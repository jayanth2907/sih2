from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False) # e.g. "USER_LOGIN", "INCIDENT_STATUS_CHANGE", "MINE_CREATED", "SENSOR_THRESHOLD_UPDATED"
    resource_type = Column(String(100), nullable=False) # e.g. "INCIDENT", "MINE", "USER", "SENSOR", "VIOLATION"
    resource_id = Column(String(100), nullable=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="SET NULL"), nullable=True, index=True)
    
    before_state = Column(Text, nullable=True) # JSON representation
    after_state = Column(Text, nullable=True) # JSON representation
    metadata_json = Column(Text, nullable=True) # Context metadata
    ip_address = Column(String(50), nullable=True)
    correlation_id = Column(String(100), nullable=True)
    
    # Hash-chain integrity fields
    previous_event_hash = Column(String(128), nullable=True)
    current_event_hash = Column(String(128), nullable=True)
    
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    actor = relationship("User")
    mine = relationship("Mine")

Index("idx_audit_resource", AuditEvent.resource_type, AuditEvent.resource_id)
