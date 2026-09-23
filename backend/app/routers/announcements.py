from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Announcement
from ..schemas import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from ..dependencies import get_current_user, require_admin
from ..services.announcement_service import (
    get_announcements_for_user,
    create_announcement,
    update_announcement,
    compute_effective_status,
    refresh_announcement_statuses,
    make_naive_utc
)

router = APIRouter(prefix="/api/announcements", tags=["announcements"])


def format_announcement_response(item: Announcement) -> AnnouncementResponse:
    now = datetime.utcnow()
    effective_status = compute_effective_status(item, now)
    
    # Recent if published within last 24 hours
    is_recent = False
    publish_at = make_naive_utc(item.publish_at)
    if effective_status == "active" and publish_at:
        diff = now - publish_at
        if timedelta(seconds=0) <= diff <= timedelta(hours=24):
            is_recent = True

    return AnnouncementResponse(
        id=item.id,
        title=item.title,
        content=item.content,
        status=effective_status,
        priority=item.priority,
        audience_type=item.audience_type,
        audience_value=item.audience_value,
        publish_at=item.publish_at,
        expires_at=item.expires_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
        created_by=item.created_by,
        creator_name=item.creator.name if item.creator else "System Admin",
        is_recent=is_recent
    )


@router.get("", response_model=List[AnnouncementResponse])
def list_announcements(
    status: Optional[str] = Query(None, description="Status filter: all, active, draft, scheduled, inactive, expired"),
    audience: Optional[str] = Query(None, description="Audience filter: all, everyone, department, role"),
    search: Optional[str] = Query(None, description="Search term in title"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = get_announcements_for_user(
        db=db,
        user=current_user,
        status_filter=status,
        audience_filter=audience,
        search_query=search
    )
    return [format_announcement_response(item) for item in items]


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement_detail(
    announcement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    refresh_announcement_statuses(db, now)
    
    item = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # If not admin, verify audience relevance & active status
    if current_user.role != "admin":
        effective_status = compute_effective_status(item, now)
        if effective_status != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this announcement"
            )
        
        is_relevant = (
            item.audience_type == "everyone" or
            (item.audience_type == "department" and item.audience_value == current_user.department) or
            (item.audience_type == "role" and item.audience_value == current_user.role)
        )
        if not is_relevant:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This announcement is not designated for your department or role"
            )

    return format_announcement_response(item)


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_new_announcement(
    data: AnnouncementCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Validation: Expiry must be after publish_at
    publish_time = make_naive_utc(data.publish_at) or datetime.utcnow()
    expires_time = make_naive_utc(data.expires_at)
    if expires_time and expires_time <= publish_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expiry date and time must be after the publication date and time"
        )

    announcement = create_announcement(db=db, data=data, user_id=current_admin.id)
    return format_announcement_response(announcement)


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_existing_announcement(
    announcement_id: int,
    data: AnnouncementUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )

    # Validate dates if changed
    target_publish = make_naive_utc(data.publish_at) if data.publish_at is not None else make_naive_utc(announcement.publish_at)
    target_expiry = make_naive_utc(data.expires_at) if data.expires_at is not None else make_naive_utc(announcement.expires_at)

    if target_publish and target_expiry and target_expiry <= target_publish:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expiry date and time must be after the publication date and time"
        )

    updated = update_announcement(db=db, announcement=announcement, data=data)
    return format_announcement_response(updated)


@router.delete("/{announcement_id}", status_code=status.HTTP_200_OK)
def delete_announcement(
    announcement_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement successfully deleted", "id": announcement_id}


@router.post("/{announcement_id}/publish", response_model=AnnouncementResponse)
def publish_announcement(
    announcement_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    now = datetime.utcnow()
    announcement.publish_at = now
    announcement.status = "active"
    announcement.updated_at = now
    db.commit()
    db.refresh(announcement)
    return format_announcement_response(announcement)


@router.post("/{announcement_id}/deactivate", response_model=AnnouncementResponse)
def deactivate_announcement(
    announcement_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    now = datetime.utcnow()
    announcement.status = "inactive"
    announcement.updated_at = now
    db.commit()
    db.refresh(announcement)
    return format_announcement_response(announcement)
