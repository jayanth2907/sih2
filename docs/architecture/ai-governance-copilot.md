# TRINETRA AI Governance Copilot & Multilingual Intelligence Architecture

## 1. Architectural Philosophy & Governance Principles

TRINETRA Phase 6 elevates the platform into an **AI-Powered Governance Operating Layer**. The AI Governance Copilot enables authorized statutory personnel (Mine Managers, Safety Officers, DGMS Inspectors, Regulators) to conduct natural-language investigations across verified operational telemetry, forward-looking 30-minute predictive risk models, statutory violations, workforce attendance, and environmental threshold observations.

### Non-Negotiable Tenets

1. **Zero Data Fabrication (Absolute Evidence Grounding)**:
   - The Copilot **never** manufactures telemetry values, safety incidents, or regulatory findings.
   - Every factual assertion is derived from structured payloads retrieved from authorized backend tool executions.

2. **The LLM is Never the Authorization Layer**:
   - The Copilot never directly connects to raw SQL databases, never bypasses FastAPI dependency injection, and never constructs ad-hoc database queries.
   - All tool executions strictly pass through JWT authentication, role verification, and multi-tenant mine isolation checks.

3. **Advisory Role & Human-in-the-Loop**:
   - The Copilot's function is to **detect, explain, synthesize, navigate, and recommend**.
   - The Copilot is strictly prohibited from autonomously issuing punitive statutory violations, modifying risk scores, closing corrective actions, or triggering equipment shutdowns without human authorization.

---

## 2. End-to-End Copilot Execution Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            USER INPUT & INTENT CLASSIFICATION                               │
│   • Natural Language Query (English, Hindi, Telugu)                                         │
│   • Prompt Injection Defense & Sanitization (app.copilot.security.CopilotSecurity)          │
│   • Rate Limiting Check (max 60 queries/min per user)                                       │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            SECURE TOOL REGISTRY & AUTHORIZATION                             │
│   • Allow-listed Tools (get_current_risk, get_predicted_risk, get_violations, etc.)         │
│   • Server-Side RBAC Enforcement & Multi-Tenant Mine Scoping Check                          │
│   • Controlled Backend Tool Invocation via Python Service Functions                         │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              STRUCTURED EVIDENCE RETRIEVAL                                  │
│   • Sensor Readings & Recovery States             • DGMS Violations & Overdue Actions       │
│   • 30-min Forward Predictive Escalation Score    • Shift Muster Attendance Compliance      │
│   • Shift Production Variances                    • Active Workforce Grievances & SLAs      │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                        EVIDENCE COMPOSITION & MULTILINGUAL SYNTHESIS                        │
│   • Gemini LLM Provider (when API key is present)                                           │
│   • Grounded Deterministic Fallback Engine (for zero-external-dependency offline demo)     │
│   • Multilingual Rendering in English, Hindi (हिंदी), and Telugu (తెలుగు)                   │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         ACTION DEEP-LINKS & IMMUTABLE AUDIT LOGGING                         │
│   • One-Click 3D Spatial Fly-To Handshake ([FOCUS IN 3D])                                   │
│   • Governance Task & Violation Deep-Links                                                  │
│   • SHA-256 Hash-Chained Audit Record (AuditEvent: COPILOT_QUERY)                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tool Registry & Permitted Roles Allow-List

| Tool Name | Purpose | Permitted Roles | Parameters |
| :--- | :--- | :--- | :--- |
| `get_mine_summary` | Mine spatial hierarchy, levels, zones, sensors | All Operational Roles | `mine_id` |
| `get_current_risk` | Real-time multi-factor deterministic risk score | All Operational Roles | `mine_id` |
| `get_predicted_risk` | 30-minute forward ML escalation projection | All Operational Roles | `mine_id` |
| `get_active_anomalies` | Recent atmospheric gas/ventilation spikes | All Operational Roles | `mine_id` |
| `get_sensor_status` | Status distribution and threshold breaches | All Operational Roles | `mine_id` |
| `get_incidents` | Active safety incidents and spatial coordinates | All Operational Roles | `mine_id` |
| `get_violations` | Open DGMS statutory rule violations | All Operational Roles | `mine_id` |
| `get_corrective_actions` | Overdue and pending safety corrective actions | All Operational Roles | `mine_id` |
| `get_environmental_observations` | Dust PM10, CH4, CO, and air velocity readings | All Operational Roles | `mine_id` |
| `get_production_reports` | Shift planned vs actual coal tonnage | Admin, Manager, Inspector, Regulator | `mine_id` |
| `get_attendance_summary` | Shift muster roll compliance percentage | Admin, Manager, Contractor Mgr, Regulator | `mine_id` |
| `get_contractor_status` | Active vendor agreements and expiring contracts | Admin, Manager, Contractor Mgr, Regulator | `mine_id` |
| `get_grievances` | Workforce safety complaints and SLA breach status | All Operational Roles | `mine_id` |
| `get_pending_approvals` | Pending sign-offs requiring separation of duties | Admin, Manager, Safety Officer, Regulator | `mine_id` |
| `get_governance_tasks` | Open manager action items and reviews | Admin, Manager, Safety Officer, Regulator | `mine_id` |
| `get_what_changed` | 1-hour delta in risk, anomalies, and incidents | All Operational Roles | `mine_id`, `window_hours` |
| `get_audit_events` | Recent SHA-256 tamper-evident ledger entries | Admin, Manager, Safety Officer, Regulator | `mine_id`, `limit` |

---

## 4. Multilingual Governance Architecture

The multilingual engine (`app/copilot/i18n.py` and `frontend/src/i18n/translations.ts`) provides full support for **English**, **Hindi (हिंदी)**, and **Telugu (తెలుగు)**:
* **Canonical Terminology Mapping**: DGMS statutory terms, Coal Mines Regulations (CMR) 2017 clauses, ventilation parameters, and spatial zones are mapped to natural, official government phrasing.
* **Dynamic Language Detection**: Identifies Devanagari script for Hindi, Telugu script for Telugu, or respects the user's active UI language toggle.
* **Bidirectional Response Consistency**: Responses are returned in the query's language while preserving exact technical units (% vol, ppm, m/s, mg/m³).

---

## 5. 3D Digital Twin Deep-Linking Handshake

When a Copilot response recommends inspecting a high-risk zone:
1. Copilot attaches a structured action item (`FOCUS_3D_ZONE`).
2. The UI renders an interactive **"FOCUS IN 3D"** button.
3. Clicking the button sets `focusedTarget` in `MineContext` (e.g. `x: 0, y: 200, z: -180`, `zone_code: "ZN-EAST-LW-102"`).
4. The application seamlessly switches to the `digital-twin` tab and animates the Three.js camera viewport directly to the affected seam level with risk context highlight.
