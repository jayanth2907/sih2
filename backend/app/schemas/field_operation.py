from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ChecklistItem(BaseModel):
    id: str
    title: str
    category: str = "GENERAL" # ATMOSPHERIC, VENTILATION, STRATA, MACHINERY, PPE, EMERGENCY
    status: str = "PENDING" # PENDING, SATISFACTORY, NON_COMPLIANT, HAZARD_FLAGGED, NOT_APPLICABLE
    notes: Optional[str] = None
    severity: Optional[str] = "LOW"
    evidence_codes: List[str] = []

class FieldInspectionBase(BaseModel):
    inspection_type: str = "ROUTINE_SAFETY"
    scheduled_date: datetime
    status: str = "SCHEDULED"
    checklist: Optional[List[ChecklistItem]] = []
    summary_notes: Optional[str] = None
    severity_assessment: str = "LOW"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gps_accuracy_meters: Optional[float] = None

class FieldInspectionCreate(FieldInspectionBase):
    mine_id: int
    level_id: Optional[int] = None
    zone_id: Optional[int] = None

class FieldInspectionUpdate(BaseModel):
    status: Optional[str] = None
    checklist: Optional[List[ChecklistItem]] = None
    summary_notes: Optional[str] = None
    severity_assessment: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gps_accuracy_meters: Optional[float] = None
    completed_at: Optional[datetime] = None

class FieldEvidenceCreate(BaseModel):
    evidence_code: str
    mine_id: int
    inspection_id: Optional[int] = None
    observation_id: Optional[int] = None
    incident_id: Optional[int] = None
    evidence_type: str = "PHOTO"
    title: str
    description: Optional[str] = None
    file_url_or_path: Optional[str] = None
    file_hash_sha256: str
    file_size_bytes: int = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gps_accuracy_meters: Optional[float] = None
    client_capture_timestamp: datetime

class FieldEvidenceRead(BaseModel):
    id: int
    evidence_code: str
    mine_id: int
    inspection_id: Optional[int] = None
    evidence_type: str
    title: str
    description: Optional[str] = None
    file_url_or_path: Optional[str] = None
    file_hash_sha256: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gps_accuracy_meters: Optional[float] = None
    client_capture_timestamp: datetime
    server_received_timestamp: datetime
    captured_by_id: int

class FieldInspectionRead(BaseModel):
    id: int
    inspection_code: str
    mine_id: int
    mine_name: Optional[str] = None
    level_id: Optional[int] = None
    level_name: Optional[str] = None
    zone_id: Optional[int] = None
    zone_name: Optional[str] = None
    inspector_id: int
    inspector_name: Optional[str] = None
    inspection_type: str
    scheduled_date: datetime
    status: str
    checklist: List[ChecklistItem] = []
    summary_notes: Optional[str] = None
    severity_assessment: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gps_accuracy_meters: Optional[float] = None
    current_zone_risk: Optional[float] = None
    predicted_zone_risk: Optional[float] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    evidences: List[FieldEvidenceRead] = []
    created_at: datetime
    updated_at: datetime

class SyncOperationItem(BaseModel):
    operation_id: str = Field(..., description="Unique client-generated idempotency UUID")
    entity_type: str = Field(..., description="INSPECTION, OBSERVATION, INCIDENT, EVIDENCE")
    entity_id: Optional[str] = None
    operation_type: str = Field("CREATE", description="CREATE, UPDATE")
    payload: Dict[str, Any]
    client_timestamp: datetime
    client_version: Optional[str] = "1.0.0"

class SyncBatchRequest(BaseModel):
    mine_id: int
    operations: List[SyncOperationItem]

class SyncOperationResult(BaseModel):
    operation_id: str
    entity_type: str
    entity_id: Optional[str] = None
    server_id: Optional[int] = None
    status: str # ACCEPTED, REJECTED, CONFLICT, ALREADY_PROCESSED
    error: Optional[str] = None
    server_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SyncBatchResponse(BaseModel):
    mine_id: int
    processed_count: int
    accepted_count: int
    rejected_count: int
    conflict_count: int
    results: List[SyncOperationResult]
