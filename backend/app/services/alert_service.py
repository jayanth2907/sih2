from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.risk import AnomalyEvent
from app.models.sensor import Sensor
from app.models.incident import Incident
from app.schemas.alert import AlertCreate, AlertStatusUpdate
from app.schemas.incident import IncidentCreate
from app.services.incident_service import IncidentService
from app.services.audit_service import AuditService
from app.core.exceptions import EntityNotFoundError

class AlertService:
    @staticmethod
    def get_alerts(
        db: Session,
        mine_id: Optional[int] = None,
        status: Optional[str] = None,
        severity: Optional[str] = None
    ) -> List[Alert]:
        query = db.query(Alert)
        if mine_id is not None:
            query = query.filter(Alert.mine_id == mine_id)
        if status:
            query = query.filter(Alert.status == status)
        if severity:
            query = query.filter(Alert.severity == severity)
        return query.order_by(Alert.created_at.desc()).all()

    @staticmethod
    def get_alert_by_id(db: Session, alert_id: int) -> Alert:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise EntityNotFoundError("Alert", alert_id)
        return alert

    @staticmethod
    def process_anomaly_alert_and_incident(
        db: Session,
        mine_id: int,
        sensor: Sensor,
        anomaly: AnomalyEvent,
        risk_score: float
    ) -> Tuple[Alert, Optional[Incident]]:
        """Creates or updates an operational alert and auto-creates an Incident if critical"""
        dedup_key = f"MINE_{mine_id}_SENSOR_{sensor.id}_{anomaly.anomaly_type}"
        now = datetime.now(timezone.utc)

        # 1. Deduplication check: Active alert for same sensor and anomaly type
        existing_alert = (
            db.query(Alert)
            .filter(
                Alert.deduplication_key == dedup_key,
                Alert.status.in_(["UNREAD", "READ", "ACKNOWLEDGED"])
            )
            .order_by(Alert.created_at.desc())
            .first()
        )

        location_ctx = f"{sensor.zone.name if sensor.zone else 'Zone'} ({sensor.x:.1f}, {sensor.y:.1f}, {sensor.z:.1f})"

        if existing_alert:
            existing_alert.message = anomaly.description
            existing_alert.risk_score = risk_score
            existing_alert.severity = anomaly.severity
            alert = existing_alert
        else:
            alert = Alert(
                mine_id=mine_id,
                sensor_id=sensor.id,
                anomaly_id=anomaly.id,
                title=f"Telemetry Alert: {sensor.name} ({sensor.sensor_code})",
                message=anomaly.description,
                severity=anomaly.severity,
                risk_score=risk_score,
                status="UNREAD",
                source=anomaly.source,
                location_context=location_ctx,
                deduplication_key=dedup_key,
                created_at=now
            )
            db.add(alert)
            db.flush()

        incident = None

        # 2. Critical Incident Auto-Creation / Correlation
        if anomaly.severity == "CRITICAL":
            # Check for existing open incident on this sensor
            existing_incident = (
                db.query(Incident)
                .filter(
                    Incident.mine_id == mine_id,
                    Incident.zone_id == sensor.zone_id,
                    Incident.category == "GAS_ANOMALY" if "CH4" in sensor.sensor_code or "METHANE" in sensor.sensor_code else "HAZARD_ANOMALY",
                    Incident.status.in_(["OPEN", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "ESCALATED"])
                )
                .order_by(Incident.created_at.desc())
                .first()
            )

            if existing_incident:
                incident = existing_incident
                anomaly.incident_id = incident.id
                alert.incident_id = incident.id
            else:
                inc_payload = IncidentCreate(
                    mine_id=mine_id,
                    level_id=sensor.level_id,
                    zone_id=sensor.zone_id,
                    title=f"Critical Telemetry Breach: {sensor.name}",
                    description=f"Auto-generated incident triggered by {anomaly.anomaly_type} on sensor {sensor.sensor_code}. {anomaly.description}",
                    category="GAS_ANOMALY" if "CH4" in sensor.sensor_code or "METHANE" in sensor.sensor_code else "HAZARD_ANOMALY",
                    severity="CRITICAL",
                    sla_hours=4, # High urgency SLA
                    x=sensor.x,
                    y=sensor.y,
                    z=sensor.z
                )
                incident = IncidentService.create_incident(db, inc_payload, reporter_id=None)
                anomaly.incident_id = incident.id
                alert.incident_id = incident.id

                AuditService.log_event(
                    db=db,
                    actor_id=None,
                    action="INCIDENT_AUTO_CREATED_FROM_ANOMALY",
                    resource_type="INCIDENT",
                    resource_id=str(incident.id),
                    mine_id=mine_id,
                    metadata={"anomaly_id": anomaly.id, "sensor_code": sensor.sensor_code}
                )

        db.commit()
        db.refresh(alert)
        if incident:
            db.refresh(incident)

        return alert, incident

    @staticmethod
    def update_alert_status(
        db: Session,
        alert_id: int,
        status_update: AlertStatusUpdate,
        actor_id: Optional[int] = None
    ) -> Alert:
        alert = AlertService.get_alert_by_id(db, alert_id)
        from_st = alert.status
        to_st = status_update.status
        now = datetime.now(timezone.utc)

        alert.status = to_st
        if to_st == "ACKNOWLEDGED":
            alert.acknowledged_at = now
        elif to_st == "RESOLVED":
            alert.resolved_at = now

        db.commit()
        db.refresh(alert)

        AuditService.log_event(
            db=db,
            actor_id=actor_id,
            action="ALERT_STATUS_UPDATED",
            resource_type="ALERT",
            resource_id=str(alert.id),
            mine_id=alert.mine_id,
            before_state={"status": from_st},
            after_state={"status": to_st}
        )
        return alert
