from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    violation_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. VIO-DGMS-2026-042
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    inspector_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    regulatory_clause = Column(String(255), nullable=False) # e.g. Coal Mines Regulations (CMR) 2017 - Regulation 153 (Ventilation)
    statute = Column(String(100), default="DGMS_CMR_2017", nullable=False)
    severity = Column(String(50), default="HIGH", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, UNDER_REVIEW, CORRECTIVE_ACTION_REQUIRED, RECTIFIED, VERIFIED, CLOSED
    
    remedial_deadline = Column(DateTime, nullable=True)
    financial_penalty_amount = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine", back_populates="violations")
    zone = relationship("MineZone", back_populates="violations")
    inspector = relationship("User", foreign_keys=[inspector_id])
    corrective_actions = relationship("CorrectiveAction", back_populates="violation", cascade="all, delete-orphan")
    escalations = relationship("Escalation", back_populates="violation", cascade="all, delete-orphan")

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id", ondelete="CASCADE"), nullable=False, index=True)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_text = Column(Text, nullable=False)
    target_completion_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, IN_PROGRESS, COMPLETED, VERIFIED
    completion_notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    violation = relationship("Violation", back_populates="corrective_actions")
    assignee = relationship("User")

class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(Integer, ForeignKey("violations.id", ondelete="CASCADE"), nullable=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=True, index=True)
    level = Column(Integer, default=1, nullable=False) # 1: Safety Officer, 2: Mine Manager, 3: Directorate/Regulator
    reason = Column(Text, nullable=False)
    triggered_by = Column(String(50), default="SYSTEM_SLA_BREACH", nullable=False) # SYSTEM_SLA_BREACH, MANUAL_ESCALATION, THRESHOLD_SPIKE
    notified_roles = Column(String(255), nullable=True)
    is_acknowledged = Column(String(10), default="NO", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    violation = relationship("Violation", back_populates="escalations")
    incident = relationship("Incident")
