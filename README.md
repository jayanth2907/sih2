# TRINETRA (त्रिनेत्र)
### AI-Based Smart Governance & Compliance Monitoring System for Coal Mines
*Smart India Hackathon (SIH) — Phase 2: IoT Telemetry, Anomaly Detection & Operational Event Intelligence*

---

## 🌟 Executive Overview
**TRINETRA** is an enterprise-grade AI governance and operational compliance monitoring platform engineered for the Indian coal mining industry. The system provides real-time telemetry ingestion, deterministic anomaly detection, statutory compliance tracking under the **Coal Mines Regulations (CMR) 2017**, explainable multi-factor risk intelligence, an immutable cryptographic audit trail, and the spatial foundation for a future **3D Digital Mine Twin**.

---

## 🚀 Phase 2 Telemetry & Anomaly Pipeline

```
SENSOR NODE
  ↓
TELEMETRY INGESTION & IDEMPOTENCY FILTER
  ↓
ANOMALY DETECTION (Thresholds / Sudden Spikes / Drops / Silence)
  ↓
SPATIAL PROXIMITY DISCOVERY (3D Euclidean Distance to Cameras & Machinery)
  ↓
RISK EVALUATION & SILENCE-TO-RISK ANALYSIS
  ↓
ALERT ENGINE (Deduplication & Cooldown)
  ↓
INCIDENT AUTO-CREATION (For Critical Breaches)
  ↓
WEBSOCKET BROADCAST & SHA-256 AUDIT LOGGING
```

---

## 🔐 Role-Based Access Control (RBAC)

TRINETRA enforces strict backend-authorized data scoping across 6 distinct personas:

| Role | Scope | Demo Email | Password |
|---|---|---|---|
| **System Admin** | All Mines (Global) | `admin@trinetra.gov.in` | `Trinetra@2026` |
| **Mine Manager** | Bharat Deep Shaft 4 | `manager.mine1@trinetra.gov.in` | `Trinetra@2026` |
| **Mine Safety Officer** | Bharat Deep Shaft 4 | `safety.mine1@trinetra.gov.in` | `Trinetra@2026` |
| **Mine Manager** | Singrauli OpenCast | `manager.mine2@trinetra.gov.in` | `Trinetra@2026` |
| **Field Inspector** | Assigned Mines (DGMS) | `inspector.dgms@trinetra.gov.in` | `Trinetra@2026` |
| **Regulator** | Cross-Mine (Audit Mode) | `regulator@dgms.gov.in` | `Trinetra@2026` |

---

## 🕹 Simulation Scenarios Supported

The portal includes a deterministic simulation control center supporting:
1. **NORMAL**: Baseline safe readings across all sensors.
2. **METHANE_SPIKE**: Gas concentration surge exceeding critical threshold ($>1.25\%$).
3. **CO_SPIKE**: Carbon monoxide surge indicating early spontaneous heating.
4. **VENTILATION_DROP**: Sudden airflow drop in return airways ($<0.5$ m/s).
5. **SENSOR_OFFLINE**: Telemetry silence triggering Silence-to-Risk alerts.
6. **MULTI_SENSOR_ANOMALY**: Simultaneous gas surge and ventilation stall.
7. **RECOVERING**: Return of readings to normal operating limits.

---

## 🚀 Local Quickstart Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # or 'source venv/bin/activate' on Linux/macOS
pip install -r requirements.txt
python -m app.db.seed_data
pytest tests/ -v
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive OpenAPI Docs: **`http://localhost:8000/docs`**

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Frontend Application Portal: **`http://localhost:5173`**

---

## 🧪 Testing Summary

Execute the complete test suite:
```bash
pytest backend/tests/ -v
```
**27 automated unit & integration tests passing (100%):**
- Password hashing & JWT generation
- Health probe & database probe
- Multi-mine scoping & authorization boundaries
- Normal telemetry validation & impossible timestamp rejection
- Warning and Critical threshold breach detection
- Anomaly event generation and state progression
- Critical incident auto-creation and deduplication control
- Sensor recovery sequence handling
- Sensor silence / offline detection
- 3D spatial proximity calculation for cameras and machinery
- Telemetry message idempotency
- Cryptographic SHA-256 hash-chain audit generation

---

## 🔮 Recommended Next Phase (Phase 3)
1. **Three.js / React Three Fiber 3D Digital Twin Viewer**: Interactive WebGL rendering of mine shafts, galleries, and real-time color-coded sensor beacons.
2. **Live MQTT Broker Integration**: Production MQTT subscriber worker for IoT edge gateways.
3. **AI Document & Inspection Intelligence**: OCR and automated DGMS regulation clause matching on uploaded statutory permits.
