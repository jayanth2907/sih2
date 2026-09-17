from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class RiskFactorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    factor_name: str
    weight: float
    contribution_points: float
    details: Optional[str] = None

class RiskScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mine_id: int
    zone_id: Optional[int] = None
    score: float
    severity: str
    rule_score: float
    ml_score: float
    silence_risk_score: float
    explanation: str
    model_version: str
    rule_version: str
    generated_at: datetime
    factors: List[RiskFactorRead] = []

class AnomalyEventCreate(BaseModel):
    mine_id: int
    sensor_id: Optional[int] = None
    level_id: Optional[int] = None
    zone_id: Optional[int] = None
    anomaly_type: str
    severity: str = "HIGH"
    observed_value: Optional[float] = None
    expected_range: Optional[str] = None
    threshold_limit: Optional[float] = None
    unit: Optional[str] = None
    description: str
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    source: str = "SIMULATED"
    status: str = "ACTIVE"

class AnomalyEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mine_id: int
    sensor_id: Optional[int] = None
    level_id: Optional[int] = None
    zone_id: Optional[int] = None
    incident_id: Optional[int] = None
    anomaly_type: str
    severity: str
    observed_value: Optional[float] = None
    expected_range: Optional[str] = None
    threshold_limit: Optional[float] = None
    unit: Optional[str] = None
    description: str
    x: float
    y: float
    z: float
    source: str
    status: str
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    is_processed: str
    sensor_code: Optional[str] = None
    zone_name: Optional[str] = None
    level_name: Optional[str] = None
    mine_name: Optional[str] = None

class AuditEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_id: Optional[int] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    mine_id: Optional[int] = None
    before_state: Optional[str] = None
    after_state: Optional[str] = None
    metadata_json: Optional[str] = None
    ip_address: Optional[str] = None
    correlation_id: Optional[str] = None
    current_event_hash: Optional[str] = None
    timestamp: datetime
