from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.camera import Camera
from app.models.equipment import Equipment
from app.schemas.camera import CameraCreate, EquipmentCreate
from app.core.exceptions import EntityNotFoundError, BusinessRuleViolationError
from app.services.audit_service import AuditService

class CameraService:
    @staticmethod
    def get_cameras_by_mine(db: Session, mine_id: int) -> List[Camera]:
        return db.query(Camera).filter(Camera.mine_id == mine_id).all()

    @staticmethod
    def get_camera_by_id(db: Session, camera_id: int) -> Camera:
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if not camera:
            raise EntityNotFoundError("Camera", camera_id)
        return camera

    @staticmethod
    def create_camera(db: Session, camera_in: CameraCreate, creator_id: Optional[int] = None) -> Camera:
        existing = db.query(Camera).filter(Camera.camera_code == camera_in.camera_code).first()
        if existing:
            raise BusinessRuleViolationError(f"Camera code {camera_in.camera_code} already exists.")
        
        camera = Camera(**camera_in.model_dump())
        db.add(camera)
        db.commit()
        db.refresh(camera)
        
        AuditService.log_event(
            db=db,
            actor_id=creator_id,
            action="CAMERA_REGISTERED",
            resource_type="CAMERA",
            resource_id=str(camera.id),
            mine_id=camera.mine_id,
            after_state=camera_in.model_dump()
        )
        return camera

class EquipmentService:
    @staticmethod
    def get_equipment_by_mine(db: Session, mine_id: int) -> List[Equipment]:
        return db.query(Equipment).filter(Equipment.mine_id == mine_id).all()

    @staticmethod
    def get_equipment_by_id(db: Session, equipment_id: int) -> Equipment:
        eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
        if not eq:
            raise EntityNotFoundError("Equipment", equipment_id)
        return eq

    @staticmethod
    def create_equipment(db: Session, eq_in: EquipmentCreate, creator_id: Optional[int] = None) -> Equipment:
        existing = db.query(Equipment).filter(Equipment.equipment_code == eq_in.equipment_code).first()
        if existing:
            raise BusinessRuleViolationError(f"Equipment code {eq_in.equipment_code} already exists.")
        
        equipment = Equipment(**eq_in.model_dump())
        db.add(equipment)
        db.commit()
        db.refresh(equipment)
        
        AuditService.log_event(
            db=db,
            actor_id=creator_id,
            action="EQUIPMENT_REGISTERED",
            resource_type="EQUIPMENT",
            resource_id=str(equipment.id),
            mine_id=equipment.mine_id,
            after_state=eq_in.model_dump()
        )
        return equipment
