from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base

class ExternalEventLog(Base):
    __tablename__ = "external_event_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), unique=True, nullable=False, index=True)
    source_system = Column(String(50), nullable=False, index=True)  # CMSMS, PARIVESH, DGMS
    source_record_id = Column(String(100), nullable=False, index=True)  # e.g., CMSMS-2026-KP-0491
    source_mode = Column(String(20), default="SIMULATED", nullable=False)  # SIMULATED, LIVE, DEMO
    
    event_type = Column(String(100), nullable=False)  # ILLEGAL_MINING_ALERT, ENV_CLEARANCE_BOUNDARY, STATUTORY_SAFETY_NOTICE
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(50), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    
    # Geospatial data & Spatial Matching
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    spatial_match_status = Column(String(50), default="OUTSIDE_KNOWN_MINE", nullable=False)  # MATCHED, OUTSIDE_KNOWN_MINE, INVALID_COORDINATE
    distance_to_mine_meters = Column(Float, nullable=True)
    
    # Payload integrity & Status
    raw_payload_hash = Column(String(64), nullable=False)  # SHA-256
    status = Column(String(50), default="RECEIVED", nullable=False)  # RECEIVED, UNDER_REVIEW, VERIFIED, ACTIONED, REJECTED
    verification_notes = Column(Text, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    adapter_version = Column(String(50), default="v1.0.0-simulated", nullable=False)
    received_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    processed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    zone = relationship("MineZone")
    verified_by = relationship("User")

    __table_args__ = (
        Index("ix_external_source_idempotency", "source_system", "source_record_id", unique=True),
    )
