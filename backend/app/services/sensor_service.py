from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.sensor import Sensor, SensorType, SensorReading
from app.models.risk import AnomalyEvent, RiskScore
from app.models.incident import Incident
from app.models.alert import Alert
from app.schemas.sensor import SensorCreate, SensorReadingCreate
from app.schemas.telemetry import TelemetryIngestPayload, MineTelemetrySummary
from app.core.exceptions import EntityNotFoundError, BusinessRuleViolationError
from app.services.audit_service import AuditService
from app.services.anomaly_detection_service import AnomalyDetectionService
from app.services.alert_service import AlertService
from app.services.telemetry_provider import get_telemetry_provider
from app.services.risk_service import RiskService

class SensorService:
    @staticmethod
    def get_sensor_types(db: Session) -> List[SensorType]:
        return db.query(SensorType).all()

    @staticmethod
    def get_sensors_by_mine(db: Session, mine_id: int, status: Optional[str] = None) -> List[Sensor]:
        query = db.query(Sensor).filter(Sensor.mine_id == mine_id)
        if status:
            query = query.filter(Sensor.status == status)
        return query.all()

    @staticmethod
    def get_sensor_by_id(db: Session, sensor_id: int) -> Sensor:
        sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
        if not sensor:
            raise EntityNotFoundError("Sensor", sensor_id)
        return sensor

    @staticmethod
    def get_sensor_by_code(db: Session, code: str) -> Optional[Sensor]:
        return db.query(Sensor).filter(Sensor.sensor_code == code).first()

    @staticmethod
    def get_sensor_readings(
        db: Session,
        sensor_id: int,
        limit: int = 50
    ) -> List[SensorReading]:
        return (
            db.query(SensorReading)
            .filter(SensorReading.sensor_id == sensor_id)
            .order_by(SensorReading.timestamp.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def create_sensor(db: Session, sensor_in: SensorCreate, creator_id: Optional[int] = None) -> Sensor:
        existing = db.query(Sensor).filter(Sensor.sensor_code == sensor_in.sensor_code).first()
        if existing:
            raise BusinessRuleViolationError(f"Sensor code {sensor_in.sensor_code} already exists.")
        
        sensor = Sensor(**sensor_in.model_dump())
        db.add(sensor)
        db.commit()
        db.refresh(sensor)
        
        AuditService.log_event(
            db=db,
            actor_id=creator_id,
            action="SENSOR_REGISTERED",
            resource_type="SENSOR",
            resource_id=str(sensor.id),
            mine_id=sensor.mine_id,
            after_state=sensor_in.model_dump()
        )
        return sensor

    @staticmethod
    def validate_and_ingest_reading(
        db: Session,
        payload: TelemetryIngestPayload
    ) -> Dict[str, Any]:
        """Comprehensive telemetry validation, idempotency check, ingestion, anomaly evaluation, and alert dispatch"""
        # 1. Resolve Sensor
        if payload.sensor_id:
            sensor = SensorService.get_sensor_by_id(db, payload.sensor_id)
        elif payload.sensor_code:
            sensor = SensorService.get_sensor_by_code(db, payload.sensor_code)
            if not sensor:
                raise BusinessRuleViolationError(f"Sensor code '{payload.sensor_code}' does not exist.")
        else:
            raise BusinessRuleViolationError("Must supply either sensor_id or sensor_code.")

        # 2. Validate Mine Scoping
        if payload.mine_id is not None and payload.mine_id != sensor.mine_id:
            raise BusinessRuleViolationError(f"Sensor {sensor.sensor_code} belongs to Mine {sensor.mine_id}, not {payload.mine_id}.")

        # 3. Validate Unit & Timestamp
        now = datetime.now(timezone.utc)
        reading_time = payload.timestamp or now

        if reading_time > (now + timedelta(minutes=5)):
            raise BusinessRuleViolationError(f"Impossible future timestamp: {reading_time.isoformat()}.")

        # 4. Idempotency Check: Reject duplicate reading within 2 seconds with same value
        dup_cutoff = reading_time - timedelta(seconds=2)
        duplicate = (
            db.query(SensorReading)
            .filter(
                SensorReading.sensor_id == sensor.id,
                SensorReading.timestamp >= dup_cutoff,
                SensorReading.value == payload.value
            )
            .first()
        )
        if duplicate:
            # Idempotent skip: return existing without double-counting downstream events
            return {
                "status": "IDEMPOTENT_DUPLICATE_ACCEPTED",
                "reading_id": duplicate.id,
                "sensor_id": sensor.id,
                "value": duplicate.value,
                "anomaly_triggered": False
            }

        # 5. Persist Reading
        reading = SensorReading(
            sensor_id=sensor.id,
            timestamp=reading_time,
            value=payload.value,
            unit=payload.unit,
            quality=payload.quality,
            source=payload.source,
            ingestion_timestamp=now
        )
        db.add(reading)
        
        sensor.last_value = payload.value
        sensor.last_reading_at = reading_time

        # 6. Evaluate Anomaly
        eval_result = AnomalyDetectionService.evaluate_reading(
            db=db,
            sensor=sensor,
            current_value=payload.value,
            unit=payload.unit,
            timestamp=reading_time
        )

        anomaly_event = None
        alert_event = None
        incident_event = None

        if eval_result.is_anomaly:
            # Determine new sensor status
            sensor.status = eval_result.severity if eval_result.severity in ["WARNING", "CRITICAL"] else "ACTIVE"

            # Check if active anomaly of same type exists for this sensor
            existing_active_anomaly = (
                db.query(AnomalyEvent)
                .filter(
                    AnomalyEvent.sensor_id == sensor.id,
                    AnomalyEvent.anomaly_type == eval_result.anomaly_type,
                    AnomalyEvent.status == "ACTIVE"
                )
                .first()
            )

            if existing_active_anomaly:
                existing_active_anomaly.observed_value = payload.value
                existing_active_anomaly.value_recorded = payload.value
                existing_active_anomaly.severity = eval_result.severity
                existing_active_anomaly.description = eval_result.explanation
                anomaly_event = existing_active_anomaly
            else:
                anomaly_event = AnomalyEvent(
                    mine_id=sensor.mine_id,
                    sensor_id=sensor.id,
                    level_id=sensor.level_id,
                    zone_id=sensor.zone_id,
                    anomaly_type=eval_result.anomaly_type or "THRESHOLD_EXCEEDED",
                    severity=eval_result.severity,
                    observed_value=payload.value,
                    value_recorded=payload.value,
                    expected_range=eval_result.expected_range,
                    threshold_limit=eval_result.threshold_limit,
                    unit=payload.unit,
                    description=eval_result.explanation,
                    x=sensor.x,
                    y=sensor.y,
                    z=sensor.z,
                    source=payload.source,
                    status="ACTIVE",
                    detected_at=reading_time
                )
                db.add(anomaly_event)
                db.flush()

            # Dynamic Risk & Alert Evaluation
            risk_res = RiskService.calculate_mine_risk(db, sensor.mine_id)
            alert_event, incident_event = AlertService.process_anomaly_alert_and_incident(
                db=db,
                mine_id=sensor.mine_id,
                sensor=sensor,
                anomaly=anomaly_event,
                risk_score=risk_res.score
            )

        elif eval_result.status == "RECOVERING":
            # Update active anomaly state toward recovery
            active_anom = (
                db.query(AnomalyEvent)
                .filter(
                    AnomalyEvent.sensor_id == sensor.id,
                    AnomalyEvent.status == "ACTIVE"
                )
                .first()
            )
            if active_anom:
                active_anom.status = "RECOVERING"
                active_anom.resolved_at = now
            sensor.status = "ACTIVE"

        else:
            sensor.status = "ACTIVE"

        db.commit()
        db.refresh(reading)

        return {
            "status": "INGESTED",
            "reading_id": reading.id,
            "sensor_id": sensor.id,
            "sensor_code": sensor.sensor_code,
            "value": reading.value,
            "unit": reading.unit,
            "source": payload.source,
            "sensor_status": sensor.status,
            "anomaly_triggered": eval_result.is_anomaly,
            "anomaly_type": eval_result.anomaly_type,
            "alert_id": alert_event.id if alert_event else None,
            "incident_id": incident_event.id if incident_event else None
        }

    @staticmethod
    def ingest_reading(db: Session, reading_in: SensorReadingCreate) -> SensorReading:
        """Backward-compatible ingest helper"""
        payload = TelemetryIngestPayload(
            sensor_id=reading_in.sensor_id,
            value=reading_in.value,
            unit=reading_in.unit,
            quality=reading_in.quality,
            source=reading_in.source,
            timestamp=reading_in.timestamp
        )
        res = SensorService.validate_and_ingest_reading(db, payload)
        return db.query(SensorReading).filter(SensorReading.id == res["reading_id"]).first()

    @staticmethod
    def simulate_telemetry_batch(db: Session, mine_id: int) -> List[SensorReading]:
        return SensorService.simulate_scenario_batch(db, mine_id, scenario="NORMAL")

    @staticmethod
    def simulate_scenario_batch(
        db: Session,
        mine_id: int,
        scenario: str = "NORMAL",
        target_sensor_code: Optional[str] = None
    ) -> List[SensorReading]:
        """Executes a realistic time-series simulation scenario across sensors in a mine"""
        sensors = db.query(Sensor).filter(Sensor.mine_id == mine_id).all()
        provider = get_telemetry_provider("SIMULATED")
        readings = []

        if scenario == "SENSOR_OFFLINE":
            # Simulate silence on target sensor or first sensor by creating SENSOR_OFFLINE anomaly
            AnomalyDetectionService.detect_sensor_silence(db, mine_id, dormancy_minutes=0)
            return []

        for s in sensors:
            current_scenario = scenario
            if target_sensor_code and s.sensor_code != target_sensor_code:
                current_scenario = "NORMAL"

            meta = {
                "id": s.id,
                "sensor_code": s.sensor_code,
                "unit": s.unit,
                "normal_min": s.normal_min,
                "normal_max": s.normal_max,
                "warning_threshold": s.warning_threshold,
                "critical_threshold": s.critical_threshold,
                "last_value": s.last_value
            }
            dto = provider.generate_or_fetch_reading(meta, scenario=current_scenario)
            payload = TelemetryIngestPayload(
                sensor_id=dto.sensor_id,
                value=dto.value,
                unit=dto.unit,
                quality=dto.quality,
                source=dto.source,
                timestamp=dto.timestamp,
                message_id=dto.message_id
            )
            res = SensorService.validate_and_ingest_reading(db, payload)
            r = db.query(SensorReading).filter(SensorReading.id == res["reading_id"]).first()
            if r:
                readings.append(r)

        return readings

    @staticmethod
    def get_telemetry_summary(db: Session, mine_id: int) -> MineTelemetrySummary:
        from app.models.mine import Mine
        mine = db.query(Mine).filter(Mine.id == mine_id).first()
        if not mine:
            raise EntityNotFoundError("Mine", mine_id)

        sensors = db.query(Sensor).filter(Sensor.mine_id == mine_id).all()
        total_s = len(sensors)
        offline_s = sum(1 for s in sensors if s.status == "OFFLINE")
        online_s = total_s - offline_s
        normal_s = sum(1 for s in sensors if s.status == "ACTIVE")
        warning_s = sum(1 for s in sensors if s.status == "WARNING")
        crit_s = sum(1 for s in sensors if s.status == "CRITICAL")

        active_anom = db.query(AnomalyEvent).filter(AnomalyEvent.mine_id == mine_id, AnomalyEvent.status == "ACTIVE").count()
        active_alerts = db.query(Alert).filter(Alert.mine_id == mine_id, Alert.status.in_(["UNREAD", "READ", "ACKNOWLEDGED"])).count()
        crit_alerts = db.query(Alert).filter(Alert.mine_id == mine_id, Alert.severity == "CRITICAL", Alert.status.in_(["UNREAD", "READ", "ACKNOWLEDGED"])).count()
        open_inc = db.query(Incident).filter(Incident.mine_id == mine_id, Incident.status != "CLOSED").count()

        latest_risk = RiskService.get_latest_risk_score(db, mine_id)

        return MineTelemetrySummary(
            mine_id=mine.id,
            mine_code=mine.code,
            mine_name=mine.name,
            total_sensors=total_s,
            online_sensors=online_s,
            offline_sensors=offline_s,
            normal_sensors=normal_s,
            warning_sensors=warning_s,
            critical_sensors=crit_s,
            active_anomalies=active_anom,
            active_alerts=active_alerts,
            critical_alerts=crit_alerts,
            open_incidents=open_inc,
            current_risk_score=latest_risk.score if latest_risk else 25.0,
            current_risk_severity=latest_risk.severity if latest_risk else "LOW",
            generated_at=datetime.now(timezone.utc)
        )
