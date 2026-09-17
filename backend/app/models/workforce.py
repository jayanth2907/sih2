from datetime import datetime, timezone, date, time
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Time, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    worker_code = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    designation = Column(String(100), nullable=False)
    trade_category = Column(String(50), default="MINER", nullable=False) # MINER, ELECTRICIAN, DRILLER, LOADER, OPERATOR, FITTER, OVERMAN
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="SET NULL"), nullable=True, index=True)
    
    is_contractual = Column(Boolean, default=False, nullable=False)
    emergency_contact = Column(String(50), nullable=True)
    blood_group = Column(String(10), nullable=True)
    medical_fitness_expiry = Column(Date, nullable=True)
    safety_induction_completed = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, INACTIVE, SUSPENDED
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    contractor = relationship("Contractor", back_populates="workers")
    attendance_records = relationship("AttendanceRecord", back_populates="worker", cascade="all, delete-orphan")

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False)
    shift_code = Column(String(20), nullable=False) # A, B, C, GENERAL
    name = Column(String(100), nullable=False)
    start_time = Column(String(10), nullable=False) # e.g. "06:00"
    end_time = Column(String(10), nullable=False)   # e.g. "14:00"
    is_night_shift = Column(Boolean, default=False, nullable=False)

    mine = relationship("Mine")
    attendance_records = relationship("AttendanceRecord", back_populates="shift")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="SET NULL"), nullable=True, index=True)
    attendance_date = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False, index=True)
    
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    status = Column(String(50), default="PRESENT", nullable=False) # PRESENT, ABSENT, LATE, ON_LEAVE, UNKNOWN
    verification_mode = Column(String(50), default="SIMULATED", nullable=False) # MANUAL, RFID_CARD, SIMULATED
    marked_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    worker = relationship("Worker", back_populates="attendance_records")
    mine = relationship("Mine")
    shift = relationship("Shift", back_populates="attendance_records")
    marked_by = relationship("User")
