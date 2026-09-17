from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    level_id = Column(Integer, ForeignKey("mine_levels.id", ondelete="SET NULL"), nullable=True, index=True)
    
    prediction_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    horizon_minutes = Column(Integer, default=30, nullable=False) # e.g. 15, 30, 60 minutes
    
    predicted_risk_score = Column(Float, nullable=False) # 0 to 100
    predicted_severity = Column(String(50), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    probability = Column(Float, nullable=False) # Calibrated model probability (0.0 to 1.0)
    predicted_class = Column(Integer, default=0, nullable=False) # 0: Normal, 1: Escalation Likely
    current_risk_score = Column(Float, nullable=False) # Snapshot of current risk at inference time
    
    model_name = Column(String(100), default="TRINETRA-RiskGradientBoosting", nullable=False)
    model_version = Column(String(50), default="risk-escalation-v1.0", nullable=False)
    dataset_type = Column(String(50), default="SIMULATED_DEMO", nullable=False) # SIMULATED_DEMO or PRODUCTION
    
    feature_snapshot_json = Column(Text, nullable=False) # Snapshot of input features for reproducibility & audit
    explanation_json = Column(Text, nullable=False) # Top feature attributions & directional impact
    
    data_quality_score = Column(Float, default=1.0, nullable=False) # 0.0 - 1.0 feature completeness score
    data_quality_notes = Column(String(255), default="Full telemetry available (100% online sensors)", nullable=False)
    is_alert_generated = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    zone = relationship("MineZone")
    level = relationship("MineLevel")

Index("idx_risk_pred_mine_time", RiskPrediction.mine_id, RiskPrediction.prediction_timestamp)
Index("idx_risk_pred_zone_time", RiskPrediction.zone_id, RiskPrediction.prediction_timestamp)
