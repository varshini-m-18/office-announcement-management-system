from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from ..models import Announcement, User
from ..schemas import AnnouncementCreate, AnnouncementUpdate
from ..auth import get_password_hash


def make_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def compute_effective_status(announcement: Announcement, now: Optional[datetime] = None) -> str:
    """Dynamically determine the effective status of an announcement."""
    if now is None:
        now = datetime.utcnow()
    else:
        now = make_naive_utc(now)

    # If it was saved as draft, it stays draft until explicitly published
    if announcement.status == "draft":
        return "draft"

    # If it was manually deactivated, it is inactive
    if announcement.status == "inactive":
        return "inactive"

    expires_at = make_naive_utc(announcement.expires_at)
    publish_at = make_naive_utc(announcement.publish_at)

    # If expires_at is set and in the past, it is expired
    if expires_at and now > expires_at:
        return "expired"

    # If publish_at is in the future, it is scheduled
    if publish_at and publish_at > now:
        return "scheduled"

    # Otherwise, it's active
    return "active"


def refresh_announcement_statuses(db: Session, now: Optional[datetime] = None):
    """Synchronize effective statuses in DB if needed."""
    if now is None:
        now = datetime.utcnow()
    announcements = db.query(Announcement).all()
    for item in announcements:
        effective = compute_effective_status(item, now)
        if item.status != effective and item.status not in ["draft", "inactive"]:
            item.status = effective
    db.commit()


def get_announcements_for_user(
    db: Session,
    user: User,
    status_filter: Optional[str] = None,
    audience_filter: Optional[str] = None,
    search_query: Optional[str] = None
) -> List[Announcement]:
    now = datetime.utcnow()
    refresh_announcement_statuses(db, now)

    query = db.query(Announcement)

    if user.role == "admin":
        # Admin can filter by status
        if status_filter and status_filter != "all":
            query = query.filter(Announcement.status == status_filter)
        if audience_filter and audience_filter != "all":
            query = query.filter(Announcement.audience_type == audience_filter)
        if search_query:
            query = query.filter(Announcement.title.ilike(f"%{search_query}%"))
        
        # Order by created_at descending
        return query.order_by(Announcement.created_at.desc()).all()
    else:
        # EMPLOYEE ROLE: Strict audience and active-only filtering
        query = query.filter(Announcement.status == "active")

        # Audience relevance logic
        query = query.filter(
            or_(
                Announcement.audience_type == "everyone",
                and_(
                    Announcement.audience_type == "department",
                    Announcement.audience_value == user.department
                ),
                and_(
                    Announcement.audience_type == "role",
                    Announcement.audience_value == user.role
                )
            )
        )

        if search_query:
            query = query.filter(Announcement.title.ilike(f"%{search_query}%"))

        # Order: Urgent priority first, then Important, then Normal, then newest publish_at
        # In SQLite/SQLAlchemy we can sort by priority weighting and publish_at desc
        announcements = query.all()
        
        priority_weight = {"urgent": 0, "important": 1, "normal": 2}
        return sorted(
            announcements,
            key=lambda a: (priority_weight.get(a.priority, 3), -(a.publish_at.timestamp() if a.publish_at else 0))
        )


