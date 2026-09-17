# TRINETRA (त्रिनेत्र) — SIH Demonstration Playbook & Scenario Catalog

## 1. Executive Summary & Demo Strategy

TRINETRA's Phase 9 Demonstration Engine guarantees **100% deterministic, repeatable, and resilient judging flows**. It eliminates all fragility associated with live sensors, random data drift, internet timeouts, or manual data entry during live evaluation.

### Core Principles for Presenters
1. **Never Claim Live Government Access Without Credentials:** External adapters (CMSMS, PARIVESH, DGMS) operate in **`SIMULATED / DEMO`** mode. Presenters must point to the badge and highlight the sovereign architecture rather than pretending live ministry connectivity.
2. **Never Claim Automatic Legal Conviction or Autonomous Certification:** TRINETRA alerts, prioritizes, predicts, and dispatches statutory tasks for **human-in-the-loop verification**.
3. **Never Claim 100% Deterministic Future Forecasting:** Machine learning predictions represent **calibrated 30-minute escalation probabilities** based on chronological holdout models.

---

## 2. 5-Minute Recommended Judging Flow (Primary Technical Showcase)

| Time | Stage | Action in Demo Control Center | Key Presenter Script / Judge Takeaway |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:30** | **Baseline State** | Select **Scenario 1: Normal Mine Operations**; verify Pre-Flight matrix is `READY`. | *"TRINETRA starts with a clean baseline. Sensors in Seam 2 Longwall report nominal 0.35% CH4, low risk score (18.5), and all statutory safety parameters are green."* |
| **00:30 - 01:45** | **Gas Surge Ingestion & Anomaly** | Switch to **Scenario 2: Gas Escalation** $\rightarrow$ Click **[NEXT EVENT]** twice. | *"A methane surge occurs at SN-BDS04-CH4-101 (1.88%, exceeding 1.25% DGMS critical limit). Anomaly detection engine triggers priority alert and statistical outlier event."* |
| **01:45 - 02:45** | **Predictive AI Escalation** | Click **[NEXT EVENT]** (Step 4: Predictive Risk Spike). | *"Our HistGradientBoosting model (risk-escalation-v1.0) forecasts an 88.4% escalation probability over the next 30 minutes. Notice the transparent signal attributions highlighting rate-of-rise and air velocity drop."* |
| **02:45 - 03:30** | **3D Digital Twin Hotspot** | Click **[Focus in 3D Twin]** / Step 5. | *"The 3D Digital Twin bounds the risk envelope at (145.0, 470.0, -318.0) in Seam 2 East Face, displaying adjacent CCTV feeds and cutting machinery."* |
| **03:30 - 04:15** | **AI Copilot Grounded Reasoning** | Click **[Ask Copilot]** / Step 6. | *"Copilot provides evidence-grounded root cause explanations citing CMR 2017 Reg 153 without LLM hallucination."* |
| **04:15 - 05:00** | **Governance & Audit Trail** | Click **[NEXT EVENT]** (Step 7) $\rightarrow$ Show **Cryptographic Audit Ledger**. | *"An urgent ventilation verification task is dispatched to the Safety Officer. Every single transaction is anchored in our SHA-256 hash-chained immutable audit ledger."* |

---

## 3. 10-Minute Extended Deep-Dive Flow

