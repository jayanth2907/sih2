from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_code = Column(String(100), unique=True, nullable=False, index=True) # e.g. CAM-BDS04-SHAFT-01
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    level_id = Column(Integer, ForeignKey("mine_levels.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    
    name = Column(String(255), nullable=False)
    camera_type = Column(String(50), default="FIXED_OPTICAL", nullable=False) # FIXED_OPTICAL, PTZ, THERMAL, FLAME_PROOF_EX
    stream_url = Column(String(255), nullable=True) # Future RTSP/WebRTC stream url
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, OFFLINE, MAINTENANCE
    
    # 3D Spatial coordinates & orientation for Digital Twin
    x = Column(Float, default=0.0, nullable=False)
    y = Column(Float, default=0.0, nullable=False)
    z = Column(Float, default=0.0, nullable=False)
    yaw = Column(Float, default=0.0, nullable=False) # horizontal rotation degrees
    pitch = Column(Float, default=0.0, nullable=False) # vertical tilt degrees
    fov = Column(Float, default=90.0, nullable=False) # field of view
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True)
    
    resolution = Column(String(50), default="1080p", nullable=True)
    is_simulated = Column(String(20), default="SIMULATED", nullable=False) # SIMULATED, REAL
    installation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine", back_populates="cameras")
    level = relationship("MineLevel", back_populates="cameras")
    zone = relationship("MineZone", back_populates="cameras")
