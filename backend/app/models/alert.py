from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="SET NULL"), nullable=True, index=True)
    anomaly_id = Column(Integer, ForeignKey("anomaly_events.id", ondelete="SET NULL"), nullable=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="HIGH", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    risk_score = Column(Float, default=50.0, nullable=False)
    status = Column(String(50), default="UNREAD", nullable=False) # UNREAD, READ, ACKNOWLEDGED, RESOLVED
    source = Column(String(50), default="SIMULATED", nullable=False) # SIMULATED, MQTT, API, SCADA
    recipient_scope = Column(String(100), default="ALL", nullable=False) # ALL, MINE_MANAGER, MINE_SAFETY_OFFICER, REGULATOR
    location_context = Column(String(255), nullable=True) # e.g. "Level 2 > East Longwall Face (145.0, 470.0, -318.0)"
    deduplication_key = Column(String(150), nullable=True, index=True) # e.g. "MINE1_SENSOR101_METHANE_CRITICAL"

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    mine = relationship("Mine")
    sensor = relationship("Sensor")
    anomaly = relationship("AnomalyEvent")
    incident = relationship("Incident")

Index("idx_alerts_mine_status", Alert.mine_id, Alert.status)
