from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class AdapterHealthStatus(BaseModel):
    name: str
    source_system: str  # CMSMS, PARIVESH, DGMS, TELEMETRY
    mode: str  # SIMULATED, LIVE, DEMO
    status: str  # HEALTHY, DEGRADED, OFFLINE
    circuit_state: str  # CLOSED, OPEN, HALF_OPEN
    latency_ms: float
    last_sync_time: Optional[datetime] = None
    last_error: Optional[str] = None
    records_processed: int = 0
    records_rejected: int = 0
    adapter_version: str

    model_config = ConfigDict(from_attributes=True)

class IntegrationHealthResponse(BaseModel):
    overall_health: str  # HEALTHY, DEGRADED, OFFLINE
    total_adapters: int
    adapters: List[AdapterHealthStatus]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ExternalReportRead(BaseModel):
    id: int
    event_id: str
    source_system: str
    source_record_id: str
    source_mode: str
    event_type: str
    mine_id: Optional[int] = None
    mine_code: Optional[str] = None
    zone_id: Optional[int] = None
    zone_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    severity: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    spatial_match_status: str
    distance_to_mine_meters: Optional[float] = None
    raw_payload_hash: str
    status: str
    verification_notes: Optional[str] = None
    adapter_version: str
    received_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExternalReportCreate(BaseModel):
    source_system: str
    source_record_id: str
    event_type: str
    title: str
    description: Optional[str] = None
    severity: str = "MEDIUM"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    raw_payload: Optional[Dict[str, Any]] = None

class AuditChainVerificationResponse(BaseModel):
    status: str  # VALID, TAMPER_DETECTED
    total_events: int
    chain_head_hash: Optional[str] = None
    corrupted_event_id: Optional[int] = None
    failure_reason: Optional[str] = None
    verified_at: datetime

class SystemHealthComponent(BaseModel):
    name: str
    status: str  # HEALTHY, DEGRADED, OFFLINE
    details: str
    latency_ms: Optional[float] = None

class SystemHealthResponse(BaseModel):
    status: str  # HEALTHY, DEGRADED, OFFLINE
    version: str
    environment: str
    components: List[SystemHealthComponent]
    timestamp: datetime
