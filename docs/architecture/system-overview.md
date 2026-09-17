# TRINETRA System Architecture Overview

**Project:** AI-Based Smart Governance & Compliance Monitoring System for Coal Mines  
**Competition:** Smart India Hackathon (SIH)  
**Version:** Phase 1 Foundation (1.0.0-phase1)

---

## 1. High-Level Vision & Data Flow

TRINETRA transforms fragmented coal mine monitoring data into a single, cohesive governance engine:

```
DATA (Sensors / CCTV / Field Inspections / Reports)
  │
  ▼
MONITORING & TELEMETRY INGESTION (TelemetryProvider: Simulated / MQTT / SCADA)
  │
  ▼
ANOMALY DETECTION & SILENCE-TO-RISK ANALYSIS
  │
  ▼
EXPLAINABLE RISK SCORING (Rule-Based + ML + Reporting Drift)
  │
  ▼
GOVERNANCE & INCIDENT LIFECYCLE
  ├── Incident: Operational / Hazard Response (OPEN -> TRIAGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> VERIFIED -> CLOSED)
  └── Violation: DGMS Statutory Compliance (CMR 2017 -> Remedial Action -> Penalty -> Rectification)
  │
  ▼
IMMUTABLE AUDIT TRAIL (Cryptographic SHA-256 Hash Chain)
  │
  ▼
DIGITAL MINE TWIN (3D Spatial Representation x, y, z)
```

---

## 2. Multi-Mine Hierarchy & Spatial Model

Every operational and safety entity in TRINETRA is structurally anchored to a strict spatial hierarchy:

```
Mine (Lat, Lon, Elevation, Type: Underground / Opencast)
  └── MineLevel (Depth, Elevation, Sequence Order)
        └── MineZone (Origin X, Y, Z, Bounding Width/Length/Height, Risk Category)
              ├── Sensor (X, Y, Z, Warning & Critical Thresholds, Telemetry Readings)
              ├── Camera (X, Y, Z, Yaw, Pitch, FOV, Stream URL, Simulation Flag)
              ├── Equipment (X, Y, Z, Machinery Category, Maintenance Schedule)
              ├── Safety Incidents (X, Y, Z, SLA Hours, Severity, State Transitions)
              └── Compliance Violations (DGMS Clause, Remedial Deadline, Penalties)
```

---

## 3. Strict Role-Based Access Control (RBAC) & Scoping

| Role | Scope | Key Capabilities |
|---|---|---|
| **SYSTEM_ADMIN** | Cross-Mine (System-wide) | Full administrative authority across all mines, user provisioning, role assignments, system-wide risk intelligence, global audit logs. |
| **MINE_MANAGER** | Assigned Mine(s) Only | Operational oversight, incident triage/assignment, SLA monitoring, sensor/camera management for assigned mines. |
| **MINE_SAFETY_OFFICER** | Assigned Mine(s) Only | Safety protocol enforcement, sensor threshold monitoring, incident logging, corrective action verification. |
| **FIELD_INSPECTOR** | Assigned Mine(s) Only | Field observation logging, evidence attachment, DGMS statutory violation citations. |
| **CONTRACTOR_MANAGER** | Workforce Scope | Contractor safety compliance, statutory workforce certifications. |
| **REGULATOR** | Cross-Mine (Read-Heavy) | Statutory oversight, audit trail verification, DGMS compliance dashboards. |

---

## 4. Telemetry Provider & Simulated IoT Architecture

TRINETRA incorporates a clean `TelemetryProvider` design pattern. Telemetry source is explicitly tracked:
- `SIMULATED`: Default mode for hackathon demonstrations and local development.
- `MQTT`: Dedicated message broker integration for real IoT edge gateways.
- `SCADA`: Industrial automation PLC/OPC-UA data exchange.
- `API` / `EXTERNAL`: Third-party vendor sensor ingestion.

---

## 5. Incident vs. Violation Distinction

- **Incident**: An operational or safety hazard requiring immediate operational response (e.g., localized methane surge, roof convergence, conveyor fire risk). Follows a strict state machine with SLA tracking.
- **Violation**: A statutory regulatory breach under the Coal Mines Regulations (CMR) 2017 (e.g., CMR 152 dust barriers, CMR 153 ventilation limits). Involves statutory deadlines, financial penalties, and formal corrective action plans.

---

## 6. Cryptographic Audit Trail

Every state change, user login, sensor anomaly, and incident transition is recorded in an immutable ledger with SHA-256 hash chaining:
$$\text{Current Hash} = \text{SHA256}(\text{PrevHash} : \text{ActorID} : \text{Action} : \text{ResourceType} : \text{ResourceID} : \text{Timestamp} : \text{AfterState})$$
