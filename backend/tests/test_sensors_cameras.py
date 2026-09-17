import pytest

def get_token(client, email):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "Trinetra@2026"})
    return res.json()["access_token"]

def test_sensor_mine_association_and_telemetry(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get Mine 1
    mines = client.get("/api/v1/mines", headers=headers).json()
    mine1 = next(m for m in mines if m["code"] == "MINE-BDS-04")
    
    # Fetch sensors for Mine 1
    sensors_res = client.get(f"/api/v1/sensors?mine_id={mine1['id']}", headers=headers)
    assert sensors_res.status_code == 200
    sensors = sensors_res.json()
    assert len(sensors) >= 3
    
    # Verify all returned sensors belong to Mine 1
    for s in sensors:
        assert s["mine_id"] == mine1["id"]
        assert "x" in s and "y" in s and "z" in s  # Spatial coordinates present
    
    # Ingest a reading for sensor 1
    target_sensor = sensors[0]
    reading_payload = {
        "sensor_id": target_sensor["id"],
        "value": 0.42,
        "unit": target_sensor["unit"],
        "quality": "GOOD",
        "source": "SIMULATED"
    }
    ingest_res = client.post("/api/v1/sensors/readings/ingest", json=reading_payload, headers=headers)
    assert ingest_res.status_code == 201
    reading_data = ingest_res.json()
    assert reading_data["value"] == 0.42
    assert reading_data["source"] == "SIMULATED"

def test_camera_mine_association_and_spatial_coordinates(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers).json()
    mine1 = next(m for m in mines if m["code"] == "MINE-BDS-04")
    
    cameras_res = client.get(f"/api/v1/cameras?mine_id={mine1['id']}", headers=headers)
    assert cameras_res.status_code == 200
    cameras = cameras_res.json()
    assert len(cameras) >= 2
    
    for c in cameras:
        assert c["mine_id"] == mine1["id"]
        assert "yaw" in c and "pitch" in c and "fov" in c
        assert c["is_simulated"] == "SIMULATED"
