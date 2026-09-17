from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.mine import Mine
from app.models.spatial import MineLevel, MineZone
from app.models.sensor import Sensor, SensorReading
from app.models.risk import RiskScore, AnomalyEvent
from app.models.incident import Incident
from app.models.violation import Violation, CorrectiveAction
from app.models.environmental import EnvironmentalObservation
from app.models.production import ProductionReport
from app.models.workforce import AttendanceRecord, Shift
from app.models.contractor import Contractor, Contract
from app.models.grievance import Grievance
from app.models.approval import ApprovalRequest
from app.models.governance_task import GovernanceTask
from app.models.audit import AuditEvent
from app.models.user import User

from app.services.risk_service import RiskService
from app.services.predictive_risk_service import PredictiveRiskService
from app.copilot.security import CopilotSecurity

class CopilotTools:
    @staticmethod
    def get_mine_summary(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        mine = db.query(Mine).filter(Mine.id == mine_id).first()
        if not mine:
            return {"error": f"Mine ID {mine_id} not found."}
        
        levels_count = db.query(MineLevel).filter(MineLevel.mine_id == mine_id).count()
        zones_count = db.query(MineZone).join(MineLevel).filter(MineLevel.mine_id == mine_id).count()
        sensors_count = db.query(Sensor).filter(Sensor.mine_id == mine_id).count()
        active_incidents_count = db.query(Incident).filter(
            Incident.mine_id == mine_id, Incident.status.in_(["OPEN", "UNDER_INVESTIGATION", "ACTION_REQUIRED"])
        ).count()
        
        return {
            "mine_id": mine.id,
            "name": mine.name,
            "code": mine.code,
            "type": mine.mine_type.value if hasattr(mine.mine_type, 'value') else str(mine.mine_type),
            "status": mine.status.value if hasattr(mine.status, 'value') else str(mine.status),
            "levels_count": levels_count,
            "zones_count": zones_count,
            "sensors_count": sensors_count,
            "active_incidents_count": active_incidents_count
        }

    @staticmethod
    def get_current_risk(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        latest_risk = RiskService.get_latest_risk_score(db, mine_id)
        if not latest_risk:
            calc = RiskService.calculate_mine_risk(db, mine_id)
            latest_risk = RiskService.get_latest_risk_score(db, mine_id)
        
        score_val = latest_risk.score if latest_risk else 15.0
        band_val = latest_risk.severity if latest_risk else "LOW"
        
        factor_list = []
        if latest_risk and latest_risk.factors:
            for f in latest_risk.factors:
                factor_list.append({
                    "name": f.factor_name,
                    "contribution_points": f.contribution_points,
                    "weight": f.weight,
                    "details": f.details
                })
        return {
            "mine_id": mine_id,
            "current_risk_score": score_val,
            "risk_band": band_val,
            "factors": factor_list
        }

    @staticmethod
    def get_predicted_risk(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        pred = PredictiveRiskService.generate_prediction(db, mine_id)
        return {
            "mine_id": mine_id,
            "current_risk_score": pred.get("current_risk_score", 0.0),
            "current_risk_band": pred.get("current_severity", "LOW"),
            "predicted_risk_score": pred.get("predicted_risk_score", 0.0),
            "predicted_risk_band": pred.get("predicted_severity", "LOW"),
            "risk_trend": pred.get("trend_direction", "STABLE"),
            "horizon": f"{pred.get('horizon_minutes', 30)} minutes",
            "probability": pred.get("probability", 0.0),
            "signal_attributions": pred.get("top_signals", []),
            "model_version": pred.get("model_version", "risk-escalation-v1.0"),
            "data_provenance": pred.get("dataset_provenance", "SIMULATED_DEMO")
        }

    @staticmethod
    def get_active_anomalies(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
        anomalies = (
            db.query(AnomalyEvent)
            .join(Sensor, AnomalyEvent.sensor_id == Sensor.id)
            .filter(Sensor.mine_id == mine_id, AnomalyEvent.detected_at >= two_hours_ago)
            .order_by(desc(AnomalyEvent.detected_at))
            .limit(10)
            .all()
        )
        items = []
        for a in anomalies:
            items.append({
                "anomaly_id": a.id,
                "sensor_id": a.sensor_id,
                "anomaly_type": a.anomaly_type,
                "severity": a.severity,
                "value": a.value,
                "threshold": a.threshold,
                "detected_at": a.detected_at.isoformat()
            })
        return {"mine_id": mine_id, "count": len(items), "recent_anomalies": items}

    @staticmethod
    def get_sensor_status(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        sensors = db.query(Sensor).filter(Sensor.mine_id == mine_id).all()
        status_counts = {"ACTIVE": 0, "WARNING": 0, "CRITICAL": 0, "OFFLINE": 0, "CALIBRATING": 0}
        critical_sensors = []
        for s in sensors:
            st = s.status.value if hasattr(s.status, 'value') else str(s.status)
            status_counts[st] = status_counts.get(st, 0) + 1
            if st in ["WARNING", "CRITICAL"]:
                critical_sensors.append({
                    "sensor_id": s.id,
                    "code": s.sensor_code,
                    "name": s.name,
                    "status": st,
                    "last_value": s.last_value,
                    "unit": s.unit,
                    "warning_threshold": s.warning_threshold,
                    "critical_threshold": s.critical_threshold,
                    "x": s.x, "y": s.y, "z": s.z
                })
        return {
            "mine_id": mine_id,
            "total_sensors": len(sensors),
            "status_distribution": status_counts,
            "elevated_sensors": critical_sensors
        }

    @staticmethod
    def get_incidents(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        incidents = (
            db.query(Incident)
            .filter(Incident.mine_id == mine_id)
            .order_by(desc(Incident.occurred_at))
            .limit(10)
            .all()
        )
        items = []
        for inc in incidents:
            items.append({
                "incident_id": inc.id,
                "code": inc.incident_code,
                "title": inc.title,
                "severity": inc.severity.value if hasattr(inc.severity, 'value') else str(inc.severity),
                "status": inc.status.value if hasattr(inc.status, 'value') else str(inc.status),
                "category": inc.category.value if hasattr(inc.category, 'value') else str(inc.category),
                "occurred_at": inc.occurred_at.isoformat(),
                "x": inc.x, "y": inc.y, "z": inc.z
            })
        return {"mine_id": mine_id, "total": len(items), "incidents": items}

    @staticmethod
    def get_violations(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        violations = (
            db.query(Violation)
            .filter(Violation.mine_id == mine_id)
            .order_by(desc(Violation.created_at))
            .limit(10)
            .all()
        )
        items = []
        for v in violations:
            items.append({
                "violation_id": v.id,
                "code": v.violation_code,
                "title": v.title,
                "severity": v.severity.value if hasattr(v.severity, 'value') else str(v.severity),
                "status": v.status.value if hasattr(v.status, 'value') else str(v.status),
                "statutory_ref": v.statutory_rule_reference,
                "action_deadline": v.action_deadline.isoformat() if v.action_deadline else None
            })
        return {"mine_id": mine_id, "total": len(items), "violations": items}

    @staticmethod
    def get_corrective_actions(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        actions = (
            db.query(CorrectiveAction)
            .join(Violation, CorrectiveAction.violation_id == Violation.id)
            .filter(Violation.mine_id == mine_id)
            .order_by(desc(CorrectiveAction.due_date))
            .limit(10)
            .all()
        )
        now = datetime.now(timezone.utc)
        items = []
        for a in actions:
            due = a.due_date.replace(tzinfo=timezone.utc) if a.due_date.tzinfo is None else a.due_date
            is_overdue = due < now and a.status not in ["COMPLETED", "VERIFIED", "CLOSED"]
            items.append({
                "action_id": a.id,
                "title": a.title,
                "status": a.status.value if hasattr(a.status, 'value') else str(a.status),
                "due_date": a.due_date.isoformat(),
                "is_overdue": is_overdue,
                "priority": a.priority.value if hasattr(a.priority, 'value') else str(a.priority)
            })
        return {"mine_id": mine_id, "total": len(items), "actions": items}

    @staticmethod
    def get_environmental_observations(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        obs = (
            db.query(EnvironmentalObservation)
            .filter(EnvironmentalObservation.mine_id == mine_id)
            .order_by(desc(EnvironmentalObservation.observation_time))
            .limit(10)
            .all()
        )
        items = []
        for o in obs:
            items.append({
                "observation_id": o.id,
                "parameter_type": o.parameter_type,
                "observed_value": o.observed_value,
                "statutory_limit": o.statutory_limit,
                "threshold_breached": o.threshold_breached,
                "observation_time": o.observation_time.isoformat(),
                "x": o.x, "y": o.y, "z": o.z
            })
        return {"mine_id": mine_id, "total": len(items), "observations": items}

    @staticmethod
    def get_production_reports(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        reports = (
            db.query(ProductionReport)
            .filter(ProductionReport.mine_id == mine_id)
            .order_by(desc(ProductionReport.log_date))
            .limit(5)
            .all()
        )
        items = []
        for r in reports:
            items.append({
                "report_id": r.id,
                "log_date": r.log_date.isoformat(),
                "shift": r.shift_code,
                "planned_tonnage": r.planned_tonnage,
                "actual_tonnage": r.actual_tonnage,
                "variance_tons": r.variance_tonnage,
                "status": r.status.value if hasattr(r.status, 'value') else str(r.status)
            })
        return {"mine_id": mine_id, "recent_reports": items}

    @staticmethod
    def get_attendance_summary(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        today = datetime.now(timezone.utc).date()
        records = (
            db.query(AttendanceRecord)
            .filter(AttendanceRecord.mine_id == mine_id, AttendanceRecord.attendance_date == today)
            .all()
        )
        total = len(records)
        present = sum(1 for r in records if r.status in ["PRESENT", "LATE"])
        muster_pct = (present / total * 100.0) if total > 0 else 100.0
        return {
            "mine_id": mine_id,
            "date": today.isoformat(),
            "total_rostered": total,
            "present_count": present,
            "muster_compliance_pct": round(muster_pct, 1)
        }

    @staticmethod
    def get_contractor_status(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        contractors = db.query(Contractor).join(Contract).filter(Contract.mine_id == mine_id).distinct().all()
        now = datetime.now(timezone.utc).date()
        expiring = []
        for c in contractors:
            for contract in c.contracts:
                if contract.mine_id == mine_id and contract.end_date:
                    days_left = (contract.end_date - now).days
                    if 0 <= days_left <= 30:
                        expiring.append({
                            "contractor": c.name,
                            "contract_code": contract.contract_code,
                            "days_remaining": days_left
                        })
        return {
            "mine_id": mine_id,
            "total_active_contractors": len(contractors),
            "expiring_contracts_30d": expiring
        }

    @staticmethod
    def get_grievances(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        grievances = (
            db.query(Grievance)
            .filter(Grievance.mine_id == mine_id, Grievance.status.in_(["SUBMITTED", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS"]))
            .order_by(desc(Grievance.created_at))
            .limit(10)
            .all()
        )
        now = datetime.now(timezone.utc)
        items = []
        for g in grievances:
            target = g.target_resolution_date.replace(tzinfo=timezone.utc) if g.target_resolution_date.tzinfo is None else g.target_resolution_date
            sla_breached = target < now
            items.append({
                "grievance_id": g.id,
                "ticket_code": g.ticket_code,
                "category": g.category,
                "priority": g.priority.value if hasattr(g.priority, 'value') else str(g.priority),
                "status": g.status.value if hasattr(g.status, 'value') else str(g.status),
                "sla_breached": sla_breached
            })
        return {"mine_id": mine_id, "active_grievances": items}

    @staticmethod
    def get_pending_approvals(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        approvals = (
            db.query(ApprovalRequest)
            .filter(ApprovalRequest.mine_id == mine_id, ApprovalRequest.status == "PENDING")
            .order_by(desc(ApprovalRequest.created_at))
            .limit(10)
            .all()
        )
        items = []
        for a in approvals:
            items.append({
                "approval_id": a.id,
                "request_code": a.request_code,
                "document_type": a.document_type,
                "title": a.title,
                "requested_by_id": a.requested_by_id,
                "created_at": a.created_at.isoformat()
            })
        return {"mine_id": mine_id, "pending_count": len(items), "pending_approvals": items}

    @staticmethod
    def get_governance_tasks(db: Session, mine_id: int, user: User) -> Dict[str, Any]:
        tasks = (
            db.query(GovernanceTask)
            .filter(GovernanceTask.mine_id == mine_id, GovernanceTask.status.in_(["PENDING", "IN_PROGRESS"]))
            .order_by(desc(GovernanceTask.due_date))
            .limit(10)
            .all()
        )
        items = []
        for t in tasks:
            items.append({
                "task_id": t.id,
                "task_type": t.task_type.value if hasattr(t.task_type, 'value') else str(t.task_type),
                "title": t.title,
                "status": t.status.value if hasattr(t.status, 'value') else str(t.status),
                "priority": t.priority.value if hasattr(t.priority, 'value') else str(t.priority),
                "due_date": t.due_date.isoformat()
            })
        return {"mine_id": mine_id, "open_tasks": items}

    @staticmethod
    def get_what_changed(db: Session, mine_id: int, user: User, window_hours: int = 1) -> Dict[str, Any]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=window_hours)
        new_anomalies = (
            db.query(AnomalyEvent)
            .join(Sensor, AnomalyEvent.sensor_id == Sensor.id)
            .filter(Sensor.mine_id == mine_id, AnomalyEvent.detected_at >= cutoff)
            .count()
        )
        new_incidents = db.query(Incident).filter(Incident.mine_id == mine_id, Incident.occurred_at >= cutoff).count()
        new_violations = db.query(Violation).filter(Violation.mine_id == mine_id, Violation.created_at >= cutoff).count()
        latest_risk = RiskService.get_latest_risk_score(db, mine_id)
        current_risk = latest_risk.score if latest_risk else 15.0
        
        return {
            "mine_id": mine_id,
            "window_hours": window_hours,
            "new_anomalies_count": new_anomalies,
            "new_incidents_count": new_incidents,
            "new_violations_count": new_violations,
            "current_risk_score": current_risk
        }

    @staticmethod
    def get_audit_events(db: Session, mine_id: int, user: User, limit: int = 5) -> Dict[str, Any]:
        events = (
            db.query(AuditEvent)
            .filter(AuditEvent.mine_id == mine_id)
            .order_by(desc(AuditEvent.timestamp))
            .limit(limit)
            .all()
        )
        items = []
        for e in events:
            items.append({
                "audit_id": e.id,
                "action": e.action,
                "resource_type": e.resource_type,
                "resource_id": e.resource_id,
                "timestamp": e.timestamp.isoformat(),
                "event_hash": e.current_event_hash[:12] + "..." if e.current_event_hash else None
            })
        return {"mine_id": mine_id, "recent_audit_events": items}
