from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class FieldInspection(Base):
    __tablename__ = "field_inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_code = Column(String(50), unique=True, index=True, nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    level_id = Column(Integer, ForeignKey("mine_levels.id", ondelete="SET NULL"), nullable=True)
    zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    inspection_type = Column(String(50), default="ROUTINE_SAFETY", nullable=False) # ROUTINE_SAFETY, VENTILATION_AUDIT, STRATA_CONTROL, DGMS_SPECIAL
    scheduled_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="SCHEDULED", nullable=False) # SCHEDULED, IN_PROGRESS, COMPLETED, SUBMITTED, VERIFIED
    
    checklist_json = Column(Text, nullable=True)
    summary_notes = Column(Text, nullable=True)
    severity_assessment = Column(String(50), default="LOW", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    gps_accuracy_meters = Column(Float, nullable=True)
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    level = relationship("MineLevel")
    zone = relationship("MineZone")
    inspector = relationship("User", foreign_keys=[inspector_id])
    evidences = relationship("FieldEvidence", back_populates="inspection", cascade="all, delete-orphan")

class FieldEvidence(Base):
    __tablename__ = "field_evidences"

    id = Column(Integer, primary_key=True, index=True)
    evidence_code = Column(String(50), unique=True, index=True, nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    inspection_id = Column(Integer, ForeignKey("field_inspections.id", ondelete="SET NULL"), nullable=True)
    observation_id = Column(Integer, ForeignKey("environmental_observations.id", ondelete="SET NULL"), nullable=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    
    evidence_type = Column(String(50), default="PHOTO", nullable=False) # PHOTO, DOCUMENT, NOTE, SENSOR_LOG
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_url_or_path = Column(String(500), nullable=True)
    file_hash_sha256 = Column(String(64), nullable=False) # Integrity verification
    file_size_bytes = Column(Integer, default=0, nullable=False)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    gps_accuracy_meters = Column(Float, nullable=True)
    
    client_capture_timestamp = Column(DateTime, nullable=False)
    server_received_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    captured_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    inspection = relationship("FieldInspection", back_populates="evidences")
    captured_by = relationship("User", foreign_keys=[captured_by_id])

class FieldSyncLog(Base):
    __tablename__ = "field_sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    operation_id = Column(String(64), unique=True, index=True, nullable=False) # Idempotency key
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    entity_type = Column(String(50), nullable=False) # INSPECTION, OBSERVATION, INCIDENT, EVIDENCE
    entity_id = Column(String(100), nullable=True)
    operation_type = Column(String(50), nullable=False) # CREATE, UPDATE
    
    client_timestamp = Column(DateTime, nullable=False)
    status = Column(String(50), default="ACCEPTED", nullable=False) # ACCEPTED, REJECTED, CONFLICT, ALREADY_PROCESSED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    user = relationship("User")
