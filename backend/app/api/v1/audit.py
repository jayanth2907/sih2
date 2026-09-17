from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.authz import require_roles, get_current_active_user
from app.core.permissions import RoleEnum
from app.models.user import User
from app.models.audit import AuditEvent
from app.schemas.risk import AuditEventRead

router = APIRouter(prefix="/audit", tags=["Governance & Cryptographic Audit Trail"])

@router.get("", response_model=List[AuditEventRead])
def get_audit_trail(
    mine_id: Optional[int] = Query(None, description="Filter by Mine ID"),
    resource_type: Optional[str] = Query(None, description="Filter by resource (MINE, SENSOR, INCIDENT, VIOLATION, USER)"),
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN, RoleEnum.REGULATOR, RoleEnum.MINE_MANAGER])),
    db: Session = Depends(get_db)
):
    """Retrieve immutable audit log with cryptographic hash verification chain."""
    query = db.query(AuditEvent)
    if mine_id is not None:
        query = query.filter(AuditEvent.mine_id == mine_id)
    if resource_type:
        query = query.filter(AuditEvent.resource_type == resource_type)
        
    events = query.order_by(AuditEvent.timestamp.desc()).limit(100).all()
    return [AuditEventRead.model_validate(e) for e in events]
