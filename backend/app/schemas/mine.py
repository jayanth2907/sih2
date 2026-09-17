from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class MineZoneBase(BaseModel):
    code: str
    name: str
    zone_type: str = "PRODUCTION"
    risk_category: str = "MEDIUM"
    origin_x: float = 0.0
    origin_y: float = 0.0
    origin_z: float = 0.0
    width: float = 100.0
    length: float = 100.0
    height: float = 5.0

class MineZoneCreate(MineZoneBase):
    level_id: Optional[int] = None

class MineZoneRead(MineZoneBase):
    id: int
    mine_id: int
    level_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MineLevelBase(BaseModel):
    code: str
    name: str
    depth_meters: float = 0.0
    elevation: Optional[float] = None
    sequence_order: int = 0

class MineLevelCreate(MineLevelBase):
    pass

class MineLevelRead(MineLevelBase):
    id: int
    mine_id: int
    zones: List[MineZoneRead] = []
    created_at: datetime

    class Config:
        from_attributes = True

class MineBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    mine_type: str = "UNDERGROUND"
    state: str
    district: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    status: str = "OPERATIONAL"

class MineCreate(MineBase):
    pass

class MineRead(MineBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MineDetail(MineRead):
    levels: List[MineLevelRead] = []
    total_sensors: int = 0
    total_cameras: int = 0
    active_incidents: int = 0
    risk_score: Optional[float] = None
    risk_severity: Optional[str] = None

class MineDigitalTwinResponse(BaseModel):
    mine: MineRead
    levels: List[MineLevelRead]
    zones: List[MineZoneRead]
    sensors: List[dict]
    cameras: List[dict]
    equipment: List[dict]
    active_incidents: List[dict]
    anomalies: List[dict]
    current_risk_score: Optional[float] = None
    current_risk_severity: Optional[str] = None
