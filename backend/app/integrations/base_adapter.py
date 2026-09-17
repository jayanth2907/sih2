from abc import ABC, abstractmethod
from datetime import datetime, timezone
import math
import time
from typing import Dict, Any, Optional, List, Tuple
from pydantic import BaseModel

class CircuitState:
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_timeout_sec: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_sec = recovery_timeout_sec
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.last_success_time: Optional[float] = None

    def record_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.last_success_time = time.time()

    def record_failure(self, error: Optional[Exception] = None):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

    def reset(self):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None

    def allow_request(self) -> bool:
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            # Check if recovery timeout has elapsed to allow probe request
            if self.last_failure_time and (time.time() - self.last_failure_time > self.recovery_timeout_sec):
                self.state = CircuitState.HALF_OPEN
                return True
            return False
        if self.state == CircuitState.HALF_OPEN:
            return True
        return True

    def force_state(self, state: str):
        self.state = state
        if state == CircuitState.OPEN:
            self.last_failure_time = time.time()
            self.failure_count = self.failure_threshold
        elif state == CircuitState.CLOSED:
            self.failure_count = 0

class NormalizedExternalRecord(BaseModel):
    source_system: str
    source_record_id: str
    source_mode: str
    event_type: str
    title: str
    description: Optional[str] = None
    severity: str = "MEDIUM"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    raw_payload: Dict[str, Any]
    observed_at: datetime
    adapter_version: str

def calculate_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in meters between two GPS points."""
    R = 6371000  # Radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class BaseExternalAdapter(ABC):
    def __init__(self, name: str, source_system: str, mode: str = "SIMULATED", adapter_version: str = "v1.0.0-simulated"):
        self.name = name
        self.source_system = source_system
        self.mode = mode  # SIMULATED, LIVE, DEMO
        self.adapter_version = adapter_version
        self.circuit_breaker = CircuitBreaker()
        self.last_sync_time: Optional[datetime] = None
        self.last_error: Optional[str] = None
        self.records_processed: int = 0
        self.records_rejected: int = 0
        self.simulated_latency_ms: float = 45.0

    @abstractmethod
    def connect(self) -> bool:
        """Test connection to external provider."""
        pass

    @abstractmethod
    def fetch_records(self, mine_code: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch raw external records."""
        pass

    @abstractmethod
    def validate_payload(self, raw_payload: Dict[str, Any]) -> bool:
        """Validate raw incoming payload against schema."""
        pass

    @abstractmethod
    def normalize_record(self, raw_payload: Dict[str, Any]) -> NormalizedExternalRecord:
        """Normalize external record into canonical TRINETRA structure."""
        pass

    def health(self) -> Dict[str, Any]:
        """Return health status and circuit breaker information."""
        is_healthy = self.circuit_breaker.state == CircuitState.CLOSED
        return {
            "name": self.name,
            "source_system": self.source_system,
            "mode": self.mode,
            "status": "HEALTHY" if is_healthy else ("DEGRADED" if self.circuit_breaker.state == CircuitState.HALF_OPEN else "OFFLINE"),
            "circuit_state": self.circuit_breaker.state,
            "latency_ms": self.simulated_latency_ms,
            "last_sync_time": self.last_sync_time,
            "last_error": self.last_error,
            "records_processed": self.records_processed,
            "records_rejected": self.records_rejected,
            "adapter_version": self.adapter_version
        }

    def provenance(self) -> Dict[str, Any]:
        """Return provenance metadata."""
        return {
            "source_system": self.source_system,
            "source_mode": self.mode,
            "adapter_version": self.adapter_version,
            "disclaimer": "REAL DATA BOUNDARY | UNLESS LIVE CREDENTIALS CONFIGURED, DATA IS PRODUCED VIA DETERMINISTIC ADAPTER SIMULATION"
        }