| Time | Section | Scenario Triggered | Judge Highlight |
| :--- | :--- | :--- | :--- |
| **05:00 - 06:15** | **Statutory SLA Breach** | **Scenario 3: Compliance SLA Breach** | Shows DGMS violation notice, 24-hr statutory countdown timer, overdue status, and automated Directorate Level 2 escalation. |
| **06:15 - 07:15** | **Sovereign GIS Ingestion** | **Scenario 5: CMSMS External Signal** | Ingests citizen illegal mining report via Ministry of Coal CMSMS adapter, verifies Haversine boundary matching within 150m lease buffer, and enriches contextual risk. |
| **07:15 - 08:30** | **Offline-First Field Mobile** | **Scenario 6: Offline Field Inspection** | Simulates disconnected tablet, local indexed queue, GPS proof-of-presence, reconnection, and idempotent zero-conflict server sync. |
| **08:30 - 09:15** | **Fault Resilience** | **Scenario 7: CMSMS Outage** | Simulates external API 504 timeouts $\rightarrow$ Circuit Breaker trips to `OPEN / DEGRADED` $\rightarrow$ TRINETRA core telemetry and predictive intelligence remain 100% operational. |
| **09:15 - 10:00** | **Zero-Trust Security** | **Scenario 8: Cross-Mine Attack** | Demonstrates Mine Manager A attempting access to Mine B resources $\rightarrow$ intercepted with `HTTP 403 Forbidden` and security audit log. |

---

## 4. Scenario Catalog & Step Specifications

### Scenario 1 — NORMAL_OPERATIONS
- **Target Mine:** Bharat Deep Shaft 4 (`MINE-BDS-04`)
- **Step 1 (`BASELINE_TELEMETRY`):** Ingests $CH_4 = 0.35\%$, $CO = 8.5\text{ ppm}$, $v = 2.8\text{ m/s}$.
- **Step 2 (`STABLE_PREDICTIVE_RISK`):** Evaluates forward risk; confirms nominal probability $< 0.15$.

### Scenario 2 — GAS_ESCALATION (Primary Judge Demo)
- **Target Mine:** Bharat Deep Shaft 4 (`MINE-BDS-04`), Zone `ZN-EAST-LW102`
- **Step 1 (`NORMAL_BASELINE`):** Steady-state $CH_4 = 0.35\%$.
- **Step 2 (`GAS_SURGE_INGESTION`):** Ingests $CH_4 = 1.88\%$ exceeding critical statutory limit.
- **Step 3 (`ANOMALY_ALERT_ACTIVE`):** Creates `AnomalyEvent` and active `Alert` in `UNREAD` state.
- **Step 4 (`PREDICTIVE_RISK_SPIKE`):** Evaluates ML model; probability jumps to $> 85\%$ with directional factor breakdown.
- **Step 5 (`HOTSPOT_3D_FOCUS`):** Generates 3D spatial coordinates $(145.0, 470.0, -318.0)$ and 45m risk envelope.
- **Step 6 (`COPILOT_GROUNDED_EXPLANATION`):** Formulates grounded citation summary citing CMR 2017 Reg 153.
- **Step 7 (`GOVERNANCE_TASK_AUDIT`):** Creates urgent `GovernanceTask` for Safety Officer and extends SHA-256 audit chain.

### Scenario 3 — COMPLIANCE_SLA_BREACH
- **Target Mine:** Bharat Deep Shaft 4 (`MINE-BDS-04`)
- **Step 1 (`INSPECTION_RECORDED`):** Logs DGMS inspection `INSP-DGMS-2026-088`.
- **Step 2 (`VIOLATION_ISSUED`):** Issues statutory violation notice for dust suppression deficit.
- **Step 3 (`CORRECTIVE_ACTION_ASSIGNED`):** Assigns remediation with 24-hour statutory deadline.
- **Step 4 (`SLA_BREACH_ESCALATION`):** SLA expires; escalates to Directorate Level 2.
- **Step 5 (`AUDIT_TRAIL_CHAINED`):** Verifies cryptographic ledger entry.

### Scenario 4 — ENVIRONMENTAL_DEVIATION
- **Target Mine:** Singrauli OpenCast Basin (`MINE-SOB-02`)
- **Step 1 (`ENV_BASELINE`):** PM10 at $42.5\,\mu\text{g/m}^3$.
- **Step 2 (`DUST_SPIKE_DEVIATION`):** Particulate spike to $168.0\,\mu\text{g/m}^3$ (flagged `REVIEW REQUIRED`).
- **Step 3 (`MITIGATION_DISPATCH`):** Mobile water mist cannon dispatched.
- **Step 4 (`ENV_AUDIT_LOG`):** Environmental observation chained in audit trail.

