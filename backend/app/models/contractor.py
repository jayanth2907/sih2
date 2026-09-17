from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(Integer, primary_key=True, index=True)
    contractor_code = Column(String(50), unique=True, index=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    registration_number = Column(String(100), nullable=False)
    contact_person = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    pan_number = Column(String(50), nullable=True)
    gst_number = Column(String(50), nullable=True)
    safety_rating = Column(Float, default=4.2, nullable=False) # 1.0 to 5.0
    status = Column(String(50), default="ACTIVE", nullable=False) # ACTIVE, BLACKLISTED, SUSPENDED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    contracts = relationship("Contract", back_populates="contractor", cascade="all, delete-orphan")
    workers = relationship("Worker", back_populates="contractor")

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    contract_code = Column(String(50), unique=True, index=True, nullable=False)
    contractor_id = Column(Integer, ForeignKey("contractors.id", ondelete="CASCADE"), nullable=False, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    
    work_scope = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False, index=True)
    total_value = Column(Float, nullable=False)
    
    status = Column(String(50), default="ACTIVE", nullable=False) # DRAFT, ACTIVE, EXPIRING, EXPIRED, SUSPENDED, CLOSED
    compliance_status = Column(String(50), default="COMPLIANT", nullable=False) # COMPLIANT, REVIEW_REQUIRED, NON_COMPLIANT
    responsible_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    contractor = relationship("Contractor", back_populates="contracts")
    mine = relationship("Mine")
    responsible_officer = relationship("User")
    requirements = relationship("ContractRequirement", back_populates="contract", cascade="all, delete-orphan")

class ContractRequirement(Base):
    __tablename__ = "contract_requirements"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    document_type = Column(String(100), nullable=False) # ESI_EPF_CERTIFICATE, SAFETY_TRAINING_RECORD, INSURANCE_POLICY, MEDICAL_FITNESS
    mandatory = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="DOCUMENTED", nullable=False) # DOCUMENTED, PENDING, EXPIRED, NOT_PROVIDED
    expiry_date = Column(Date, nullable=True)
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    contract = relationship("Contract", back_populates="requirements")
    verified_by = relationship("User")
