from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.incident import Incident, IncidentEvent
from app.models.violation import Violation, CorrectiveAction
from app.schemas.incident import IncidentCreate, IncidentStatusUpdate
from app.schemas.violation import ViolationCreate, CorrectiveActionBase
from app.core.permissions import IncidentStatus, ViolationStatus
from app.core.exceptions import EntityNotFoundError, BusinessRuleViolationError
from app.services.audit_service import AuditService

VALID_TRANSITIONS = {
    IncidentStatus.OPEN.value: [IncidentStatus.TRIAGED.value, IncidentStatus.ASSIGNED.value, IncidentStatus.CLOSED.value],
    IncidentStatus.TRIAGED.value: [IncidentStatus.ASSIGNED.value, IncidentStatus.IN_PROGRESS.value, IncidentStatus.CLOSED.value],
    IncidentStatus.ASSIGNED.value: [IncidentStatus.IN_PROGRESS.value, IncidentStatus.CLOSED.value],
    IncidentStatus.IN_PROGRESS.value: [IncidentStatus.RESOLVED.value, IncidentStatus.ESCALATED.value],
    IncidentStatus.ESCALATED.value: [IncidentStatus.RESOLVED.value, IncidentStatus.IN_PROGRESS.value],
    IncidentStatus.RESOLVED.value: [IncidentStatus.VERIFIED.value, IncidentStatus.IN_PROGRESS.value], # If verification fails -> back to IN_PROGRESS
    IncidentStatus.VERIFIED.value: [IncidentStatus.CLOSED.value, IncidentStatus.IN_PROGRESS.value],
    IncidentStatus.CLOSED.value: [] # Closed is terminal state
}

