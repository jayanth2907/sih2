import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.sensor import Sensor
from app.models.camera import Camera
from app.models.equipment import Equipment
from app.models.risk import AnomalyEvent
from app.models.incident import Incident
from app.models.mine import Mine
from app.models.spatial import MineLevel, MineZone
from app.schemas.telemetry import SpatialContextResponse, NearbyCameraDTO, NearbyEquipmentDTO
from app.core.exceptions import EntityNotFoundError

def calculate_3d_distance(x1: float, y1: float, z1: float, x2: float, y2: float, z2: float) -> float:
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2)

class SpatialContextService:
    @staticmethod
    def get_nearby_cameras(
        db: Session,
        mine_id: int,
        target_x: float,
        target_y: float,
        target_z: float,
        radius_meters: float = 250.0
    ) -> List[NearbyCameraDTO]:
        cameras = db.query(Camera).filter(Camera.mine_id == mine_id).all()
        results = []
        for c in cameras:
            dist = calculate_3d_distance(target_x, target_y, target_z, c.x, c.y, c.z)
            if dist <= radius_meters:
                results.append(NearbyCameraDTO(
                    id=c.id,
                    camera_code=c.camera_code,
                    name=c.name,
                    camera_type=c.camera_type,
                    x=c.x,
                    y=c.y,
                    z=c.z,
                    distance_meters=round(dist, 1),
                    yaw=c.yaw,
                    pitch=c.pitch,
                    fov=c.fov,
                    stream_url=c.stream_url,
                    is_simulated=c.is_simulated
                ))
        results.sort(key=lambda item: item.distance_meters)
        return results

    @staticmethod
    def get_nearby_equipment(
        db: Session,
        mine_id: int,
        target_x: float,
        target_y: float,
        target_z: float,
        radius_meters: float = 250.0
    ) -> List[NearbyEquipmentDTO]:
        machinery = db.query(Equipment).filter(Equipment.mine_id == mine_id).all()
        results = []
        for eq in machinery:
            dist = calculate_3d_distance(target_x, target_y, target_z, eq.x, eq.y, eq.z)
            if dist <= radius_meters:
                results.append(NearbyEquipmentDTO(
                    id=eq.id,
                    equipment_code=eq.equipment_code,
                    name=eq.name,
                    category=eq.category,
                    status=eq.status,
                    x=eq.x,
                    y=eq.y,
                    z=eq.z,
                    distance_meters=round(dist, 1),
                    last_serviced_at=eq.last_serviced_at
                ))
        results.sort(key=lambda item: item.distance_meters)
        return results

    @staticmethod
    def get_spatial_context_for_anomaly(
        db: Session,
        anomaly_id: int,
        radius_meters: float = 250.0
    ) -> SpatialContextResponse:
        anomaly = db.query(AnomalyEvent).filter(AnomalyEvent.id == anomaly_id).first()
        if not anomaly:
            raise EntityNotFoundError("AnomalyEvent", anomaly_id)

        sensor = anomaly.sensor
        sensor_x = anomaly.x or (sensor.x if sensor else 0.0)
        sensor_y = anomaly.y or (sensor.y if sensor else 0.0)
        sensor_z = anomaly.z or (sensor.z if sensor else 0.0)

        nearby_cams = SpatialContextService.get_nearby_cameras(
            db=db,
            mine_id=anomaly.mine_id,
            target_x=sensor_x,
            target_y=sensor_y,
            target_z=sensor_z,
            radius_meters=radius_meters
        )

        nearby_eq = SpatialContextService.get_nearby_equipment(
            db=db,
            mine_id=anomaly.mine_id,
            target_x=sensor_x,
            target_y=sensor_y,
            target_z=sensor_z,
            radius_meters=radius_meters
        )

        mine = anomaly.mine
        level = anomaly.level or (sensor.level if sensor else None)
        zone = anomaly.zone or (sensor.zone if sensor else None)
        incident = anomaly.incident

        return SpatialContextResponse(
            anomaly_id=anomaly.id,
            anomaly_type=anomaly.anomaly_type,
            severity=anomaly.severity,
            detected_at=anomaly.detected_at,
            observed_value=anomaly.observed_value or anomaly.value_recorded,
            threshold_limit=anomaly.threshold_limit,
            explanation=anomaly.description,
            mine={
                "id": mine.id,
                "code": mine.code,
                "name": mine.name,
                "state": mine.state,
                "district": mine.district
            },
            level={
                "id": level.id,
                "code": level.code,
                "name": level.name,
                "depth_meters": level.depth_meters
            } if level else None,
            zone={
                "id": zone.id,
                "code": zone.code,
                "name": zone.name,
                "zone_type": zone.zone_type,
                "risk_category": zone.risk_category
            } if zone else None,
            sensor={
                "id": sensor.id if sensor else 0,
                "code": sensor.sensor_code if sensor else "UNKNOWN",
                "name": sensor.name if sensor else "Unknown Sensor",
                "unit": sensor.unit if sensor else "",
                "status": sensor.status if sensor else "ACTIVE"
            },
            coordinates={
                "x": sensor_x,
                "y": sensor_y,
                "z": sensor_z
            },
            nearby_cameras=nearby_cams,
            nearby_equipment=nearby_eq,
            related_incident={
                "id": incident.id,
                "code": incident.incident_code,
                "title": incident.title,
                "status": incident.status,
                "severity": incident.severity
            } if incident else None
        )
