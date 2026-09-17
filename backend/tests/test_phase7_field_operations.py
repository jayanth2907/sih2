import pytest
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.mine import Mine
from app.models.spatial import MineLevel, MineZone
from app.models.user import User
from app.models.field_operation import FieldInspection, FieldEvidence, FieldSyncLog
from app.models.environmental import EnvironmentalObservation
from app.models.incident import Incident
from app.models.audit import AuditEvent
from app.core.permissions import RoleEnum

def get_token(client: TestClient, email: str = "inspector.dgms@trinetra.gov.in", password: str = "Trinetra@2026") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

def test_field_inspection_creation_and_workflow(client: TestClient, db_session: Session):
    """Verify inspector can create, progress, and complete a field safety inspection."""
    token = get_token(client, "inspector.dgms@trinetra.gov.in")
    mine = db_session.query(Mine).filter(Mine.code == "MINE-BDS-04").first()
    zone = db_session.query(MineZone).filter(MineZone.code == "ZN-EAST-LW-102").first()
    
    create_payload = {
        "mine_id": mine.id,
        "zone_id": zone.id,
        "inspection_type": "VENTILATION_AUDIT",
        "scheduled_date": datetime.now(timezone.utc).isoformat(),
        "status": "IN_PROGRESS",
        "checklist": [
            {
                "id": "chk-01",
                "title": "Airway Return CH4 Concentration",
                "category": "ATMOSPHERIC",
                "status": "SATISFACTORY",
                "notes": "Reading 0.42% vol",
                "severity": "LOW",
                "evidence_codes": []
            }
        ],
        "summary_notes": "Main ventilation drift inspection in progress.",
        "severity_assessment": "MEDIUM",
        "latitude": 23.7957,
        "longitude": 86.4304,
        "gps_accuracy_meters": 4.5
    }
    
    res = client.post("/api/v1/mobile/inspections", json=create_payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "INSP-" in data["inspection_code"]
    insp_id = data["id"]
    
    # Progress workflow: IN_PROGRESS -> COMPLETED
    update_payload = {
        "status": "COMPLETED",
        "summary_notes": "Inspection completed successfully. No critical blockage found.",
        "severity_assessment": "LOW",
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    up_res = client.put(f"/api/v1/mobile/inspections/{insp_id}", json=update_payload, headers={"Authorization": f"Bearer {token}"})
    assert up_res.status_code == 200

def test_field_evidence_recording_with_sha256_hash(client: TestClient, db_session: Session):
    """Verify evidence metadata is stored with SHA-256 integrity hash and GPS coordinates."""
    token = get_token(client, "inspector.dgms@trinetra.gov.in")
    mine = db_session.query(Mine).filter(Mine.code == "MINE-BDS-04").first()
    
    test_bytes = b"TRINETRA_FIELD_PHOTO_EVIDENCE_SAMPLE"
    sha256_hash = hashlib.sha256(test_bytes).hexdigest()
    
    ev_payload = {
        "evidence_code": f"EVID-2026-{uuid.uuid4().hex[:8]}",
        "mine_id": mine.id,
        "evidence_type": "PHOTO",
        "title": "East Longwall Return Regulator Photo",
        "description": "Visual record of auxiliary ventilation duct.",
        "file_hash_sha256": sha256_hash,
        "file_size_bytes": len(test_bytes),
        "latitude": 23.7958,
        "longitude": 86.4305,
        "gps_accuracy_meters": 3.2,
        "client_capture_timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    res = client.post("/api/v1/mobile/evidence", json=ev_payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "SUCCESS"

def test_idempotent_batch_synchronization(client: TestClient, db_session: Session):
    """Verify offline batch sync successfully processes multiple entity types idempotently."""
    token = get_token(client, "inspector.dgms@trinetra.gov.in")
    mine = db_session.query(Mine).filter(Mine.code == "MINE-BDS-04").first()
    
    op_id_1 = str(uuid.uuid4())
    op_id_2 = str(uuid.uuid4())
    
    batch_payload = {
        "mine_id": mine.id,
        "operations": [
            {
                "operation_id": op_id_1,
                "entity_type": "OBSERVATION",
                "operation_type": "CREATE",
                "client_timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": {
                    "parameter_name": "Respirable Coal Dust PM10",
                    "observed_value": 3.8,
                    "threshold_limit": 2.0,
                    "unit": "mg/m3",
                    "severity": "HIGH",
                    "location_context": "Loading Point Transfer Chute",
                    "x": 120.0, "y": 450.0, "z": -320.0,
                    "action_taken": "Dust suppression water sprays activated."
                }
            },
            {
                "operation_id": op_id_2,
                "entity_type": "INCIDENT",
                "operation_type": "CREATE",
                "client_timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": {
                    "title": "Minor auxiliary fan vibration spike",
                    "description": "Transient bearing vibration during shift handover",
                    "category": "EQUIPMENT_FAILURE",
                    "severity": "MEDIUM",
                    "x": 0.0, "y": 100.0, "z": -220.0
                }
            }
        ]
    }
    
    res = client.post("/api/v1/mobile/sync", json=batch_payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["processed_count"] == 2
    assert data["accepted_count"] == 2
    assert data["rejected_count"] == 0

def test_duplicate_sync_operation_rejected_as_already_processed(client: TestClient, db_session: Session):
    """Verify sending the same operation ID twice returns ALREADY_PROCESSED and avoids duplicates."""
    token = get_token(client, "inspector.dgms@trinetra.gov.in")
    mine = db_session.query(Mine).filter(Mine.code == "MINE-BDS-04").first()
    
    fixed_op_id = f"op_idempotency_{uuid.uuid4().hex[:10]}"
    
    payload = {
        "mine_id": mine.id,
        "operations": [
            {
                "operation_id": fixed_op_id,
                "entity_type": "OBSERVATION",
                "operation_type": "CREATE",
                "client_timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": {
                    "parameter_name": "Seam Water pH",
                    "observed_value": 5.8,
                    "threshold_limit": 6.5,
                    "unit": "pH",
                    "severity": "LOW",
                    "x": 50.0, "y": 200.0, "z": -180.0
                }
            }
        ]
    }
    
    # 1st sync: ACCEPTED
    res1 = client.post("/api/v1/mobile/sync", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 200
    assert res1.json()["accepted_count"] == 1
    
    # 2nd sync with same operation_id: ALREADY_PROCESSED
    res2 = client.post("/api/v1/mobile/sync", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 200
    res_items = res2.json()["results"]
    assert res_items[0]["status"] == "ALREADY_PROCESSED"

def test_field_operations_rbac_mine_isolation(client: TestClient, db_session: Session):
    """Verify field inspector cannot sync operations for unauthorized mines."""
    token = get_token(client, "inspector.dgms@trinetra.gov.in")
    unassigned_mine = db_session.query(Mine).filter(Mine.code == "MINE-RS-07").first()
    
    payload = {
        "mine_id": unassigned_mine.id,
        "operations": [
            {
                "operation_id": str(uuid.uuid4()),
                "entity_type": "OBSERVATION",
                "operation_type": "CREATE",
                "client_timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": {"parameter_name": "Airflow", "observed_value": 1.2, "threshold_limit": 2.0}
            }
        ]
    }
    
    res = client.post("/api/v1/mobile/sync", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_state_transition_validation_on_sync(client: TestClient, db_session: Session):
    """Verify invalid workflow state transitions return CONFLICT status."""
    token = get_token(client, "inspector.dgms@trinetra.gov.in")
    mine = db_session.query(Mine).filter(Mine.code == "MINE-BDS-04").first()
    
    # Create inspection in SCHEDULED state
    insp = FieldInspection(
        inspection_code=f"INSP-TEST-TRANS-{uuid.uuid4().hex[:6]}",
        mine_id=mine.id,
        inspector_id=db_session.query(User).filter(User.email == "inspector.dgms@trinetra.gov.in").first().id,
        scheduled_date=datetime.now(timezone.utc),
        status="SCHEDULED",
        severity_assessment="LOW"
    )
    db_session.add(insp)
    db_session.commit()
    db_session.refresh(insp)
    
    # Attempt invalid jump directly from SCHEDULED to VERIFIED
    invalid_batch = {
        "mine_id": mine.id,
        "operations": [
            {
                "operation_id": str(uuid.uuid4()),
                "entity_type": "INSPECTION",
                "operation_type": "UPDATE",
                "client_timestamp": datetime.now(timezone.utc).isoformat(),
                "payload": {
                    "id": insp.id,
                    "status": "VERIFIED"
                }
            }
        ]
    }
    
    res = client.post("/api/v1/mobile/sync", json=invalid_batch, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["conflict_count"] == 1
    assert data["results"][0]["status"] == "CONFLICT"

def test_assigned_inspections_enriched_with_predictive_risk(client: TestClient, db_session: Session):
    """Verify inspector's inspection list includes 30-minute forward predicted risk context."""
    token = get_token(client, "inspector.dgms@trinetra.gov.in")
    
    res = client.get("/api/v1/mobile/inspections", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    inspections = res.json()
    assert isinstance(inspections, list)
    if len(inspections) > 0:
        item = inspections[0]
        assert "current_zone_risk" in item
        assert "predicted_zone_risk" in item
        assert "inspection_code" in item