class IncidentService:
    @staticmethod
    def get_incidents(db: Session, mine_id: Optional[int] = None, status: Optional[str] = None) -> List[Incident]:
        query = db.query(Incident)
        if mine_id is not None:
            query = query.filter(Incident.mine_id == mine_id)
        if status:
            query = query.filter(Incident.status == status)
        return query.order_by(Incident.created_at.desc()).all()

    @staticmethod
    def get_incident_by_id(db: Session, incident_id: int) -> Incident:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise EntityNotFoundError("Incident", incident_id)
        return incident

    @staticmethod
    def create_incident(db: Session, incident_in: IncidentCreate, reporter_id: Optional[int] = None) -> Incident:
        now = datetime.now(timezone.utc)
        count = db.query(Incident).count() + 1
        code = f"INC-{now.year}-{count:04d}"
        
        sla_due = now + timedelta(hours=incident_in.sla_hours)
        
        incident = Incident(
            incident_code=code,
            mine_id=incident_in.mine_id,
            level_id=incident_in.level_id,
            zone_id=incident_in.zone_id,
            equipment_id=incident_in.equipment_id,
            reporter_id=reporter_id,
            assignee_id=incident_in.assignee_id,
            title=incident_in.title,
            description=incident_in.description,
            category=incident_in.category,
            severity=incident_in.severity,
            status=IncidentStatus.OPEN.value,
            sla_hours=incident_in.sla_hours,
            sla_due_at=sla_due,
            x=incident_in.x,
            y=incident_in.y,
            z=incident_in.z,
            latitude=incident_in.latitude,
            longitude=incident_in.longitude,
            created_at=now
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        
        # Add initial creation event
        event = IncidentEvent(
            incident_id=incident.id,
            actor_id=reporter_id,
            from_status=None,
            to_status=IncidentStatus.OPEN.value,
            comment="Incident registered into TRINETRA governance engine.",
            created_at=now
        )
        db.add(event)
        db.commit()
        
        AuditService.log_event(
            db=db,
            actor_id=reporter_id,
            action="INCIDENT_CREATED",
            resource_type="INCIDENT",
            resource_id=str(incident.id),
            mine_id=incident.mine_id,
            after_state=incident_in.model_dump()
        )
        return incident

    @staticmethod
    def update_incident_status(
        db: Session,
        incident_id: int,
        update_in: IncidentStatusUpdate,
        actor_id: Optional[int] = None
    ) -> Incident:
        incident = IncidentService.get_incident_by_id(db, incident_id)
        from_status = incident.status
        to_status = update_in.status
        
        if from_status != to_status:
            allowed_next = VALID_TRANSITIONS.get(from_status, [])
            if to_status not in allowed_next:
                raise BusinessRuleViolationError(
                    f"Illegal state transition from '{from_status}' to '{to_status}'. Allowed transitions: {allowed_next}"
                )
        
        now = datetime.now(timezone.utc)
        incident.status = to_status
        if update_in.assignee_id is not None:
            incident.assignee_id = update_in.assignee_id
        if update_in.resolution_notes:
            incident.resolution_notes = update_in.resolution_notes
            
        if to_status == IncidentStatus.RESOLVED.value:
            incident.resolved_at = now
        elif to_status == IncidentStatus.VERIFIED.value:
            incident.verified_at = now
        elif to_status == IncidentStatus.CLOSED.value:
            incident.closed_at = now
        elif to_status == IncidentStatus.ESCALATED.value:
            incident.is_escalated = "YES"
            incident.escalation_level += 1
            
        event = IncidentEvent(
            incident_id=incident.id,
            actor_id=actor_id,
            from_status=from_status,
            to_status=to_status,
            comment=update_in.comment,
            created_at=now
        )
        db.add(event)
        db.commit()
        db.refresh(incident)
        
        AuditService.log_event(
            db=db,
            actor_id=actor_id,
            action="INCIDENT_STATUS_CHANGED",
            resource_type="INCIDENT",
            resource_id=str(incident.id),
            mine_id=incident.mine_id,
            before_state={"status": from_status},
            after_state={"status": to_status, "comment": update_in.comment}
        )
        return incident

class ViolationService:
    @staticmethod
    def get_violations(db: Session, mine_id: Optional[int] = None, status: Optional[str] = None) -> List[Violation]:
        query = db.query(Violation)
        if mine_id is not None:
            query = query.filter(Violation.mine_id == mine_id)
        if status:
            query = query.filter(Violation.status == status)
        return query.order_by(Violation.created_at.desc()).all()

    @staticmethod
    def get_violation_by_id(db: Session, violation_id: int) -> Violation:
        v = db.query(Violation).filter(Violation.id == violation_id).first()
        if not v:
            raise EntityNotFoundError("Violation", violation_id)
        return v

    @staticmethod
    def create_violation(db: Session, v_in: ViolationCreate, inspector_id: Optional[int] = None) -> Violation:
        now = datetime.now(timezone.utc)
        count = db.query(Violation).count() + 1
        code = f"VIO-DGMS-{now.year}-{count:04d}"
        
        violation = Violation(
            violation_code=code,
            mine_id=v_in.mine_id,
            zone_id=v_in.zone_id,
            inspector_id=inspector_id,
            title=v_in.title,
            description=v_in.description,
            regulatory_clause=v_in.regulatory_clause,
            statute=v_in.statute,
            severity=v_in.severity,
            financial_penalty_amount=v_in.financial_penalty_amount,
            remedial_deadline=v_in.remedial_deadline or (now + timedelta(days=14)),
            status=ViolationStatus.OPEN.value,
            created_at=now
        )
        db.add(violation)
        db.commit()
        db.refresh(violation)
        
        AuditService.log_event(
            db=db,
            actor_id=inspector_id,
            action="VIOLATION_LOGGED",
            resource_type="VIOLATION",
            resource_id=str(violation.id),
            mine_id=violation.mine_id,
            after_state=v_in.model_dump()
        )
        return violation

    @staticmethod
    def add_corrective_action(db: Session, violation_id: int, ca_in: CorrectiveActionBase) -> CorrectiveAction:
        ViolationService.get_violation_by_id(db, violation_id)
        ca = CorrectiveAction(
            violation_id=violation_id,
            action_text=ca_in.action_text,
            target_completion_date=ca_in.target_completion_date,
            assignee_id=ca_in.assignee_id,
            status="PENDING",
            created_at=datetime.now(timezone.utc)
        )
        db.add(ca)
        db.commit()
        db.refresh(ca)
        return ca
