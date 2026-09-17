from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(Integer, primary_key=True, index=True)
    grievance_code = Column(String(50), unique=True, index=True, nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), default="SAFETY", nullable=False) # SAFETY, ENVIRONMENT, LABOUR, CONTRACTOR, FACILITIES, OTHER
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    priority = Column(String(50), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="SUBMITTED", nullable=False) # SUBMITTED, ACKNOWLEDGED, ASSIGNED, IN_PROGRESS, RESOLVED, VERIFIED, CLOSED, ESCALATED
    
    submitted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    anonymous = Column(Boolean, default=False, nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    sla_hours = Column(Integer, default=72, nullable=False) # 24h for CRITICAL, 48h for HIGH, 72h for MEDIUM
    due_at = Column(DateTime, nullable=False)
    is_escalated = Column(Boolean, default=False, nullable=False)
    escalation_level = Column(Integer, default=0, nullable=False)
    
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    submitted_by = relationship("User", foreign_keys=[submitted_by_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