### Scenario 5 — CMSMS_EXTERNAL_SIGNAL
- **Target Mine:** Bharat Deep Shaft 4 (`MINE-BDS-04`)
- **Step 1 (`EXTERNAL_REPORT_INGESTED`):** Ingests simulated report `CMSMS-DEMO-9021` with SHA-256 payload hash.
- **Step 2 (`GEOFENCE_MINE_MATCH`):** Matches location within 120m of lease boundary.
- **Step 3 (`CONTEXTUAL_RISK_ENRICHMENT`):** Contextual risk signal created.
- **Step 4 (`FIELD_VERIFICATION_DISPATCH`):** Nodal officer verification task scheduled.

### Scenario 6 — OFFLINE_FIELD_INSPECTION
- **Target Mine:** Bharat Deep Shaft 4 (`MINE-BDS-04`)
- **Step 1 (`SIMULATE_OFFLINE_MODE`):** Client network toggled to disconnected mode.
- **Step 2 (`RECORD_OFFLINE_INSPECTION`):** Inspection and photo evidence hashed in client indexed queue.
- **Step 3 (`NETWORK_RECONNECTED`):** Connection restored.
- **Step 4 (`IDEMPOTENT_SERVER_PERSISTENCE`):** Replayed to server; 0 duplicates, 0 conflicts.

### Scenario 7 — CMSMS_OUTAGE
- **Target Mine:** Bharat Deep Shaft 4 (`MINE-BDS-04`)
- **Step 1 (`INJECT_SYNC_FAILURES`):** 3 consecutive 504 Gateway Timeouts simulated.
- **Step 2 (`CIRCUIT_BREAKER_TRIPPED`):** Circuit Breaker transitions to `OPEN`; status marked `DEGRADED`.
- **Step 3 (`CORE_PLATFORM_OPERATIONAL`):** Proves TRINETRA core APIs respond with 100% uptime.

### Scenario 8 — CROSS_MINE_ATTACK
- **Target Mine:** Mine 1 (`MINE-BDS-04`) attempting Mine 3 (`MINE-RS-07`)
- **Step 1 (`AUTHENTICATE_MINE1_MANAGER`):** Login as Manager scoped to Mine 1.
- **Step 2 (`ATTEMPT_UNAUTHORIZED_MINE3_ACCESS`):** Submit request targeting Mine 3 resources.
- **Step 3 (`DEFENSE_BLOCKED_403`):** Intercepted by backend with `403 Forbidden` and security audit alert.

---

## 5. Claims That Must NOT Be Made to Judges

| ❌ Defective / Prohibited Claim | ✅ Technically Accurate & Defensible TRINETRA Claim |
| :--- | :--- |
| *"TRINETRA has live real-time API connectivity to the Ministry of Coal's private CMSMS database."* | *"TRINETRA features an extensible Integration Gateway with a simulated CMSMS adapter adhering to the Ministry's published GIS workflow."* |
| *"The AI model predicts disasters with 100% precision."* | *"TRINETRA computes forward 30-minute calibrated escalation probabilities using a chronological HistGradientBoosting pipeline."* |
| *"The system automatically convicts violators and cancels mining leases."* | *"TRINETRA provides automated risk prioritization and dispatches statutory tasks for authorized human-in-the-loop verification."* |
| *"Field officers never need connectivity because we built a separate offline app."* | *"TRINETRA incorporates an offline-first indexed queue architecture with cryptographic GPS tamper checks and idempotent server replay."* |

---

## 6. One-Click Recovery & Reset Runbook

If a presenter needs to reset the demonstration state during a judging round:
1. Navigate to **Demo Control Center** (`/demo-control`).
2. Click **[RESET ALL DEMO DATA]** (top right corner).
3. The system clears runtime scenario step pointers, resets all 3 Circuit Breakers to `CLOSED`, clears ephemeral telemetry triggers, and returns the pre-flight check to `READY` within $< 500\text{ms}$.
