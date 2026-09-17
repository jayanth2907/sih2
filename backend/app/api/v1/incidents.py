from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.authz import get_current_active_user, require_mine_access, require_roles
from app.core.permissions import RoleEnum
from app.models.user import User
from app.schemas.incident import IncidentRead, IncidentCreate, IncidentStatusUpdate
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/incidents", tags=["Safety Incidents & Operational Workflow"])

@router.get("", response_model=List[IncidentRead])
def list_incidents(
    mine_id: Optional[int] = Query(None, description="Filter by Mine ID"),
    status: Optional[str] = Query(None, description="Filter by Incident status (OPEN, TRIAGED, ASSIGNED, IN_PROGRESS, RESOLVED, VERIFIED, CLOSED, ESCALATED)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List safety/operational incidents with full status transition history."""
    if mine_id is not None:
        require_mine_access(mine_id, current_user, db)
    incidents = IncidentService.get_incidents(db, mine_id=mine_id, status=status)
    return [
        IncidentRead(
            id=i.id,
            incident_code=i.incident_code,
            mine_id=i.mine_id,
            level_id=i.level_id,
            zone_id=i.zone_id,
            equipment_id=i.equipment_id,
            reporter_id=i.reporter_id,
            assignee_id=i.assignee_id,
            title=i.title,
            description=i.description,
            category=i.category,
            severity=i.severity,
            status=i.status,
            is_escalated=i.is_escalated,
            escalation_level=i.escalation_level,
            sla_hours=i.sla_hours,
            sla_due_at=i.sla_due_at,
            resolution_notes=i.resolution_notes,
            resolved_at=i.resolved_at,
            verified_at=i.verified_at,
            closed_at=i.closed_at,
            x=i.x,
            y=i.y,
            z=i.z,
            latitude=i.latitude,
            longitude=i.longitude,
            created_at=i.created_at,
            updated_at=i.updated_at,
            reporter_name=i.reporter.full_name if i.reporter else None,
            assignee_name=i.assignee.full_name if i.assignee else None,
            zone_name=i.zone.name if i.zone else None,
            mine_name=i.mine.name if i.mine else None,
            events=[e for e in i.events]
        ) for i in incidents
    ]

@router.post("", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: IncidentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Log an operational safety incident requiring triage, corrective response, and verification."""
    require_mine_access(incident_in.mine_id, current_user, db)
    incident = IncidentService.create_incident(db, incident_in, reporter_id=current_user.id)
    return IncidentRead.model_validate(incident)

@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident(
    incident_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get single incident details with lifecycle history events."""
    incident = IncidentService.get_incident_by_id(db, incident_id)
    require_mine_access(incident.mine_id, current_user, db)
    return IncidentRead.model_validate(incident)

@router.patch("/{incident_id}/status", response_model=IncidentRead)
def update_incident_status(
    incident_id: int,
    status_update: IncidentStatusUpdate,
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN, RoleEnum.MINE_MANAGER, RoleEnum.MINE_SAFETY_OFFICER, RoleEnum.FIELD_INSPECTOR])),
    db: Session = Depends(get_db)
):
    """Progress incident through the state machine: OPEN -> TRIAGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> VERIFIED -> CLOSED."""
    incident = IncidentService.get_incident_by_id(db, incident_id)
    require_mine_access(incident.mine_id, current_user, db)
    updated = IncidentService.update_incident_status(db, incident_id, status_update, actor_id=current_user.id)
    return IncidentRead.model_validate(updated)
