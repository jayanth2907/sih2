import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.core.config import settings
from app.models.user import User
from app.models.mine import Mine
from app.models.sensor import Sensor
from app.models.alert import Alert
from app.services.audit_service import AuditService
from app.services.demo_scenario_service import DemoScenarioService, SCENARIO_REGISTRY

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def admin_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@trinetra.gov.in", "password": "Trinetra@2026"}
    )
    assert res.status_code == 200
    return res.json()["access_token"]

@pytest.fixture
def manager_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "manager.mine1@trinetra.gov.in", "password": "Trinetra@2026"}
    )
    assert res.status_code == 200
    return res.json()["access_token"]


def test_demo_preflight_check(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/demo/preflight", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_ready"] is True
    assert data["overall_status"] in ("READY", "DEGRADED")
    assert len(data["checks"]) >= 5
    component_names = [c["component"] for c in data["checks"]]
    assert "DATABASE" in component_names
    assert "TELEMETRY" in component_names
    assert "PREDICTIVE_ML" in component_names
    assert "AUDIT_LEDGER" in component_names


def test_list_demo_scenarios(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/demo/scenarios", headers=headers)
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) >= 8
    scenario_ids = [s["scenario_id"] for s in scenarios]
    assert "NORMAL_OPERATIONS" in scenario_ids
    assert "GAS_ESCALATION" in scenario_ids
    assert "COMPLIANCE_SLA_BREACH" in scenario_ids
    assert "ENVIRONMENTAL_DEVIATION" in scenario_ids
    assert "CMSMS_EXTERNAL_SIGNAL" in scenario_ids
    assert "OFFLINE_FIELD_INSPECTION" in scenario_ids
    assert "CMSMS_OUTAGE" in scenario_ids
    assert "CROSS_MINE_ATTACK" in scenario_ids


def test_get_scenario_detail(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/demo/scenarios/GAS_ESCALATION", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_id"] == "GAS_ESCALATION"
    assert data["total_steps"] == 7
    assert len(data["steps"]) == 7
    assert data["steps"][0]["step_key"] == "NORMAL_BASELINE"
    assert data["steps"][3]["step_key"] == "PREDICTIVE_RISK_SPIKE"


