"""
TRINETRA Temporal Dataset Generator & Forward Labeling (Phase 5)
Target: RISK_ESCALATION_WITHIN_30MIN (1 if risk escalates in future window (t, t + 30m], else 0)
Ensures strict chronological train/val/test splitting with zero future leakage.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Dict, Any
import numpy as np
import pandas as pd
from app.ml.features import FEATURE_NAMES

def generate_synthetic_mining_telemetry_series(
    num_samples: int = 1200,
    random_seed: int = 42
) -> pd.DataFrame:
    """
    Generates a realistic temporal time-series dataset of mining telemetry & governance signals
    spanning multiple shifts with realistic gas buildup, sensor spikes, ventilation deviations, and normal recovery cycles.
    Explicitly marked: SIMULATED_DEMO dataset.
    """
    np.random.seed(random_seed)
    
    base_time = datetime(2026, 9, 1, 0, 0, 0, tzinfo=timezone.utc)
    time_step_minutes = 10
    
    records = []
    
    # State machine simulation parameters
    state = "NORMAL" # NORMAL, WARNING_DRIFT, ESCALATING, RECOVERING
    steps_in_state = 0
    
    # Baseline normal values
    ch4_base = 0.22
    co_base = 10.0
    dust_base = 1.6
    temp_base = 27.5
    rule_risk_base = 22.0
    
    for i in range(num_samples):
        timestamp = base_time + timedelta(minutes=i * time_step_minutes)
        steps_in_state += 1
        
        # State transitions
        if state == "NORMAL":
            if steps_in_state > 30 and np.random.rand() < 0.08:
                state = "WARNING_DRIFT"
                steps_in_state = 0
        elif state == "WARNING_DRIFT":
            if steps_in_state > 6:
                if np.random.rand() < 0.60:
                    state = "ESCALATING"
                else:
                    state = "RECOVERING"
                steps_in_state = 0
        elif state == "ESCALATING":
            if steps_in_state > 5:
                state = "RECOVERING"
                steps_in_state = 0
        elif state == "RECOVERING":
            if steps_in_state > 8:
                state = "NORMAL"
                steps_in_state = 0

        # Generate correlated features based on current regime
        noise_ch4 = np.random.normal(0, 0.03)
        noise_co = np.random.normal(0, 1.2)
        noise_dust = np.random.normal(0, 0.2)
        
        if state == "NORMAL":
            ch4_mean = ch4_base + noise_ch4
            ch4_max = ch4_mean + abs(np.random.normal(0, 0.04))
            ch4_slope = np.random.normal(0, 0.005)
            co_mean = co_base + noise_co
            co_max = co_mean + 2.0
            dust_mean = dust_base + noise_dust
            temp_mean = temp_base + np.random.normal(0, 0.5)
            sensor_anomalies_24h = float(np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1]))
            sensor_crit_anomalies_24h = 0.0
            sensor_offline_ratio = float(np.random.choice([0.0, 0.05], p=[0.9, 0.1]))
            env_open = 0.0
            env_crit = 0.0
            incidents_open = float(np.random.choice([0, 1], p=[0.85, 0.15]))
            incidents_crit = 0.0
            violations_open = float(np.random.choice([0, 1], p=[0.8, 0.2]))
            overdue_actions = 0.0
            prod_variance_pct = float(np.random.normal(0, 4.0))
            contracts_expiring = 0.0
            grievances_open = float(np.random.choice([0, 1], p=[0.7, 0.3]))
            grievances_esc = 0.0
            absent_rate = float(np.random.uniform(0.04, 0.08))
            rule_risk = rule_risk_base + np.random.normal(0, 3.0)

        elif state == "WARNING_DRIFT":
            ch4_mean = ch4_base + 0.35 + (steps_in_state * 0.06) + noise_ch4
            ch4_max = ch4_mean + 0.12
            ch4_slope = 0.04 + (steps_in_state * 0.01)
            co_mean = co_base + 15.0 + (steps_in_state * 2.0) + noise_co
            co_max = co_mean + 5.0
            dust_mean = dust_base + 0.8 + noise_dust
            temp_mean = temp_base + 2.5 + np.random.normal(0, 0.4)
            sensor_anomalies_24h = float(np.random.choice([2, 3, 4]))
            sensor_crit_anomalies_24h = 1.0
            sensor_offline_ratio = 0.10
            env_open = 1.0
            env_crit = 0.0
            incidents_open = 1.0
            incidents_crit = 0.0
            violations_open = 1.0
            overdue_actions = 1.0
            prod_variance_pct = -8.0 + np.random.normal(0, 3.0)
            contracts_expiring = 1.0
            grievances_open = 2.0
            grievances_esc = 0.0
            absent_rate = 0.12
            rule_risk = 48.0 + (steps_in_state * 3.5)

        elif state == "ESCALATING":
            ch4_mean = 0.82 + (steps_in_state * 0.08) + noise_ch4 # Above 0.75% threshold
            ch4_max = ch4_mean + 0.20
            ch4_slope = 0.08
            co_mean = 52.0 + (steps_in_state * 4.0) + noise_co # Above 50 PPM threshold
            co_max = co_mean + 12.0
            dust_mean = 3.4 + noise_dust
            temp_mean = 34.2 + np.random.normal(0, 0.4)
            sensor_anomalies_24h = float(np.random.choice([5, 6, 8]))
            sensor_crit_anomalies_24h = float(np.random.choice([2, 3, 4]))
            sensor_offline_ratio = 0.20
            env_open = 2.0
            env_crit = 2.0
            incidents_open = 2.0
            incidents_crit = 1.0
            violations_open = 2.0
            overdue_actions = 2.0
            prod_variance_pct = -22.0 # Critical production shortfall
            contracts_expiring = 1.0
            grievances_open = 3.0
            grievances_esc = 1.0
            absent_rate = 0.18
            rule_risk = 74.0 + (steps_in_state * 4.0)

        else: # RECOVERING
            ch4_mean = 0.40 - (steps_in_state * 0.03) + noise_ch4
            ch4_max = ch4_mean + 0.05
            ch4_slope = -0.03
            co_mean = 25.0 - (steps_in_state * 1.5) + noise_co
            co_max = co_mean + 3.0
            dust_mean = 2.1 + noise_dust
            temp_mean = 29.5 - (steps_in_state * 0.2)
            sensor_anomalies_24h = float(np.random.choice([1, 2]))
            sensor_crit_anomalies_24h = 0.0
            sensor_offline_ratio = 0.05
            env_open = 1.0
            env_crit = 0.0
            incidents_open = 1.0
            incidents_crit = 0.0
            violations_open = 1.0
            overdue_actions = 0.0
            prod_variance_pct = -5.0
            contracts_expiring = 0.0
            grievances_open = 1.0
            grievances_esc = 0.0
            absent_rate = 0.07
            rule_risk = max(30.0, 60.0 - (steps_in_state * 3.5))

        # Enforce valid ranges
        ch4_mean = max(0.05, ch4_mean)
        ch4_max = max(ch4_mean, ch4_max)
        co_mean = max(1.0, co_mean)
        co_max = max(co_mean, co_max)
        dust_mean = max(0.1, dust_mean)
        temp_mean = max(18.0, temp_mean)
        rule_risk = min(100.0, max(5.0, rule_risk))

        record = {
            "timestamp": timestamp,
            "simulated_state": state,
            "methane_ch4_mean_1h": round(ch4_mean, 4),
            "methane_ch4_max_1h": round(ch4_max, 4),
            "methane_ch4_slope_1h": round(ch4_slope, 5),
            "co_ppm_mean_1h": round(co_mean, 2),
            "co_ppm_max_1h": round(co_max, 2),
            "dust_pm10_mean_1h": round(dust_mean, 2),
            "temperature_mean_1h": round(temp_mean, 2),
            "sensor_anomaly_count_24h": sensor_anomalies_24h,
            "sensor_critical_anomaly_count_24h": sensor_crit_anomalies_24h,
            "sensor_offline_ratio": round(sensor_offline_ratio, 3),
            "env_observations_open_count": env_open,
            "env_critical_breach_count_24h": env_crit,
            "incidents_open_count": incidents_open,
            "incidents_critical_count_7d": incidents_crit,
            "violations_open_count": violations_open,
            "corrective_actions_overdue_count": overdue_actions,
            "production_variance_pct_recent": round(prod_variance_pct, 2),
            "contracts_expiring_soon_count": contracts_expiring,
            "grievances_open_count": grievances_open,
            "grievances_escalated_count": grievances_esc,
            "attendance_absent_rate_recent": round(absent_rate, 3),
            "current_rule_risk_score": round(rule_risk, 1)
        }
        records.append(record)
        
    df = pd.DataFrame(records)
    
    # -------------------------------------------------------------
    # Forward Label Generation (Strictly in future horizon (t, t + 30 min])
    # Horizon = 3 steps (3 * 10 min = 30 minutes)
    # -------------------------------------------------------------
    horizon_steps = 3 # 30 minutes
    
    labels = []
    future_risks = []
    
    for idx in range(len(df)):
        future_window = df.iloc[idx + 1 : idx + 1 + horizon_steps]
        if len(future_window) < horizon_steps:
            # End of series without full horizon
            labels.append(np.nan)
            future_risks.append(np.nan)
        else:
            current_r = df.iloc[idx]["current_rule_risk_score"]
            future_max_r = future_window["current_rule_risk_score"].max()
            future_ch4_max = future_window["methane_ch4_max_1h"].max()
            future_crit_anom = future_window["sensor_critical_anomaly_count_24h"].max()
            
            # Ground truth: escalation occurred if future risk crosses 65 OR increases by >= 15 points OR ch4 exceeds 0.75%
            escalated = 1 if (future_max_r >= 65.0 or (future_max_r - current_r) >= 15.0 or future_ch4_max >= 0.75 or future_crit_anom >= 2) else 0
            labels.append(escalated)
            future_risks.append(round(future_max_r, 1))
            
    df["target_escalation_30m"] = labels
    df["future_max_risk_30m"] = future_risks
    
    # Drop rows without complete future horizon
    df = df.dropna().reset_index(drop=True)
    return df

def get_chronological_splits(
    df: pd.DataFrame,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Performs strictly chronological split (zero future-to-past leakage).
    Train: [0 : N_train]
    Validation: [N_train : N_train + N_val]
    Test: [N_train + N_val : End]
    """
    n = len(df)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)
    
    train_df = df.iloc[:n_train].copy()
    val_df = df.iloc[n_train : n_train + n_val].copy()
    test_df = df.iloc[n_train + n_val:].copy()
    
    return train_df, val_df, test_df
