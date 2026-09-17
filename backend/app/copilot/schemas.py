from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class EvidenceItem(BaseModel):
    source_type: str = Field(..., description="Entity category, e.g. SENSOR, INCIDENT, PREDICTIVE_RISK")
    entity_id: Optional[str] = None
    title: str
    description: str
    status_or_value: str
    severity: Optional[str] = "INFO"  # LOW, MEDIUM, HIGH, CRITICAL, INFO
    deep_link: Optional[Dict[str, Any]] = None

class CopilotAction(BaseModel):
    action_type: str = Field(..., description="Action trigger, e.g. FOCUS_3D_ZONE, NAVIGATE_TAB")
    label: str
    payload: Dict[str, Any]

class PredictiveSignalSummary(BaseModel):
    current_risk_score: float
    predicted_risk_score: float
    horizon: str = "30 minutes"
    probability: float
    top_signals: List[str] = []

class CopilotQueryRequest(BaseModel):
    mine_id: int
    query: str = Field(..., min_length=1, max_length=1000)
    conversation_id: Optional[str] = None
    language: Optional[str] = Field("en", description="ISO language code: en, hi, te")

class CopilotQueryResponse(BaseModel):
    conversation_id: str
    mine_id: int
    mine_name: str
    language: str
    query: str
    intent: str
    tools_invoked: List[str]
    summary: str
    evidence: List[EvidenceItem] = []
    predictive_signal: Optional[PredictiveSignalSummary] = None
    recommended_next_step: str
    actions: List[CopilotAction] = []
    answer_markdown: str
    data_provenance: str = "REAL_BACKEND_DATA | SIMULATED_TELEMETRY"
    provider_used: str = "DETERMINISTIC_GROUNDED_FALLBACK"
    data_coverage: str = "SUFFICIENT (100% telemetry streams)"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CopilotQuickPrompt(BaseModel):
    id: str
    category: str
    prompt_en: str
    prompt_hi: str
    prompt_te: str

class ToolDefinition(BaseModel):
    name: str
    description: str
    allowed_roles: List[str]
    parameters: Dict[str, Any]
