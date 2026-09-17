from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.mine import Mine
from app.models.incident import Incident
from app.models.violation import Violation
from app.models.sensor import Sensor
from app.models.risk import RiskScore, RiskFactor, AnomalyEvent

class RiskCalculationResult:
    def __init__(
        self,
        mine_id: int,
        score: float,
        severity: str,
        rule_score: float,
        ml_score: float,
        silence_risk_score: float,
        explanation: str,
        factors: List[dict],
        model_version: str = "TRINETRA-RISK-v1.0",
        rule_version: str = "DGMS-RULESET-2026.1"
    ):
        self.mine_id = mine_id
        self.score = round(score, 1)
        self.severity = severity
        self.rule_score = round(rule_score, 1)
        self.ml_score = round(ml_score, 1)
        self.silence_risk_score = round(silence_risk_score, 1)
        self.explanation = explanation
        self.factors = factors
        self.model_version = model_version
        self.rule_version = rule_version
        self.generated_at = datetime.now(timezone.utc)

class RiskService:
    @staticmethod
    def calculate_mine_risk(db: Session, mine_id: int) -> RiskCalculationResult:
        factors = []
        total_score = 10.0 # Base operational ambient risk
        
        # 1. Active Incidents Impact
        active_incidents = db.query(Incident).filter(
            Incident.mine_id == mine_id,
            Incident.status != "CLOSED"
        ).all()
        
        crit_incidents = sum(1 for i in active_incidents if i.severity == "CRITICAL")
        high_incidents = sum(1 for i in active_incidents if i.severity == "HIGH")
        med_incidents = sum(1 for i in active_incidents if i.severity == "MEDIUM")
        
        incident_pts = min(40.0, (crit_incidents * 20.0) + (high_incidents * 10.0) + (med_incidents * 4.0))
        if incident_pts > 0:
            factors.append({
                "factor_name": "Active Safety Incidents",
                "weight": 0.35,
                "contribution_points": incident_pts,
                "details": f"{crit_incidents} critical, {high_incidents} high, {med_incidents} medium open incidents."
            })
        total_score += incident_pts

        # 2. Open Violations & Compliance Breaches
        open_violations = db.query(Violation).filter(
            Violation.mine_id == mine_id,
            Violation.status != "CLOSED"
        ).all()
        
        violation_pts = min(25.0, len(open_violations) * 8.0)
        if violation_pts > 0:
            factors.append({
                "factor_name": "Regulatory Compliance Breaches",
                "weight": 0.25,
                "contribution_points": violation_pts,
                "details": f"{len(open_violations)} statutory violations under remediation."
            })
        total_score += violation_pts

        # 3. Sensor Anomaly Events (Past 24 Hours)
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        recent_anomalies = db.query(AnomalyEvent).filter(
            AnomalyEvent.mine_id == mine_id,
            AnomalyEvent.detected_at >= yesterday
        ).all()
        
        anomaly_pts = min(25.0, len(recent_anomalies) * 6.0)
        if anomaly_pts > 0:
            factors.append({
                "factor_name": "Gas & Environmental Sensor Spikes",
                "weight": 0.25,
                "contribution_points": anomaly_pts,
                "details": f"{len(recent_anomalies)} critical sensor threshold anomalies recorded in the last 24h."
            })
        total_score += anomaly_pts

        # 4. Silence-to-Risk / Reporting Drift Signal
        # Detect if telemetry sensors have not reported in > 30 minutes
        stale_cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)
        stale_sensors = db.query(Sensor).filter(
            Sensor.mine_id == mine_id,
            (Sensor.last_reading_at == None) | (Sensor.last_reading_at < stale_cutoff)
        ).all()
        
        silence_pts = min(20.0, len(stale_sensors) * 4.0)
        if silence_pts > 0:
            factors.append({
                "factor_name": "Silence-to-Risk (Reporting Drift)",
                "weight": 0.15,
                "contribution_points": silence_pts,
                "details": f"{len(stale_sensors)} telemetry nodes exhibiting reporting gaps/silence (>30m dormancy)."
            })
        total_score += silence_pts

        # Clamp total score between 0 and 100
        final_score = min(100.0, max(0.0, total_score))
        
        # Risk Bands: 0–30 LOW, 31–60 MEDIUM, 61–80 HIGH, 81–100 CRITICAL
        if final_score <= 30.0:
            severity = "LOW"
            explanation = "Mine operating within standard safety and compliance parameters. Low telemetry anomalies."
        elif final_score <= 60.0:
            severity = "MEDIUM"
            explanation = "Moderate compliance or operational risks detected. Timely closure of open actions required."
        elif final_score <= 80.0:
            severity = "HIGH"
            explanation = "Elevated danger indicators: gas anomalies, multiple open incidents, or high-risk reporting silence."
        else:
            severity = "CRITICAL"
            explanation = "Severe safety danger! Multiple critical threshold breaches or critical statutory non-compliance. Immediate emergency response mandatory."

        rule_score = incident_pts + violation_pts
        ml_score = anomaly_pts
        silence_risk_score = silence_pts

        # Persist score in database
        risk_record = RiskScore(
            mine_id=mine_id,
            score=final_score,
            severity=severity,
            rule_score=rule_score,
            ml_score=ml_score,
            silence_risk_score=silence_risk_score,
            explanation=explanation,
            model_version="TRINETRA-RISK-v1.0",
            rule_version="DGMS-RULESET-2026.1",
            generated_at=datetime.now(timezone.utc)
        )
        db.add(risk_record)
        db.commit()
        db.refresh(risk_record)

        for f in factors:
            rf = RiskFactor(
                risk_score_id=risk_record.id,
                factor_name=f["factor_name"],
                weight=f["weight"],
                contribution_points=f["contribution_points"],
                details=f["details"]
            )
            db.add(rf)
        db.commit()

        return RiskCalculationResult(
            mine_id=mine_id,
            score=final_score,
            severity=severity,
            rule_score=rule_score,
            ml_score=ml_score,
            silence_risk_score=silence_risk_score,
            explanation=explanation,
            factors=factors
        )

    @staticmethod
    def get_latest_risk_score(db: Session, mine_id: int) -> Optional[RiskScore]:
        return db.query(RiskScore).filter(RiskScore.mine_id == mine_id).order_by(RiskScore.generated_at.desc()).first()
