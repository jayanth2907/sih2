# TRINETRA Model Card: Operational Risk Escalation Predictor

## Model Details

- **Model Identifier:** `trinetra-risk-escalation-v1.0-histgbm`
- **Model Type:** Tabular Gradient Boosted Decision Tree Classifier (`sklearn.ensemble.HistGradientBoostingClassifier`)
- **Version:** `1.0.0`
- **Developer:** TRINETRA AI/ML Applied Engineering Team
- **Release Date:** September 2026
- **License:** Proprietary / DGMS Smart Mine Governance Framework

---

## Intended Use

- **Primary Intended Use:** Provide proactive early-warning notifications to mine managers, ventilation engineers, and safety officers 30 minutes prior to potential threshold breaches and risk escalation.
- **Primary Users:** Mine Managers, Colliery Safety Officers, DGMS Statutory Inspectors, Control Room Operators.
- **Decision Context:** High-priority visual recommendations on the 3D Digital Twin, scheduling targeted physical inspections, and investigating early gas accumulations.

## Out-of-Scope & Prohibited Uses

- **Autonomous Mine Control:** This model **must not** directly actuate ventilation shafts, electrical circuit breakers, or conveyor stops without human verification.
- **Automated Statutory Penalties:** Predictions **must never** automatically issue punitive regulatory violations against mine personnel or contractors.
- **Long-Horizon Extrapolation:** Predictions beyond the defined 30-minute horizon are unvalidated and prohibited.

---

## Factors & Features

| Feature Name | Type | Statutory / Normal Baseline | Description |
| :--- | :--- | :--- | :--- |
| `methane_current` | Float | $< 0.50\%$ vol | Current CH4 concentration |
| `methane_rolling_mean_30m` | Float | $< 0.50\%$ vol | 30-minute moving average of CH4 |
| `methane_trend_slope` | Float | $\approx 0.0$ | Linear trend slope over 30 minutes |
| `methane_rate_of_change` | Float | $\approx 0.0$ | Instantaneous rate of change |
| `co_current` | Float | $< 15.0$ ppm | Current CO concentration |
| `co_trend_slope` | Float | $\approx 0.0$ | 30-minute CO accumulation rate |
| `airflow_current` | Float | $\ge 2.50$ m/s | Main face air velocity |
| `airflow_trend_slope` | Float | $\ge 0.0$ | Airflow degradation rate |
| `recent_anomalies_count` | Int | $0$ | Total anomalies in last 30 minutes |
| `critical_anomalies_count` | Int | $0$ | Critical spikes in last 30 minutes |
| `active_incidents_count` | Int | $0$ | Open incidents in target zone |
| `open_violations_count` | Int | $0$ | Open DGMS inspection violations |
| `overdue_corrective_actions` | Int | $0$ | High-priority overdue actions |
| `production_deviation_tons` | Float | $\approx 0.0$ | Shift production plan variance |

---

## Training & Evaluation Data

- **Data Source:** `SIMULATED / DEMO` (Deterministic underground coal mine physics-based telemetry generator reflecting Coal Mines Regulations 2017 operating regimes).
- **Temporal Splitting Strategy:**
  - `Train (70%)`: Chronological training subset ($t_0 \rightarrow t_{\text{train}}$)
  - `Validation (15%)`: Chronological tuning subset ($t_{\text{train}} \rightarrow t_{\text{val}}$)
  - `Holdout Test (15%)`: Chronological unseen evaluation subset ($t_{\text{val}} \rightarrow t_{\text{test}}$)
- **Zero Future Leakage:** Verified via strict timestamp filtering ($t \le t_{\text{as\_of}}$).

---

## Evaluation Metrics

Evaluated on the unseen chronological holdout test set:

| Evaluation Metric | Baseline (Persistence) | Candidate ML (HistGBM) |
| :--- | :--- | :--- |
| **ROC-AUC** | 0.8075 | **0.9219** |
| **PR-AUC** | 0.7712 | **0.8975** |
| **Precision** | 0.7500 | **0.8929** |
| **Recall** | 0.7031 | **0.7937** |
| **F1 Score** | 0.7258 | **0.8403** |
| **Brier Score** | 0.1650 | **0.0707** |

---

## Explainability & Provenance

- **Method:** Directional Signal Attributions with baseline offsets and point weights.
- **Auditing:** Feature snapshots and model parameters are logged into the TRINETRA SHA-256 tamper-evident governance ledger.
- **Provenance Label:** Explicitly tagged as `SIMULATED_DEMO` across all API responses and UI components.

---

## Limitations & Ethical Considerations

1. **Synthetic Data Warning:** Because initial training utilized simulated telemetry, performance figures reflect simulated dynamics and must be recalibrated when continuous production SCADA telemetry is connected.
2. **Missing Sensor Degradation:** If $> 40\%$ of sensor channels in a zone drop offline, the model enters a safe degraded state (`is_available = false`) rather than generating uncalibrated predictions.
