from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class ProductionReport(Base):
    __tablename__ = "production_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(50), unique=True, index=True, nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    report_date = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False, index=True)
    shift = Column(String(20), default="A", nullable=False) # A, B, C, GENERAL
    material_type = Column(String(50), default="COAL_RAW", nullable=False) # COAL_RAW, COAL_WASHED, OVERBURDEN
    
    planned_quantity = Column(Float, nullable=False)
    actual_quantity = Column(Float, nullable=False)
    unit = Column(String(20), default="TONNES", nullable=False) # TONNES, BCM
    
    variance_quantity = Column(Float, nullable=False) # actual - planned
    variance_percentage = Column(Float, nullable=False) # (variance / planned) * 100
    
    status = Column(String(50), default="SUBMITTED", nullable=False) # DRAFT, SUBMITTED, REVIEWED, APPROVED, REJECTED
    deviation_flag = Column(String(50), default="NORMAL", nullable=False) # NORMAL, DEVIATION_REVIEW_REQUIRED, CRITICAL_SHORTFALL
    
    reporting_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approval_id = Column(Integer, nullable=True) # Linked to ApprovalRequest
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    reporting_officer = relationship("User", foreign_keys=[reporting_officer_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
