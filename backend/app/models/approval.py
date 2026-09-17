from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(50), unique=True, index=True, nullable=False)
    resource_type = Column(String(50), nullable=False) # PRODUCTION_REPORT, STATUTORY_REPORT, CONTRACT, GRIEVANCE, CORRECTIVE_ACTION
    resource_id = Column(String(50), nullable=False, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    required_role = Column(String(50), default="MINE_MANAGER", nullable=False) # MINE_SAFETY_OFFICER, MINE_MANAGER, REGULATOR
    
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED, CHANGES_REQUESTED
    final_decision_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    requester = relationship("User", foreign_keys=[requester_id])
    actions = relationship("ApprovalAction", back_populates="request", cascade="all, delete-orphan")

class ApprovalAction(Base):
    __tablename__ = "approval_actions"

    id = Column(Integer, primary_key=True, index=True)
    approval_request_id = Column(Integer, ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False) # SUBMIT, APPROVE, REJECT, REQUEST_CHANGES
    role_used = Column(String(50), nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    request = relationship("ApprovalRequest", back_populates="actions")
    actor = relationship("User")
