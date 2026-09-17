from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class RegulatoryReport(Base):
    __tablename__ = "regulatory_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(50), unique=True, index=True, nullable=False)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(String(100), nullable=False) # COMPLIANCE_SUMMARY, SAFETY_INSPECTION_SUMMARY, INCIDENT_SUMMARY, ENVIRONMENTAL_SUMMARY, PRODUCTION_SUMMARY, MINE_GOVERNANCE_SUMMARY
    
    title = Column(String(255), nullable=False)
    reporting_period_start = Column(Date, nullable=False)
    reporting_period_end = Column(Date, nullable=False)
    
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False) # DRAFT, SUBMITTED, APPROVED, ARCHIVED
    current_version = Column(Integer, default=1, nullable=False)
    
    pdf_storage_path = Column(String(500), nullable=True)
    summary_data = Column(JSON, nullable=True) # Summary snapshot
    
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    generated_by = relationship("User")
    versions = relationship("ReportVersion", back_populates="report", cascade="all, delete-orphan")

class ReportVersion(Base):
    __tablename__ = "report_versions"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("regulatory_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    summary_json = Column(JSON, nullable=False)
    approval_id = Column(Integer, ForeignKey("approval_requests.id"), nullable=True)
    file_path = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("RegulatoryReport", back_populates="versions")
    generated_by = relationship("User")
    approval = relationship("ApprovalRequest")
