from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class MineLevel(Base):
    __tablename__ = "mine_levels"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(50), nullable=False) # e.g. LVL-01, SURFACE, SEAM-03
    name = Column(String(255), nullable=False)
    depth_meters = Column(Float, default=0.0, nullable=False) # e.g. 0.0 for surface, 250.0 for underground
    elevation = Column(Float, nullable=True) # absolute elevation in meters
    sequence_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine", back_populates="levels")
    zones = relationship("MineZone", back_populates="level", cascade="all, delete-orphan")
    sensors = relationship("Sensor", back_populates="level")
    cameras = relationship("Camera", back_populates="level")
    equipment = relationship("Equipment", back_populates="level")

class MineZone(Base):
    __tablename__ = "mine_zones"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    level_id = Column(Integer, ForeignKey("mine_levels.id", ondelete="SET NULL"), nullable=True, index=True)
    code = Column(String(50), nullable=False) # e.g. ZN-EAST-GAL-02
    name = Column(String(255), nullable=False)
    zone_type = Column(String(50), default="PRODUCTION", nullable=False) # PRODUCTION, VENTILATION, HAULAGE, DRIFT, SURFACE_PLANT
    risk_category = Column(String(50), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    
    # 3D Bounding / Reference coordinates
    origin_x = Column(Float, default=0.0, nullable=False)
    origin_y = Column(Float, default=0.0, nullable=False)
    origin_z = Column(Float, default=0.0, nullable=False)
    width = Column(Float, default=100.0, nullable=False)
    length = Column(Float, default=100.0, nullable=False)
    height = Column(Float, default=5.0, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine", back_populates="zones")
    level = relationship("MineLevel", back_populates="zones")
    sensors = relationship("Sensor", back_populates="zone")
    cameras = relationship("Camera", back_populates="zone")
    equipment = relationship("Equipment", back_populates="zone")
    incidents = relationship("Incident", back_populates="zone")
    violations = relationship("Violation", back_populates="zone")
