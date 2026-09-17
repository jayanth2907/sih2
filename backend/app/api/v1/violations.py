from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.authz import get_current_active_user, require_mine_access, require_roles
from app.core.permissions import RoleEnum
from app.models.user import User
from app.schemas.violation import ViolationRead, ViolationCreate, CorrectiveActionRead, CorrectiveActionBase
from app.services.incident_service import ViolationService

router = APIRouter(prefix="/violations", tags=["Statutory Violations & DGMS Compliance"])

@router.get("", response_model=List[ViolationRead])
def list_violations(
    mine_id: Optional[int] = Query(None, description="Filter by Mine ID"),
    status: Optional[str] = Query(None, description="Filter by Violation status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List regulatory/statutory violations (separate from operational incidents)."""
    if mine_id is not None:
        require_mine_access(mine_id, current_user, db)
    violations = ViolationService.get_violations(db, mine_id=mine_id, status=status)
    return [
        ViolationRead(
            id=v.id,
            violation_code=v.violation_code,
            mine_id=v.mine_id,
            zone_id=v.zone_id,
            inspector_id=v.inspector_id,
            title=v.title,
            description=v.description,
            regulatory_clause=v.regulatory_clause,
            statute=v.statute,
            severity=v.severity,
            status=v.status,
            remedial_deadline=v.remedial_deadline,
            financial_penalty_amount=v.financial_penalty_amount,
            created_at=v.created_at,
            updated_at=v.updated_at,
            inspector_name=v.inspector.full_name if v.inspector else None,
            zone_name=v.zone.name if v.zone else None,
            mine_name=v.mine.name if v.mine else None,
            corrective_actions=[
                CorrectiveActionRead(
                    id=ca.id,
                    violation_id=ca.violation_id,
                    action_text=ca.action_text,
                    target_completion_date=ca.target_completion_date,
                    assignee_id=ca.assignee_id,
                    status=ca.status,
                    completion_notes=ca.completion_notes,
                    completed_at=ca.completed_at,
                    created_at=ca.created_at,
                    assignee_name=ca.assignee.full_name if ca.assignee else None
                ) for ca in v.corrective_actions
            ]
        ) for v in violations
    ]

@router.post("", response_model=ViolationRead, status_code=status.HTTP_201_CREATED)
def create_violation(
    v_in: ViolationCreate,
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN, RoleEnum.FIELD_INSPECTOR, RoleEnum.REGULATOR, RoleEnum.MINE_SAFETY_OFFICER])),
    db: Session = Depends(get_db)
):
    """Issue a statutory compliance violation citing relevant Coal Mines Regulations (CMR)."""
    require_mine_access(v_in.mine_id, current_user, db)
    violation = ViolationService.create_violation(db, v_in, inspector_id=current_user.id)
    return ViolationRead.model_validate(violation)

@router.post("/{violation_id}/corrective-actions", response_model=CorrectiveActionRead, status_code=status.HTTP_201_CREATED)
def add_corrective_action(
    violation_id: int,
    ca_in: CorrectiveActionBase,
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN, RoleEnum.MINE_MANAGER, RoleEnum.MINE_SAFETY_OFFICER])),
    db: Session = Depends(get_db)
):
    """Assign mandatory corrective action with deadline to rectify a violation."""
    v = ViolationService.get_violation_by_id(db, violation_id)
    require_mine_access(v.mine_id, current_user, db)
    ca = ViolationService.add_corrective_action(db, violation_id, ca_in)
    return CorrectiveActionRead.model_validate(ca)
