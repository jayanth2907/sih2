# TRINETRA: Field Inspector Operational Standard Operating Procedure (SOP)

## 1. Overview & Objective
This document outlines the standard operating procedure for Mine Safety Officers, DGMS Field Inspectors, and Mine Managers operating mobile devices in underground or opencast coal mine environments using TRINETRA Phase 7.

---

## 2. Field Workflow Stages

```
   [1. PRE-SHIFT DISPATCH]
              ↓
  Inspect Assigned Work & Prioritization via Phase 5 Predictive Risk (30m Horizon)
              ↓
   [2. ENTERING MINE SITE]
              ↓
  Network drops → Offline Mode automatically activates. Local Queue becomes authoritative.
              ↓
   [3. EXECUTING INSPECTIONS & CHECKLISTS]
              ↓
  - Verify statutory checklist (Atmospheric Methane/CO, Strata, Ventilation, PPE).
  - Record observations with severity classification (LOW / MEDIUM / HIGH / CRITICAL).
              ↓
   [4. EVIDENCE & GEOLOCATION CAPTURE]
              ↓
  - Capture photo evidence; client generates SHA-256 integrity hash.
  - Geotag with GPS coordinates (latitude, longitude, ±accuracy).
              ↓
   [5. OFFLINE STORAGE & SAFETY]
              ↓
  - All drafts, findings, and evidence saved to durable local persistence.
  - Safe across battery depletion, device reboots, and app closures.
              ↓
   [6. RESURFACING & RECONNECTING]
              ↓
  - Network connectivity detected.
  - Tap [SYNC NOW] or allow automatic background sync batching.
              ↓
   [7. GOVERNANCE LEDGER & DIGITAL TWIN]
              ↓
  - Server confirms sync with authoritative audit event.
  - Mine Managers can immediately select [FOCUS IN 3D] to navigate spatial digital twin.
```

---

## 3. Step-by-Step Operator Guide

### 3.1 Pre-Shift Preparation (Online)
1. Log in to TRINETRA using your authorized DGMS or Mine Inspector credentials.
2. Select your assigned mine (e.g. `MINE-BDS-04 - Bhadradri Deep Shaft 04`).
3. Navigate to **Field Operations** tab.
4. Review assigned inspections and observe **Zone Predictive Risk Scores** (e.g., Zone B showing Predicted Risk 82 CRITICAL within 30 min). Prioritize high-risk zones first.
5. Tap **Start / Open** to load the statutory checklist and cache the inspection locally.

### 3.2 Operating Underground / In Non-Network Zones (Offline)
1. The status pill will display **OFFLINE (Local Queue Active)** in amber/red.
2. Complete each checklist item by toggling **PASS**, **FLAG**, or **FAIL**.
3. In the observation card:
   - Enter Observation Title and Description.
   - Select Category (Ventilation, Strata, Atmosphere, PPE, Machinery).
   - Select Severity Level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - Capture a photo using the device camera. The client automatically computes the **SHA-256 integrity hash**.
   - Tap **Save Observation to Local Queue**.
4. If a severe safety condition is detected, navigate to **Report Incident** and log an emergency hazard.

### 3.3 Returning to Surface & Synchronization (Online)
1. As network connectivity resumes, the status pill updates to **ONLINE**.
2. Tap **Sync Now** or execute sync from the **Sync Ledger** tab.
3. Observe real-time progress:
   - **ACCEPTED**: Record saved to server and linked to DGMS compliance ledger.
   - **ALREADY_PROCESSED**: Operation was previously received; deduplicated without duplicate creation.
   - **CONFLICT**: Server version differs; operator is prompted to review before overwriting.
4. The synchronized observations and incidents are immediately accessible on the web portal, linked to the **3D Spatial Digital Twin**, and queryable via the **AI Governance Copilot**.
