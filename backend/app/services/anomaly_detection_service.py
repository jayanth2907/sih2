from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.sensor import Sensor, SensorReading
from app.models.risk import AnomalyEvent

class AnomalyEvaluationResult:
    def __init__(
        self,
        is_anomaly: bool,
        anomaly_type: Optional[str] = None,
        severity: str = "LOW",
        explanation: str = "",
        observed_value: Optional[float] = None,
        expected_range: Optional[str] = None,
        threshold_limit: Optional[float] = None,
        status: str = "ACTIVE"
    ):
        self.is_anomaly = is_anomaly
        self.anomaly_type = anomaly_type
        self.severity = severity
        self.explanation = explanation
        self.observed_value = observed_value
        self.expected_range = expected_range
        self.threshold_limit = threshold_limit
        self.status = status

class AnomalyDetectionService:
    @staticmethod
    def evaluate_reading(
        db: Session,
        sensor: Sensor,
        current_value: float,
        unit: str,
        timestamp: datetime
    ) -> AnomalyEvaluationResult:
        # Expected baseline range
        min_norm = sensor.normal_min if sensor.normal_min is not None else 0.0
        max_norm = sensor.normal_max if sensor.normal_max is not None else sensor.warning_threshold
        expected_range_str = f"{min_norm:.2f} - {max_norm:.2f} {unit}"

        # Fetch recent readings for trend / spike calculation (last 5 readings)
        recent_readings = (
            db.query(SensorReading)
            .filter(SensorReading.sensor_id == sensor.id)
            .order_by(SensorReading.timestamp.desc())
            .limit(5)
            .all()
        )

        last_val = recent_readings[0].value if recent_readings else sensor.last_value

        # 1. Critical Threshold Exceeded
        if current_value >= sensor.critical_threshold:
            return AnomalyEvaluationResult(
                is_anomaly=True,
                anomaly_type="THRESHOLD_EXCEEDED",
                severity="CRITICAL",
                explanation=f"{sensor.name} ({sensor.sensor_code}) exceeded critical threshold: {current_value:.2f} {unit} >= {sensor.critical_threshold:.2f} {unit}.",
                observed_value=current_value,
                expected_range=expected_range_str,
                threshold_limit=sensor.critical_threshold,
                status="ACTIVE"
            )

        # 2. Warning Threshold Exceeded
        if current_value >= sensor.warning_threshold:
            return AnomalyEvaluationResult(
                is_anomaly=True,
                anomaly_type="THRESHOLD_EXCEEDED",
                severity="WARNING",
                explanation=f"{sensor.name} ({sensor.sensor_code}) exceeded warning threshold: {current_value:.2f} {unit} >= {sensor.warning_threshold:.2f} {unit}.",
                observed_value=current_value,
                expected_range=expected_range_str,
                threshold_limit=sensor.warning_threshold,
                status="ACTIVE"
            )

        # 3. Sudden Spike Detection (Delta > 40% of warning threshold in one step)
        if last_val is not None:
            delta = current_value - last_val
            spike_threshold = sensor.warning_threshold * 0.40
            if delta >= spike_threshold and current_value > max_norm:
                return AnomalyEvaluationResult(
                    is_anomaly=True,
                    anomaly_type="SUDDEN_SPIKE",
                    severity="HIGH" if current_value >= sensor.warning_threshold else "MEDIUM",
                    explanation=f"Rapid surge detected on {sensor.sensor_code}: value jumped by +{delta:.2f} {unit} from previous reading {last_val:.2f} {unit}.",
                    observed_value=current_value,
                    expected_range=expected_range_str,
                    threshold_limit=sensor.warning_threshold,
                    status="ACTIVE"
                )

        # 3. Sudden Drop Detection (e.g. Ventilation air velocity crash)
        if last_val is not None:
            drop = last_val - current_value
            if drop >= (sensor.warning_threshold * 0.45) and (sensor.normal_min is not None and current_value < sensor.normal_min):
                return AnomalyEvaluationResult(
                    is_anomaly=True,
                    anomaly_type="SUDDEN_DROP",
                    severity="HIGH",
                    explanation=f"Sudden collapse observed on {sensor.sensor_code}: dropped by -{drop:.2f} {unit} below baseline range.",
                    observed_value=current_value,
                    expected_range=expected_range_str,
                    threshold_limit=sensor.normal_min,
                    status="ACTIVE"
                )

        # 4. Rapid Upward Trend (3 consecutive increasing values above baseline)
        if len(recent_readings) >= 3:
            vals = [r.value for r in recent_readings[:3]] # [t-0, t-1, t-2]
            if current_value > vals[0] > vals[1] > max_norm:
                return AnomalyEvaluationResult(
                    is_anomaly=True,
                    anomaly_type="RAPID_UPWARD_TREND",
                    severity="MEDIUM",
                    explanation=f"Continuous upward drift recorded on {sensor.sensor_code} across consecutive telemetry ticks.",
                    observed_value=current_value,
                    expected_range=expected_range_str,
                    threshold_limit=sensor.warning_threshold,
                    status="ACTIVE"
                )

        # 5. Warning Threshold Exceeded
        if current_value >= sensor.warning_threshold:
            return AnomalyEvaluationResult(
                is_anomaly=True,
                anomaly_type="THRESHOLD_EXCEEDED",
                severity="WARNING",
                explanation=f"{sensor.name} ({sensor.sensor_code}) exceeded warning threshold: {current_value:.2f} {unit} >= {sensor.warning_threshold:.2f} {unit}.",
                observed_value=current_value,
                expected_range=expected_range_str,
                threshold_limit=sensor.warning_threshold,
                status="ACTIVE"
            )

        # 6. Check if Recovering from existing active anomaly
        existing_anomaly = (
            db.query(AnomalyEvent)
            .filter(
                AnomalyEvent.sensor_id == sensor.id,
                AnomalyEvent.status.in_(["ACTIVE", "RECOVERING"])
            )
            .order_by(AnomalyEvent.detected_at.desc())
            .first()
        )

        if existing_anomaly and current_value < sensor.warning_threshold:
            return AnomalyEvaluationResult(
                is_anomaly=False,
                anomaly_type="RECOVERING",
                severity="LOW",
                explanation=f"{sensor.sensor_code} stabilized below warning limits: {current_value:.2f} {unit}.",
                observed_value=current_value,
                expected_range=expected_range_str,
                threshold_limit=sensor.warning_threshold,
                status="RECOVERING"
            )

        return AnomalyEvaluationResult(
            is_anomaly=False,
            severity="LOW",
            explanation="Normal operational baseline.",
            observed_value=current_value,
            expected_range=expected_range_str,
            status="NORMAL"
        )

    @staticmethod
    def detect_sensor_silence(
        db: Session,
        mine_id: int,
        dormancy_minutes: int = 20
    ) -> List[AnomalyEvent]:
        """Detects sensors that have stopped sending readings beyond configured interval"""
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=dormancy_minutes)
        silent_sensors = (
            db.query(Sensor)
            .filter(
                Sensor.mine_id == mine_id,
                (Sensor.last_reading_at == None) | (Sensor.last_reading_at < cutoff)
            )
            .all()
        )

        offline_anomalies = []
        for s in silent_sensors:
            # Check if active SENSOR_OFFLINE anomaly already exists (deduplication)
            existing = (
                db.query(AnomalyEvent)
                .filter(
                    AnomalyEvent.sensor_id == s.id,
                    AnomalyEvent.anomaly_type == "SENSOR_OFFLINE",
                    AnomalyEvent.status == "ACTIVE"
                )
                .first()
            )
            if not existing:
                s.status = "OFFLINE"
                anomaly = AnomalyEvent(
                    mine_id=s.mine_id,
                    sensor_id=s.id,
                    level_id=s.level_id,
                    zone_id=s.zone_id,
                    anomaly_type="SENSOR_OFFLINE",
                    severity="MEDIUM",
                    observed_value=None,
                    expected_range=f"Heartbeat <= {dormancy_minutes}m",
                    threshold_limit=float(dormancy_minutes),
                    unit="minutes",
                    description=f"Sensor {s.sensor_code} ({s.name}) is exhibiting telemetry silence. No data received for >{dormancy_minutes} minutes.",
                    x=s.x,
                    y=s.y,
                    z=s.z,
                    source="SIMULATED",
                    status="ACTIVE",
                    detected_at=datetime.now(timezone.utc)
                )
                db.add(anomaly)
                offline_anomalies.append(anomaly)
        
        if offline_anomalies:
            db.commit()
            for a in offline_anomalies:
                db.refresh(a)

        return offline_anomalies
