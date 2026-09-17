# TRINETRA External Integrations Architecture

## 1. Executive Summary & Design Principles

TRINETRA (त्रिनेत्र) integrates with sovereign mining and environmental monitoring platforms across India's mineral governance ecosystem. The core tenet of Phase 8 integration architecture is **Architectural Integrity & Zero-Simulation Pretense**:
- TRINETRA distinguishes **`SIMULATED` / `DEMO`** data from **`LIVE`** authenticated streams.
- TRINETRA never claims direct government connectivity without cryptographically verified or authorized credentials.
- External payloads are strictly isolated via the **Adapter Pattern** and **Integration Gateway** and never directly mutate core entity records without validation, normalization, and cryptographic audit hashing.

---

## 2. Integration Architecture

```
[ External Government Systems / Sensors ]
   │
   ├─► CMSMS / Khanan Prahari (Ministry of Coal)
   ├─► PARIVESH 2.0 (MoEFCC Environmental Clearances)
   ├─► DGMS (Directorate General of Mines Safety)
   └─► SCADA / IoT Telemetry Streams
         │
         ▼
┌────────────────────────────────────────────────────────┐
│               INTEGRATION GATEWAY                      │
├────────────────────────────────────────────────────────┤
│ 1. Circuit Breaker (CLOSED / OPEN / HALF_OPEN)         │
│ 2. Schema Validation (Pydantic / Strict Typing)        │
│ 3. Normalization (Canonical Internal Model)            │
│ 4. Provenance Metadata Enrichment                      │
│ 5. SHA-256 Payload Integrity Hashing                   │
│ 6. Idempotent Deduplication (source_system + record_id)│
│ 7. Spatial Mine/Zone Geofence Matching                 │
└────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│            TRINETRA CORE PLATFORM SERVICES             │
├────────────────────────────────────────────────────────┤
│ ├─► SHA-256 Hash-Chained Audit Ledger (Tamper-evident) │
│ ├─► Contextual Risk Enrichment (Predictive AI)         │
│ ├─► 3D Digital Mine Operational Twin (Spatial View)    │
│ └─► AI Governance Copilot (Multilingual RAG Engine)    │
└────────────────────────────────────────────────────────┘
```

---

## 3. Adapters & Governance Boundaries

### 3.1 CMSMS / Khanan Prahari Adapter (`CMSMSAdapter`)
- **Ecosystem Authority:** Ministry of Coal, Govt. of India.
- **Workflow Scope:** Citizen reporting of unauthorized extraction and GIS geofence breach tracking.
- **Boundary Guarantee:** External reports enter TRINETRA as `UNVERIFIED` external activity records. They generate **Contextual Risk Signals** but do **NOT** automatically issue statutory penalties or close leases without authorized Nodal Officer review.
- **Provenance Tags:**
  - `source_system`: `CMSMS`
  - `source_mode`: `SIMULATED` (or `LIVE` when authorized API keys are provided)
  - `adapter_version`: `cmsms-v1.2`

### 3.2 PARIVESH Adapter (`PARIVESHAdapter`)
- **Ecosystem Authority:** Ministry of Environment, Forest and Climate Change (MoEFCC).
- **Workflow Scope:** Environmental Clearances (EC), Forest Clearances (FC), and ambient air/water compliance limits.
- **Boundary Guarantee:** Ingests geospatial lease buffer polygons and emission caps. Validates coordinate reference systems (WGS84) before matching against mine lease boundaries.
- **Provenance Tags:**
  - `source_system`: `PARIVESH`
  - `source_mode`: `SIMULATED`
  - `adapter_version`: `parivesh-v2.0`

### 3.3 DGMS Adapter (`DGMSAdapter`)
- **Ecosystem Authority:** Directorate General of Mines Safety.
- **Workflow Scope:** Mining safety circulars, statutory hazard notices, and safety audit recommendations.
- **Boundary Guarantee:** Safety circulars are mapped to mine hazard risk matrices without overriding mine-level statutory compliance ledgers until confirmed by the Safety Officer.
- **Provenance Tags:**
  - `source_system`: `DGMS`
  - `source_mode`: `SIMULATED`
  - `adapter_version`: `dgms-v1.0`

---

## 4. Circuit Breaker & Resilience

To ensure that unstable or rate-limited third-party endpoints do not degrade TRINETRA's core monitoring and telemetry pipelines, each adapter is wrapped by an autonomous **Circuit Breaker**:

- **Failure Threshold:** 3 consecutive failures transitions state from `CLOSED` to `OPEN`.
- **Recovery Timeout:** 30 seconds before testing `HALF_OPEN` state.
- **Graceful Degradation:** When an adapter is `OPEN`, calls return an immediate fallback (`HTTP 503 / DEGRADED`) without blocking worker threads or thread pools. Core dashboard, spatial twin, and compliance ledgers remain 100% operational.

---

## 5. Data Provenance & Cryptographic Audit Integration

Every ingested external record creates an immutable entry in the `ExternalEventLog` and the primary `AuditEvent` ledger:
1. **Idempotency Key:** Composite unique index on `(source_system, source_record_id)` prevents duplicate records upon automated replay or webhook retries.
2. **Payload Hash:** SHA-256 hex digest of the raw external payload guarantees non-repudiation.
3. **Audit Chaining:** Each external event is chained to previous ledger events using cryptographic SHA-256 hash chaining (`previous_hash` + event payload).
