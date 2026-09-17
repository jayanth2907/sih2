from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class EnvironmentalRule(Base):
    __tablename__ = "environmental_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, index=True, nullable=False)
    parameter_name = Column(String(100), nullable=False) # PM10, PM2.5, NOISE_DB, WATER_PH, EFFLUENT_TSS, AMBIENT_TEMP
    threshold_limit = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    severity = Column(String(50), default="HIGH", nullable=False)
    statute_reference = Column(String(255), default="DGMS / CPCB Standards", nullable=False)
    description = Column(Text, nullable=True)

class EnvironmentalObservation(Base):
    __tablename__ = "environmental_observations"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="SET NULL"), nullable=True)
    rule_id = Column(Integer, ForeignKey("environmental_rules.id", ondelete="SET NULL"), nullable=True)
    
    parameter_name = Column(String(100), nullable=False)
    observed_value = Column(Float, nullable=False)
    threshold_limit = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    severity = Column(String(50), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, UNDER_REVIEW, MITIGATION_IN_PROGRESS, RESOLVED, CLOSED
    
    location_context = Column(String(255), nullable=True)
    x = Column(Float, default=0.0, nullable=False)
    y = Column(Float, default=0.0, nullable=False)
    z = Column(Float, default=0.0, nullable=False)
    
    action_taken = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    mine = relationship("Mine")
    sensor = relationship("Sensor")
    rule = relationship("EnvironmentalRule")
