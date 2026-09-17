from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class SignalAttribution(BaseModel):
    feature: str
    label: str
    direction: str # INCREASING_RISK, MITIGATING_RISK, NEUTRAL
    symbol: str # ↑, ↓, →
    current_value: float
    unit: str
    normal_reference: float
    threshold_reference: float
    contribution_points: float
    explanation: str

class RiskPredictionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    mine_id: int
    zone_id: Optional[int] = None
    level_id: Optional[int] = None
    prediction_timestamp: datetime
    horizon_minutes: int
    predicted_risk_score: float
    predicted_severity: str
    probability: float
    predicted_class: int
    current_risk_score: float
    model_name: str
    model_version: str
    dataset_type: str
    data_quality_score: float
    data_quality_notes: str
    explanation_json: str
    created_at: datetime

class PredictiveRiskSummary(BaseModel):
    mine_id: int
    mine_name: str
    current_risk_score: float
    current_severity: str
    predicted_risk_score: float
    predicted_severity: str
    risk_delta: float
    trend_direction: str # UP, DOWN, STABLE
    probability: float
    horizon_minutes: int
    model_name: str
    model_version: str
    dataset_provenance: str # SIMULATED_DEMO or PRODUCTION
    data_quality_score: float
    data_quality_notes: str
    is_alert_active: bool
    top_signals: List[SignalAttribution]
    evaluated_at: datetime

class MLModelRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    model_name: str
    version: str
    algorithm: str
    target_variable: str
    horizon_minutes: int
    status: str
    is_default: bool
    dataset_source: str
    metrics_json: str
    trained_at: datetime
    trained_by: str
    description: Optional[str] = None
