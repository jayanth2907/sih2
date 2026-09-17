from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=True, index=True)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    doc_type = Column(String(100), nullable=False) # DGMS_PERMISSION, STATUTORY_REPORT, SAFETY_AUDIT, CONTRACTOR_COMPLIANCE, EVIDENCE
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), default="application/pdf", nullable=False)
    file_size_bytes = Column(Integer, default=0, nullable=False)
    ocr_status = Column(String(50), default="PENDING", nullable=False) # PENDING, PROCESSING, COMPLETED, FAILED
    
    extracted_text = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    verified_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    mine = relationship("Mine")
    uploader = relationship("User", foreign_keys=[uploader_id])
    fields = relationship("ExtractedDocumentField", back_populates="document", cascade="all, delete-orphan")

class ExtractedDocumentField(Base):
    __tablename__ = "extracted_document_fields"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False) # e.g. "Permit_Number", "Expiry_Date", "Gas_Limit"
    field_value = Column(String(500), nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)
    is_verified = Column(String(10), default="NO", nullable=False)

    document = relationship("Document", back_populates="fields")
