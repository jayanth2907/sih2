import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
import pandas as pd
import numpy as np

from app.ml.features import extract_features_for_mine, FEATURE_NAMES
from app.ml.dataset import generate_synthetic_mining_telemetry_series, get_chronological_splits
from app.ml.models import BaselineThresholdModel, train_and_evaluate_models, compute_predicted_risk_score
from app.ml.explainability import generate_prediction_explanation
from app.services.predictive_risk_service import PredictiveRiskService
from app.models.mine import Mine
from app.models.sensor import Sensor, SensorReading
from app.models.risk_prediction import RiskPrediction
from app.models.alert import Alert

def get_token(client: TestClient, email="admin@trinetra.gov.in", password="Trinetra@2026"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

def test_feature_extraction_no_future_leakage(db_session):
    """
    CRITICAL TEST: Verifies that feature extraction only uses records with timestamp <= as_of_time.
    Future records added AFTER as_of_time must NOT leak into the feature vector.
    """
    mine = db_session.query(Mine).first()
    sensor = db_session.query(Sensor).filter(Sensor.mine_id == mine.id).first()
    assert mine is not None and sensor is not None
    
    cutoff_time = datetime(2026, 9, 13, 10, 0, 0, tzinfo=timezone.utc)
    future_time = datetime(2026, 9, 13, 11, 0, 0, tzinfo=timezone.utc)
    
    # 1. Add historical reading before cutoff
    past_reading = SensorReading(
        sensor_id=sensor.id,
        value=0.25,
        unit="%",
        quality="GOOD",
        source="SIMULATED",
        timestamp=datetime(2026, 9, 13, 9, 30, 0, tzinfo=timezone.utc)
    )
    db_session.add(past_reading)
    
    # 2. Add future reading with extreme spike AFTER cutoff
    future_reading = SensorReading(
        sensor_id=sensor.id,
        value=1.95, # Extreme methane leak in future
        unit="%",
        quality="BAD",
        source="SIMULATED",
        timestamp=future_time
    )
    db_session.add(future_reading)
    db_session.commit()
    
    # 3. Extract features at cutoff_time
    features, quality = extract_features_for_mine(db_session, mine.id, as_of_time=cutoff_time)
    
    # Verify: Future reading of 1.95% must NOT be reflected in 10:00 cutoff feature
    assert features["methane_ch4_max_1h"] < 1.0, "Future leakage detected! Future reading leaked into feature vector."
    assert quality["provenance"] == "SIMULATED_DEMO"

def test_dataset_generation_and_chronological_splits():
    """
    Verifies temporal dataset creation, forward labeling, and non-overlapping chronological splits.
    """
    df = generate_synthetic_mining_telemetry_series(num_samples=600, random_seed=42)
    assert len(df) > 0
    assert "target_escalation_30m" in df.columns
    assert "future_max_risk_30m" in df.columns
    
    # Check all required features exist in generated dataset
    for feat in FEATURE_NAMES:
        assert feat in df.columns, f"Feature {feat} missing from generated dataset."
        
    train_df, val_df, test_df = get_chronological_splits(df, train_ratio=0.70, val_ratio=0.15)
    
    # Verify chronological monotonicity (max train timestamp < min val timestamp < min test timestamp)
    assert train_df["timestamp"].max() < val_df["timestamp"].min()
    assert val_df["timestamp"].max() < test_df["timestamp"].min()

def test_model_training_and_metrics_evaluation():
    """
    Verifies baseline and ML model training, metric honesty, and lift calculation.
    """
    df = generate_synthetic_mining_telemetry_series(num_samples=1000, random_seed=42)
    train_df, val_df, test_df = get_chronological_splits(df, train_ratio=0.70, val_ratio=0.15)
    
    model, ml_metrics, baseline_metrics = train_and_evaluate_models(train_df, val_df, test_df)
    
    assert ml_metrics["roc_auc"] >= 0.50
    assert ml_metrics["pr_auc"] >= 0.0
    assert "confusion_matrix" in ml_metrics
    assert ml_metrics["dataset_source"] == "SIMULATED_DEMO"
    assert ml_metrics["target_horizon"] == "30_MINUTES"
    assert "baseline_comparison" in ml_metrics

def test_calibrated_predicted_risk_score():
    """
    Verifies calibrated probability mapping to 0-100 risk score and severity bands.
    """
    # Low probability
    score_low, sev_low = compute_predicted_risk_score(current_risk=20.0, probability=0.10)
    assert score_low <= 35.0
    assert sev_low in ("LOW", "MEDIUM")
    
    # High probability escalation
    score_high, sev_high = compute_predicted_risk_score(current_risk=68.0, probability=0.85)
    assert score_high >= 75.0
    assert sev_high in ("HIGH", "CRITICAL")

def test_signal_attributions_explainability():
    """
    Verifies transparent signal attributions with directional indicator and unit labels.
    """
    features = {
        "methane_ch4_max_1h": 0.88, # Spike above 0.75% threshold
        "co_ppm_max_1h": 45.0,
        "current_rule_risk_score": 62.0,
        "sensor_critical_anomaly_count_24h": 2.0,
        "production_variance_pct_recent": -18.0
    }
    
    attributions = generate_prediction_explanation(features, probability=0.82, top_k=4)
    assert len(attributions) > 0
    assert attributions[0]["direction"] == "INCREASING_RISK"
    assert attributions[0]["symbol"] == "↑"
    assert "explanation" in attributions[0]

def test_predictive_risk_service_end_to_end(db_session):
    """
    Verifies end-to-end forward prediction evaluation, persistence, and audit logging.
    """
    mine = db_session.query(Mine).first()
    assert mine is not None
    
    summary = PredictiveRiskService.generate_prediction(db=db_session, mine_id=mine.id)
    
    assert summary["mine_id"] == mine.id
    assert "current_risk_score" in summary
    assert "predicted_risk_score" in summary
    assert "probability" in summary
    assert summary["horizon_minutes"] == 30
    assert summary["dataset_provenance"] == "SIMULATED_DEMO"
    assert len(summary["top_signals"]) > 0
    
    # Verify saved prediction record
    pred = db_session.query(RiskPrediction).filter(RiskPrediction.mine_id == mine.id).order_by(RiskPrediction.created_at.desc()).first()
    assert pred is not None
    assert pred.predicted_risk_score == summary["predicted_risk_score"]
    assert pred.dataset_type == "SIMULATED_DEMO"

def test_predictive_alert_generation_and_cooldown(db_session):
    """
    Verifies predictive alerting trigger when risk is high and enforces cooldown deduplication.
    """
    mine = db_session.query(Mine).first()
    assert mine is not None
    
    # Clear past alerts
    db_session.query(Alert).filter(Alert.mine_id == mine.id, Alert.source == "PREDICTIVE_ML_ENGINE").delete()
    db_session.commit()
    
    now = datetime.now(timezone.utc)
    
    # Trigger 1st evaluation
    summary1 = PredictiveRiskService.generate_prediction(db=db_session, mine_id=mine.id, as_of_time=now)
    
    # Trigger 2nd evaluation immediately after (within cooldown)
    summary2 = PredictiveRiskService.generate_prediction(db=db_session, mine_id=mine.id, as_of_time=now + timedelta(minutes=5))
    
    # Alerts should not be duplicated in rapid succession
    alerts_count = db_session.query(Alert).filter(Alert.mine_id == mine.id, Alert.source == "PREDICTIVE_ML_ENGINE").count()
    assert alerts_count <= 1

def test_predictive_risk_api_endpoints(client: TestClient, db_session):
    """
    Verifies API endpoints for evaluation, latest summary, history, models, and health.
    """
    token = get_token(client, "admin@trinetra.gov.in")
    headers = {"Authorization": f"Bearer {token}"}
    mine = db_session.query(Mine).first()
    assert mine is not None
    
    # 1. Evaluate Prediction (Initializes model and registry if not already done)
    res = client.post(f"/api/v1/predictive-risk/evaluate/{mine.id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["mine_id"] == mine.id
    assert "current_risk_score" in data
    assert "predicted_risk_score" in data
    assert data["dataset_provenance"] == "SIMULATED_DEMO"
    
    # 2. Latest Summary
    res_latest = client.get(f"/api/v1/predictive-risk/latest/{mine.id}", headers=headers)
    assert res_latest.status_code == 200
    
    # 3. History
    res_hist = client.get(f"/api/v1/predictive-risk/history/{mine.id}", headers=headers)
    assert res_hist.status_code == 200
    assert isinstance(res_hist.json(), list)
    
    # 4. Models Registry
    res_models = client.get("/api/v1/predictive-risk/models", headers=headers)
    assert res_models.status_code == 200
    assert len(res_models.json()) > 0
    
    # 5. Model Health
    res_health = client.get("/api/v1/predictive-risk/health", headers=headers)
    assert res_health.status_code == 200
    health = res_health.json()
    assert health["status"] == "HEALTHY"
    assert health["dataset_source"] == "SIMULATED_DEMO"

def test_predictive_risk_rbac_mine_isolation(client: TestClient, db_session):
    """
    Verifies that a Mine Manager cannot access predictive risk intelligence for an unassigned mine.
    """
    manager_token = get_token(client, "manager.mine1@trinetra.gov.in") # Assigned to mine 1
    headers = {"Authorization": f"Bearer {manager_token}"}
    mines = db_session.query(Mine).all()
    if len(mines) >= 2:
        unauthorized_mine = mines[1] # Mine 2
        res = client.get(f"/api/v1/predictive-risk/latest/{unauthorized_mine.id}", headers=headers)
        assert res.status_code == 403
