# TRINETRA (त्रिनेत्र) — Governance & Compliance Architecture (Phase 4)

## Overview
Phase 4 completes the governance, compliance, and regulatory lifecycle for TRINETRA, transforming the platform into a unified AI-powered smart governance and statutory monitoring system for Indian coal mines.

```
       SENSOR / FIELD / OBSERVATION
                   ↓
            DATA INGESTION
                   ↓
         AI/RULE INTELLIGENCE
                   ↓
              GOVERNANCE RISK
                   ↓
             GOVERNANCE EVENT
                   ↓
                  ALERT
                   ↓
                ASSIGNMENT
                   ↓
            CORRECTIVE ACTION
                   ↓
               APPROVAL
                   ↓
              VERIFICATION
                   ↓
                CLOSURE
                   ↓
             SHA-256 AUDIT
```

---

## 1. Production Governance & Variance Intelligence
- **Entity**: `ProductionReport`
- **Deviation Engine**: Automatically calculates output variance quantity and percentage ($\text{Variance} = \text{Actual} - \text{Planned}$).
- **Automated Governance Review**: If output drops $\ge 15\%$ below target, TRINETRA flags the record as `DEVIATION_REVIEW_REQUIRED` and automatically spawns a `GovernanceTask` assigned to the mine manager for operational enquiry.

---

## 2. Workforce Roster & Shift Attendance
- **Entities**: `Worker`, `Shift`, `AttendanceRecord`
- **Multi-Shift Muster Support**: Shift A (06:00 - 14:00), Shift B (14:00 - 22:00), Shift C (22:00 - 06:00).
- **Muster Roll Tracking**: Scoped strictly by mine isolation with compliance percentages and contractor staffing quotas.
- **Credibility Standard**: Clearly demarcated as simulated manual demo rosters without biometric hardware falsification.

---

## 3. Contractor Dossiers & SLA Governance
- **Entities**: `Contractor`, `Contract`, `ContractRequirement`
- **Expiry Intelligence**: Tracks contract end dates, automatically escalating contracts expiring within 30 days (`EXPIRING_SOON`) and flagging overdue safety compliance certifications.

---

## 4. Atmospheric & Environmental Compliance
- **Entities**: `EnvironmentalRule`, `EnvironmentalObservation`
- **DGMS & CPCB Parameter Thresholds**: Methane ($\text{CH}_4 \le 0.75\%$), Carbon Monoxide ($\text{CO} \le 50\text{ PPM}$), Respirable Dust ($\text{PM}_{10} \le 3.0\text{ mg/m}^3$), Mine Temperature ($\le 33.5^\circ\text{C}$).
- **Spatial 3D Twin Connection**: Each environmental observation with coordinates provides direct **"FOCUS IN 3D"** deep-linking into the Three.js digital mine twin.

---

## 5. Grievance Redressal & SLA Escalation
- **Entity**: `Grievance`
- **Categories**: Safety, Environmental, Labour, Contractor, Facilities, Other.
- **SLA Engine**: Calculates server-side deadlines with SLA escalation states (`ON_TRACK`, `DUE_SOON`, `BREACHED`, `RESOLVED`).
- **Escalation Hierarchy**: L0 (Standard) $\rightarrow$ L1 (Safety Officer) $\rightarrow$ L2 (Mine Manager) $\rightarrow$ L3 (Regulatory Board).

---

## 6. Digital Approvals & Separation of Duties
- **Entities**: `ApprovalRequest`, `ApprovalAction`
- **Four-Eyes Principle**: Requesters are strictly prohibited from approving their own submissions (`HTTP 422 Separation of Duties Violation`).
- **Audit Stamp**: Every digital approval or rejection writes an immutable hash-chained record to the SHA-256 audit ledger.

---

## 7. Statutory Report Generation Engine (ReportLab)
- **Entities**: `RegulatoryReport`, `ReportVersion`
- **Server-Side PDF Streaming**: Generates professional PDF dossiers (`DGMS Safety Summary`, `Environmental Compliance Report`, `Production Variance Record`, `Mine Governance Master Audit`).
- **Cryptographic Seal**: Embeds a unique SHA-256 audit hash and watermarking in the document footer.

---

## 8. Backend RBAC & Multi-Mine Isolation
Every endpoint enforces:
1. Valid JWT Authentication
2. Role-Based Access Control (`SYSTEM_ADMIN`, `MINE_MANAGER`, `MINE_SAFETY_OFFICER`, `FIELD_INSPECTOR`, `CONTRACTOR_MANAGER`, `REGULATOR`)
3. Tenant mine boundary isolation via `require_mine_access`
