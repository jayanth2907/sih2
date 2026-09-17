import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.mine import Mine
from app.models.spatial import MineLevel, MineZone
from app.models.user import User
from app.models.field_operation import FieldInspection, FieldEvidence, FieldSyncLog
from app.models.environmental import EnvironmentalObservation
from app.models.incident import Incident, IncidentEvent
from app.models.audit import AuditEvent
from app.core.exceptions import EntityNotFoundError, PermissionDeniedError, BusinessRuleViolationError
from app.core.authz import check_mine_access, get_user_roles
from app.core.permissions import RoleEnum
from app.services.risk_service import RiskService
from app.services.predictive_risk_service import PredictiveRiskService
from app.services.audit_service import AuditService
from app.schemas.field_operation import (
    FieldInspectionCreate, FieldInspectionUpdate, FieldInspectionRead,
    FieldEvidenceCreate, FieldEvidenceRead, ChecklistItem,
    SyncBatchRequest, SyncBatchResponse, SyncOperationResult
)

logger = logging.getLogger("trinetra.field_operations")

class FieldService:
    @staticmethod
    def get_inspector_inspections(
        db: Session,
        user: User,
        mine_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        roles = get_user_roles(user, db)
        query = db.query(FieldInspection)

        if mine_id is not None:
            if not check_mine_access(user, mine_id, db):
                raise PermissionDeniedError(f"Access denied to Mine ID {mine_id}")
            query = query.filter(FieldInspection.mine_id == mine_id)
        else:
            # Filter to assigned mines unless superuser/admin/regulator
            if not (user.is_superuser or RoleEnum.SYSTEM_ADMIN.value in roles or RoleEnum.REGULATOR.value in roles):
                assigned_mines = [a.mine_id for a in user.mine_assignments]
                query = query.filter(FieldInspection.mine_id.in_(assigned_mines))

        # Field Inspectors see their own assigned inspections
        if RoleEnum.FIELD_INSPECTOR.value in roles and not (RoleEnum.SYSTEM_ADMIN.value in roles or RoleEnum.MINE_MANAGER.value in roles):
            query = query.filter(FieldInspection.inspector_id == user.id)

        inspections = query.order_by(desc(FieldInspection.scheduled_date)).all()
        results = []

        for insp in inspections:
            ch_items = []
            if insp.checklist_json:
                try:
                    ch_items = json.loads(insp.checklist_json)
                except Exception:
                    ch_items = []

            # Get zone risk context
            c_risk = 25.0
            p_risk = 35.0
            if insp.zone_id and insp.mine_id:
                try:
                    p_summary = PredictiveRiskService.generate_prediction(db, insp.mine_id)
                    c_risk = p_summary.get("current_risk_score", 25.0)
                    p_risk = p_summary.get("predicted_risk_score", 35.0)
                except Exception:
                    pass

            results.append({
                "id": insp.id,
                "inspection_code": insp.inspection_code,
                "mine_id": insp.mine_id,
                "mine_name": insp.mine.name if insp.mine else None,
                "level_id": insp.level_id,
                "level_name": insp.level.name if insp.level else None,
                "zone_id": insp.zone_id,
                "zone_name": insp.zone.name if insp.zone else None,
                "inspector_id": insp.inspector_id,
                "inspector_name": insp.inspector.full_name if insp.inspector else None,
                "inspection_type": insp.inspection_type,
                "scheduled_date": insp.scheduled_date.isoformat(),
                "status": insp.status,
                "checklist": ch_items,
                "summary_notes": insp.summary_notes,
                "severity_assessment": insp.severity_assessment,
                "latitude": insp.latitude,
                "longitude": insp.longitude,
                "gps_accuracy_meters": insp.gps_accuracy_meters,
                "current_zone_risk": c_risk,
                "predicted_zone_risk": p_risk,
                "started_at": insp.started_at.isoformat() if insp.started_at else None,
                "completed_at": insp.completed_at.isoformat() if insp.completed_at else None,
                "created_at": insp.created_at.isoformat(),
                "updated_at": insp.updated_at.isoformat()
            })

        return results

    @staticmethod
    def create_inspection(
        db: Session,
        user: User,
        data: FieldInspectionCreate
    ) -> FieldInspection:
        if not check_mine_access(user, data.mine_id, db):
            raise PermissionDeniedError(f"Access denied to Mine ID {data.mine_id}")

        count = db.query(FieldInspection).filter(FieldInspection.mine_id == data.mine_id).count() + 1
        mine = db.query(Mine).filter(Mine.id == data.mine_id).first()
        code_prefix = mine.code.replace("MINE-", "") if mine else f"M{data.mine_id}"
        insp_code = f"INSP-{datetime.now().year}-{code_prefix}-{count:03d}"

        checklist_str = json.dumps([item.model_dump() for item in data.checklist]) if data.checklist else None

        inspection = FieldInspection(
            inspection_code=insp_code,
            mine_id=data.mine_id,
            level_id=data.level_id,
            zone_id=data.zone_id,
            inspector_id=user.id,
            inspection_type=data.inspection_type,
            scheduled_date=data.scheduled_date,
            status=data.status,
            checklist_json=checklist_str,
            summary_notes=data.summary_notes,
            severity_assessment=data.severity_assessment,
            latitude=data.latitude,
            longitude=data.longitude,
            gps_accuracy_meters=data.gps_accuracy_meters,
            started_at=datetime.now(timezone.utc) if data.status == "IN_PROGRESS" else None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(inspection)
        db.commit()
        db.refresh(inspection)

        AuditService.log_event(
            db=db,
            actor_id=user.id,
            action="FIELD_INSPECTION_CREATED",
            resource_type="FieldInspection",
            resource_id=insp_code,
            mine_id=data.mine_id,
            after_state=f"Status:{data.status}|Type:{data.inspection_type}"
        )

        return inspection

    @staticmethod
    def update_inspection(
        db: Session,
        inspection_id: int,
        user: User,
        data: FieldInspectionUpdate
    ) -> FieldInspection:
        inspection = db.query(FieldInspection).filter(FieldInspection.id == inspection_id).first()
        if not inspection:
            raise EntityNotFoundError("FieldInspection", inspection_id)

        if not check_mine_access(user, inspection.mine_id, db):
            raise PermissionDeniedError(f"Access denied to Mine ID {inspection.mine_id}")

        # Validate valid workflow transition
        if data.status and data.status != inspection.status:
            allowed_transitions = {
                "SCHEDULED": ["IN_PROGRESS", "CANCELLED"],
                "IN_PROGRESS": ["COMPLETED", "SUBMITTED"],
                "COMPLETED": ["SUBMITTED", "VERIFIED"],
                "SUBMITTED": ["VERIFIED", "ACTION_REQUIRED"],
                "VERIFIED": [],
                "CANCELLED": []
            }
            if data.status not in allowed_transitions.get(inspection.status, []):
                raise BusinessRuleViolationError(
                    f"Invalid state transition from {inspection.status} to {data.status}."
                )
            inspection.status = data.status
            if data.status == "IN_PROGRESS" and not inspection.started_at:
                inspection.started_at = datetime.now(timezone.utc)
            if data.status in ["COMPLETED", "SUBMITTED"] and not inspection.completed_at:
                inspection.completed_at = datetime.now(timezone.utc)

        if data.checklist is not None:
            inspection.checklist_json = json.dumps([item.model_dump() for item in data.checklist])
        if data.summary_notes is not None:
            inspection.summary_notes = data.summary_notes
        if data.severity_assessment is not None:
            inspection.severity_assessment = data.severity_assessment
        if data.latitude is not None:
            inspection.latitude = data.latitude
        if data.longitude is not None:
            inspection.longitude = data.longitude
        if data.gps_accuracy_meters is not None:
            inspection.gps_accuracy_meters = data.gps_accuracy_meters

        inspection.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(inspection)

        AuditService.log_event(
            db=db,
            actor_id=user.id,
            action="FIELD_INSPECTION_UPDATED",
            resource_type="FieldInspection",
            resource_id=inspection.inspection_code,
            mine_id=inspection.mine_id,
            after_state=f"Status:{inspection.status}|Severity:{inspection.severity_assessment}"
        )

        return inspection

    @staticmethod
    def save_evidence(
        db: Session,
        user: User,
        data: FieldEvidenceCreate
    ) -> FieldEvidence:
        if not check_mine_access(user, data.mine_id, db):
            raise PermissionDeniedError(f"Access denied to Mine ID {data.mine_id}")

        evidence = FieldEvidence(
            evidence_code=data.evidence_code,
            mine_id=data.mine_id,
            inspection_id=data.inspection_id,
            observation_id=data.observation_id,
            incident_id=data.incident_id,
            evidence_type=data.evidence_type,
            title=data.title,
            description=data.description,
            file_url_or_path=data.file_url_or_path,
            file_hash_sha256=data.file_hash_sha256,
            file_size_bytes=data.file_size_bytes,
            latitude=data.latitude,
            longitude=data.longitude,
            gps_accuracy_meters=data.gps_accuracy_meters,
            client_capture_timestamp=data.client_capture_timestamp,
            server_received_timestamp=datetime.now(timezone.utc),
            captured_by_id=user.id,
            created_at=datetime.now(timezone.utc)
        )
        db.add(evidence)
        db.commit()
        db.refresh(evidence)

        AuditService.log_event(
            db=db,
            actor_id=user.id,
            action="FIELD_EVIDENCE_RECORDED",
            resource_type="FieldEvidence",
            resource_id=data.evidence_code,
            mine_id=data.mine_id,
            metadata={"hash_sha256": data.file_hash_sha256, "type": data.evidence_type}
        )

        return evidence

    @staticmethod
    def process_sync_batch(
        db: Session,
        user: User,
        batch: SyncBatchRequest
    ) -> SyncBatchResponse:
        """
        Idempotent, fault-tolerant batch synchronization for offline field operations.
        Validates authorizations, records sync logs, and updates core governance entities.
        """
        if not check_mine_access(user, batch.mine_id, db):
            raise PermissionDeniedError(f"Access denied: User not authorized for Mine {batch.mine_id}")

        results: List[SyncOperationResult] = []
        accepted_cnt = 0
        rejected_cnt = 0
        conflict_cnt = 0

        for op in batch.operations:
            # 1. Idempotency Check: check if operation_id was already processed
            existing_log = db.query(FieldSyncLog).filter(FieldSyncLog.operation_id == op.operation_id).first()
            if existing_log:
                results.append(SyncOperationResult(
                    operation_id=op.operation_id,
                    entity_type=op.entity_type,
                    entity_id=op.entity_id,
                    status="ALREADY_PROCESSED",
                    error=None
                ))
                continue

            try:
                # 2. Entity Dispatcher
                if op.entity_type == "INSPECTION":
                    payload = op.payload
                    if op.operation_type == "CREATE":
                        insp_data = FieldInspectionCreate(
                            mine_id=batch.mine_id,
                            level_id=payload.get("level_id"),
                            zone_id=payload.get("zone_id"),
                            inspection_type=payload.get("inspection_type", "ROUTINE_SAFETY"),
                            scheduled_date=payload.get("scheduled_date", datetime.now(timezone.utc)),
                            status=payload.get("status", "SUBMITTED"),
                            checklist=[ChecklistItem(**c) for c in payload.get("checklist", [])],
                            summary_notes=payload.get("summary_notes"),
                            severity_assessment=payload.get("severity_assessment", "LOW"),
                            latitude=payload.get("latitude"),
                            longitude=payload.get("longitude"),
                            gps_accuracy_meters=payload.get("gps_accuracy_meters")
                        )
                        created_insp = FieldService.create_inspection(db, user, insp_data)
                        results.append(SyncOperationResult(
                            operation_id=op.operation_id,
                            entity_type=op.entity_type,
                            entity_id=created_insp.inspection_code,
                            server_id=created_insp.id,
                            status="ACCEPTED"
                        ))
                        accepted_cnt += 1

                    elif op.operation_type == "UPDATE":
                        insp_id = payload.get("id")
                        if not insp_id:
                            raise BusinessRuleViolationError("Inspection ID required for UPDATE operation.")
                        insp_update = FieldInspectionUpdate(
                            status=payload.get("status"),
                            checklist=[ChecklistItem(**c) for c in payload.get("checklist", [])] if "checklist" in payload else None,
                            summary_notes=payload.get("summary_notes"),
                            severity_assessment=payload.get("severity_assessment"),
                            latitude=payload.get("latitude"),
                            longitude=payload.get("longitude"),
                            gps_accuracy_meters=payload.get("gps_accuracy_meters")
                        )
                        updated_insp = FieldService.update_inspection(db, int(insp_id), user, insp_update)
                        results.append(SyncOperationResult(
                            operation_id=op.operation_id,
                            entity_type=op.entity_type,
                            entity_id=updated_insp.inspection_code,
                            server_id=updated_insp.id,
                            status="ACCEPTED"
                        ))
                        accepted_cnt += 1

                elif op.entity_type == "OBSERVATION":
                    payload = op.payload
                    obs = EnvironmentalObservation(
                        mine_id=batch.mine_id,
                        parameter_name=payload.get("parameter_name", "Atmospheric & Dust Observation"),
                        observed_value=float(payload.get("observed_value", 1.0)),
                        threshold_limit=float(payload.get("threshold_limit", 2.0)),
                        unit=payload.get("unit", "mg/m3"),
                        severity=payload.get("severity", "MEDIUM"),
                        status=payload.get("status", "OPEN"),
                        location_context=payload.get("location_context", "Field Inspector Observation"),
                        x=float(payload.get("x", 0.0)),
                        y=float(payload.get("y", 200.0)),
                        z=float(payload.get("z", -180.0)),
                        action_taken=payload.get("action_taken"),
                        detected_at=op.client_timestamp
                    )
                    db.add(obs)
                    db.commit()
                    db.refresh(obs)

                    AuditService.log_event(
                        db=db,
                        actor_id=user.id,
                        action="FIELD_OBSERVATION_SYNCED",
                        resource_type="EnvironmentalObservation",
                        resource_id=str(obs.id),
                        mine_id=batch.mine_id,
                        after_state=f"Observed:{obs.observed_value}{obs.unit}|Severity:{obs.severity}"
                    )

                    results.append(SyncOperationResult(
                        operation_id=op.operation_id,
                        entity_type=op.entity_type,
                        entity_id=str(obs.id),
                        server_id=obs.id,
                        status="ACCEPTED"
                    ))
                    accepted_cnt += 1

                elif op.entity_type == "INCIDENT":
                    payload = op.payload
                    count = db.query(Incident).filter(Incident.mine_id == batch.mine_id).count() + 1
                    inc_code = f"INC-{datetime.now().year}-FLD-{count:03d}"
                    incident = Incident(
                        incident_code=inc_code,
                        mine_id=batch.mine_id,
                        title=payload.get("title", "Field Logged Safety Incident"),
                        description=payload.get("description", "Reported by field mobile inspector"),
                        category=payload.get("category", "HAZARD_CONDITION"),
                        severity=payload.get("severity", "MEDIUM"),
                        status="OPEN",
                        reporter_id=user.id,
                        x=float(payload.get("x", 0.0)),
                        y=float(payload.get("y", 200.0)),
                        z=float(payload.get("z", -180.0)),
                        latitude=payload.get("latitude"),
                        longitude=payload.get("longitude"),
                        created_at=op.client_timestamp if op.client_timestamp else datetime.now(timezone.utc)
                    )
                    db.add(incident)
                    db.commit()
                    db.refresh(incident)

                    results.append(SyncOperationResult(
                        operation_id=op.operation_id,
                        entity_type=op.entity_type,
                        entity_id=inc_code,
                        server_id=incident.id,
                        status="ACCEPTED"
                    ))
                    accepted_cnt += 1

                elif op.entity_type == "EVIDENCE":
                    payload = op.payload
                    ev_data = FieldEvidenceCreate(
                        evidence_code=payload.get("evidence_code", f"EVID-{datetime.now().year}-{op.operation_id[:8]}"),
                        mine_id=batch.mine_id,
                        inspection_id=payload.get("inspection_id"),
                        observation_id=payload.get("observation_id"),
                        incident_id=payload.get("incident_id"),
                        evidence_type=payload.get("evidence_type", "PHOTO"),
                        title=payload.get("title", "Field Captured Evidence"),
                        description=payload.get("description"),
                        file_url_or_path=payload.get("file_url_or_path"),
                        file_hash_sha256=payload.get("file_hash_sha256", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
                        file_size_bytes=int(payload.get("file_size_bytes", 1024)),
                        latitude=payload.get("latitude"),
                        longitude=payload.get("longitude"),
                        gps_accuracy_meters=payload.get("gps_accuracy_meters"),
                        client_capture_timestamp=op.client_timestamp
                    )
                    ev_rec = FieldService.save_evidence(db, user, ev_data)
                    results.append(SyncOperationResult(
                        operation_id=op.operation_id,
                        entity_type=op.entity_type,
                        entity_id=ev_rec.evidence_code,
                        server_id=ev_rec.id,
                        status="ACCEPTED"
                    ))
                    accepted_cnt += 1

                # Log successful sync
                sync_log = FieldSyncLog(
                    operation_id=op.operation_id,
                    mine_id=batch.mine_id,
                    user_id=user.id,
                    entity_type=op.entity_type,
                    entity_id=op.entity_id,
                    operation_type=op.operation_type,
                    client_timestamp=op.client_timestamp,
                    status="ACCEPTED"
                )
                db.add(sync_log)
                db.commit()

            except Exception as e:
                logger.error(f"Sync operation {op.operation_id} failed: {e}")
                err_msg = str(e)
                status_code = "CONFLICT" if "transition" in err_msg.lower() or "conflict" in err_msg.lower() else "REJECTED"
                if status_code == "CONFLICT":
                    conflict_cnt += 1
                else:
                    rejected_cnt += 1

                sync_log = FieldSyncLog(
                    operation_id=op.operation_id,
                    mine_id=batch.mine_id,
                    user_id=user.id,
                    entity_type=op.entity_type,
                    entity_id=op.entity_id,
                    operation_type=op.operation_type,
                    client_timestamp=op.client_timestamp,
                    status=status_code,
                    error_message=err_msg
                )
                db.add(sync_log)
                db.commit()

                results.append(SyncOperationResult(
                    operation_id=op.operation_id,
                    entity_type=op.entity_type,
                    entity_id=op.entity_id,
                    status=status_code,
                    error=err_msg
                ))

        return SyncBatchResponse(
            mine_id=batch.mine_id,
            processed_count=len(batch.operations),
            accepted_count=accepted_cnt,
            rejected_count=rejected_cnt,
            conflict_count=conflict_cnt,
            results=results
        )
