import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import hashlib

from app.main import app
from app.db.session import get_db
from app.models.user import User
from app.models.mine import Mine
from app.models.audit import AuditEvent
from app.models.external_integration import ExternalEventLog
from app.services.audit_service import AuditService
from app.integrations.gateway import gateway
from app.integrations.base_adapter import CircuitState, calculate_distance_meters
from app.integrations.cmsms_adapter import CMSMSAdapter
from app.integrations.parivesh_adapter import PARIVESHAdapter
from app.integrations.dgms_adapter import DGMSAdapter

client = TestClient(app)

def get_admin_token(test_client=None):
    c = test_client or client
    res = c.post("/api/v1/auth/login", json={
        "email": "admin@trinetra.gov.in",
        "password": "Trinetra@2026"
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["access_token"]

def get_manager_m1_token(test_client=None):
    c = test_client or client
    res = c.post("/api/v1/auth/login", json={
        "email": "manager.mine1@trinetra.gov.in",
        "password": "Trinetra@2026"
    })
    assert res.status_code == 200, f"Manager login failed: {res.text}"
    return res.json()["access_token"]

def test_liveness_and_readiness_probes(client):
    """Verify standard Kubernetes/Docker liveness and readiness endpoints."""
    res_live = client.get("/api/v1/health/live")
    assert res_live.status_code == 200
    assert res_live.json()["status"] == "ALIVE"

    res_ready = client.get("/api/v1/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "READY"
    assert res_ready.json()["database"] == "CONNECTED"

def test_security_headers_present(client):
    """Verify security headers middleware injects hardening headers."""
    res = client.get("/api/v1/health/live")
    assert res.status_code == 200
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

def test_cmsms_adapter_validation_and_normalization():
    """Verify CMSMS adapter validates coordinates and normalizes severity."""
    adapter = CMSMSAdapter(mode="SIMULATED")
    assert adapter.connect() is True
    assert adapter.provenance()["source_system"] == "CMSMS"

    valid_payload = {
        "report_id": "CMSMS-TEST-001",
        "report_type": "UNAUTHORIZED_MINING_SIGNAL",
        "latitude": 23.795,
        "longitude": 86.430,
        "severity": "MAJOR",
        "title": "Excavation near boundary"
    }
    assert adapter.validate_payload(valid_payload) is True
    norm = adapter.normalize_record(valid_payload)
    assert norm.source_system == "CMSMS"
    assert norm.severity == "HIGH"  # MAJOR mapped to HIGH
    assert norm.latitude == 23.795

    invalid_payload = {
        "report_id": "CMSMS-BAD",
        "latitude": 999.0,  # Invalid latitude
        "longitude": 86.430
    }
    assert adapter.validate_payload(invalid_payload) is False

def test_parivesh_and_dgms_adapters():
    """Verify PARIVESH and DGMS adapters normalize and validate properly."""
    par_adapter = PARIVESHAdapter(mode="SIMULATED")
    dgms_adapter = DGMSAdapter(mode="SIMULATED")

    par_payload = {
        "clearance_id": "PARIVESH-TEST-01",
        "observation_type": "ENV_CLEARANCE_BOUNDARY",
        "latitude": 23.79,
        "longitude": 86.42,
        "compliance_status": "EXCEEDED"
    }
    assert par_adapter.validate_payload(par_payload) is True
    par_norm = par_adapter.normalize_record(par_payload)
    assert par_norm.severity == "HIGH"

    dgms_payload = {
        "directive_id": "DGMS-TEST-01",
        "directive_type": "STATUTORY_SAFETY_NOTICE",
        "title": "Mandatory Strata Testing",
        "urgency": "MANDATORY"
    }
    assert dgms_adapter.validate_payload(dgms_payload) is True
    dgms_norm = dgms_adapter.normalize_record(dgms_payload)
    assert dgms_norm.severity == "HIGH"

def test_haversine_distance_calculation():
    """Verify GPS distance calculation helper."""
    # Distance between ~100m points
    dist = calculate_distance_meters(23.7957, 86.4304, 23.7966, 86.4304)
    assert 90.0 <= dist <= 110.0

def test_integration_gateway_sync_and_idempotency(client, db_session):
    """Verify external ingestion, spatial matching, and idempotency (no duplicate rows)."""
    admin_token = get_admin_token(client)

    # Step 1: Initial Sync
    res1 = client.post(
        "/api/v1/integrations/sync/CMSMS?mine_id=1",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "SUCCESS"
    assert data1["records_imported"] >= 1

    # Count initial records
    initial_count = db_session.query(ExternalEventLog).filter(ExternalEventLog.source_system == "CMSMS").count()
    assert initial_count >= 1

    # Step 2: Resend identical sync -> must be deduplicated idempotently
    res2 = client.post(
        "/api/v1/integrations/sync/CMSMS?mine_id=1",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "SUCCESS"
    assert data2["records_imported"] == 0  # 0 new records because already imported

    after_count = db_session.query(ExternalEventLog).filter(ExternalEventLog.source_system == "CMSMS").count()
    assert after_count == initial_count  # No duplicate rows created

def test_circuit_breaker_transitions_and_failure_resilience(client):
    """Verify circuit breaker opens on failure and prevents cascading errors."""
    admin_token = get_admin_token(client)

    # Simulate failure on PARIVESH
    res_fail = client.post(
        "/api/v1/integrations/simulate-failure/PARIVESH",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_fail.status_code == 200
    assert res_fail.json()["circuit_state"] == CircuitState.OPEN

    # Check health dashboard reports PARIVESH as DEGRADED / OFFLINE
    res_health = client.get(
        "/api/v1/integrations/health",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_health.status_code == 200
    adapters = res_health.json()["adapters"]
    parivesh_health = next(a for a in adapters if a["source_system"] == "PARIVESH")
    assert parivesh_health["circuit_state"] == CircuitState.OPEN

    # Core platform remains fully functional
    res_sys = client.get(
        "/api/v1/integrations/system-health",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_sys.status_code == 200

    # Reset circuit breaker
    res_rec = client.post(
        "/api/v1/integrations/simulate-recovery/PARIVESH",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_rec.status_code == 200
    assert res_rec.json()["circuit_state"] == CircuitState.CLOSED

def test_audit_chain_verification_and_tamper_detection(client, db_session):
    """
    Mandatory Test:
    1. Verify genuine audit chain passes validation (VALID).
    2. Tamper with an audit record's after_state payload.
    3. Verify verify_audit_chain() reliably detects tampering (TAMPER_DETECTED).
    """
    admin_token = get_admin_token(client)

    # 1. Verify clean audit ledger
    res_clean = client.get(
        "/api/v1/integrations/audit-verify",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_clean.status_code == 200
    clean_data = res_clean.json()
    assert clean_data["status"] == "VALID", f"Audit verification failed: {clean_data.get('failure_reason')}"
    assert clean_data["total_events"] > 0

    # 2. Intentionally tamper with the latest audit event
    last_event = db_session.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
    assert last_event is not None
    original_state = last_event.after_state

    last_event.after_state = '{"tampered": true, "unauthorized_modification": "hacked"}'
    db_session.commit()

    # 3. Verify tampering is detected
    verification_tampered = AuditService.verify_audit_chain(db_session)
    assert verification_tampered["status"] == "TAMPER_DETECTED"
    assert verification_tampered["corrupted_event_id"] == last_event.id
    assert "Payload Tampering Detected" in verification_tampered["failure_reason"]

    # Restore original state for subsequent tests
    last_event.after_state = original_state
    db_session.commit()

    # Verify restored state passes
    verification_restored = AuditService.verify_audit_chain(db_session)
    assert verification_restored["status"] == "VALID"

def test_rbac_mine_isolation_on_external_reports(client):
    """Verify cross-mine access restrictions on external reports."""
    manager_token = get_manager_m1_token(client)  # Assigned to Mine 1 (BDS-04)

    # Authorized access to Mine 1
    res_m1 = client.get(
        "/api/v1/integrations/reports?mine_id=1",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    assert res_m1.status_code == 200

    # Unauthorized access to Mine 3 (RS-07)
    res_m3 = client.get(
        "/api/v1/integrations/reports?mine_id=3",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    assert res_m3.status_code == 403
    assert "Access Denied" in res_m3.json()["detail"]
