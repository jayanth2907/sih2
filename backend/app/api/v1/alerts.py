from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.authz import get_current_active_user, require_mine_access, get_user_roles, get_user_assigned_mine_ids
from app.core.permissions import RoleEnum
from app.models.user import User
from app.schemas.alert import AlertRead, AlertStatusUpdate
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Operational Alerts & Alarms"])

@router.get("", response_model=List[AlertRead])
def list_alerts(
    mine_id: Optional[int] = Query(None, description="Filter by Mine ID"),
    status: Optional[str] = Query(None, description="Filter by Status (UNREAD, READ, ACKNOWLEDGED, RESOLVED)"),
    severity: Optional[str] = Query(None, description="Filter by Severity (LOW, MEDIUM, HIGH, CRITICAL)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List operational alerts with location context and severity levels (role-scoped)."""
    roles = get_user_roles(current_user, db)
    if RoleEnum.SYSTEM_ADMIN.value not in roles and RoleEnum.REGULATOR.value not in roles and not current_user.is_superuser:
        assigned_mines = get_user_assigned_mine_ids(current_user, db)
        if mine_id is not None:
            require_mine_access(mine_id, current_user, db)
        else:
            # Filter by first assigned mine if not supplied
            mine_id = assigned_mines[0] if assigned_mines else -1

    alerts = AlertService.get_alerts(db, mine_id=mine_id, status=status, severity=severity)
    return [
        AlertRead(
            id=a.id,
            mine_id=a.mine_id,
            sensor_id=a.sensor_id,
            anomaly_id=a.anomaly_id,
            incident_id=a.incident_id,
            title=a.title,
            message=a.message,
            severity=a.severity,
            risk_score=a.risk_score,
            status=a.status,
            source=a.source,
            recipient_scope=a.recipient_scope,
            location_context=a.location_context,
            created_at=a.created_at,
            acknowledged_at=a.acknowledged_at,
            resolved_at=a.resolved_at,
            sensor_code=a.sensor.sensor_code if a.sensor else None,
            mine_name=a.mine.name if a.mine else None
        ) for a in alerts
    ]

@router.get("/{alert_id}", response_model=AlertRead)
def get_alert_detail(
    alert_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get single alert details."""
    alert = AlertService.get_alert_by_id(db, alert_id)
    require_mine_access(alert.mine_id, current_user, db)
    return AlertRead.model_validate(alert)

@router.patch("/{alert_id}/status", response_model=AlertRead)
def update_alert_status(
    alert_id: int,
    status_update: AlertStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update alert status (e.g. ACKNOWLEDGED or RESOLVED)."""
    alert = AlertService.get_alert_by_id(db, alert_id)
    require_mine_access(alert.mine_id, current_user, db)
    updated = AlertService.update_alert_status(db, alert_id, status_update, actor_id=current_user.id)
    return AlertRead.model_validate(updated)
