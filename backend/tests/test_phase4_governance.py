import pytest
from fastapi.testclient import TestClient

def get_token(client, email="admin@trinetra.gov.in", password="Trinetra@2026"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

def test_production_report_submission_and_deviation_task(client: TestClient):
    """Test production report submission and negative deviation task generation."""
    token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Submit normal production
    prod_payload = {
        "mine_id": 1,
        "shift": "A",
        "material_type": "COAL_RAW",
        "planned_quantity": 5000.0,
        "actual_quantity": 4850.0,
        "unit": "TONNES",
        "notes": "Regular shift production."
    }
    res = client.post("/api/v1/governance/production", json=prod_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["variance_quantity"] == -150.0
    assert data["deviation_flag"] == "NORMAL"
    
    # 2. Submit significant shortfall (-30%) -> triggers CRITICAL_SHORTFALL
    shortfall_payload = {
        "mine_id": 1,
        "shift": "B",
        "material_type": "COAL_RAW",
        "planned_quantity": 5000.0,
        "actual_quantity": 3200.0, # -36%
        "unit": "TONNES",
        "notes": "Shearer cable fault caused face stall."
    }
    sf_res = client.post("/api/v1/governance/production", json=shortfall_payload, headers=headers)
    assert sf_res.status_code == 201
    sf_data = sf_res.json()
    assert sf_data["variance_percentage"] <= -30.0
    assert sf_data["deviation_flag"] == "CRITICAL_SHORTFALL"
    
    # 3. Verify governance task created for deviation review
    tasks_res = client.get("/api/v1/governance/tasks/1", headers=headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert any(t["domain"] == "PRODUCTION" and "Deviation Review" in t["title"] for t in tasks)

def test_workforce_and_attendance_logging(client: TestClient):
    """Test worker directory retrieval and shift attendance marking."""
    token = get_token(client, "manager.mine1@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get workers for Mine 1
    workers_res = client.get("/api/v1/governance/workers/1", headers=headers)
    assert workers_res.status_code == 200
    workers = workers_res.json()
    assert len(workers) >= 5
    
    # Mark attendance for worker 1
    w1 = workers[0]
    att_payload = {
        "worker_id": w1["id"],
        "mine_id": 1,
        "shift_code": "A",
        "status": "PRESENT",
        "verification_mode": "SIMULATED",
        "notes": "Morning roll call verified."
    }
    att_res = client.post("/api/v1/governance/attendance", json=att_payload, headers=headers)
    assert att_res.status_code == 201
    att_data = att_res.json()
    assert att_data["status"] == "PRESENT"
    
    # Check roster
    roster_res = client.get("/api/v1/governance/attendance/1", headers=headers)
    assert roster_res.status_code == 200
    assert len(roster_res.json()) >= 1

def test_contractor_directory_and_contracts(client: TestClient):
    """Test contractor directory and contract expiry monitoring."""
    token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    # List contractors
    cnt_res = client.get("/api/v1/governance/contractors", headers=headers)
    assert cnt_res.status_code == 200
    contractors = cnt_res.json()
    assert len(contractors) >= 3
    
    # List contracts for Mine 1
    con_res = client.get("/api/v1/governance/contracts/1", headers=headers)
    assert con_res.status_code == 200
    contracts = con_res.json()
    assert len(contracts) >= 2
    assert any(c["status"] in ["ACTIVE", "EXPIRING"] for c in contracts)

def test_environmental_observation_and_thresholds(client: TestClient):
    """Test environmental observation creation and retrieval."""
    token = get_token(client, "safety.mine1@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    obs_payload = {
        "mine_id": 1,
        "parameter_name": "Respirable Dust PM10",
        "observed_value": 3.4,
        "threshold_limit": 3.0,
        "unit": "mg/m3",
        "severity": "HIGH",
        "location_context": "Longwall Seam 2 Tailgate Chute",
        "x": 150.0,
        "y": 480.0,
        "z": -318.0,
        "action_taken": "Auxiliary water mist spray activated."
    }
    res = client.post("/api/v1/governance/environment/observations", json=obs_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["observed_value"] == 3.4
    assert data["severity"] == "HIGH"
    
    # List observations
    list_res = client.get("/api/v1/governance/environment/observations/1", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

def test_grievance_submission_and_sla(client: TestClient):
    """Test grievance lifecycle, priority SLA calculation, and status update."""
    token = get_token(client, "safety.mine1@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Submit grievance
    grv_payload = {
        "mine_id": 1,
        "category": "SAFETY",
        "title": "Loose roof support mesh in Incline Section",
        "description": "Roof bolt washer displaced; rock mesh vibrating under airflow.",
        "priority": "HIGH",
        "anonymous": False
    }
    res = client.post("/api/v1/governance/grievances", json=grv_payload, headers=headers)
    assert res.status_code == 201
    grv = res.json()
    assert grv["sla_hours"] == 48
    assert grv["status"] == "SUBMITTED"
    
    # Update status to IN_PROGRESS
    grv_id = grv["id"]
    patch_res = client.patch(
        f"/api/v1/governance/grievances/{grv_id}/status",
        json={"status": "IN_PROGRESS", "resolution_notes": "Strata control team dispatched."},
        headers=headers
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "IN_PROGRESS"

def test_approval_workflow_and_separation_of_duties(client: TestClient):
    """Test digital approval requests and separation of duties enforcement."""
    inspector_token = get_token(client, "inspector.dgms@trinetra.gov.in")
    manager_token = get_token(client, "manager.mine1@trinetra.gov.in")
    
    # 1. Inspector requests approval
    req_payload = {
        "mine_id": 1,
        "resource_type": "STATUTORY_REPORT",
        "resource_id": "REP-MINE-BDS-04-STAT-202609",
        "title": "Statutory Monthly Compliance Review Approval",
        "required_role": "MINE_MANAGER",
        "description": "Monthly report ready for executive sign-off."
    }
    res = client.post(
        "/api/v1/governance/approvals/request",
        json=req_payload,
        headers={"Authorization": f"Bearer {inspector_token}"}
    )
    assert res.status_code == 201
    req = res.json()
    req_id = req["id"]
    
    # 2. Separation of Duties: Inspector cannot approve their own submission!
    self_approve_res = client.post(
        f"/api/v1/governance/approvals/{req_id}/decision",
        json={"action": "APPROVE", "comments": "Self approving."},
        headers={"Authorization": f"Bearer {inspector_token}"}
    )
    assert self_approve_res.status_code == 422
    assert "Separation of Duties" in self_approve_res.json()["detail"]
    
    # 3. Mine Manager approves
    mgr_approve_res = client.post(
        f"/api/v1/governance/approvals/{req_id}/decision",
        json={"action": "APPROVE", "comments": "Verified and approved for statutory release."},
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    assert mgr_approve_res.status_code == 200
    assert mgr_approve_res.json()["status"] == "APPROVED"

def test_regulatory_report_generation_and_pdf_download(client: TestClient):
    """Test report generation and server-side ReportLab PDF download."""
    token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    gen_payload = {
        "mine_id": 1,
        "report_type": "COMPLIANCE_SUMMARY",
        "title": "DGMS Statutory Monthly Compliance Report",
        "reporting_period_start": "2026-08-01",
        "reporting_period_end": "2026-08-31"
    }
    res = client.post("/api/v1/governance/reports/generate", json=gen_payload, headers=headers)
    assert res.status_code == 201
    report = res.json()
    report_id = report["id"]
    
    # Download PDF
    pdf_res = client.get(f"/api/v1/governance/reports/{report_id}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000 # Valid generated PDF bytes
    assert pdf_res.content.startswith(b"%PDF")

def test_governance_dashboard_summary(client: TestClient):
    """Test unified governance dashboard KPI summary endpoint."""
    token = get_token(client, "manager.mine1@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/v1/governance/summary/1", headers=headers)
    assert res.status_code == 200
    summary = res.json()
    assert summary["mine_id"] == 1
    assert "production_today_tonnes" in summary
    assert "attendance_headcount" in summary
    assert "governance_risk_score" in summary

def test_phase4_rbac_mine_isolation(client: TestClient):
    """Verify Manager 1 cannot access Mine 2 production or grievances."""
    mgr1_token = get_token(client, "manager.mine1@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {mgr1_token}"}
    
    # Access Mine 2 (SOB-02) production -> 403 Forbidden
    res = client.get("/api/v1/governance/production/2", headers=headers)
    assert res.status_code == 403
    
    # Access Mine 2 grievances -> 403 Forbidden
    grv_res = client.get("/api/v1/governance/grievances/2", headers=headers)
    assert grv_res.status_code == 403
