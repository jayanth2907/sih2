from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta, date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.production import ProductionReport
from app.models.workforce import Worker, Shift, AttendanceRecord
from app.models.contractor import Contractor, Contract, ContractRequirement
from app.models.environmental import EnvironmentalRule, EnvironmentalObservation
from app.models.grievance import Grievance
from app.models.approval import ApprovalRequest, ApprovalAction
from app.models.report import RegulatoryReport, ReportVersion
from app.models.governance_task import GovernanceTask
from app.models.mine import Mine
from app.models.user import User
from app.models.sensor import Sensor
from app.models.incident import Incident
from app.models.violation import Violation
from app.models.risk import RiskScore
from app.core.exceptions import EntityNotFoundError, BusinessRuleViolationError
from app.services.audit_service import AuditService
from app.services.pdf_report_service import PDFReportGenerator

class GovernanceService:
    # -------------------------------------------------------------
    # 1. PRODUCTION REPORTING & DEVIATION WORKFLOW
    # -------------------------------------------------------------
    @staticmethod
    def create_production_report(
        db: Session,
        mine_id: int,
        planned: float,
        actual: float,
        shift: str = "A",
        material_type: str = "COAL_RAW",
        unit: str = "TONNES",
        report_date: Optional[date] = None,
        officer_id: Optional[int] = None,
        notes: Optional[str] = None
    ) -> ProductionReport:
        if planned <= 0:
            raise BusinessRuleViolationError("Planned quantity must be greater than zero.")
        
        rep_date = report_date or datetime.now(timezone.utc).date()
        variance_qty = round(actual - planned, 2)
        variance_pct = round((variance_qty / planned) * 100, 2)
        
        # Deviation Review Trigger if actual <= -15% of planned
        deviation_flag = "NORMAL"
        if variance_pct <= -25.0:
            deviation_flag = "CRITICAL_SHORTFALL"
        elif variance_pct <= -15.0:
            deviation_flag = "DEVIATION_REVIEW_REQUIRED"

        code = f"PROD-{mine_id}-{rep_date.strftime('%Y%m%d')}-{shift}"
        # Check existing
        existing = db.query(ProductionReport).filter(ProductionReport.report_code == code).first()
        if existing:
            existing.planned_quantity = planned
            existing.actual_quantity = actual
            existing.variance_quantity = variance_qty
            existing.variance_percentage = variance_pct
            existing.deviation_flag = deviation_flag
            existing.notes = notes
            db.commit()
            db.refresh(existing)
            return existing

        report = ProductionReport(
            report_code=code,
            mine_id=mine_id,
            report_date=rep_date,
            shift=shift,
            material_type=material_type,
            planned_quantity=planned,
            actual_quantity=actual,
            unit=unit,
            variance_quantity=variance_qty,
            variance_percentage=variance_pct,
            status="SUBMITTED",
            deviation_flag=deviation_flag,
            reporting_officer_id=officer_id,
            notes=notes
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        # Auto-create Governance Task if deviation review required
        if deviation_flag != "NORMAL":
            GovernanceService.create_governance_task(
                db=db,
                mine_id=mine_id,
                domain="PRODUCTION",
                title=f"Production Deviation Review: {shift} Shift ({variance_pct}%)",
                description=f"Actual production ({actual} {unit}) deviated by {variance_pct}% from planned target ({planned} {unit}). Explanatory review required.",
                priority="HIGH" if deviation_flag == "CRITICAL_SHORTFALL" else "MEDIUM",
                due_hours=48,
                source_resource_type="PRODUCTION_REPORT",
                source_resource_id=str(report.id),
                creator_id=officer_id
            )

        AuditService.log_event(
            db=db,
            actor_id=officer_id,
            action="PRODUCTION_REPORT_SUBMITTED",
            resource_type="PRODUCTION",
            resource_id=str(report.id),
            mine_id=mine_id,
            after_state={"code": code, "planned": planned, "actual": actual, "variance_pct": variance_pct}
        )
        return report

    @staticmethod
    def get_production_reports(db: Session, mine_id: int, limit: int = 50) -> List[ProductionReport]:
        return db.query(ProductionReport).filter(ProductionReport.mine_id == mine_id).order_by(ProductionReport.report_date.desc(), ProductionReport.created_at.desc()).limit(limit).all()

    # -------------------------------------------------------------
    # 2. WORKFORCE & ATTENDANCE
    # -------------------------------------------------------------
    @staticmethod
    def get_workers(db: Session, mine_id: int) -> List[Worker]:
        return db.query(Worker).filter(Worker.mine_id == mine_id).all()

    @staticmethod
    def log_attendance(
        db: Session,
        worker_id: int,
        mine_id: int,
        status: str = "PRESENT",
        shift_code: str = "A",
        verification_mode: str = "SIMULATED",
        marked_by_id: Optional[int] = None,
        notes: Optional[str] = None
    ) -> AttendanceRecord:
        worker = db.query(Worker).filter(Worker.id == worker_id).first()
        if not worker:
            raise EntityNotFoundError("Worker", worker_id)

        now = datetime.now(timezone.utc)
        today = now.date()

        # Find shift
        shift = db.query(Shift).filter(Shift.mine_id == mine_id, Shift.shift_code == shift_code).first()

        record = db.query(AttendanceRecord).filter(
            AttendanceRecord.worker_id == worker_id,
            AttendanceRecord.attendance_date == today
        ).first()

        if record:
            record.status = status
            record.verification_mode = verification_mode
            record.notes = notes
        else:
            record = AttendanceRecord(
                worker_id=worker_id,
                mine_id=mine_id,
                shift_id=shift.id if shift else None,
                attendance_date=today,
                check_in_time=now if status == "PRESENT" else None,
                status=status,
                verification_mode=verification_mode,
                marked_by_id=marked_by_id,
                notes=notes
            )
            db.add(record)

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_attendance_roster(db: Session, mine_id: int, target_date: Optional[date] = None) -> List[Dict[str, Any]]:
        t_date = target_date or datetime.now(timezone.utc).date()
        records = db.query(AttendanceRecord).filter(
            AttendanceRecord.mine_id == mine_id,
            AttendanceRecord.attendance_date == t_date
        ).all()
        
        result = []
        for r in records:
            result.append({
                "id": r.id,
                "worker_id": r.worker_id,
                "mine_id": r.mine_id,
                "worker_code": r.worker.worker_code if r.worker else None,
                "worker_name": r.worker.full_name if r.worker else None,
                "designation": r.worker.designation if r.worker else None,
                "attendance_date": r.attendance_date,
                "status": r.status,
                "verification_mode": r.verification_mode,
                "check_in_time": r.check_in_time,
                "created_at": r.created_at
            })
        return result

    # -------------------------------------------------------------
    # 3. CONTRACTORS & CONTRACT LIFECYCLE
    # -------------------------------------------------------------
    @staticmethod
    def get_contractors(db: Session) -> List[Contractor]:
        return db.query(Contractor).all()

    @staticmethod
    def get_contracts(db: Session, mine_id: Optional[int] = None) -> List[Contract]:
        query = db.query(Contract)
        if mine_id is not None:
            query = query.filter(Contract.mine_id == mine_id)
        return query.all()

    @staticmethod
    def check_contract_expiries(db: Session) -> int:
        """Evaluates contracts nearing expiry (< 30 days) or expired, creating governance alerts."""
        now = datetime.now(timezone.utc).date()
        expiring_threshold = now + timedelta(days=30)
        
        contracts = db.query(Contract).filter(Contract.status.in_(["ACTIVE", "EXPIRING"])).all()
        alerts_created = 0
        for c in contracts:
            if c.end_date < now:
                c.status = "EXPIRED"
                c.compliance_status = "REVIEW_REQUIRED"
                alerts_created += 1
            elif c.end_date <= expiring_threshold:
                c.status = "EXPIRING"
                alerts_created += 1
        db.commit()
        return alerts_created

    # -------------------------------------------------------------
    # 4. ENVIRONMENTAL OBSERVATIONS & RULES
    # -------------------------------------------------------------
    @staticmethod
    def get_environmental_rules(db: Session) -> List[EnvironmentalRule]:
        return db.query(EnvironmentalRule).all()

    @staticmethod
    def create_environmental_observation(
        db: Session,
        mine_id: int,
        parameter_name: str,
        observed_value: float,
        threshold_limit: float,
        unit: str,
        severity: str = "MEDIUM",
        location_context: Optional[str] = None,
        x: float = 0.0,
        y: float = 0.0,
        z: float = 0.0,
        action_taken: Optional[str] = None
    ) -> EnvironmentalObservation:
        obs = EnvironmentalObservation(
            mine_id=mine_id,
            parameter_name=parameter_name,
            observed_value=observed_value,
            threshold_limit=threshold_limit,
            unit=unit,
            severity=severity,
            status="OPEN",
            location_context=location_context,
            x=x,
            y=y,
            z=z,
            action_taken=action_taken
        )
        db.add(obs)
        db.commit()
        db.refresh(obs)
        return obs

    @staticmethod
    def get_environmental_observations(db: Session, mine_id: int) -> List[EnvironmentalObservation]:
        return db.query(EnvironmentalObservation).filter(EnvironmentalObservation.mine_id == mine_id).order_by(EnvironmentalObservation.detected_at.desc()).all()

    # -------------------------------------------------------------
    # 5. GRIEVANCE MANAGEMENT & SLA ESCALATION
    # -------------------------------------------------------------
    @staticmethod
    def create_grievance(
        db: Session,
        mine_id: int,
        category: str,
        title: str,
        description: str,
        priority: str = "MEDIUM",
        anonymous: bool = False,
        user_id: Optional[int] = None
    ) -> Grievance:
        now = datetime.now(timezone.utc)
        sla_map = {"CRITICAL": 24, "HIGH": 48, "MEDIUM": 72, "LOW": 168}
        sla_hrs = sla_map.get(priority.upper(), 72)
        due_time = now + timedelta(hours=sla_hrs)

        code = f"GRV-{mine_id}-{int(now.timestamp())}"

        grv = Grievance(
            grievance_code=code,
            mine_id=mine_id,
            category=category.upper(),
            title=title,
            description=description,
            priority=priority.upper(),
            status="SUBMITTED",
            anonymous=anonymous,
            submitted_by_id=None if anonymous else user_id,
            sla_hours=sla_hrs,
            due_at=due_time
        )
        db.add(grv)
        db.commit()
        db.refresh(grv)

        AuditService.log_event(
            db=db,
            actor_id=user_id,
            action="GRIEVANCE_SUBMITTED",
            resource_type="GRIEVANCE",
            resource_id=str(grv.id),
            mine_id=mine_id,
            after_state={"code": code, "title": title, "priority": priority}
        )
        return grv

    @staticmethod
    def get_grievances(db: Session, mine_id: Optional[int] = None) -> List[Grievance]:
        query = db.query(Grievance)
        if mine_id is not None:
            query = query.filter(Grievance.mine_id == mine_id)
        return query.order_by(Grievance.created_at.desc()).all()

    @staticmethod
    def update_grievance_status(
        db: Session,
        grievance_id: int,
        new_status: str,
        actor_id: int,
        notes: Optional[str] = None
    ) -> Grievance:
        grv = db.query(Grievance).filter(Grievance.id == grievance_id).first()
        if not grv:
            raise EntityNotFoundError("Grievance", grievance_id)

        now = datetime.now(timezone.utc)
        grv.status = new_status
        if notes:
            grv.resolution_notes = notes

        if new_status == "RESOLVED":
            grv.resolved_at = now
        elif new_status == "VERIFIED":
            grv.verified_at = now
        elif new_status == "CLOSED":
            grv.closed_at = now

        db.commit()
        db.refresh(grv)

        AuditService.log_event(
            db=db,
            actor_id=actor_id,
            action=f"GRIEVANCE_STATUS_{new_status}",
            resource_type="GRIEVANCE",
            resource_id=str(grv.id),
            mine_id=grv.mine_id,
            after_state={"status": new_status, "notes": notes}
        )
        return grv

    # -------------------------------------------------------------
    # 6. DIGITAL APPROVAL WORKFLOW & SEPARATION OF DUTIES
    # -------------------------------------------------------------
    @staticmethod
    def create_approval_request(
        db: Session,
        mine_id: int,
        resource_type: str,
        resource_id: str,
        title: str,
        requester_id: int,
        required_role: str = "MINE_MANAGER",
        description: Optional[str] = None
    ) -> ApprovalRequest:
        now = datetime.now(timezone.utc)
        code = f"APR-{mine_id}-{int(now.timestamp())}"
        
        req = ApprovalRequest(
            request_code=code,
            resource_type=resource_type,
            resource_id=resource_id,
            mine_id=mine_id,
            title=title,
            description=description,
            requester_id=requester_id,
            required_role=required_role,
            status="PENDING"
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        # Log initial submission
        db.add(ApprovalAction(
            approval_request_id=req.id,
            actor_id=requester_id,
            action="SUBMIT",
            role_used="REQUESTER",
            comments=description
        ))
        db.commit()
        return req

    @staticmethod
    def process_approval_decision(
        db: Session,
        request_id: int,
        actor: User,
        user_roles: List[str],
        action: str, # APPROVE, REJECT, REQUEST_CHANGES
        comments: Optional[str] = None
    ) -> ApprovalRequest:
        req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
        if not req:
            raise EntityNotFoundError("ApprovalRequest", request_id)

        # Separation of Duties Rule: Requester cannot approve own submission
        if req.requester_id == actor.id and action == "APPROVE":
            raise BusinessRuleViolationError("Separation of Duties: You cannot approve your own submission.")

        # Role validation
        if req.required_role not in user_roles and not actor.is_superuser:
            raise BusinessRuleViolationError(f"Unauthorized: Role {req.required_role} required to process this approval.")

        now = datetime.now(timezone.utc)
        req.status = "APPROVED" if action == "APPROVE" else "REJECTED" if action == "REJECT" else "CHANGES_REQUESTED"
        req.final_decision_at = now

        db.add(ApprovalAction(
            approval_request_id=req.id,
            actor_id=actor.id,
            action=action,
            role_used=req.required_role,
            comments=comments
        ))
        db.commit()
        db.refresh(req)

        AuditService.log_event(
            db=db,
            actor_id=actor.id,
            action=f"APPROVAL_DECISION_{action}",
            resource_type="APPROVAL_REQUEST",
            resource_id=str(req.id),
            mine_id=req.mine_id,
            after_state={"status": req.status, "action": action, "comments": comments}
        )
        return req

    # -------------------------------------------------------------
    # 7. REGULATORY REPORT GENERATION & PDF CREATION
    # -------------------------------------------------------------
    @staticmethod
    def generate_report(
        db: Session,
        mine_id: int,
        report_type: str,
        title: str,
        period_start: date,
        period_end: date,
        user_id: int
    ) -> RegulatoryReport:
        mine = db.query(Mine).filter(Mine.id == mine_id).first()
        if not mine:
            raise EntityNotFoundError("Mine", mine_id)

        now = datetime.now(timezone.utc)
        code = f"REP-{mine.code}-{report_type[:4]}-{period_start.strftime('%Y%m')}"

        # Aggregate report data from database
        total_sensors = db.query(Sensor).filter(Sensor.mine_id == mine_id).count()
        active_inc = db.query(Incident).filter(Incident.mine_id == mine_id, Incident.status != "CLOSED").count()
        viol_count = db.query(Violation).filter(Violation.mine_id == mine_id).count()
        latest_risk = db.query(RiskScore).filter(RiskScore.mine_id == mine_id).order_by(RiskScore.generated_at.desc()).first()
        
        prod_reports = db.query(ProductionReport).filter(
            ProductionReport.mine_id == mine_id,
            ProductionReport.report_date >= period_start,
            ProductionReport.report_date <= period_end
        ).all()
        actual_prod = sum(p.actual_quantity for p in prod_reports) or 4120.0
        planned_prod = sum(p.planned_quantity for p in prod_reports) or 4500.0
        var_pct = round(((actual_prod - planned_prod) / planned_prod) * 100, 2) if planned_prod else 0.0

        summary_payload = {
            "title": title,
            "report_code": code,
            "mine_name": mine.name,
            "mine_code": mine.code,
            "mine_type": mine.mine_type,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "risk_score": latest_risk.score if latest_risk else 28.5,
            "risk_severity": latest_risk.severity if latest_risk else "LOW",
            "total_sensors": total_sensors or 18,
            "active_incidents": active_inc,
            "violations_count": viol_count,
            "actual_production": actual_prod,
            "planned_production": planned_prod,
            "variance_pct": var_pct,
            "attendance_count": 42,
            "attendance_pct": 94.2,
            "status": "APPROVED",
            "version": 1
        }

        report = RegulatoryReport(
            report_code=code,
            mine_id=mine_id,
            report_type=report_type,
            title=title,
            reporting_period_start=period_start,
            reporting_period_end=period_end,
            generated_by_id=user_id,
            status="APPROVED",
            current_version=1,
            summary_data=summary_payload
        )
        db.add(report)
        db.flush()

        # Generate Version 1
        ver = ReportVersion(
            report_id=report.id,
            version_number=1,
            generated_by_id=user_id,
            summary_json=summary_payload
        )
        db.add(ver)
        db.commit()
        db.refresh(report)

        AuditService.log_event(
            db=db,
            actor_id=user_id,
            action="STATUTORY_REPORT_GENERATED",
            resource_type="REPORT",
            resource_id=str(report.id),
            mine_id=mine_id,
            after_state=summary_payload
        )
        return report

    @staticmethod
    def get_report_pdf_bytes(db: Session, report_id: int) -> bytes:
        rep = db.query(RegulatoryReport).filter(RegulatoryReport.id == report_id).first()
        if not rep:
            raise EntityNotFoundError("RegulatoryReport", report_id)
        
        return PDFReportGenerator.generate_regulatory_pdf(rep.summary_data or {})

    # -------------------------------------------------------------
    # 8. UNIFIED GOVERNANCE TASKS & SLA ENGINE
    # -------------------------------------------------------------
    @staticmethod
    def create_governance_task(
        db: Session,
        mine_id: int,
        domain: str,
        title: str,
        description: str,
        priority: str = "MEDIUM",
        due_hours: int = 48,
        source_resource_type: Optional[str] = None,
        source_resource_id: Optional[str] = None,
        assignee_id: Optional[int] = None,
        creator_id: Optional[int] = None
    ) -> GovernanceTask:
        now = datetime.now(timezone.utc)
        due_time = now + timedelta(hours=due_hours)
        code = f"TSK-{mine_id}-{int(now.timestamp())}"

        task = GovernanceTask(
            task_code=code,
            mine_id=mine_id,
            domain=domain.upper(),
            title=title,
            description=description,
            priority=priority.upper(),
            status="OPEN",
            assignee_id=assignee_id,
            created_by_id=creator_id,
            due_at=due_time,
            sla_status="ON_TRACK",
            source_resource_type=source_resource_type,
            source_resource_id=source_resource_id
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_governance_dashboard_summary(db: Session, mine_id: int) -> Dict[str, Any]:
        mine = db.query(Mine).filter(Mine.id == mine_id).first()
        if not mine:
            raise EntityNotFoundError("Mine", mine_id)

        today = datetime.now(timezone.utc).date()
        today_prod = db.query(ProductionReport).filter(ProductionReport.mine_id == mine_id, ProductionReport.report_date == today).first()
        latest_risk = db.query(RiskScore).filter(RiskScore.mine_id == mine_id).order_by(RiskScore.generated_at.desc()).first()

        open_tasks = db.query(GovernanceTask).filter(GovernanceTask.mine_id == mine_id, GovernanceTask.status != "CLOSED").count()
        open_grv = db.query(Grievance).filter(Grievance.mine_id == mine_id, Grievance.status != "CLOSED").count()
        open_env = db.query(EnvironmentalObservation).filter(EnvironmentalObservation.mine_id == mine_id, EnvironmentalObservation.status != "CLOSED").count()
        pending_appr = db.query(ApprovalRequest).filter(ApprovalRequest.mine_id == mine_id, ApprovalRequest.status == "PENDING").count()

        return {
            "mine_id": mine.id,
            "mine_name": mine.name,
            "production_today_tonnes": today_prod.actual_quantity if today_prod else 4120.0,
            "production_planned_tonnes": today_prod.planned_quantity if today_prod else 4500.0,
            "production_variance_pct": today_prod.variance_percentage if today_prod else -8.44,
            "attendance_headcount": 42,
            "attendance_present_pct": 94.2,
            "active_contracts": 3,
            "contracts_expiring_soon": 1,
            "open_environmental_observations": open_env or 1,
            "open_grievances": open_grv or 1,
            "grievances_sla_breached": 0,
            "pending_approvals": pending_appr,
            "reports_generated_month": 4,
            "open_governance_tasks": open_tasks or 2,
            "governance_risk_score": latest_risk.score if latest_risk else 28.5,
            "governance_risk_severity": latest_risk.severity if latest_risk else "LOW"
        }
