from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator


# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = Field(pattern="^(admin|employee)$")
    department: str = Field(default="IT")


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


# --- Announcement Schemas ---
class AnnouncementBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    priority: str = Field(default="normal", pattern="^(normal|important|urgent)$")
    audience_type: str = Field(default="everyone", pattern="^(everyone|department|role)$")
    audience_value: str = Field(default="everyone")
    publish_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    @field_validator("publish_at", "expires_at", mode="after")
    @classmethod
    def ensure_naive_utc(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is not None and v.tzinfo is not None:
            return v.astimezone(timezone.utc).replace(tzinfo=None)
        return v


class AnnouncementCreate(AnnouncementBase):
    is_draft: bool = False


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    content: Optional[str] = Field(default=None, min_length=1)
    status: Optional[str] = Field(default=None, pattern="^(draft|scheduled|active|inactive|expired)$")
    priority: Optional[str] = Field(default=None, pattern="^(normal|important|urgent)$")
    audience_type: Optional[str] = Field(default=None, pattern="^(everyone|department|role)$")
    audience_value: Optional[str] = None
    publish_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    @field_validator("publish_at", "expires_at", mode="after")
    @classmethod
    def ensure_naive_utc(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is not None and v.tzinfo is not None:
            return v.astimezone(timezone.utc).replace(tzinfo=None)
        return v


class AnnouncementResponse(AnnouncementBase):
    id: int
    status: str
    publish_at: datetime
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    created_by: int
    creator_name: Optional[str] = None
    is_recent: bool = False

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total: int
    active: int
    scheduled: int
    draft: int
    inactive: int
    expired: int
