from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class Mine(Base):
    __tablename__ = "mines"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True) # e.g. MINE-BDS-04
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    mine_type = Column(String(50), default="UNDERGROUND", nullable=False) # UNDERGROUND, OPENCAST, MIXED
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True)
    status = Column(String(50), default="OPERATIONAL", nullable=False) # OPERATIONAL, MAINTENANCE, DECOMMISSIONED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Hierarchical and asset relationships
    levels = relationship("MineLevel", back_populates="mine", cascade="all, delete-orphan")
    zones = relationship("MineZone", back_populates="mine", cascade="all, delete-orphan")
    sensors = relationship("Sensor", back_populates="mine", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="mine", cascade="all, delete-orphan")
    equipment = relationship("Equipment", back_populates="mine", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="mine", cascade="all, delete-orphan")
    violations = relationship("Violation", back_populates="mine", cascade="all, delete-orphan")
    risk_scores = relationship("RiskScore", back_populates="mine", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyEvent", back_populates="mine", cascade="all, delete-orphan")
    user_assignments = relationship("UserMineAssignment", back_populates="mine", cascade="all, delete-orphan")
