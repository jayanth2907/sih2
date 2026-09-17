"""
TRINETRA Predictive Risk Service (Phase 5)
Core orchestration service for forward-looking AI/ML risk intelligence.
Maintains strict separation between CURRENT RISK and PREDICTED RISK.
"""

import json
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd

from app.models.mine import Mine
from app.models.risk import RiskScore
from app.models.risk_prediction import RiskPrediction
from app.models.ml_registry import MLModelRegistry
from app.models.alert import Alert
from app.models.audit import AuditEvent
from app.services.audit_service import AuditService
from app.core.exceptions import EntityNotFoundError, BusinessRuleViolationError
from app.ml.features import extract_features_for_mine, FEATURE_NAMES
from app.ml.models import load_active_model, compute_predicted_risk_score, train_and_evaluate_models
from app.ml.dataset import generate_synthetic_mining_telemetry_series, get_chronological_splits
from app.ml.explainability import generate_prediction_explanation

logger = logging.getLogger("trinetra.ml.predictive_risk")

class PredictiveRiskService:
    @classmethod
    def ensure_model_initialized(cls, db: Session):
        """
        Ensures a default model is trained and registered in DB if none exists.
        """
        existing = db.query(MLModelRegistry).filter(MLModelRegistry.version == "risk-escalation-v1.0").first()
        if not existing:
            logger.info("No active model registry entry found. Training and registering default risk model...")
            df = generate_synthetic_mining_telemetry_series(num_samples=1200, random_seed=42)
            train_df, val_df, test_df = get_chronological_splits(df, train_ratio=0.70, val_ratio=0.15)
            best_model, ml_metrics, baseline_metrics = train_and_evaluate_models(train_df, val_df, test_df)
            
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
                feature_names_json=json.dumps(FEATURE_NAMES),
                model_artifact_path="artifacts/risk_escalation_model_v1.joblib",
                trained_at=datetime.now(timezone.utc),
                trained_by="SYSTEM_AUTO_INIT",
                description="Time-aware Gradient Boosting model for 30-minute operational & atmospheric risk escalation forecasting."
            )
            db.add(registry_entry)
            db.commit()

    @classmethod
    def generate_prediction(
        cls,
        db: Session,
        mine_id: int,
        zone_id: Optional[int] = None,
        as_of_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Extracts temporal features strictly <= as_of_time, computes forward escalation probability,
        generates transparent signal attributions, stores audit snapshot, and returns summary.
        """
        mine = db.query(Mine).filter(Mine.id == mine_id).first()
        if not mine:
            raise EntityNotFoundError("Mine", mine_id)

        cls.ensure_model_initialized(db)
        
        if as_of_time is None:
            as_of_time = datetime.now(timezone.utc)
        elif as_of_time.tzinfo is None:
            as_of_time = as_of_time.replace(tzinfo=timezone.utc)

        # 1. Extract Time-Aware Features (ZERO Future Leakage)
        features, data_quality = extract_features_for_mine(db, mine_id, as_of_time)

        # 2. Check Data Quality & Feature Sufficiency
        if data_quality["total_sensors"] == 0 and features["current_rule_risk_score"] == 0:
            raise BusinessRuleViolationError(
                "Prediction unavailable: Insufficient telemetry history or unconfigured sensor topology."
            )

        # 3. Model Inference
        model = load_active_model()
        input_df = pd.DataFrame([features])[FEATURE_NAMES]
        
        if model is not None:
            try:
                probs = model.predict_proba(input_df)[0]
                prob_escalation = round(float(probs[1]), 4)
            except Exception as e:
                logger.error(f"Inference error: {e}. Falling back to baseline threshold.")
                prob_escalation = 0.50 if features["current_rule_risk_score"] >= 60 else 0.20
        else:
            prob_escalation = 0.45

        # 4. Calibrated Predicted Risk Score & Severity
        current_risk = features.get("current_rule_risk_score", 25.0)
        predicted_score, predicted_severity = compute_predicted_risk_score(current_risk, prob_escalation)
        
        # Determine Current Severity
        if current_risk >= 81.0:
            current_severity = "CRITICAL"
        elif current_risk >= 61.0:
            current_severity = "HIGH"
        elif current_risk >= 31.0:
            current_severity = "MEDIUM"
        else:
            current_severity = "LOW"

        risk_delta = round(predicted_score - current_risk, 1)
        trend_direction = "UP" if risk_delta > 2.0 else ("DOWN" if risk_delta < -2.0 else "STABLE")
        predicted_class = 1 if prob_escalation >= 0.50 else 0

        # 5. Signal Attributions & Reasoning
        top_signals = generate_prediction_explanation(features, prob_escalation, top_k=5)

        # 6. Predictive Alerting & Cooldown Logic
        is_alert_created = False
        if predicted_score >= 80.0 or (prob_escalation >= 0.75 and risk_delta >= 10.0):
            # Check 30-minute cooldown
            cooldown_cutoff = as_of_time - timedelta(minutes=30)
            existing_alert = (
                db.query(Alert)
                .filter(
                    Alert.mine_id == mine_id,
                    Alert.source == "PREDICTIVE_ML_ENGINE",
                    Alert.created_at >= cooldown_cutoff
                )
                .first()
            )
            if not existing_alert:
                alert = Alert(
                    mine_id=mine_id,
                    title=f"PREDICTIVE RISK: Escalation Forecast for {mine.name}",
                    message=(
                        f"Forward ML model predicts elevated operational risk ({predicted_score}/100 - {predicted_severity}) "
                        f"over next 30 minutes (Probability: {int(prob_escalation * 100)}%). "
                        f"Primary driver: {top_signals[0]['explanation']}."
                    ),
                    severity="HIGH" if predicted_score < 85 else "CRITICAL",
                    risk_score=predicted_score,
                    status="UNREAD",
                    source="PREDICTIVE_ML_ENGINE",
                    recipient_scope="MINE_MANAGEMENT",
                    location_context=f"Mine Horizon: 30min",
                    created_at=as_of_time
                )
                db.add(alert)
                is_alert_created = True

        # 7. Persist Prediction Record for Auditability
        prediction_record = RiskPrediction(
            mine_id=mine_id,
            zone_id=zone_id,
            prediction_timestamp=as_of_time,
            horizon_minutes=30,
            predicted_risk_score=predicted_score,
            predicted_severity=predicted_severity,
            probability=prob_escalation,
            predicted_class=predicted_class,
            current_risk_score=current_risk,
            model_name="TRINETRA-HistGradientBoosting",
            model_version="risk-escalation-v1.0",
            dataset_type="SIMULATED_DEMO",
            feature_snapshot_json=json.dumps(features),
            explanation_json=json.dumps(top_signals),
            data_quality_score=data_quality["score"],
            data_quality_notes=data_quality["notes"],
            is_alert_generated=is_alert_created,
            created_at=datetime.now(timezone.utc)
        )
        db.add(prediction_record)

        # 8. SHA-256 Hash Chained Audit Entry
        AuditService.log_event(
            db=db,
            actor_id=None,
            action="PREDICTIVE_RISK_EVALUATION",
            resource_type="RiskPrediction",
            resource_id=f"PRED-MINE-{mine_id}",
            mine_id=mine_id,
            before_state=f"CurrentRisk:{current_risk}",
            after_state=f"PredictedRisk:{predicted_score}|Prob:{prob_escalation}",
            metadata={
                "horizon": "30min",
                "model": "risk-escalation-v1.0",
                "dataset": "SIMULATED_DEMO",
                "top_driver": top_signals[0]["label"] if top_signals else "Baseline"
            }
        )
        db.refresh(prediction_record)

        # 9. Broadcast WebSocket Update to Connected Clients
        try:
            from app.api.v1.ws import manager
            import asyncio
            payload = {
                "type": "PREDICTIVE_RISK_UPDATED",
                "mine_id": mine_id,
                "current_risk_score": current_risk,
                "current_severity": current_severity,
                "predicted_risk_score": predicted_score,
                "predicted_severity": predicted_severity,
                "probability": prob_escalation,
                "horizon_minutes": 30,
                "trend_direction": trend_direction,
                "timestamp": as_of_time.isoformat()
            }
            # Non-blocking async dispatch if loop available
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(manager.broadcast_mine(mine_id, payload))
            except RuntimeError:
                pass
        except Exception as ws_err:
            logger.debug(f"WebSocket broadcast skipped: {ws_err}")

        return {
            "mine_id": mine_id,
            "mine_name": mine.name,
            "current_risk_score": current_risk,
            "current_severity": current_severity,
            "predicted_risk_score": predicted_score,
            "predicted_severity": predicted_severity,
            "risk_delta": risk_delta,
            "trend_direction": trend_direction,
            "probability": prob_escalation,
            "horizon_minutes": 30,
            "model_name": "TRINETRA-HistGradientBoosting",
            "model_version": "risk-escalation-v1.0",
            "dataset_provenance": "SIMULATED_DEMO",
            "data_quality_score": data_quality["score"],
            "data_quality_notes": data_quality["notes"],
            "is_alert_active": is_alert_created,
            "top_signals": top_signals,
            "evaluated_at": as_of_time
        }

    @classmethod
    def get_predictions_history(
        cls,
        db: Session,
        mine_id: int,
        limit: int = 50
    ) -> List[RiskPrediction]:
        return (
            db.query(RiskPrediction)
            .filter(RiskPrediction.mine_id == mine_id)
            .order_by(RiskPrediction.prediction_timestamp.desc())
            .limit(limit)
            .all()
        )

    @classmethod
    def get_registered_models(cls, db: Session) -> List[MLModelRegistry]:
        cls.ensure_model_initialized(db)
        return db.query(MLModelRegistry).order_by(MLModelRegistry.trained_at.desc()).all()

    @classmethod
    def get_model_health_summary(cls, db: Session) -> Dict[str, Any]:
        cls.ensure_model_initialized(db)
        total_predictions = db.query(RiskPrediction).count()
        active_model = db.query(MLModelRegistry).filter(MLModelRegistry.status == "ACTIVE").first()
        
        recent_preds = db.query(RiskPrediction).order_by(RiskPrediction.created_at.desc()).limit(100).all()
        avg_prob = np.mean([p.probability for p in recent_preds]) if recent_preds else 0.35
        avg_quality = np.mean([p.data_quality_score for p in recent_preds]) if recent_preds else 1.0

        return {
            "active_model_name": active_model.model_name if active_model else "TRINETRA-HistGradientBoosting",
            "active_version": active_model.version if active_model else "risk-escalation-v1.0",
            "dataset_source": "SIMULATED_DEMO",
            "total_inference_count": total_predictions,
            "average_predicted_probability": round(float(avg_prob), 3),
            "telemetry_data_quality_avg": round(float(avg_quality), 2),
            "target_horizon": "30_MINUTES",
            "status": "HEALTHY",
            "last_evaluated": datetime.now(timezone.utc).isoformat()
        }
