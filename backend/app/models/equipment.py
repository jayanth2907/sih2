from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    equipment_code = Column(String(100), unique=True, nullable=False, index=True) # e.g. EQP-SHEARER-01
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    level_id = Column(Integer, ForeignKey("mine_levels.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False) # CONTINUOUS_MINER, SHEARER, CONVEYOR, VENTILATION_FAN, HAUL_TRUCK, WINDING_ENGINE
    status = Column(String(50), default="OPERATIONAL", nullable=False) # OPERATIONAL, WARNING, CRITICAL, MAINTENANCE, DECOMMISSIONED
    manufacturer = Column(String(100), nullable=True)
    model_number = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)
    
    # 3D Spatial coordinates
    x = Column(Float, default=0.0, nullable=False)
    y = Column(Float, default=0.0, nullable=False)
    z = Column(Float, default=0.0, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True)
    
    last_serviced_at = Column(DateTime, nullable=True)
    next_service_due = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine", back_populates="equipment")
    level = relationship("MineLevel", back_populates="equipment")
    zone = relationship("MineZone", back_populates="equipment")
    incidents = relationship("Incident", back_populates="equipment")
