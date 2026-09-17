from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class CorrectiveActionBase(BaseModel):
    action_text: str
    target_completion_date: datetime
    assignee_id: Optional[int] = None

class CorrectiveActionRead(CorrectiveActionBase):
    id: int
    violation_id: int
    status: str
    completion_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    assignee_name: Optional[str] = None

    class Config:
        from_attributes = True

class ViolationBase(BaseModel):
    title: str
    description: str
    regulatory_clause: str
    statute: str = "DGMS_CMR_2017"
    severity: str = "HIGH"
    financial_penalty_amount: float = 0.0
    remedial_deadline: Optional[datetime] = None

class ViolationCreate(ViolationBase):
    mine_id: int
    zone_id: Optional[int] = None

class ViolationRead(ViolationBase):
    id: int
    violation_code: str
    mine_id: int
    zone_id: Optional[int] = None
    inspector_id: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime
    inspector_name: Optional[str] = None
    zone_name: Optional[str] = None
    mine_name: Optional[str] = None
    corrective_actions: List[CorrectiveActionRead] = []

    class Config:
        from_attributes = True