def test_gas_escalation_step_by_step(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    run_id = "TEST-RUN-GAS-01"

    # Reset first
    client.post("/api/v1/demo/scenarios/GAS_ESCALATION/reset", headers=headers)

    # Step 1: Baseline
    r1 = client.post("/api/v1/demo/scenarios/GAS_ESCALATION/step", json={"run_id": run_id, "force": True}, headers=headers)
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["step_index"] == 1
    assert d1["step_key"] == "NORMAL_BASELINE"
    assert d1["completed"] is False

    # Step 2: Surge Ingestion
    r2 = client.post("/api/v1/demo/scenarios/GAS_ESCALATION/step", json={"run_id": run_id}, headers=headers)
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["step_index"] == 2
    assert d2["step_key"] == "GAS_SURGE_INGESTION"

    # Step 3: Anomaly Alert
    r3 = client.post("/api/v1/demo/scenarios/GAS_ESCALATION/step", json={"run_id": run_id}, headers=headers)
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["step_index"] == 3
    assert d3["step_key"] == "ANOMALY_ALERT_ACTIVE"

    # Step 4: Predictive Risk Spike
    r4 = client.post("/api/v1/demo/scenarios/GAS_ESCALATION/step", json={"run_id": run_id}, headers=headers)
    assert r4.status_code == 200
    d4 = r4.json()
    assert d4["step_index"] == 4
    assert d4["step_key"] == "PREDICTIVE_RISK_SPIKE"
    assert "predicted_escalation_probability" in d4["state_updates"]

    # Step 5: 3D Hotspot Focus
    r5 = client.post("/api/v1/demo/scenarios/GAS_ESCALATION/step", json={"run_id": run_id}, headers=headers)
    assert r5.status_code == 200
    d5 = r5.json()
    assert d5["step_index"] == 5
    assert d5["step_key"] == "HOTSPOT_3D_FOCUS"

    # Step 6: Copilot Explanation
    r6 = client.post("/api/v1/demo/scenarios/GAS_ESCALATION/step", json={"run_id": run_id}, headers=headers)
    assert r6.status_code == 200
    d6 = r6.json()
    assert d6["step_index"] == 6
    assert d6["step_key"] == "COPILOT_GROUNDED_EXPLANATION"

    # Step 7: Governance Task & Audit
    r7 = client.post("/api/v1/demo/scenarios/GAS_ESCALATION/step", json={"run_id": run_id}, headers=headers)
    assert r7.status_code == 200
    d7 = r7.json()
    assert d7["step_index"] == 7
    assert d7["step_key"] == "GOVERNANCE_TASK_AUDIT"
    assert d7["completed"] is True
    assert d7["next_step_available"] is False


def test_gas_escalation_run_all(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post("/api/v1/demo/scenarios/GAS_ESCALATION/run-all", json={"run_id": "TEST-RUN-ALL-01"}, headers=headers)
    assert res.status_code == 200
    steps = res.json()
    assert len(steps) == 7
    assert steps[-1]["completed"] is True


def test_compliance_sla_breach_scenario(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post("/api/v1/demo/scenarios/COMPLIANCE_SLA_BREACH/run-all", json={"run_id": "TEST-SLA-01"}, headers=headers)
    assert res.status_code == 200
    steps = res.json()
    assert len(steps) == 5
    assert steps[-1]["step_key"] == "AUDIT_TRAIL_CHAINED"
    assert steps[-1]["completed"] is True


def test_environmental_deviation_scenario(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post("/api/v1/demo/scenarios/ENVIRONMENTAL_DEVIATION/run-all", headers=headers)
    assert res.status_code == 200
    steps = res.json()
    assert len(steps) == 4
    assert steps[-1]["step_key"] == "ENV_AUDIT_LOG"


def test_cmsms_external_signal_scenario(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post("/api/v1/demo/scenarios/CMSMS_EXTERNAL_SIGNAL/run-all", headers=headers)
    assert res.status_code == 200
    steps = res.json()
    assert len(steps) == 4
    assert steps[1]["step_key"] == "GEOFENCE_MINE_MATCH"


def test_offline_field_inspection_scenario(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post("/api/v1/demo/scenarios/OFFLINE_FIELD_INSPECTION/run-all", headers=headers)
    assert res.status_code == 200
    steps = res.json()
    assert len(steps) == 4
    assert steps[-1]["step_key"] == "IDEMPOTENT_SERVER_PERSISTENCE"


def test_cmsms_outage_resilience_scenario(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post("/api/v1/demo/scenarios/CMSMS_OUTAGE/run-all", headers=headers)
    assert res.status_code == 200
    steps = res.json()
    assert len(steps) == 3
    assert steps[1]["state_updates"]["circuit_breaker_state"] == "OPEN"
    assert steps[2]["state_updates"]["core_api_status"] == "OPERATIONAL"


def test_cross_mine_attack_security_scenario(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post("/api/v1/demo/scenarios/CROSS_MINE_ATTACK/run-all", headers=headers)
    assert res.status_code == 200
    steps = res.json()
    assert len(steps) == 3
    assert steps[-1]["state_updates"]["status_code"] == 403


def test_10_consecutive_runs_repeatability(client, admin_token):
    """Stress & repeatability test: 10 consecutive scenario executions without failure or corruption"""
    headers = {"Authorization": f"Bearer {admin_token}"}
    for i in range(10):
        run_id = f"REPEAT-RUN-{i+1:03d}"
        res = client.post("/api/v1/demo/scenarios/GAS_ESCALATION/run-all", json={"run_id": run_id}, headers=headers)
        assert res.status_code == 200
        steps = res.json()
        assert len(steps) == 7
        assert steps[-1]["completed"] is True


def test_demo_reset_all(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post("/api/v1/demo/reset-all", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True


def test_demo_unauthenticated_blocked(client):
    res = client.get("/api/v1/demo/preflight")
    assert res.status_code == 401
