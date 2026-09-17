from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AlertBase(BaseModel):
    title: str
    message: str
    severity: str = "HIGH"
    risk_score: float = 50.0
    status: str = "UNREAD" # UNREAD, READ, ACKNOWLEDGED, RESOLVED
    source: str = "SIMULATED"
    recipient_scope: str = "ALL"
    location_context: Optional[str] = None

class AlertCreate(AlertBase):
    mine_id: int
    sensor_id: Optional[int] = None
    anomaly_id: Optional[int] = None
    incident_id: Optional[int] = None
    deduplication_key: Optional[str] = None

class AlertStatusUpdate(BaseModel):
    status: str # UNREAD, READ, ACKNOWLEDGED, RESOLVED

class AlertRead(AlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mine_id: int
    sensor_id: Optional[int] = None
    anomaly_id: Optional[int] = None
    incident_id: Optional[int] = None
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    sensor_code: Optional[str] = None
    mine_name: Optional[str] = None
