from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. INC-2026-0001
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    level_id = Column(Integer, ForeignKey("mine_levels.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="SET NULL"), nullable=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False) # GAS_ANOMALY, ROOF_FALL_RISK, VENTILATION_FAILURE, EQUIPMENT_BREAKDOWN, INJURY, FIRE_HAZARD
    severity = Column(String(50), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, TRIAGED, ASSIGNED, IN_PROGRESS, RESOLVED, VERIFIED, CLOSED, ESCALATED
    
    # 3D Spatial coordinates of incident
    x = Column(Float, default=0.0, nullable=False)
    y = Column(Float, default=0.0, nullable=False)
    z = Column(Float, default=0.0, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # SLA and Escalation tracking
    sla_hours = Column(Integer, default=24, nullable=False)
    sla_due_at = Column(DateTime, nullable=True)
    is_escalated = Column(String(10), default="NO", nullable=False)
    escalation_level = Column(Integer, default=0, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine", back_populates="incidents")
    level = relationship("MineLevel")
    zone = relationship("MineZone", back_populates="incidents")
    equipment = relationship("Equipment", back_populates="incidents")
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reported_incidents")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_incidents")
    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")
    anomaly = relationship("AnomalyEvent", back_populates="incident", uselist=False)

class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    incident = relationship("Incident", back_populates="events")
    actor = relationship("User")
