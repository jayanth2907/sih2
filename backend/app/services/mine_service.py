from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.mine import Mine
from app.models.spatial import MineLevel, MineZone
from app.models.sensor import Sensor
from app.models.camera import Camera
from app.models.equipment import Equipment
from app.models.incident import Incident
from app.models.risk import RiskScore, AnomalyEvent
from app.schemas.mine import MineCreate, MineLevelCreate, MineZoneCreate, MineDigitalTwinResponse, MineRead, MineLevelRead, MineZoneRead
from app.core.exceptions import EntityNotFoundError, BusinessRuleViolationError
from app.services.audit_service import AuditService

class MineService:
    @staticmethod
    def get_all_mines(db: Session, allowed_mine_ids: Optional[List[int]] = None) -> List[Mine]:
        query = db.query(Mine)
        if allowed_mine_ids is not None:
            query = query.filter(Mine.id.in_(allowed_mine_ids))
        return query.all()

    @staticmethod
    def get_mine_by_id(db: Session, mine_id: int) -> Mine:
        mine = db.query(Mine).filter(Mine.id == mine_id).first()
        if not mine:
            raise EntityNotFoundError("Mine", mine_id)
        return mine

    @staticmethod
    def create_mine(db: Session, mine_in: MineCreate, creator_id: Optional[int] = None) -> Mine:
        existing = db.query(Mine).filter(Mine.code == mine_in.code).first()
        if existing:
            raise BusinessRuleViolationError(f"Mine with code {mine_in.code} already exists.")
        
        mine = Mine(**mine_in.model_dump())
        db.add(mine)
        db.commit()
        db.refresh(mine)
        
        AuditService.log_event(
            db=db,
            actor_id=creator_id,
            action="MINE_CREATED",
            resource_type="MINE",
            resource_id=str(mine.id),
            mine_id=mine.id,
            after_state=mine_in.model_dump()
        )
        return mine

    @staticmethod
    def add_level(db: Session, mine_id: int, level_in: MineLevelCreate) -> MineLevel:
        MineService.get_mine_by_id(db, mine_id)
        level = MineLevel(mine_id=mine_id, **level_in.model_dump())
        db.add(level)
        db.commit()
        db.refresh(level)
        return level

    @staticmethod
    def add_zone(db: Session, mine_id: int, zone_in: MineZoneCreate) -> MineZone:
        MineService.get_mine_by_id(db, mine_id)
        zone = MineZone(mine_id=mine_id, **zone_in.model_dump())
        db.add(zone)
        db.commit()
        db.refresh(zone)
        return zone

    @staticmethod
    def get_digital_twin_state(db: Session, mine_id: int) -> MineDigitalTwinResponse:
        mine = MineService.get_mine_by_id(db, mine_id)
        levels = db.query(MineLevel).filter(MineLevel.mine_id == mine_id).order_by(MineLevel.sequence_order).all()
        zones = db.query(MineZone).filter(MineZone.mine_id == mine_id).all()
        
        sensors = db.query(Sensor).filter(Sensor.mine_id == mine_id).all()
        cameras = db.query(Camera).filter(Camera.mine_id == mine_id).all()
        equipment = db.query(Equipment).filter(Equipment.mine_id == mine_id).all()
        incidents = db.query(Incident).filter(Incident.mine_id == mine_id, Incident.status != "CLOSED").all()
        anomalies = db.query(AnomalyEvent).filter(AnomalyEvent.mine_id == mine_id).order_by(AnomalyEvent.detected_at.desc()).limit(20).all()
        latest_risk = db.query(RiskScore).filter(RiskScore.mine_id == mine_id).order_by(RiskScore.generated_at.desc()).first()
        
        sensor_dicts = [{
            "id": s.id, "sensor_code": s.sensor_code, "name": s.name, "unit": s.unit,
            "sensor_type_code": s.sensor_type.code if s.sensor_type else "UNKNOWN",
            "status": s.status, "last_value": s.last_value, "last_reading_at": s.last_reading_at,
            "warning_threshold": s.warning_threshold, "critical_threshold": s.critical_threshold,
            "level_id": s.level_id, "zone_id": s.zone_id,
            "level_name": s.level.name if s.level else None,
            "zone_name": s.zone.name if s.zone else None,
            "x": s.x, "y": s.y, "z": s.z, "latitude": s.latitude, "longitude": s.longitude, "elevation": s.elevation
        } for s in sensors]
        
        camera_dicts = [{
            "id": c.id, "camera_code": c.camera_code, "name": c.name, "camera_type": c.camera_type,
            "status": c.status, "is_simulated": c.is_simulated, "stream_url": c.stream_url,
            "level_id": c.level_id, "zone_id": c.zone_id,
            "level_name": c.level.name if c.level else None,
            "zone_name": c.zone.name if c.zone else None,
            "x": c.x, "y": c.y, "z": c.z, "yaw": c.yaw, "pitch": c.pitch, "fov": c.fov
        } for c in cameras]
        
        equipment_dicts = [{
            "id": e.id, "equipment_code": e.equipment_code, "name": e.name, "category": e.category,
            "status": e.status, "level_id": e.level_id, "zone_id": e.zone_id,
            "level_name": e.level.name if e.level else None,
            "zone_name": e.zone.name if e.zone else None,
            "x": e.x, "y": e.y, "z": e.z
        } for e in equipment]
        
        incident_dicts = [{
            "id": inc.id, "incident_code": inc.incident_code, "title": inc.title,
            "severity": inc.severity, "status": inc.status, "category": inc.category,
            "level_id": inc.level_id, "zone_id": inc.zone_id,
            "level_name": inc.level.name if inc.level else None,
            "zone_name": inc.zone.name if inc.zone else None,
            "x": inc.x, "y": inc.y, "z": inc.z, "created_at": inc.created_at
        } for inc in incidents]
        
        anomaly_dicts = [{
            "id": a.id, "anomaly_type": a.anomaly_type, "severity": a.severity,
            "sensor_id": a.sensor_id,
            "sensor_code": a.sensor.sensor_code if a.sensor else None,
            "sensor_name": a.sensor.name if a.sensor else None,
            "observed_value": a.observed_value, "threshold_limit": a.threshold_limit,
            "description": a.description, "detected_at": a.detected_at,
            "x": a.x, "y": a.y, "z": a.z, "source": a.source, "status": a.status
        } for a in anomalies]
        
        return MineDigitalTwinResponse(
            mine=MineRead.model_validate(mine),
            levels=[MineLevelRead.model_validate(lvl) for lvl in levels],
            zones=[MineZoneRead.model_validate(z) for z in zones],
            sensors=sensor_dicts,
            cameras=camera_dicts,
            equipment=equipment_dicts,
            active_incidents=incident_dicts,
            anomalies=anomaly_dicts,
            current_risk_score=latest_risk.score if latest_risk else 24.5,
            current_risk_severity=latest_risk.severity if latest_risk else "LOW"
        )
