# TRINETRA: Phase 7 — Offline-First Field Operations & Mobile Intelligence Architecture

## 1. Executive Summary & Philosophy
Underground and open-cast coal mining environments are characterised by severe RF attenuation, deep strata obstruction, and frequent network blackouts. In TRINETRA, **Offline-First** is not merely UI page caching; it is an architectural commitment that **all field inspection workflows continue uninterrupted without connectivity**, with full local data persistence, client-side cryptographic hashing, durable sync queues, and idempotent reconciliation when network connectivity returns.

```mermaid
flowchart TD
    subgraph MobileFieldDevice["Mobile Field Device (Underground / Open-Cast)"]
        UI["Field Operations UI (EN/HI/TE)"]
        LocalStore[("Local IndexedDB/Storage Cache (Mine-Scoped)")]
        SyncQueue[("Durable Sync Queue (Survives Restarts)")]
        GPS["GPS / Strata Geolocation Engine"]
        Crypto["SHA-256 Evidence Hasher"]
    end

    subgraph TRINETRAServer["TRINETRA Server & Governance Backend"]
        AuthGate["RBAC & Multi-Tenant Mine Isolation Guard"]
        SyncProcessor["Idempotent Sync Batch Processor (/api/v1/mobile/sync)"]
        StateValidator["Workflow & State Transition Validator"]
        AuditLedger["Authoritative SHA-256 Immutable Audit Ledger"]
        PredictiveRisk["Phase 5 Predictive Risk Engine (30m Horizon)"]
        DigitalTwin["Phase 3 3D Spatial Digital Twin"]
        Copilot["Phase 6 Multilingual AI Copilot"]
    end

    UI -->|1. Record Findings & Evidence| LocalStore
    Crypto -->|2. Compute SHA-256| LocalStore
    GPS -->|3. Geotag (Lat/Lng/Accuracy)| LocalStore
    LocalStore -->|4. Enqueue Op with UUID| SyncQueue
    SyncQueue -->|5. Batch Sync on Reconnect| AuthGate
    AuthGate --> SyncProcessor
    SyncProcessor --> StateValidator
    StateValidator --> AuditLedger
    AuditLedger --> DigitalTwin
    AuditLedger --> PredictiveRisk
    AuditLedger --> Copilot
```

---

## 2. Core Architectural Pillars

### 2.1 Durable Sync Queue & Client-Generated UUIDs
Every field operation (Inspection updates, observations, incident reports, photos, and checklists) is assigned a client-side UUID `operation_id` (e.g. `op-insp-1741872900000-a1b2c3`).
- Operations are written to the durable queue before any network attempt.
- The queue survives device restarts, tab closures, and power loss.
- Queue statuses: `PENDING`, `SYNCING`, `SYNCED`, `FAILED`, `CONFLICT`.

### 2.2 Idempotent Server Reconciliation
When the device reconnects and submits a batch to `/api/v1/mobile/sync`:
1. The server checks the `field_sync_logs` table for each `operation_id`.
2. If `operation_id` has already been successfully processed, the server returns `status="ALREADY_PROCESSED"` with the existing `server_id` without creating duplicate records.
3. If new, the server validates multi-tenant mine isolation, inspector role assignment, and workflow state transitions before writing to PostgreSQL and the SHA-256 audit ledger.

### 2.3 Partial Sync Failure & Fault Tolerance
A batch containing multiple operations is executed atomically per operation. If 8 succeed and 2 encounter validation or conflict errors:
- The 8 successful operations are committed, returning `ACCEPTED` with server IDs.
- The 2 failing operations return `REJECTED` or `CONFLICT` with explanatory error messages.
- The client retains only the failed/conflict items in the queue for inspector review and retry.

### 2.4 Evidence Cryptographic Integrity & SHA-256 Hashing
Field photographs and documents are hashed on-device using SHA-256 (`window.crypto.subtle.digest` in browser / native crypto on mobile) prior to synchronization:
- The hash, device timestamp, geolocation (latitude, longitude, accuracy in meters), and inspector user ID are permanently stored.
- When uploaded, the server verifies that the received file digest matches the client hash, preventing post-capture tampering.

---

## 3. Integration with Prior TRINETRA Phases

| Phase | Subsystem | Phase 7 Field Integration |
|---|---|---|
| **Phase 1** | RBAC & Mine Isolation | Strict enforcement: Field inspectors only receive assigned mine inspections. Cross-mine sync attempts are rejected with `403 Forbidden`. |
| **Phase 2** | Telemetry & Anomalies | Field observations link directly to sensor anomalies and spatial proximity coordinates. |
| **Phase 3** | 3D Digital Twin | Synchronized field observations and incidents feature a `[FOCUS IN 3D]` action that shifts the 3D camera to the exact coordinates (`x, y, z`) in the digital twin. |
| **Phase 4** | Statutory Compliance | Inspection checklists enforce DGMS Coal Mines Regulations requirements (Ventilation, Strata, PPE, Escapeways). |
| **Phase 5** | Predictive Risk | Field tasks and assigned inspections display real-time **Current Risk** and **Predicted Risk (30m Horizon)** with top signals (CH4, CO, ventilation velocity) for proactive task prioritization. |
| **Phase 6** | Copilot & Multilingual | Field inspectors can query the AI Copilot in English, Hindi (हिन्दी), or Telugu (తెలుగు) for zone safety guidance. Core checklist and UI translations function 100% offline. |

---

## 4. API Specification

- `GET /api/v1/mobile/inspections/assigned?mine_id={mine_id}`: Fetch active inspections assigned to current inspector.
- `POST /api/v1/mobile/inspections`: Create field inspection.
- `PUT /api/v1/mobile/inspections/{id}`: Update inspection findings, checklist, and severity.
- `POST /api/v1/mobile/evidence`: Record geo-tagged evidence with SHA-256 hash.
- `POST /api/v1/mobile/sync`: Batch idempotent synchronization processor.
- `GET /api/v1/mobile/sync/status?mine_id={mine_id}`: Retrieve sync statistics and server ledger health.
