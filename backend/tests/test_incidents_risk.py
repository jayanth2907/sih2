import pytest

def get_token(client, email):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "Trinetra@2026"})
    return res.json()["access_token"]

def test_incident_creation_and_state_machine(client):
    mgr_token = get_token(client, "manager.mine1@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {mgr_token}"}
    
    # Get Mine 1
    mines = client.get("/api/v1/mines", headers=headers).json()
    mine1 = mines[0]
    
    # 1. Create Incident
    inc_payload = {
        "mine_id": mine1["id"],
        "title": "Abnormal Strata Convergence at Face 102",
        "description": "Roof extensometer recorded 14mm displacement in 2 hours.",
        "category": "ROOF_FALL_RISK",
        "severity": "HIGH",
        "sla_hours": 6,
        "x": 125.0,
        "y": 455.0,
        "z": -320.0
    }
    create_res = client.post("/api/v1/incidents", json=inc_payload, headers=headers)
    assert create_res.status_code == 201
    inc = create_res.json()
    assert inc["status"] == "OPEN"
    assert inc["incident_code"].startswith("INC-")
    
    inc_id = inc["id"]
    
    # 2. Transition OPEN -> TRIAGED
    triage_res = client.patch(
        f"/api/v1/incidents/{inc_id}/status",
        json={"status": "TRIAGED", "comment": "Triage verified by Senior Safety Officer."},
        headers=headers
    )
    assert triage_res.status_code == 200
    assert triage_res.json()["status"] == "TRIAGED"
    
    # 3. Transition TRIAGED -> IN_PROGRESS
    prog_res = client.patch(
        f"/api/v1/incidents/{inc_id}/status",
        json={"status": "IN_PROGRESS", "comment": "Support crew deployed hydraulic props."},
        headers=headers
    )
    assert prog_res.status_code == 200
    assert prog_res.json()["status"] == "IN_PROGRESS"
    
    # 4. Transition IN_PROGRESS -> RESOLVED
    res_res = client.patch(
        f"/api/v1/incidents/{inc_id}/status",
        json={"status": "RESOLVED", "resolution_notes": "Props reinforced. Strata stable."},
        headers=headers
    )
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"
    
    # 5. Transition RESOLVED -> VERIFIED
    ver_res = client.patch(
        f"/api/v1/incidents/{inc_id}/status",
        json={"status": "VERIFIED", "comment": "Inspection verified support load capacity."},
        headers=headers
    )
    assert ver_res.status_code == 200
    assert ver_res.json()["status"] == "VERIFIED"
    
    # 6. Invalid transition: cannot jump from VERIFIED directly to OPEN
    bad_res = client.patch(
        f"/api/v1/incidents/{inc_id}/status",
        json={"status": "OPEN", "comment": "Illegal jump"},
        headers=headers
    )
    assert bad_res.status_code == 422

def test_risk_score_evaluation_and_factors(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers).json()
    mine1 = next(m for m in mines if m["code"] == "MINE-BDS-04")
    
    risk_res = client.get(f"/api/v1/risk/{mine1['id']}", headers=headers)
    assert risk_res.status_code == 200
    risk_data = risk_res.json()
    assert "score" in risk_data
    assert "severity" in risk_data
    assert risk_data["severity"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "factors" in risk_data
    assert "silence_risk_score" in risk_data
    assert "explanation" in risk_data
    assert risk_data["model_version"] == "TRINETRA-RISK-v1.0"
