from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Announcement, User
from ..schemas import DashboardStats
from ..dependencies import require_admin
from ..services.announcement_service import compute_effective_status, refresh_announcement_statuses

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    refresh_announcement_statuses(db, now)

    announcements = db.query(Announcement).all()

    stats = {
        "total": len(announcements),
        "active": 0,
        "scheduled": 0,
        "draft": 0,
        "inactive": 0,
        "expired": 0
    }

    for item in announcements:
        status = compute_effective_status(item, now)
        if status in stats:
            stats[status] += 1

    return DashboardStats(**stats)
