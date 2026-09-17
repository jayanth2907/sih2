# TRINETRA (त्रिनेत्र) — Design System Specifications
**Industrial Command, SCADA & Government Smart Governance Platform**
*Version: 2.0 (Phase 10 Final Polish)*

---

## 1. Design Philosophy & Aesthetic Identity

TRINETRA is an enterprise-grade, industrial-operational command center and statutory governance monitoring platform specifically tailored for coal mining safety operations under the regulatory framework of DGMS (Directorate General of Mines Safety) and the Ministry of Coal.

### Visual Identity Principles:
1. **Industrial & Command-Room Focus**: Clean, high-contrast, dark-mode surfaces reminiscent of industrial SCADA and emergency operations centers.
2. **Data Density & Scanability**: High information density with crisp hierarchy, prioritizing actionable telemetry, active breaches, and risk escalations over decorative fluff.
3. **Calm & Precise**: Zero cartoonish graphics, zero purple AI gradients, zero cyberpunk neon glows. Restrained micro-animations strictly reserved for critical status changes and active telemetry feeds.
4. **Honest & Responsible AI**: Unmistakable labeling for deterministic data vs. empirical ML predictions (`SIMULATED TELEMETRY`, `PREDICTIVE RISK (+30 MIN)`, `HUMAN VERIFICATION REQUIRED`).

---

## 2. Color System & Surface Tokens

### 2.1 Base Industrial Surfaces
| Surface Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--bg-primary` | `#080A09` | Root viewport canvas background |
| `--bg-surface-1` | `#0D100F` | Primary structural panels, headers, and cards |
| `--bg-surface-2` | `#121614` | Secondary interactive containers, nested cards |
| `--bg-surface-3` | `#171B18` | Elevated active items, focus highlights |
| `--border-subtle` | `#1B211E` | Primary divider and panel borders |
| `--border-card` | `#232A26` | Card borders and table delimiters |
| `--border-focus` | `#F59E0B` | Active element outline / focus ring |

### 2.2 Brand & Functional Accents
| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `Amber Primary` | `#F59E0B` | Brand identity accent, active tab highlight, primary action |
| `Amber Hover` | `#FFB52E` | Hover highlight for brand buttons |
| `Slate Text High` | `#F1F5F9` | Primary headings, critical data values |
| `Slate Text Med` | `#94A3B8` | Body copy, section descriptions |
| `Slate Text Low` | `#64748B` | Monospace metadata, timestamps, units |

### 2.3 Risk & Severity Hierarchy
| Level | Color Hex | Background Tint | Border Tint | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | `#EF4444` | `rgba(239, 68, 68, 0.12)` | `rgba(239, 68, 68, 0.35)` | Statutory breaches, gas threshold overshoots, tampering |
| **HIGH** | `#F97316` | `rgba(249, 115, 22, 0.12)` | `rgba(249, 115, 22, 0.35)` | Warning escalations, pending SLA breaches |
| **MEDIUM** | `#F59E0B` | `rgba(245, 158, 11, 0.12)` | `rgba(245, 158, 11, 0.35)` | Operational notices, moderate anomalies |
| **LOW / NORMAL** | `#22C55E` | `rgba(34, 197, 94, 0.12)` | `rgba(34, 197, 94, 0.35)` | Baseline within DGMS safety thresholds |
| **INFO / SIM** | `#60A5FA` | `rgba(96, 165, 250, 0.12)` | `rgba(96, 165, 250, 0.35)` | Simulated scenarios, external CMSMS/DGMS signals |

---

## 3. Typography Architecture

TRINETRA employs a dual-typeface typographic system:

### 3.1 Primary Interface Typography: `IBM Plex Sans`
Used for:
- Page and module titles
- Form labels, buttons, dialogs
- Explanations and governance copy

### 3.2 Technical Typography: `IBM Plex Mono`
Used strictly for:
- Telemetry readings and numerical metrics (`0.88%`, `42.0 ppm`, `3.2 m/s`)
- Spatial coordinates `(x: 120.0, y: 40.0, z: -180.0)`
- Hardware IDs & Sensor Codes (`SN-BDS04-CH4-101`)
- Timestamps and SLA counters (`10:34:12 IST`, `18h 42m`)
- Cryptographic Hashes (`SHA-256`, `MERKLE_ROOT`)
- System & RBAC role badges (`MINE_SAFETY_OFFICER`)

---

## 4. Component Standards

### 4.1 Navigation Sidebar
- Organized into 6 distinct operational groups: `COMMAND`, `OPERATIONS`, `GOVERNANCE`, `INTELLIGENCE`, `INTEGRATIONS`, `SYSTEM`.
- Role-aware filtering: Only authorized views are exposed per active RBAC profile.
- Compact 64px/256px layout with persistent quick brand identification.

### 4.2 Operational Header
- Left: Active mine switcher with metadata badge, clickable system health status pill (`SYSTEM: OPERATIONAL`), and honest ingestion indicator (`TELEMETRY: SIMULATED / SCENARIO READY`).
- Right: Non-breaking multilingual switcher (`EN`, `हिन्दी`, `తెలుగు`), quick AI Copilot trigger, and authenticated operator profile.

### 4.3 Compact Metric Cards (`StatCard`)
- Monospace values with subtle variant-tinted borders.
- Direct interactive click-through to corresponding operational modules.

### 4.4 Status Badges (`StatusBadge`)
- Standardized rectangular badges (`rounded-md font-mono`) with 1.5px status indicator dot.
- High contrast compliant with WCAG 2.1 AA in dark mode.

---

## 5. Performance & Accessibility (a11y)
- Dynamic code-splitting with `React.lazy` and `Suspense` keeps the core bundle lightweight (`326 kB`).
- Grayscale distinguishable: Every status incorporates an explicit text label and icon, not relying purely on color.
- Resilient multilingual support: Flexible container wrapping ensures Hindi and Telugu scripts render cleanly without truncation.
