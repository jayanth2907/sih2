from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class IncidentEventRead(BaseModel):
    id: int
    actor_id: Optional[int] = None
    from_status: Optional[str] = None
    to_status: str
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentBase(BaseModel):
    title: str
    description: str
    category: str # GAS_ANOMALY, ROOF_FALL_RISK, VENTILATION_FAILURE, EQUIPMENT_BREAKDOWN, INJURY, FIRE_HAZARD
    severity: str = "MEDIUM" # LOW, MEDIUM, HIGH, CRITICAL
    sla_hours: int = 24
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class IncidentCreate(IncidentBase):
    mine_id: int
    level_id: Optional[int] = None
    zone_id: Optional[int] = None
    equipment_id: Optional[int] = None
    assignee_id: Optional[int] = None

class IncidentStatusUpdate(BaseModel):
    status: str # OPEN, TRIAGED, ASSIGNED, IN_PROGRESS, RESOLVED, VERIFIED, CLOSED, ESCALATED
    comment: Optional[str] = None
    assignee_id: Optional[int] = None
    resolution_notes: Optional[str] = None

class IncidentRead(IncidentBase):
    id: int
    incident_code: str
    mine_id: int
    level_id: Optional[int] = None
    zone_id: Optional[int] = None
    equipment_id: Optional[int] = None
    reporter_id: Optional[int] = None
    assignee_id: Optional[int] = None
    status: str
    is_escalated: str
    escalation_level: int
    sla_due_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    reporter_name: Optional[str] = None
    assignee_name: Optional[str] = None
    zone_name: Optional[str] = None
    mine_name: Optional[str] = None
    events: List[IncidentEventRead] = []

    class Config:
        from_attributes = True
