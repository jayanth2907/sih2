import pytest

def get_token(client, email, password="Trinetra@2026"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

def test_system_admin_can_access_all_mines(client):
    token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. List all mines
    res = client.get("/api/v1/mines", headers=headers)
    assert res.status_code == 200
    mines = res.json()
    assert len(mines) >= 3
    
    # 2. Detail view of any mine (Mine 1, 2, 3)
    for m in mines:
        detail_res = client.get(f"/api/v1/mines/{m['id']}", headers=headers)
        assert detail_res.status_code == 200

def test_mine_manager_can_access_assigned_mine(client):
    token = get_token(client, "manager.mine1@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    # List should only return assigned mine (Mine 1)
    res = client.get("/api/v1/mines", headers=headers)
    assert res.status_code == 200
    mines = res.json()
    assert len(mines) == 1
    assert mines[0]["code"] == "MINE-BDS-04"
    
    # Can access Mine 1 details
    mine1_id = mines[0]["id"]
    detail_res = client.get(f"/api/v1/mines/{mine1_id}", headers=headers)
    assert detail_res.status_code == 200

def test_mine_manager_cannot_access_unassigned_mine(client):
    token = get_token(client, "manager.mine1@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try accessing Mine 2 (Singrauli OpenCast) which belongs to manager.mine2
    # First get admin token to find Mine 2 id
    admin_token = get_token(client, "admin@trinetra.gov.in")
    admin_mines = client.get("/api/v1/mines", headers={"Authorization": f"Bearer {admin_token}"}).json()
    mine2 = next(m for m in admin_mines if m["code"] == "MINE-SOB-02")
    
    # Attempt unauthorized access as Manager 1
    forbidden_res = client.get(f"/api/v1/mines/{mine2['id']}", headers=headers)
    assert forbidden_res.status_code == 403
    assert "Access denied" in forbidden_res.json()["detail"]

def test_inspector_cannot_access_unauthorized_mine(client):
    token = get_token(client, "inspector.dgms@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Inspector is assigned to Mine 1 and Mine 2, but NOT Mine 3 (Raniganj Seam 7)
    admin_token = get_token(client, "admin@trinetra.gov.in")
    admin_mines = client.get("/api/v1/mines", headers={"Authorization": f"Bearer {admin_token}"}).json()
    mine3 = next(m for m in admin_mines if m["code"] == "MINE-RS-07")
    
    forbidden_res = client.get(f"/api/v1/mines/{mine3['id']}", headers=headers)
    assert forbidden_res.status_code == 403
    assert "Access denied" in forbidden_res.json()["detail"]

def test_digital_twin_endpoint_requires_mine_access(client):
    mgr_token = get_token(client, "manager.mine1@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {mgr_token}"}
    
    admin_token = get_token(client, "admin@trinetra.gov.in")
    admin_mines = client.get("/api/v1/mines", headers={"Authorization": f"Bearer {admin_token}"}).json()
    mine1 = next(m for m in admin_mines if m["code"] == "MINE-BDS-04")
    mine2 = next(m for m in admin_mines if m["code"] == "MINE-SOB-02")
    
    # Success for assigned mine
    dt_res = client.get(f"/api/v1/mines/{mine1['id']}/digital-twin", headers=headers)
    assert dt_res.status_code == 200
    dt_data = dt_res.json()
    assert "levels" in dt_data
    assert "sensors" in dt_data
    assert "cameras" in dt_data
    
    # Forbidden for unassigned mine
    dt_forbidden = client.get(f"/api/v1/mines/{mine2['id']}/digital-twin", headers=headers)
    assert dt_forbidden.status_code == 403
