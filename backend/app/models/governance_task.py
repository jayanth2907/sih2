from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class GovernanceTask(Base):
    __tablename__ = "governance_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String(50), unique=True, index=True, nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    domain = Column(String(50), default="SAFETY", nullable=False) # SAFETY, PRODUCTION, ENVIRONMENT, WORKFORCE, CONTRACTOR, GRIEVANCE, AUDIT
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    source_resource_type = Column(String(50), nullable=True) # PRODUCTION_DEVIATION, CONTRACT_EXPIRY, GRIEVANCE, SENSOR_ANOMALY, VIOLATION
    source_resource_id = Column(String(50), nullable=True)
    
    priority = Column(String(50), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, VERIFIED, CLOSED, ESCALATED
    
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    due_at = Column(DateTime, nullable=False)
    sla_status = Column(String(50), default="ON_TRACK", nullable=False) # ON_TRACK, DUE_SOON, BREACHED, RESOLVED
    escalation_level = Column(Integer, default=0, nullable=False)
    
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    assignee = relationship("User", foreign_keys=[assignee_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
