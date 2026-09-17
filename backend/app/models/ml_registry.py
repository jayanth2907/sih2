from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean
from app.db.base import Base

class MLModelRegistry(Base):
    __tablename__ = "ml_models_registry"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False) # e.g. "TRINETRA-RiskHistGradientBoosting"
    version = Column(String(50), nullable=False, unique=True, index=True) # e.g. "risk-escalation-v1.0"
    algorithm = Column(String(100), nullable=False) # HistGradientBoostingClassifier, LogisticRegression
    target_variable = Column(String(100), default="RISK_ESCALATION_WITHIN_30MIN", nullable=False)
    horizon_minutes = Column(Integer, default=30, nullable=False)
    
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, INACTIVE, ARCHIVED
    is_default = Column(Boolean, default=True, nullable=False)
    dataset_source = Column(String(100), default="SIMULATED_DEMO", nullable=False) # SIMULATED_DEMO or PRODUCTION
    
    metrics_json = Column(Text, nullable=False) # JSON: roc_auc, pr_auc, precision, recall, f1, brier_score, baseline_roc_auc
    feature_names_json = Column(Text, nullable=False) # JSON list of input features
    model_artifact_path = Column(String(255), nullable=True) # File path to .joblib artifact
    
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    trained_by = Column(String(100), default="SYSTEM_ML_PIPELINE", nullable=False)
    description = Column(Text, nullable=True)
