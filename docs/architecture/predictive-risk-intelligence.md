# TRINETRA Predictive Risk Intelligence & Forward-Looking Governance Architecture

## 1. Executive Overview

TRINETRA Phase 5 introduces a scientifically defensible, explainable, and temporally validated Machine Learning (ML) risk intelligence engine. The primary objective is to empower mine managers, safety officers, and statutory inspectors with early warning signals regarding emerging hazards **before** they escalate into regulatory violations, dangerous atmospheric threshold breaches, or catastrophic mine emergencies.

### Critical Distinction: Current Risk vs. Predicted Risk

A foundational tenet of TRINETRA is that real-time operational risk and forward-looking predicted risk are fundamentally different concepts and must **never** be conflated:

| Dimension | Current Risk (Phase 2 Deterministic Composite) | Predicted Risk (Phase 5 ML Forward-Looking Projection) |
| :--- | :--- | :--- |
| **Question Answered** | *"What is the exact operational hazard state right now?"* | *"Based on rolling trends and governance signals, is risk likely to escalate over the next 30 minutes?"* |
| **Methodology** | Multi-factor weighted deterministic rules, immediate threshold exceedances, and active incident severity. | Calibrated ensemble gradient boosting (`HistGradientBoostingClassifier`) trained on temporal sliding-window features. |
| **Output Metric** | 0–100 Real-Time Risk Score (Low: 0-30, Med: 31-60, High: 61-80, Critical: 81-100). | 0–100 Calibrated Risk Projection + Escalation Probability ($P \in [0.0, 1.0]$). |
| **Governance Effect** | Drives immediate alarm dispatches, ventilation interlocks, and emergency muster. | Dispatches **Predictive Review Recommendations** and spatial 3D inspection targets without automatically issuing punitive regulatory citations. |

---

## 2. End-to-End Predictive Architecture Pipeline

The ML lifecycle in TRINETRA follows an auditable, time-ordered dataflow with **zero future leakage**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TRINETRA DATA PROVENANCE                                    │
│   • Sensor Telemetry (CH4, CO, Airflow, Temp)     • Governance Gaps (DGMS Violations, SLAs) │
│   • Anomaly Frequencies & Recovery States         • Production Variance & Target Deviations │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             TIME-AWARE FEATURE EXTRACTION                                   │
│                  All feature calculations strictly obey: timestamp <= T_as_of                │
│   • 30-min Rolling Mean, Min, Max, StdDev        • 30-min Incident & Violation Tallies     │
│   • Rate of Change & Trend Slope                 • DGMS Overdue Corrective Actions          │
│   • Threshold Exceedance & Recovery State        • Production Variance & Shift Attendance   │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            TEMPORAL DATASET & HORIZON TARGET                                │
│   • Target: RISK_ESCALATION_WITHIN_30MIN (Binary Classification: Future Risk >= 70 or +15pt) │
│   • Validation: Chronological Holdout (Train: 70% | Validation: 15% | Test: 15%)            │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             MODEL INFERENCE & CALIBRATION                                   │
│   • Baseline: Persistence Rule Classifier (ROC-AUC: ~0.8075)                                │
│   • Candidate: HistGradientBoostingClassifier (ROC-AUC: 0.9219, PR-AUC: 0.8975)             │
│   • Calibrated Score: P_escalation * 100 + (0.25 * Current_Risk)                            │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                        TRANSPARENT SIGNAL ATTRIBUTIONS (EXPLAINABILITY)                     │
│   • Feature deviations from statutory baseline (e.g., Methane Trend: +0.28%/h -> +18 pts)   │
│   • Directional signals (↑ Escalating / ↓ De-escalating) with human-readable rationale       │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         GOVERNANCE DISPATCH & 3D SPATIAL TWIN                               │
│   • Predictive Alert Generated (with 30-min deduplication cooldown)                         │
│   • WebSocket Broadcast (PREDICTIVE_RISK_UPDATED)                                           │
│   • One-Click Spatial Twin Fly-To ([FOCUS PREDICTED HOTSPOT IN 3D])                         │
│   • Immutable Audit Ledger Registration (SHA-256 Chain)                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Feature Engineering Pipeline

