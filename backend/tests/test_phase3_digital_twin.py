import pytest
from fastapi.testclient import TestClient

def get_token(client, email="admin@trinetra.gov.in", password="Trinetra@2026"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

def test_digital_twin_endpoint_returns_complete_spatial_hierarchy(client: TestClient):
    """Verify digital twin returns full 3D spatial hierarchy for underground mine BDS-04."""
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Fetch mines to get BDS-04 id
    res = client.get("/api/v1/mines", headers=headers)
    assert res.status_code == 200
    mines = res.json()
    bds_mine = next(m for m in mines if m["code"] == "MINE-BDS-04")
    
    # 2. Query digital twin state
    twin_res = client.get(f"/api/v1/mines/{bds_mine['id']}/digital-twin", headers=headers)
    assert twin_res.status_code == 200
    data = twin_res.json()
    
    # Assert top-level structure
    assert "mine" in data
    assert "levels" in data
    assert "zones" in data
    assert "sensors" in data
    assert "cameras" in data
    assert "equipment" in data
    assert "active_incidents" in data
    assert "anomalies" in data
    assert "current_risk_score" in data
    
    # Assert Levels & Zones
    assert len(data["levels"]) >= 3
    assert len(data["zones"]) >= 4
    
    # Assert 3D coordinates on Sensors
    assert len(data["sensors"]) >= 15
    for s in data["sensors"]:
        assert "x" in s and "y" in s and "z" in s
        assert "sensor_code" in s
        assert "sensor_type_code" in s
        assert "warning_threshold" in s
        assert "critical_threshold" in s
    
    # Assert 3D orientation and FOV on Cameras
    assert len(data["cameras"]) >= 3
    for c in data["cameras"]:
        assert "x" in c and "y" in c and "z" in c
        assert "yaw" in c and "pitch" in c and "fov" in c
        assert c["is_simulated"] == "SIMULATED" # Credibility check
    
    # Assert 3D Heavy Machinery
    assert len(data["equipment"]) >= 3
    for eq in data["equipment"]:
        assert "x" in eq and "y" in eq and "z" in eq
        assert "category" in eq

def test_digital_twin_opencast_and_incline_mines(client: TestClient):
    """Verify digital twin state loads cleanly for Opencast (SOB-02) and Incline (RS-07) demo mines."""
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    mines = client.get("/api/v1/mines", headers=headers).json()
    
    sob_mine = next(m for m in mines if m["code"] == "MINE-SOB-02")
    rs_mine = next(m for m in mines if m["code"] == "MINE-RS-07")
    
    # Opencast
    sob_res = client.get(f"/api/v1/mines/{sob_mine['id']}/digital-twin", headers=headers)
    assert sob_res.status_code == 200
    sob_data = sob_res.json()
    assert sob_data["mine"]["mine_type"] == "OPENCAST"
    assert len(sob_data["sensors"]) >= 6
    
    # Incline
    rs_res = client.get(f"/api/v1/mines/{rs_mine['id']}/digital-twin", headers=headers)
    assert rs_res.status_code == 200
    rs_data = rs_res.json()
    assert len(rs_data["sensors"]) >= 4

def test_digital_twin_rbac_mine_manager_scoping(client: TestClient):
    """Verify Mine Manager can access assigned mine digital twin but gets 403 on unassigned mine."""
    manager1_token = get_token(client, "manager.mine1@trinetra.gov.in")
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers_mgr1 = {"Authorization": f"Bearer {manager1_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers_admin).json()
    m1 = next(m for m in mines if m["code"] == "MINE-BDS-04")
    m2 = next(m for m in mines if m["code"] == "MINE-SOB-02")
    
    # Manager 1 can access Mine 1
    res_m1 = client.get(f"/api/v1/mines/{m1['id']}/digital-twin", headers=headers_mgr1)
    assert res_m1.status_code == 200
    
    # Manager 1 is FORBIDDEN from accessing Mine 2
    res_m2 = client.get(f"/api/v1/mines/{m2['id']}/digital-twin", headers=headers_mgr1)
    assert res_m2.status_code == 403

def test_spatial_proximity_context_integrity(client: TestClient):
    """Verify spatial context calculation finds nearby cameras within configured radius."""
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get active anomalies
    anom_res = client.get("/api/v1/anomalies", headers=headers)
    assert anom_res.status_code == 200
    anomalies = anom_res.json()
    
    if len(anomalies) > 0:
        anom_id = anomalies[0]["id"]
        ctx_res = client.get(f"/api/v1/anomalies/{anom_id}/context?radius_meters=100", headers=headers)
        assert ctx_res.status_code == 200
        ctx = ctx_res.json()
        assert "nearby_cameras" in ctx
        assert "nearby_equipment" in ctx
        for cam in ctx["nearby_cameras"]:
            assert "distance_meters" in cam
            assert cam["distance_meters"] <= 100.0