def create_announcement(db: Session, data: AnnouncementCreate, user_id: int) -> Announcement:
    now = datetime.utcnow()
    raw_publish = make_naive_utc(data.publish_at)
    expires_at = make_naive_utc(data.expires_at)

    if data.is_draft:
        status = "draft"
        publish_at = raw_publish or now
    else:
        # If publish_at is not provided, or is close to current time (within 60s), treat as immediate active publish
        if raw_publish is None or raw_publish <= now + timedelta(seconds=60):
            publish_at = min(raw_publish or now, now)
            status = "active"
        else:
            publish_at = raw_publish
            status = "scheduled"

    announcement = Announcement(
        title=data.title.strip(),
        content=data.content.strip(),
        priority=data.priority,
        audience_type=data.audience_type,
        audience_value=data.audience_value.strip() if data.audience_value else "everyone",
        publish_at=publish_at,
        expires_at=expires_at,
        status=status,
        created_by=user_id,
        created_at=now,
        updated_at=now
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


def update_announcement(db: Session, announcement: Announcement, data: AnnouncementUpdate) -> Announcement:
    now = datetime.utcnow()
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "title" and value is not None:
            announcement.title = value.strip()
        elif field == "content" and value is not None:
            announcement.content = value.strip()
        elif field == "audience_value" and value is not None:
            announcement.audience_value = value.strip()
        elif field == "status" and value is not None:
            announcement.status = value
        elif field in ["publish_at", "expires_at"]:
            setattr(announcement, field, make_naive_utc(value))
        elif value is not None:
            setattr(announcement, field, value)

    # Recalculate status if not explicitly draft or inactive
    if announcement.status not in ["draft", "inactive"]:
        announcement.status = compute_effective_status(announcement, now)

    announcement.updated_at = now
    db.commit()
    db.refresh(announcement)
    return announcement


def seed_database(db: Session):
    """Seed demo accounts and sample announcements if database is empty."""
    user_count = db.query(User).count()
    if user_count > 0:
        return

    # Create Demo Users
    admin_user = User(
        name="Sarah Connor (Admin)",
        email="admin@demo.com",
        hashed_password=get_password_hash("Admin@123"),
        role="admin",
        department="IT"
    )
    it_employee = User(
        name="Alex Rivera (IT)",
        email="it.employee@demo.com",
        hashed_password=get_password_hash("Employee@123"),
        role="employee",
        department="IT"
    )
    hr_employee = User(
        name="Elena Gomez (HR)",
        email="hr.employee@demo.com",
        hashed_password=get_password_hash("Employee@123"),
        role="employee",
        department="HR"
    )

    db.add_all([admin_user, it_employee, hr_employee])
    db.commit()
    db.refresh(admin_user)
    db.refresh(it_employee)
    db.refresh(hr_employee)

    now = datetime.utcnow()

    # Seed Sample Announcements
    sample_announcements = [
        Announcement(
            title="Annual Company Townhall & Q1 Strategy Briefing",
            content="Join CEO and leadership team this Friday at 3:00 PM in the Main Auditorium or via the global livestream. We will cover key milestones, revenue achievements, and major upcoming initiatives.",
            status="active",
            priority="important",
            audience_type="everyone",
            audience_value="everyone",
            publish_at=now - timedelta(hours=3),
            expires_at=now + timedelta(days=14),
            created_at=now - timedelta(hours=3),
            updated_at=now - timedelta(hours=3),
            created_by=admin_user.id
        ),
        Announcement(
            title="IT Infrastructure Security Update: Mandatory MFA Rollout",
            content="All IT department members are required to enable hardware security keys (FIDO2) on internal cluster access by end of week. Please review the updated security protocols in the IT portal.",
            status="active",
            priority="urgent",
            audience_type="department",
            audience_value="IT",
            publish_at=now - timedelta(hours=1),
            expires_at=now + timedelta(days=7),
            created_at=now - timedelta(hours=1),
            updated_at=now - timedelta(hours=1),
            created_by=admin_user.id
        ),
        Announcement(
            title="Annual Health & Dental Benefits Enrollment Window",
            content="The HR department is hosting open enrollment for 2026 comprehensive medical and dental insurance plans. Check your email for policy guides or schedule a 1-on-1 with benefits specialists.",
            status="active",
            priority="important",
            audience_type="department",
            audience_value="HR",
            publish_at=now - timedelta(hours=5),
            expires_at=now + timedelta(days=20),
            created_at=now - timedelta(hours=5),
            updated_at=now - timedelta(hours=5),
            created_by=admin_user.id
        ),
        Announcement(
            title="Welcome to our Q1 New Team Cohort!",
            content="Please give a warm welcome to our 12 new team members joining Engineering, Product, Marketing, and Operations across our offices! Check out their bios in the employee directory.",
            status="active",
            priority="normal",
            audience_type="everyone",
            audience_value="everyone",
            publish_at=now - timedelta(days=1),
            expires_at=now + timedelta(days=30),
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(days=1),
            created_by=admin_user.id
        ),
        Announcement(
            title="Upcoming Office Relocation to New Tech Campus",
            content="We are scheduled to transition our main workspace to the new Riverside Innovation Center starting next month. Detailed floor plans and seating arrangements will be published soon.",
            status="scheduled",
            priority="important",
            audience_type="everyone",
            audience_value="everyone",
            publish_at=now + timedelta(days=2),
            expires_at=now + timedelta(days=60),
            created_at=now - timedelta(hours=2),
            updated_at=now - timedelta(hours=2),
            created_by=admin_user.id
        ),
        Announcement(
            title="[Draft] Updated Kitchen and Facility Access Guidelines",
            content="This is a draft outlining new badge access hours for the pantry and game rooms during weekend maintenance windows.",
            status="draft",
            priority="normal",
            audience_type="department",
            audience_value="Operations",
            publish_at=now,
            expires_at=None,
            created_at=now - timedelta(hours=6),
            updated_at=now - timedelta(hours=6),
            created_by=admin_user.id
        ),
        Announcement(
            title="Old Holiday Schedule 2025 (Archived)",
            content="Archived reference for 2025 national holiday calendar.",
            status="inactive",
            priority="normal",
            audience_type="everyone",
            audience_value="everyone",
            publish_at=now - timedelta(days=120),
            expires_at=now - timedelta(days=30),
            created_at=now - timedelta(days=120),
            updated_at=now - timedelta(days=30),
            created_by=admin_user.id
        )
    ]

    db.add_all(sample_announcements)
    db.commit()
