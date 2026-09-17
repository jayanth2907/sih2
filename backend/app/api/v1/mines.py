from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.authz import get_current_active_user, get_user_roles, get_user_assigned_mine_ids, require_mine_access, require_roles
from app.core.permissions import RoleEnum
from app.models.user import User
from app.schemas.mine import MineRead, MineCreate, MineDetail, MineDigitalTwinResponse, MineLevelRead, MineLevelCreate, MineZoneRead, MineZoneCreate
from app.services.mine_service import MineService
from app.services.risk_service import RiskService

router = APIRouter(prefix="/mines", tags=["Mines & Spatial Organization"])

@router.get("", response_model=List[MineRead])
def list_mines(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List mines accessible to the current user (System Admin & Regulator see all; Mine Managers see assigned)."""
    roles = get_user_roles(current_user, db)
    if RoleEnum.SYSTEM_ADMIN.value in roles or RoleEnum.REGULATOR.value in roles or current_user.is_superuser:
        return MineService.get_all_mines(db)
    
    assigned_mine_ids = get_user_assigned_mine_ids(current_user, db)
    return MineService.get_all_mines(db, allowed_mine_ids=assigned_mine_ids)

@router.post("", response_model=MineRead, status_code=status.HTTP_201_CREATED)
def create_mine(
    mine_in: MineCreate,
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN])),
    db: Session = Depends(get_db)
):
    """Create a new coal mine entity (System Admin only)."""
    return MineService.create_mine(db, mine_in, creator_id=current_user.id)

@router.get("/{mine_id}", response_model=MineDetail)
def get_mine_details(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get full details of a specific mine including levels, spatial metadata, and risk score."""
    require_mine_access(mine_id, current_user, db)
    mine = MineService.get_mine_by_id(db, mine_id)
    latest_risk = RiskService.get_latest_risk_score(db, mine_id)
    
    return MineDetail(
        id=mine.id,
        code=mine.code,
        name=mine.name,
        description=mine.description,
        mine_type=mine.mine_type,
        state=mine.state,
        district=mine.district,
        latitude=mine.latitude,
        longitude=mine.longitude,
        elevation=mine.elevation,
        status=mine.status,
        created_at=mine.created_at,
        updated_at=mine.updated_at,
        levels=[MineLevelRead.model_validate(lvl) for lvl in mine.levels],
        total_sensors=len(mine.sensors),
        total_cameras=len(mine.cameras),
        active_incidents=sum(1 for i in mine.incidents if i.status != "CLOSED"),
        risk_score=latest_risk.score if latest_risk else 25.0,
        risk_severity=latest_risk.severity if latest_risk else "LOW"
    )

@router.post("/{mine_id}/levels", response_model=MineLevelRead, status_code=status.HTTP_201_CREATED)
def add_mine_level(
    mine_id: int,
    level_in: MineLevelCreate,
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN, RoleEnum.MINE_MANAGER])),
    db: Session = Depends(get_db)
):
    """Add a new underground/surface level to the mine."""
    require_mine_access(mine_id, current_user, db)
    return MineService.add_level(db, mine_id, level_in)

@router.post("/{mine_id}/zones", response_model=MineZoneRead, status_code=status.HTTP_201_CREATED)
def add_mine_zone(
    mine_id: int,
    zone_in: MineZoneCreate,
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN, RoleEnum.MINE_MANAGER])),
    db: Session = Depends(get_db)
):
    """Add a new spatial zone (e.g. Gallery, Haulage, Production) to a mine level."""
    require_mine_access(mine_id, current_user, db)
    return MineService.add_zone(db, mine_id, zone_in)

@router.get("/{mine_id}/digital-twin", response_model=MineDigitalTwinResponse)
def get_digital_twin_spatial_data(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve full 3D spatial state for the future Digital Mine Twin (levels, zones, sensors, cameras, equipment, active incidents, and anomalies)."""
    require_mine_access(mine_id, current_user, db)
    return MineService.get_digital_twin_state(db, mine_id)
