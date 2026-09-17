import pytest
from datetime import datetime, timezone, timedelta
from app.models.sensor import Sensor
from app.models.risk import AnomalyEvent
from app.models.alert import Alert
from app.models.incident import Incident
from app.models.audit import AuditEvent

def get_token(client, email):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "Trinetra@2026"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]

def test_normal_telemetry_ingestion(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers).json()
    mine1 = mines[0]
    sensors = client.get(f"/api/v1/sensors?mine_id={mine1['id']}", headers=headers).json()
    sensor = sensors[0]

    payload = {
        "sensor_id": sensor["id"],
        "mine_id": mine1["id"],
        "value": (sensor["warning_threshold"] * 0.5), # Normal safe value
        "unit": sensor["unit"],
        "source": "SIMULATED"
    }
    res = client.post("/api/v1/sensors/readings/ingest", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "INGESTED"
    assert data["sensor_status"] == "ACTIVE"
    assert data["anomaly_triggered"] is False

def test_warning_threshold_detection(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers).json()
    sensor = client.get(f"/api/v1/sensors?mine_id={mines[0]['id']}", headers=headers).json()[0]

    payload = {
        "sensor_id": sensor["id"],
        "mine_id": mines[0]["id"],
        "value": sensor["warning_threshold"] + 0.05,
        "unit": sensor["unit"],
        "source": "SIMULATED"
    }
    res = client.post("/api/v1/sensors/readings/ingest", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["anomaly_triggered"] is True
    assert data["anomaly_type"] == "THRESHOLD_EXCEEDED"
    assert data["sensor_status"] == "WARNING"

def test_critical_threshold_detection_and_alert_and_incident(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers).json()
    sensors = client.get(f"/api/v1/sensors?mine_id={mines[0]['id']}", headers=headers).json()
    # Pick a methane sensor
    ch4_sensor = next(s for s in sensors if "CH4" in s["sensor_code"])

    payload = {
        "sensor_id": ch4_sensor["id"],
        "mine_id": mines[0]["id"],
        "value": ch4_sensor["critical_threshold"] + 0.35, # Critical breach
        "unit": ch4_sensor["unit"],
        "source": "SIMULATED"
    }
    res = client.post("/api/v1/sensors/readings/ingest", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["anomaly_triggered"] is True
    assert data["sensor_status"] == "CRITICAL"
    assert data["alert_id"] is not None
    assert data["incident_id"] is not None

def test_duplicate_critical_readings_do_not_create_duplicate_incidents(client, db_session):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers).json()
    ch4_sensor = next(s for s in client.get(f"/api/v1/sensors?mine_id={mines[0]['id']}", headers=headers).json() if "CH4" in s["sensor_code"])

    init_incident_count = db_session.query(Incident).filter(Incident.mine_id == mines[0]["id"]).count()

    # Send 3 repeated critical readings
    for i in range(3):
        payload = {
            "sensor_id": ch4_sensor["id"],
            "mine_id": mines[0]["id"],
            "value": ch4_sensor["critical_threshold"] + 0.40 + (i * 0.01),
            "unit": ch4_sensor["unit"],
            "source": "SIMULATED"
        }
        res = client.post("/api/v1/sensors/readings/ingest", json=payload, headers=headers)
        assert res.status_code == 201

    post_incident_count = db_session.query(Incident).filter(Incident.mine_id == mines[0]["id"]).count()
    # Max 1 new incident created, not 3 duplicates
    assert post_incident_count <= init_incident_count + 1

def test_sensor_recovery_sequence(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers).json()
    sensor = client.get(f"/api/v1/sensors?mine_id={mines[0]['id']}", headers=headers).json()[0]

    # Ingest safe recovery value
    payload = {
        "sensor_id": sensor["id"],
        "mine_id": mines[0]["id"],
        "value": (sensor["normal_min"] or 0.0) + 0.10,
        "unit": sensor["unit"],
        "source": "SIMULATED"
    }
    res = client.post("/api/v1/sensors/readings/ingest", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["sensor_status"] == "ACTIVE"

def test_sensor_offline_detection(client, db_session):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers).json()
    mine1_id = mines[0]["id"]

    # Trigger SENSOR_OFFLINE scenario
    res = client.post(
        f"/api/v1/sensors/simulate-scenario/{mine1_id}",
        json={"scenario": "SENSOR_OFFLINE"},
        headers=headers
    )
    assert res.status_code == 200

    # Query anomalies for SENSOR_OFFLINE
    anomalies = client.get(f"/api/v1/anomalies?mine_id={mine1_id}", headers=headers).json()
    assert any(a["anomaly_type"] == "SENSOR_OFFLINE" for a in anomalies)

def test_spatial_proximity_and_nearby_assets(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers).json()
    mine1_id = mines[0]["id"]

    anomalies = client.get(f"/api/v1/anomalies?mine_id={mine1_id}", headers=headers).json()
    assert len(anomalies) > 0
    target_anomaly = anomalies[0]

    ctx_res = client.get(f"/api/v1/anomalies/{target_anomaly['id']}/context?radius_meters=300", headers=headers)
    assert ctx_res.status_code == 200
    ctx = ctx_res.json()
    assert "coordinates" in ctx
    assert "nearby_cameras" in ctx
    assert "nearby_equipment" in ctx
    assert isinstance(ctx["nearby_cameras"], list)
    for cam in ctx["nearby_cameras"]:
        assert "distance_meters" in cam
        assert "is_simulated" in cam
        assert cam["is_simulated"] == "SIMULATED"

def test_telemetry_idempotency(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    mines = client.get("/api/v1/mines", headers=headers).json()
    sensor = client.get(f"/api/v1/sensors?mine_id={mines[0]['id']}", headers=headers).json()[0]

    payload = {
        "sensor_id": sensor["id"],
        "mine_id": mines[0]["id"],
        "value": 0.33,
        "unit": sensor["unit"],
        "source": "SIMULATED",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    # First call -> Ingested
    res1 = client.post("/api/v1/sensors/readings/ingest", json=payload, headers=headers)
    assert res1.status_code == 201
    
    # Second immediate identical call -> Idempotent duplicate accepted
    res2 = client.post("/api/v1/sensors/readings/ingest", json=payload, headers=headers)
    assert res2.status_code == 201
    assert res2.json()["status"] == "IDEMPOTENT_DUPLICATE_ACCEPTED"

def test_invalid_telemetry_rejected(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Impossible future timestamp
    payload = {
        "sensor_id": 1,
        "value": 0.50,
        "unit": "%",
        "timestamp": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    }
    res = client.post("/api/v1/sensors/readings/ingest", json=payload, headers=headers)
    assert res.status_code == 422
    assert "Impossible future timestamp" in res.json()["detail"]

def test_mine_manager_cannot_access_other_mine_telemetry(client):
    mgr_token = get_token(client, "manager.mine1@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {mgr_token}"}

    admin_token = get_token(client, "admin@trinetra.gov.in")
    admin_mines = client.get("/api/v1/mines", headers={"Authorization": f"Bearer {admin_token}"}).json()
    mine2 = next(m for m in admin_mines if m["code"] == "MINE-SOB-02")

    # Unauthorized summary request
    res = client.get(f"/api/v1/mines/{mine2['id']}/telemetry/summary", headers=headers)
    assert res.status_code == 403

def test_telemetry_summary_endpoint(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}

    mines = client.get("/api/v1/mines", headers=headers).json()
    res = client.get(f"/api/v1/mines/{mines[0]['id']}/telemetry/summary", headers=headers)
    assert res.status_code == 200
    summary = res.json()
    assert summary["total_sensors"] >= 15
    assert "online_sensors" in summary
    assert "critical_sensors" in summary
    assert "active_anomalies" in summary

def test_alerts_lifecycle_acknowledged_and_resolved(client):
    admin_token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {admin_token}"}

    alerts = client.get("/api/v1/alerts", headers=headers).json()
    assert len(alerts) > 0
    target_alert = alerts[0]

    # Acknowledge
    ack_res = client.patch(
        f"/api/v1/alerts/{target_alert['id']}/status",
        json={"status": "ACKNOWLEDGED"},
        headers=headers
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACKNOWLEDGED"

    # Resolve
    res_res = client.patch(
        f"/api/v1/alerts/{target_alert['id']}/status",
        json={"status": "RESOLVED"},
        headers=headers
    )
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"
