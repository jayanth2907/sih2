from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    
    score = Column(Float, nullable=False) # 0 to 100
    severity = Column(String(50), nullable=False) # LOW (0-30), MEDIUM (31-60), HIGH (61-80), CRITICAL (81-100)
    rule_score = Column(Float, default=0.0, nullable=False)
    ml_score = Column(Float, default=0.0, nullable=False)
    silence_risk_score = Column(Float, default=0.0, nullable=False) # Silence-to-Risk reporting drift score
    
    explanation = Column(Text, nullable=False)
    model_version = Column(String(50), default="TRINETRA-RULE-v1.0", nullable=False)
    rule_version = Column(String(50), default="DGMS-RULESET-2026.1", nullable=False)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    mine = relationship("Mine", back_populates="risk_scores")
    factors = relationship("RiskFactor", back_populates="risk_score", cascade="all, delete-orphan")

class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, index=True)
    risk_score_id = Column(Integer, ForeignKey("risk_scores.id", ondelete="CASCADE"), nullable=False, index=True)
    factor_name = Column(String(100), nullable=False) # e.g. "Methane Drift", "Overdue Gas Inspection", "Reporting Gap (Silence)"
    weight = Column(Float, nullable=False)
    contribution_points = Column(Float, nullable=False)
    details = Column(Text, nullable=True)

    risk_score = relationship("RiskScore", back_populates="factors")

class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="SET NULL"), nullable=True, index=True)
    level_id = Column(Integer, ForeignKey("mine_levels.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)

    anomaly_type = Column(String(100), nullable=False) # THRESHOLD_EXCEEDED, SUDDEN_SPIKE, SUDDEN_DROP, SUSTAINED_ABNORMAL, RAPID_UPWARD_TREND, SENSOR_OFFLINE
    severity = Column(String(50), default="HIGH", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    observed_value = Column(Float, nullable=True)
    expected_range = Column(String(100), nullable=True) # e.g. "0.05 - 0.45"
    threshold_limit = Column(Float, nullable=True)
    value_recorded = Column(Float, nullable=True) # Backward compatibility alias
    unit = Column(String(20), nullable=True)
    description = Column(Text, nullable=False)
    
    # 3D spatial coordinates
    x = Column(Float, default=0.0, nullable=False)
    y = Column(Float, default=0.0, nullable=False)
    z = Column(Float, default=0.0, nullable=False)
    
    source = Column(String(50), default="SIMULATED", nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, RECOVERING, RESOLVED
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    is_processed = Column(String(10), default="NO", nullable=False)

    mine = relationship("Mine", back_populates="anomalies")
    sensor = relationship("Sensor", back_populates="anomalies")
    level = relationship("MineLevel")
    zone = relationship("MineZone")
    incident = relationship("Incident", back_populates="anomaly")

Index("idx_anomalies_mine_status", AnomalyEvent.mine_id, AnomalyEvent.status)
Index("idx_anomalies_sensor_status", AnomalyEvent.sensor_id, AnomalyEvent.status)
