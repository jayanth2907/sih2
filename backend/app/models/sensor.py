from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base

class SensorType(Base):
    __tablename__ = "sensor_types"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True) # METHANE, CARBON_MONOXIDE, TEMPERATURE, AIR_VELOCITY, DUST_PM, VIBRATION, HUMIDITY, PRESSURE
    name = Column(String(100), nullable=False)
    unit = Column(String(20), nullable=False) # %, ppm, °C, m/s, mg/m3, mm/s, %RH, kPa
    default_normal_min = Column(Float, nullable=True)
    default_normal_max = Column(Float, nullable=True)
    default_warning_threshold = Column(Float, nullable=True)
    default_critical_threshold = Column(Float, nullable=True)
    description = Column(String(255), nullable=True)

    sensors = relationship("Sensor", back_populates="sensor_type")

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    sensor_code = Column(String(100), unique=True, nullable=False, index=True) # e.g. SN-BDS04-CH4-101
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    level_id = Column(Integer, ForeignKey("mine_levels.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True, index=True)
    sensor_type_id = Column(Integer, ForeignKey("sensor_types.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    unit = Column(String(20), nullable=False)
    normal_min = Column(Float, nullable=True)
    normal_max = Column(Float, nullable=True)
    warning_threshold = Column(Float, nullable=False)
    critical_threshold = Column(Float, nullable=False)
    
    # 3D Spatial coordinates for Digital Mine Twin
    x = Column(Float, default=0.0, nullable=False)
    y = Column(Float, default=0.0, nullable=False)
    z = Column(Float, default=0.0, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    elevation = Column(Float, nullable=True)
    
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, WARNING, CRITICAL, OFFLINE, MAINTENANCE
    last_value = Column(Float, nullable=True)
    last_reading_at = Column(DateTime, nullable=True)
    installation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine", back_populates="sensors")
    level = relationship("MineLevel", back_populates="sensors")
    zone = relationship("MineZone", back_populates="sensors")
    sensor_type = relationship("SensorType", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyEvent", back_populates="sensor")

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    quality = Column(String(50), default="GOOD", nullable=False) # GOOD, UNCERTAIN, BAD
    source = Column(String(50), default="SIMULATED", nullable=False) # SIMULATED, MQTT, API, SCADA, EXTERNAL
    ingestion_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    sensor = relationship("Sensor", back_populates="readings")

Index("idx_sensor_readings_sensor_time", SensorReading.sensor_id, SensorReading.timestamp)
