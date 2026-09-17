from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.authz import get_current_active_user, require_mine_access, require_roles, get_user_roles
from app.core.permissions import RoleEnum
from app.models.user import User
from app.schemas.sensor import SensorRead, SensorCreate, SensorReadingRead, SensorReadingCreate, SensorTypeRead
from app.schemas.telemetry import TelemetryIngestPayload, SimulationScenarioRequest, MineTelemetrySummary
from app.services.sensor_service import SensorService

router = APIRouter(prefix="", tags=["Sensors & Telemetry"])

@router.get("/sensors/types", response_model=List[SensorTypeRead])
def get_sensor_types(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all supported environmental and operational sensor types (Methane, CO, Temp, Air Velocity, Dust, etc.)."""
    return SensorService.get_sensor_types(db)

@router.get("/sensors", response_model=List[SensorRead])
def list_sensors(
    mine_id: int = Query(..., description="Target mine ID"),
    status: Optional[str] = Query(None, description="Filter by sensor status (ACTIVE, WARNING, CRITICAL, OFFLINE)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all sensors deployed in a mine with their 3D coordinates, thresholds, and last telemetry."""
    require_mine_access(mine_id, current_user, db)
    sensors = SensorService.get_sensors_by_mine(db, mine_id, status=status)
    return [
        SensorRead(
            id=s.id,
            sensor_code=s.sensor_code,
            mine_id=s.mine_id,
            level_id=s.level_id,
            zone_id=s.zone_id,
            sensor_type_id=s.sensor_type_id,
            name=s.name,
            unit=s.unit,
            normal_min=s.normal_min,
            normal_max=s.normal_max,
            warning_threshold=s.warning_threshold,
            critical_threshold=s.critical_threshold,
            x=s.x,
            y=s.y,
            z=s.z,
            latitude=s.latitude,
            longitude=s.longitude,
            elevation=s.elevation,
            status=s.status,
            installation_notes=s.installation_notes,
            last_value=s.last_value,
            last_reading_at=s.last_reading_at,
            created_at=s.created_at,
            updated_at=s.updated_at,
            sensor_type_code=s.sensor_type.code if s.sensor_type else None,
            zone_name=s.zone.name if s.zone else None,
            level_name=s.level.name if s.level else None
        ) for s in sensors
    ]

@router.get("/sensors/{sensor_id}", response_model=SensorRead)
def get_sensor(
    sensor_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get single sensor profile and thresholds."""
    sensor = SensorService.get_sensor_by_id(db, sensor_id)
    require_mine_access(sensor.mine_id, current_user, db)
    return SensorRead.model_validate(sensor)

@router.get("/sensors/{sensor_id}/readings", response_model=List[SensorReadingRead])
def get_sensor_readings(
    sensor_id: int,
    limit: int = Query(50, description="Max readings to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get time-series telemetry reading history for a sensor."""
    sensor = SensorService.get_sensor_by_id(db, sensor_id)
    require_mine_access(sensor.mine_id, current_user, db)
    readings = SensorService.get_sensor_readings(db, sensor_id, limit=limit)
    return [SensorReadingRead.model_validate(r) for r in readings]

@router.post("/sensors", response_model=SensorRead, status_code=status.HTTP_201_CREATED)
def register_sensor(
    sensor_in: SensorCreate,
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN, RoleEnum.MINE_MANAGER, RoleEnum.MINE_SAFETY_OFFICER])),
    db: Session = Depends(get_db)
):
    """Register a new sensor with spatial coordinates and threshold parameters."""
    require_mine_access(sensor_in.mine_id, current_user, db)
    sensor = SensorService.create_sensor(db, sensor_in, creator_id=current_user.id)
    return SensorRead.model_validate(sensor)

@router.post("/sensors/readings/ingest", status_code=status.HTTP_201_CREATED)
def ingest_telemetry_reading(
    payload: TelemetryIngestPayload,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Ingest, validate, and evaluate a telemetry reading through the full anomaly, risk, and alert pipeline."""
    if payload.mine_id is not None:
        require_mine_access(payload.mine_id, current_user, db)
    result = SensorService.validate_and_ingest_reading(db, payload)
    return result

@router.post("/sensors/simulate-batch/{mine_id}", response_model=List[SensorReadingRead])
def simulate_mine_telemetry_batch(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Simulate a baseline telemetry tick across all sensors in a mine."""
    require_mine_access(mine_id, current_user, db)
    readings = SensorService.simulate_telemetry_batch(db, mine_id)
    return [SensorReadingRead.model_validate(r) for r in readings]

@router.post("/sensors/simulate-scenario/{mine_id}", response_model=List[SensorReadingRead])
def simulate_mine_scenario(
    mine_id: int,
    scenario_req: SimulationScenarioRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Execute a deterministic simulation scenario (e.g. METHANE_SPIKE, CO_SPIKE, VENTILATION_DROP, SENSOR_OFFLINE, RECOVERING)."""
    require_mine_access(mine_id, current_user, db)
    readings = SensorService.simulate_scenario_batch(
        db,
        mine_id,
        scenario=scenario_req.scenario,
        target_sensor_code=scenario_req.sensor_code
    )
    return [SensorReadingRead.model_validate(r) for r in readings]

@router.get("/mines/{mine_id}/telemetry/summary", response_model=MineTelemetrySummary)
def get_mine_telemetry_summary(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get aggregate telemetry, sensor health, anomaly counts, and risk severity for a specific mine."""
    require_mine_access(mine_id, current_user, db)
    return SensorService.get_telemetry_summary(db, mine_id)

@router.get("/mines/telemetry/summary-all", response_model=List[MineTelemetrySummary])
def get_all_mines_telemetry_summary(
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN, RoleEnum.REGULATOR])),
    db: Session = Depends(get_db)
):
    """Get cross-mine operational telemetry summaries across all mines in the system (System Admin & Regulator)."""
    from app.models.mine import Mine
    mines = db.query(Mine).all()
    return [SensorService.get_telemetry_summary(db, m.id) for m in mines]
