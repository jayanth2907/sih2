from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.authz import get_current_active_user, require_mine_access
from app.models.user import User
from app.models.risk import AnomalyEvent
from app.schemas.risk import RiskScoreRead, AnomalyEventRead
from app.schemas.telemetry import SpatialContextResponse
from app.services.risk_service import RiskService
from app.services.spatial_context_service import SpatialContextService
from app.core.exceptions import EntityNotFoundError

router = APIRouter(prefix="", tags=["Risk Intelligence & Anomalies"])

@router.get("/risk/{mine_id}", response_model=RiskScoreRead)
def evaluate_mine_risk(
    mine_id: int,
    recalculate: bool = Query(True, description="Whether to trigger dynamic calculation with live factors"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get multi-factor explainable risk score (0-30 LOW, 31-60 MEDIUM, 61-80 HIGH, 81-100 CRITICAL) including Silence-to-Risk."""
    require_mine_access(mine_id, current_user, db)
    if recalculate:
        res = RiskService.calculate_mine_risk(db, mine_id)
        latest = RiskService.get_latest_risk_score(db, mine_id)
        return RiskScoreRead.model_validate(latest)
    
    latest = RiskService.get_latest_risk_score(db, mine_id)
    if not latest:
        RiskService.calculate_mine_risk(db, mine_id)
        latest = RiskService.get_latest_risk_score(db, mine_id)
    return RiskScoreRead.model_validate(latest)

@router.get("/anomalies", response_model=List[AnomalyEventRead])
def list_anomalies(
    mine_id: Optional[int] = Query(None, description="Filter by Mine ID"),
    status: Optional[str] = Query(None, description="Filter by Status (ACTIVE, RECOVERING, RESOLVED)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List sensor threshold breaches, sudden spikes, sustained anomalies, and silence-to-risk events."""
    if mine_id is not None:
        require_mine_access(mine_id, current_user, db)
    
    query = db.query(AnomalyEvent)
    if mine_id is not None:
        query = query.filter(AnomalyEvent.mine_id == mine_id)
    if status:
        query = query.filter(AnomalyEvent.status == status)
    
    anomalies = query.order_by(AnomalyEvent.detected_at.desc()).limit(100).all()
    return [
        AnomalyEventRead(
            id=a.id,
            mine_id=a.mine_id,
            sensor_id=a.sensor_id,
            level_id=a.level_id,
            zone_id=a.zone_id,
            incident_id=a.incident_id,
            anomaly_type=a.anomaly_type,
            severity=a.severity,
            observed_value=a.observed_value or a.value_recorded,
            expected_range=a.expected_range,
            threshold_limit=a.threshold_limit,
            unit=a.unit,
            description=a.description,
            x=a.x,
            y=a.y,
            z=a.z,
            source=a.source,
            status=a.status,
            detected_at=a.detected_at,
            resolved_at=a.resolved_at,
            is_processed=a.is_processed,
            sensor_code=a.sensor.sensor_code if a.sensor else None,
            zone_name=a.zone.name if a.zone else (a.sensor.zone.name if (a.sensor and a.sensor.zone) else None),
            level_name=a.level.name if a.level else (a.sensor.level.name if (a.sensor and a.sensor.level) else None),
            mine_name=a.mine.name if a.mine else None
        ) for a in anomalies
    ]

@router.get("/anomalies/{anomaly_id}", response_model=AnomalyEventRead)
def get_anomaly_detail(
    anomaly_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get single anomaly event detail."""
    a = db.query(AnomalyEvent).filter(AnomalyEvent.id == anomaly_id).first()
    if not a:
        raise EntityNotFoundError("AnomalyEvent", anomaly_id)
    require_mine_access(a.mine_id, current_user, db)
    return AnomalyEventRead(
        id=a.id,
        mine_id=a.mine_id,
        sensor_id=a.sensor_id,
        level_id=a.level_id,
        zone_id=a.zone_id,
        incident_id=a.incident_id,
        anomaly_type=a.anomaly_type,
        severity=a.severity,
        observed_value=a.observed_value or a.value_recorded,
        expected_range=a.expected_range,
        threshold_limit=a.threshold_limit,
        unit=a.unit,
        description=a.description,
        x=a.x,
        y=a.y,
        z=a.z,
        source=a.source,
        status=a.status,
        detected_at=a.detected_at,
        resolved_at=a.resolved_at,
        is_processed=a.is_processed,
        sensor_code=a.sensor.sensor_code if a.sensor else None,
        zone_name=a.zone.name if a.zone else None,
        level_name=a.level.name if a.level else None,
        mine_name=a.mine.name if a.mine else None
    )

@router.get("/anomalies/{anomaly_id}/context", response_model=SpatialContextResponse)
def get_anomaly_spatial_context(
    anomaly_id: int,
    radius_meters: float = Query(250.0, description="Spatial search radius in meters"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve full 3D spatial proximity context: mine, level, zone, coordinates, nearby cameras (with yaw/pitch/fov), and nearby machinery."""
    a = db.query(AnomalyEvent).filter(AnomalyEvent.id == anomaly_id).first()
    if not a:
        raise EntityNotFoundError("AnomalyEvent", anomaly_id)
    require_mine_access(a.mine_id, current_user, db)
    return SpatialContextService.get_spatial_context_for_anomaly(db, anomaly_id, radius_meters=radius_meters)
