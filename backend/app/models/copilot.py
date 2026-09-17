from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class CopilotHistory(Base):
    __tablename__ = "copilot_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    conversation_id = Column(String(64), nullable=False, index=True)
    query_text = Column(Text, nullable=False)
    language = Column(String(10), default="en", nullable=False)
    intent = Column(String(64), nullable=False)
    tools_used_json = Column(Text, nullable=True)
    answer_text = Column(Text, nullable=False)
    evidence_json = Column(Text, nullable=True)
    actions_json = Column(Text, nullable=True)
    provider_used = Column(String(32), default="DETERMINISTIC_GROUNDED_FALLBACK", nullable=False)
    data_provenance = Column(String(64), default="REAL_BACKEND_DATA | SIMULATED_TELEMETRY", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User")
    mine = relationship("Mine")
