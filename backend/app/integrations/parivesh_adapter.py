from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.integrations.base_adapter import BaseExternalAdapter, NormalizedExternalRecord

class PARIVESHAdapter(BaseExternalAdapter):
    """
    Ministry of Environment, Forest and Climate Change (MoEFCC) PARIVESH Portal Adapter.
    Processes Environmental Clearance (EC) geospatial buffer zones, effluent parameters, and afforestation compliance records.
    """
    def __init__(self, mode: str = "SIMULATED"):
        super().__init__(
            name="MoEFCC PARIVESH Environmental Governance Adapter",
            source_system="PARIVESH",
            mode=mode,
            adapter_version="parivesh-adapter-v1.0.0"
        )
        self.simulated_latency_ms = 78.0

    def connect(self) -> bool:
        if not self.circuit_breaker.allow_request():
            return False
        return True

    def validate_payload(self, raw_payload: Dict[str, Any]) -> bool:
        required = ["clearance_id", "observation_type", "latitude", "longitude"]
        for field in required:
            if field not in raw_payload:
                return False
        try:
            lat = float(raw_payload["latitude"])
            lng = float(raw_payload["longitude"])
            if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
                return False
        except (ValueError, TypeError):
            return False
        return True

    def normalize_record(self, raw_payload: Dict[str, Any]) -> NormalizedExternalRecord:
        severity_map = {
            "CRITICAL": "CRITICAL",
            "EXCEEDED": "HIGH",
            "WARNING": "MEDIUM",
            "COMPLIANT": "LOW"
        }
        status_val = str(raw_payload.get("compliance_status", "WARNING")).upper()
        severity = severity_map.get(status_val, "MEDIUM")

        observed_time_str = raw_payload.get("timestamp")
        if observed_time_str:
            try:
                observed_at = datetime.fromisoformat(observed_time_str.replace("Z", "+00:00"))
            except Exception:
                observed_at = datetime.now(timezone.utc)
        else:
            observed_at = datetime.now(timezone.utc)

        return NormalizedExternalRecord(
            source_system=self.source_system,
            source_record_id=str(raw_payload["clearance_id"]),
            source_mode=self.mode,
            event_type=raw_payload.get("observation_type", "ENV_CLEARANCE_BOUNDARY"),
            title=raw_payload.get("title", f"PARIVESH Environmental Record: {raw_payload.get('clearance_id')}"),
            description=raw_payload.get("description", "MoEFCC PARIVESH Environmental GIS Buffer Zone Monitoring."),
            severity=severity,
            latitude=float(raw_payload["latitude"]),
            longitude=float(raw_payload["longitude"]),
            raw_payload=raw_payload,
            observed_at=observed_at,
            adapter_version=self.adapter_version
        )

    def fetch_records(self, mine_code: Optional[str] = None) -> List[Dict[str, Any]]:
        if not self.circuit_breaker.allow_request():
            raise RuntimeError("Circuit breaker OPEN: PARIVESH integration gateway unavailable.")

        now_iso = datetime.now(timezone.utc).isoformat()
        records = [
            {
                "clearance_id": "PARIVESH-EC-2026-JH-883",
                "observation_type": "ENV_CLEARANCE_BOUNDARY",
                "title": "MoEFCC Green Belt Buffer Zone Clearance Verification",
                "description": "50m statutory tree plantation corridor along South-West lease boundary confirmed via geospatial survey.",
                "compliance_status": "COMPLIANT",
                "latitude": 23.7950,
                "longitude": 86.4300,
                "timestamp": now_iso,
                "moefcc_region": "Ranchi Integrated Regional Office"
            },
            {
                "clearance_id": "PARIVESH-AQ-2026-JH-104",
                "observation_type": "AMBIENT_AIR_QUALITY_BENCHMARK",
                "title": "External Ambient PM10 Benchmark Exceedance",
                "description": "Continuous ambient air quality monitoring station at haulage junction recorded PM10 spike of 135 ug/m3.",
                "compliance_status": "WARNING",
                "latitude": 23.7970,
                "longitude": 86.4320,
                "timestamp": now_iso,
                "moefcc_region": "Ranchi Integrated Regional Office"
            }
        ]
        self.last_sync_time = datetime.now(timezone.utc)
        self.circuit_breaker.record_success()
        return records
