from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.integrations.base_adapter import BaseExternalAdapter, NormalizedExternalRecord

class CMSMSAdapter(BaseExternalAdapter):
    """
    Ministry of Coal's CMSMS (Coal Mine Surveillance and Management System) & Khanan Prahari Adapter.
    Processes GIS boundary satellite alerts, unauthorized mining reports, and citizen reporting signals.
    """
    def __init__(self, mode: str = "SIMULATED"):
        super().__init__(
            name="Ministry of Coal CMSMS / Khanan Prahari Adapter",
            source_system="CMSMS",
            mode=mode,
            adapter_version="cmsms-adapter-v1.0.0"
        )
        self.simulated_latency_ms = 62.5

    def connect(self) -> bool:
        if not self.circuit_breaker.allow_request():
            return False
        return True

    def validate_payload(self, raw_payload: Dict[str, Any]) -> bool:
        required = ["report_id", "report_type", "latitude", "longitude"]
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
            "MAJOR": "HIGH",
            "MODERATE": "MEDIUM",
            "MINOR": "LOW"
        }
        ext_sev = str(raw_payload.get("severity", "MODERATE")).upper()
        severity = severity_map.get(ext_sev, "MEDIUM")

        observed_time_str = raw_payload.get("reported_at")
        if observed_time_str:
            try:
                observed_at = datetime.fromisoformat(observed_time_str.replace("Z", "+00:00"))
            except Exception:
                observed_at = datetime.now(timezone.utc)
        else:
            observed_at = datetime.now(timezone.utc)

        return NormalizedExternalRecord(
            source_system=self.source_system,
            source_record_id=str(raw_payload["report_id"]),
            source_mode=self.mode,
            event_type=raw_payload.get("report_type", "UNAUTHORIZED_MINING_SIGNAL"),
            title=raw_payload.get("title", f"CMSMS Satellite Anomaly: {raw_payload.get('report_id')}"),
            description=raw_payload.get("description", "Khanan Prahari geo-referenced surveillance alert."),
            severity=severity,
            latitude=float(raw_payload["latitude"]),
            longitude=float(raw_payload["longitude"]),
            raw_payload=raw_payload,
            observed_at=observed_at,
            adapter_version=self.adapter_version
        )

    def fetch_records(self, mine_code: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return simulated CMSMS satellite / Khanan Prahari reports."""
        if not self.circuit_breaker.allow_request():
            raise RuntimeError("Circuit breaker OPEN: CMSMS integration gateway unavailable.")

        # Deterministic simulated records based on mine locations
        now_iso = datetime.now(timezone.utc).isoformat()
        records = [
            {
                "report_id": "CMSMS-2026-KP-0491",
                "report_type": "UNAUTHORIZED_MINING_SIGNAL",
                "title": "Suspected Surface Encroachment near Outer Lease Boundary",
                "description": "Satellite optical change detection flagged unexpected excavation machinery movement 150m outside designated quarry fence.",
                "severity": "MAJOR",
                "latitude": 23.7962,
                "longitude": 86.4312,
                "reported_at": now_iso,
                "nodal_officer": "Nodal Officer Area-IV (Coal India / DGMS Central)",
                "verification_status": "UNDER_REVIEW"
            },
            {
                "report_id": "CMSMS-2026-KP-0512",
                "report_type": "CITIZEN_KHANAN_PRAHARI_REPORT",
                "title": "Khanan Prahari App Report: Illegal Coal Loading Track",
                "description": "Mobile user submitted geo-tagged photo of unauthorized tipper truck movement along unpaved boundary track.",
                "severity": "MODERATE",
                "latitude": 23.7941,
                "longitude": 86.4295,
                "reported_at": now_iso,
                "nodal_officer": "Sub-Divisional Magistrate / Mining Officer",
                "verification_status": "REPORTED"
            }
        ]
        self.last_sync_time = datetime.now(timezone.utc)
        self.circuit_breaker.record_success()
        return records
