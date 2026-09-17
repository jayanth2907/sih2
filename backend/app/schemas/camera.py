from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class CameraBase(BaseModel):
    camera_code: str
    name: str
    camera_type: str = "FIXED_OPTICAL"
    stream_url: Optional[str] = None
    status: str = "ACTIVE"
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    yaw: float = 0.0
    pitch: float = 0.0
    fov: float = 90.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    resolution: Optional[str] = "1080p"
    is_simulated: str = "SIMULATED"
    installation_notes: Optional[str] = None

class CameraCreate(CameraBase):
    mine_id: int
    level_id: Optional[int] = None
    zone_id: Optional[int] = None

class CameraRead(CameraBase):
    id: int
    mine_id: int
    level_id: Optional[int] = None
    zone_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    zone_name: Optional[str] = None
    level_name: Optional[str] = None

    class Config:
        from_attributes = True

class EquipmentBase(BaseModel):
    equipment_code: str
    name: str
    category: str
    status: str = "OPERATIONAL"
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    last_serviced_at: Optional[datetime] = None
    next_service_due: Optional[datetime] = None
    notes: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    mine_id: int
    level_id: Optional[int] = None
    zone_id: Optional[int] = None

class EquipmentRead(EquipmentBase):
    id: int
    mine_id: int
    level_id: Optional[int] = None
    zone_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    zone_name: Optional[str] = None

    class Config:
        from_attributes = True
