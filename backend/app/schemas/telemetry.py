from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class TelemetryIngestPayload(BaseModel):
    sensor_id: Optional[int] = None
    sensor_code: Optional[str] = None
    mine_id: Optional[int] = None
    value: float
    unit: str
    quality: str = "GOOD"
    source: str = "SIMULATED" # SIMULATED, MQTT, API, SCADA
    message_id: Optional[str] = None # For idempotency deduplication
    timestamp: Optional[datetime] = None

class SimulationScenarioRequest(BaseModel):
    scenario: str = "NORMAL" # NORMAL, METHANE_SPIKE, CO_SPIKE, VENTILATION_DROP, TEMPERATURE_RISE, VIBRATION_SPIKE, SENSOR_OFFLINE, MULTI_SENSOR_ANOMALY, RECOVERING
    sensor_code: Optional[str] = None
    target_value: Optional[float] = None

class NearbyCameraDTO(BaseModel):
    id: int
    camera_code: str
    name: str
    camera_type: str
    x: float
    y: float
    z: float
    distance_meters: float
    yaw: float
    pitch: float
    fov: float
    stream_url: Optional[str] = None
    is_simulated: str = "SIMULATED"

class NearbyEquipmentDTO(BaseModel):
    id: int
    equipment_code: str
    name: str
    category: str
    status: str
    x: float
    y: float
    z: float
    distance_meters: float
    last_serviced_at: Optional[datetime] = None

class SpatialContextResponse(BaseModel):
    anomaly_id: int
    anomaly_type: str
    severity: str
    detected_at: datetime
    observed_value: Optional[float] = None
    threshold_limit: Optional[float] = None
    explanation: str
    mine: Dict[str, Any]
    level: Optional[Dict[str, Any]] = None
    zone: Optional[Dict[str, Any]] = None
    sensor: Dict[str, Any]
    coordinates: Dict[str, float]
    nearby_cameras: List[NearbyCameraDTO]
    nearby_equipment: List[NearbyEquipmentDTO]
    related_incident: Optional[Dict[str, Any]] = None

class MineTelemetrySummary(BaseModel):
    mine_id: int
    mine_code: str
    mine_name: str
    total_sensors: int
    online_sensors: int
    offline_sensors: int
    normal_sensors: int
    warning_sensors: int
    critical_sensors: int
    active_anomalies: int
    active_alerts: int
    critical_alerts: int
    open_incidents: int
    current_risk_score: float
    current_risk_severity: str
    generated_at: datetime
