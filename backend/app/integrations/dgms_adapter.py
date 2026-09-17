from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.integrations.base_adapter import BaseExternalAdapter, NormalizedExternalRecord

class DGMSAdapter(BaseExternalAdapter):
    """
    Directorate General of Mines Safety (DGMS) Statutory Safety & Regulatory Adapter.
    Processes statutory safety circulars, standard standing orders, accident alert broadcasts, and central inspection notices.
    """
    def __init__(self, mode: str = "SIMULATED"):
        super().__init__(
            name="DGMS Statutory Regulatory & Safety Directives Adapter",
            source_system="DGMS",
            mode=mode,
            adapter_version="dgms-adapter-v1.0.0"
        )
        self.simulated_latency_ms = 54.0

    def connect(self) -> bool:
        if not self.circuit_breaker.allow_request():
            return False
        return True

    def validate_payload(self, raw_payload: Dict[str, Any]) -> bool:
        required = ["directive_id", "directive_type", "title"]
        for field in required:
            if field not in raw_payload:
                return False
        return True

    def normalize_record(self, raw_payload: Dict[str, Any]) -> NormalizedExternalRecord:
        severity_map = {
            "CRITICAL": "CRITICAL",
            "MANDATORY": "HIGH",
            "ADVISORY": "MEDIUM",
            "INFORMATIONAL": "LOW"
        }
        status_val = str(raw_payload.get("urgency", "ADVISORY")).upper()
        severity = severity_map.get(status_val, "MEDIUM")

        observed_time_str = raw_payload.get("issued_at")
        if observed_time_str:
            try:
                observed_at = datetime.fromisoformat(observed_time_str.replace("Z", "+00:00"))
            except Exception:
                observed_at = datetime.now(timezone.utc)
        else:
            observed_at = datetime.now(timezone.utc)

        lat = raw_payload.get("latitude")
        lng = raw_payload.get("longitude")

        return NormalizedExternalRecord(
            source_system=self.source_system,
            source_record_id=str(raw_payload["directive_id"]),
            source_mode=self.mode,
            event_type=raw_payload.get("directive_type", "STATUTORY_SAFETY_NOTICE"),
            title=raw_payload.get("title", f"DGMS Safety Notice: {raw_payload.get('directive_id')}"),
            description=raw_payload.get("description", "DGMS Coal Mines Regulations Statutory Safety Directive."),
            severity=severity,
            latitude=float(lat) if lat is not None else None,
            longitude=float(lng) if lng is not None else None,
            raw_payload=raw_payload,
            observed_at=observed_at,
            adapter_version=self.adapter_version
        )

    def fetch_records(self, mine_code: Optional[str] = None) -> List[Dict[str, Any]]:
        if not self.circuit_breaker.allow_request():
            raise RuntimeError("Circuit breaker OPEN: DGMS integration gateway unavailable.")

        now_iso = datetime.now(timezone.utc).isoformat()
        records = [
            {
                "directive_id": "DGMS-DIR-2026-CIR-03",
                "directive_type": "STATUTORY_SAFETY_NOTICE",
                "title": "DGMS Technical Circular: Strata Control in High-Depillaring Panels",
                "description": "Mandatory testing of resin-grouted rock bolts every 15m in extraction headings under CMR 2017 Regulation 106.",
                "urgency": "MANDATORY",
                "latitude": 23.7957,
                "longitude": 86.4304,
                "issued_at": now_iso,
                "issuing_authority": "Director General of Mines Safety (Dhanbad HQ)"
            },
            {
                "directive_id": "DGMS-ADV-2026-MON-12",
                "directive_type": "SEASONAL_MONSOON_INUNDATION_ADVISORY",
                "title": "Seasonal Monsoon Inundation & Sump Pumping Preparedness",
                "description": "Pre-monsoon inspection of embankment levees and standby dewatering pumps in open-cast benches.",
                "urgency": "ADVISORY",
                "latitude": 23.7930,
                "longitude": 86.4280,
                "issued_at": now_iso,
                "issuing_authority": "Directorate of Mine Safety (Eastern Zone)"
            }
        ]
        self.last_sync_time = datetime.now(timezone.utc)
        self.circuit_breaker.record_success()
        return records
