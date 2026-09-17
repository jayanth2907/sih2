from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.core.authz import get_current_active_user, require_mine_access
from app.models.user import User
from app.models.copilot import CopilotHistory

from app.copilot.schemas import (
    CopilotQueryRequest, CopilotQueryResponse, CopilotQuickPrompt, ToolDefinition
)
from app.copilot.orchestrator import CopilotOrchestrator
from app.copilot.i18n import CopilotI18n
from app.copilot.tool_registry import tool_registry

router = APIRouter(prefix="/copilot", tags=["AI Governance Copilot"])

@router.post("/query", response_model=CopilotQueryResponse, status_code=status.HTTP_200_OK)
async def query_copilot(
    request: CopilotQueryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Query the AI Governance Copilot.
    Validates RBAC and Mine Authorization, runs allow-listed tools, defends against prompt injection,
    and returns evidence-grounded multilingual governance intelligence with 3D/governance actions.
    """
    return await CopilotOrchestrator.process_query(request, current_user, db)

@router.get("/quick-prompts", response_model=List[CopilotQuickPrompt])
def get_quick_prompts(
    current_user: User = Depends(get_current_active_user)
):
    """Returns curated multilingual quick action prompts for English, Hindi, and Telugu."""
    return CopilotI18n.QUICK_PROMPTS

@router.get("/tools", response_model=List[ToolDefinition])
def get_registered_tools(
    current_user: User = Depends(get_current_active_user)
):
    """Returns the controlled allow-list of registered tools with permitted roles."""
    return tool_registry.list_tools()

@router.get("/history/{mine_id}")
def get_copilot_history(
    mine_id: int,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Returns auditable query history for the specified mine."""
    require_mine_access(mine_id, current_user, db)
    
    history = (
        db.query(CopilotHistory)
        .filter(CopilotHistory.mine_id == mine_id)
        .order_by(desc(CopilotHistory.created_at))
        .limit(limit)
        .all()
    )
    
    return [
        {
            "id": h.id,
            "conversation_id": h.conversation_id,
            "query": h.query_text,
            "language": h.language,
            "intent": h.intent,
            "answer": h.answer_text,
            "provider_used": h.provider_used,
            "created_at": h.created_at.isoformat()
        }
        for h in history
    ]
