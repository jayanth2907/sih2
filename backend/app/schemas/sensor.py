from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class SensorTypeRead(BaseModel):
    id: int
    code: str
    name: str
    unit: str
    default_normal_min: Optional[float] = None
    default_normal_max: Optional[float] = None
    default_warning_threshold: Optional[float] = None
    default_critical_threshold: Optional[float] = None

    class Config:
        from_attributes = True

class SensorBase(BaseModel):
    sensor_code: str
    name: str
    unit: str
    normal_min: Optional[float] = None
    normal_max: Optional[float] = None
    warning_threshold: float
    critical_threshold: float
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    status: str = "ACTIVE"
    installation_notes: Optional[str] = None

class SensorCreate(SensorBase):
    mine_id: int
    level_id: Optional[int] = None
    zone_id: Optional[int] = None
    sensor_type_id: int

class SensorRead(SensorBase):
    id: int
    mine_id: int
    level_id: Optional[int] = None
    zone_id: Optional[int] = None
    sensor_type_id: int
    last_value: Optional[float] = None
    last_reading_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    sensor_type_code: Optional[str] = None
    zone_name: Optional[str] = None
    level_name: Optional[str] = None

    class Config:
        from_attributes = True

class SensorReadingCreate(BaseModel):
    sensor_id: int
    value: float
    unit: str
    quality: str = "GOOD"
    source: str = "SIMULATED" # SIMULATED, MQTT, API, SCADA, EXTERNAL
    timestamp: Optional[datetime] = None

class SensorReadingRead(BaseModel):
    id: int
    sensor_id: int
    timestamp: datetime
    value: float
    unit: str
    quality: str
    source: str
    ingestion_timestamp: datetime

    class Config:
        from_attributes = True