All features are extracted by [`app.ml.features.extract_features_for_zone`](file:///c:/Users/srija/OneDrive/Desktop/sih%20personal/backend/app/ml/features.py) with strict cutoff enforcement ($t \le t_{\text{as\_of}}$):

### 3.1 Atmospheric & Sensor Features
1. `methane_current` & `methane_rolling_mean_30m`: Rolling average of methane (% volume).
2. `methane_trend_slope`: Linear regression slope of methane readings over the last 30 minutes.
3. `methane_rate_of_change`: Instantaneous delta over previous reading interval.
4. `co_current` & `co_rolling_mean_30m`: Carbon monoxide concentration in ppm.
5. `co_trend_slope`: Early indicator of spontaneous seam combustion.
6. `airflow_current` & `airflow_rolling_mean_30m`: Face ventilation velocity in m/s.
7. `airflow_trend_slope`: Negative slope indicates progressive ventilation blockage or regulator failure.
8. `temp_current` & `temp_rolling_mean_30m`: Ambient face temperature (°C).
9. `recent_anomalies_count`: Total anomalies logged in the last 30 minutes.
10. `critical_anomalies_count`: High-severity sensor spikes within the temporal window.
11. `sensor_offline_count`: Number of sensors in OFFLINE/STALE state.
12. `in_recovery_state`: Boolean indicator if sensors recently exited a critical surge.

### 3.2 Safety, Compliance & Governance Features
13. `active_incidents_count`: Unresolved incidents in the target zone.
14. `open_violations_count`: Active DGMS statutory inspection violations.
15. `overdue_corrective_actions`: High-priority safety actions past their resolution deadline.
16. `unresolved_observations_count`: Open hazard observations from field inspectors.
17. `sla_breached_grievances`: Workforce safety grievances with breached resolution SLAs.

### 3.3 Production & Operational Features
18. `production_deviation_tons`: Variance between actual coal tonnage and planned shift target.
19. `shift_attendance_pct`: Muster percentage; understaffing can elevate operational error rates.

---

## 4. Modeling, Baseline Comparison & Validation

### 4.1 Prediction Target & Horizon
* **Prediction Target:** `RISK_ESCALATION_WITHIN_30MIN`
* **Target Definition:** Binary indicator ($y \in \{0, 1\}$) evaluating whether the zone's operational risk score increases above 70 (HIGH/CRITICAL) or increases by $\ge 15$ points within the $[t, t + 30\text{min}]$ horizon.
* **Monitoring Horizon:** 30 minutes (aligned with statutory mine shift inspection cycles and atmospheric diffusion velocities).

### 4.2 Chronological Holdout Validation
To eliminate temporal lookahead bias, data is split sequentially across time:
* **Training Set:** First 70% of chronological records.
* **Validation Set:** Next 15% of chronological records (for hyperparameter tuning and early stopping).
* **Holdout Test Set:** Final 15% of chronological records (unseen future data for evaluation).

### 4.3 Validation Results (Demonstrated on Simulated Temporal Dataset)
* **Dataset Provenance:** `SIMULATED / DEMO` (Clearly labelled across UI and API).
* **Baseline (Rule Persistence):** Assumes current high risk persists into the future.
* **Candidate ML Model:** Scikit-Learn `HistGradientBoostingClassifier` with early stopping and monotonic constraints where appropriate.

```
+---------------------------+----------------+----------------+----------------+
| Metric                    | Baseline Model | Candidate ML   | Delta / Lift   |
+---------------------------+----------------+----------------+----------------+
| ROC-AUC                   | 0.8075         | 0.9219         | +0.1144        |
| PR-AUC                    | 0.7712         | 0.8975         | +0.1263        |
| F1 Score                  | 0.7258         | 0.8403         | +0.1145        |
| Precision                 | 0.7500         | 0.8929         | +0.1429        |
| Recall                    | 0.7031         | 0.7937         | +0.0906        |
| Brier Score (Calibration) | 0.1650         | 0.0707         | -0.0943 (best) |
+---------------------------+----------------+----------------+----------------+
```

---

## 5. Transparent Explainability (Directional Signal Attributions)

Rather than generating opaque black-box outputs or fabricated SHAP objects, TRINETRA implements **Directional Signal Attributions** with empirical thresholds:
* **Signal Direction:** $\uparrow$ (Escalating risk) or $\downarrow$ (Mitigating risk / stabilizing).
* **Baseline Reference:** Safe statutory operating band (e.g., CH4 safe $< 0.50\%$, Airflow safe $\ge 2.50\text{ m/s}$).
* **Contribution Weight:** Computed points (0–30) reflecting feature magnitude and direction.
* **Plain Language Rationale:** Contextualized technical explanations for mine safety supervisors.

---

## 6. Model Governance, Health & Quality Assurance

1. **Model Versioning:** Every prediction records `model_version` (e.g. `trinetra-risk-escalation-v1.0-histgbm`).
2. **Provenance Disclosure:** API and UI explicitly broadcast `training_data_source: "SIMULATED_DEMO"`.
3. **Data Quality & Fallback Safeguards:**
   - Evaluates `data_quality_score` ($0.0 - 1.0$).
   - If $> 40\%$ of sensor streams are missing/stale, prediction is marked `is_available: false` with reason `"Insufficient telemetry history"`.
4. **Predictive Alert Deduplication:** 30-minute cooldown window per mine-zone pair prevents alert fatigue.
5. **Multi-Tenant Isolation & RBAC:** Mine-scoped access verified at API gateway; cross-tenant prediction querying is strictly forbidden.
