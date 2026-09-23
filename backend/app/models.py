import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="employee")  # 'admin' or 'employee'
    department = Column(String(50), nullable=False, default="General")  # IT, HR, Finance, Marketing, Operations
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    announcements = relationship("Announcement", back_populates="creator", cascade="all, delete-orphan")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    content = Column(Text, nullable=False)
    
    # Lifecycle status: draft, scheduled, active, inactive, expired
    status = Column(String(20), nullable=False, default="draft", index=True)
    
    # Priority: normal, important, urgent
    priority = Column(String(20), nullable=False, default="normal", index=True)
    
    # Audience: everyone, department, role
    audience_type = Column(String(20), nullable=False, default="everyone", index=True)
    audience_value = Column(String(50), nullable=False, default="everyone", index=True)
    
    publish_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    creator = relationship("User", back_populates="announcements")
