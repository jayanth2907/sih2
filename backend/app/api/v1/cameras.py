from typing import List
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.authz import get_current_active_user, require_mine_access, require_roles
from app.core.permissions import RoleEnum
from app.models.user import User
from app.schemas.camera import CameraRead, CameraCreate, EquipmentRead, EquipmentCreate
from app.services.camera_service import CameraService, EquipmentService

router = APIRouter(prefix="", tags=["Cameras & Equipment Assets"])

@router.get("/cameras", response_model=List[CameraRead])
def list_cameras(
    mine_id: int = Query(..., description="Target mine ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all camera spatial assets deployed in a mine (supports 3D orientation yaw/pitch/fov and simulation tagging)."""
    require_mine_access(mine_id, current_user, db)
    cameras = CameraService.get_cameras_by_mine(db, mine_id)
    return [
        CameraRead(
            id=c.id,
            camera_code=c.camera_code,
            mine_id=c.mine_id,
            level_id=c.level_id,
            zone_id=c.zone_id,
            name=c.name,
            camera_type=c.camera_type,
            stream_url=c.stream_url,
            status=c.status,
            x=c.x,
            y=c.y,
            z=c.z,
            yaw=c.yaw,
            pitch=c.pitch,
            fov=c.fov,
            latitude=c.latitude,
            longitude=c.longitude,
            elevation=c.elevation,
            resolution=c.resolution,
            is_simulated=c.is_simulated,
            installation_notes=c.installation_notes,
            created_at=c.created_at,
            updated_at=c.updated_at,
            zone_name=c.zone.name if c.zone else None,
            level_name=c.level.name if c.level else None
        ) for c in cameras
    ]

@router.post("/cameras", response_model=CameraRead, status_code=status.HTTP_201_CREATED)
def register_camera(
    camera_in: CameraCreate,
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN, RoleEnum.MINE_MANAGER, RoleEnum.MINE_SAFETY_OFFICER])),
    db: Session = Depends(get_db)
):
    """Register a new camera asset with spatial coordinates."""
    require_mine_access(camera_in.mine_id, current_user, db)
    camera = CameraService.create_camera(db, camera_in, creator_id=current_user.id)
    return CameraRead.model_validate(camera)

@router.get("/equipment", response_model=List[EquipmentRead])
def list_equipment(
    mine_id: int = Query(..., description="Target mine ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List heavy machinery and operational equipment in a mine."""
    require_mine_access(mine_id, current_user, db)
    equipment = EquipmentService.get_equipment_by_mine(db, mine_id)
    return [
        EquipmentRead(
            id=e.id,
            equipment_code=e.equipment_code,
            mine_id=e.mine_id,
            level_id=e.level_id,
            zone_id=e.zone_id,
            name=e.name,
            category=e.category,
            status=e.status,
            manufacturer=e.manufacturer,
            model_number=e.model_number,
            serial_number=e.serial_number,
            x=e.x,
            y=e.y,
            z=e.z,
            latitude=e.latitude,
            longitude=e.longitude,
            elevation=e.elevation,
            last_serviced_at=e.last_serviced_at,
            next_service_due=e.next_service_due,
            notes=e.notes,
            created_at=e.created_at,
            updated_at=e.updated_at,
            zone_name=e.zone.name if e.zone else None
        ) for e in equipment
    ]

@router.post("/equipment", response_model=EquipmentRead, status_code=status.HTTP_201_CREATED)
def register_equipment(
    eq_in: EquipmentCreate,
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN, RoleEnum.MINE_MANAGER])),
    db: Session = Depends(get_db)
):
    """Register a heavy equipment asset with 3D coordinates."""
    require_mine_access(eq_in.mine_id, current_user, db)
    eq = EquipmentService.create_equipment(db, eq_in, creator_id=current_user.id)
    return EquipmentRead.model_validate(eq)
