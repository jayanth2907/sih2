import pytest
from app.core.security import hash_password, verify_password

def test_password_hashing():
    raw = "TrinetraSecret@2026"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_api_health_check(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ONLINE"
    assert data["database"] == "HEALTHY"
    assert "telemetry_source_mode" in data

def test_login_success_admin(client):
    payload = {
        "email": "admin@trinetra.gov.in",
        "password": "Trinetra@2026"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@trinetra.gov.in"
    assert "SYSTEM_ADMIN" in data["user"]["roles"]

def test_login_invalid_password(client):
    payload = {
        "email": "admin@trinetra.gov.in",
        "password": "IncorrectPassword"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

def test_login_nonexistent_user(client):
    payload = {
        "email": "ghost.user@trinetra.gov.in",
        "password": "Trinetra@2026"
    }
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 401

def test_get_current_user_profile(client):
    # First login
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@trinetra.gov.in", "password": "Trinetra@2026"})
    token = login_res.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "admin@trinetra.gov.in"
