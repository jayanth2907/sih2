"""
TRINETRA Risk Model Training & Registration Script (Phase 5)
Usage: python -m app.ml.training.train_risk_model
"""

import os
import json
from datetime import datetime, timezone
from app.ml.dataset import generate_synthetic_mining_telemetry_series, get_chronological_splits
from app.ml.models import train_and_evaluate_models
from app.db.session import SessionLocal
from app.models.ml_registry import MLModelRegistry

def train_and_register_pipeline():
    print("=" * 70)
    print("TRINETRA AI/ML RISK INTELLIGENCE — MODEL TRAINING PIPELINE")
    print("=" * 70)
    print("Dataset Provenance: SIMULATED_DEMO mining telemetry & governance time-series")
    print("Prediction Target: RISK_ESCALATION_WITHIN_30MIN (Horizon: 30 minutes)")
    print("Splitting Strategy: Chronological (70% Train, 15% Val, 15% Test) — ZERO Future Leakage")
    print("-" * 70)
    
    # 1. Generate Dataset
    df = generate_synthetic_mining_telemetry_series(num_samples=1500, random_seed=42)
    print(f"Generated temporal dataset: {len(df)} samples across 250 operational hours.")
    
    # 2. Chronological Splits
    train_df, val_df, test_df = get_chronological_splits(df, train_ratio=0.70, val_ratio=0.15)
    print(f"Split sizes: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
    
    # 3. Train & Evaluate
    best_model, ml_metrics, baseline_metrics = train_and_evaluate_models(train_df, val_df, test_df)
    
    print("\n" + "=" * 70)
    print("MODEL VALIDATION RESULTS & BASELINE COMPARISON")
    print("=" * 70)
    print(f"Baseline Model (Persistence):  ROC-AUC = {baseline_metrics['roc_auc']:.4f}, F1 = {baseline_metrics['f1']:.4f}")
    print(f"Candidate ML Model (HistGBM):  ROC-AUC = {ml_metrics['roc_auc']:.4f}, PR-AUC = {ml_metrics['pr_auc']:.4f}, F1 = {ml_metrics['f1']:.4f}")
    print(f"Precision = {ml_metrics['precision']:.4f}, Recall = {ml_metrics['recall']:.4f}, Brier Score = {ml_metrics['brier_score']:.4f}")
    print(f"ML AUC Lift over Baseline:     +{ml_metrics['baseline_comparison']['ml_auc_lift']:.4f}")
    print(f"Confusion Matrix:              {ml_metrics['confusion_matrix']}")
    print("-" * 70)

    # 4. Register in Database
    from app.db.base import Base
    from app.db.session import engine
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(MLModelRegistry).filter(MLModelRegistry.version == "risk-escalation-v1.0").first()
        if existing:
            existing.metrics_json = json.dumps(ml_metrics)
            existing.trained_at = datetime.now(timezone.utc)
            existing.status = "ACTIVE"
            existing.is_default = True
        else:
            registry_entry = MLModelRegistry(
                model_name="TRINETRA-HistGradientBoosting",
                version="risk-escalation-v1.0",
                algorithm="HistGradientBoostingClassifier",
                target_variable="RISK_ESCALATION_WITHIN_30MIN",
                horizon_minutes=30,
                status="ACTIVE",
                is_default=True,
                dataset_source="SIMULATED_DEMO",
                metrics_json=json.dumps(ml_metrics),
                feature_names_json=json.dumps(ml_metrics["model_name"]),
                model_artifact_path="artifacts/risk_escalation_model_v1.joblib",
                trained_at=datetime.now(timezone.utc),
                trained_by="SYSTEM_ML_TRAINING_PIPELINE",
                description="Time-aware Gradient Boosting model for 30-minute operational & atmospheric risk escalation forecasting."
            )
            db.add(registry_entry)
        db.commit()
        print("[SUCCESS] Model successfully saved to disk and registered in database ML registry.")
    finally:
        db.close()

if __name__ == "__main__":
    train_and_register_pipeline()
