import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.integrations.base_adapter import BaseExternalAdapter, calculate_distance_meters, CircuitState
from app.integrations.cmsms_adapter import CMSMSAdapter
from app.integrations.parivesh_adapter import PARIVESHAdapter
from app.integrations.dgms_adapter import DGMSAdapter
from app.models.external_integration import ExternalEventLog
from app.models.mine import Mine
from app.models.spatial import MineZone
from app.services.audit_service import AuditService

class IntegrationGateway:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(IntegrationGateway, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.adapters: Dict[str, BaseExternalAdapter] = {
            "CMSMS": CMSMSAdapter(mode="SIMULATED"),
            "PARIVESH": PARIVESHAdapter(mode="SIMULATED"),
            "DGMS": DGMSAdapter(mode="SIMULATED")
        }
        self._initialized = True

    def get_adapter(self, source_system: str) -> Optional[BaseExternalAdapter]:
        return self.adapters.get(source_system.upper())

    def get_all_health(self) -> List[Dict[str, Any]]:
        health_list = []
        for adapter in self.adapters.values():
            health_list.append(adapter.health())
        return health_list

    def match_spatial_location(self, lat: Optional[float], lng: Optional[float], target_mine: Optional[Mine], db: Session) -> Tuple[str, Optional[int], Optional[int], Optional[float]]:
        """
        Match external coordinates against mines and zones.
        Returns: (spatial_match_status, matched_mine_id, matched_zone_id, distance_meters)
        """
        if lat is None or lng is None:
            return ("OUTSIDE_KNOWN_MINE", target_mine.id if target_mine else None, None, None)

        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            return ("INVALID_COORDINATE", None, None, None)

        # Check against target mine first if provided
        mines_to_check = [target_mine] if target_mine else db.query(Mine).all()
        best_match_mine = None
        min_distance = float('inf')

        for m in mines_to_check:
            if m and m.latitude is not None and m.longitude is not None:
                dist = calculate_distance_meters(lat, lng, m.latitude, m.longitude)
                if dist < min_distance:
                    min_distance = dist
                    best_match_mine = m

        # Within 5km boundary is considered matched to the mine
        if best_match_mine and min_distance <= 5000:
            # Find closest zone in this mine if zones exist
            matched_zone_id = None
            zones = db.query(MineZone).filter(MineZone.mine_id == best_match_mine.id).all()
            if zones:
                matched_zone_id = zones[0].id  # associate with primary zone

            return ("MATCHED", best_match_mine.id, matched_zone_id, round(min_distance, 2))

        return ("OUTSIDE_KNOWN_MINE", target_mine.id if target_mine else None, None, round(min_distance, 2) if min_distance != float('inf') else None)

    def sync_adapter(self, source_system: str, mine_id: Optional[int], db: Session) -> Dict[str, Any]:
        adapter = self.get_adapter(source_system)
        if not adapter:
            raise ValueError(f"Unknown integration source system: {source_system}")

        mine = db.query(Mine).filter(Mine.id == mine_id).first() if mine_id else None
        mine_code = mine.code if mine else None

        try:
            raw_records = adapter.fetch_records(mine_code=mine_code)
        except Exception as e:
            adapter.last_error = str(e)
            adapter.circuit_breaker.record_failure(e)
            return {
                "source_system": source_system,
                "status": "FAILED",
                "error": str(e),
                "records_imported": 0,
                "records_rejected": 0
            }

        imported_cnt = 0
        rejected_cnt = 0

        for raw in raw_records:
            if not adapter.validate_payload(raw):
                rejected_cnt += 1
                adapter.records_rejected += 1
                continue

            try:
                norm = adapter.normalize_record(raw)
            except Exception:
                rejected_cnt += 1
                adapter.records_rejected += 1
                continue

            # Compute SHA-256 hash of canonical raw payload
            raw_str = json.dumps(norm.raw_payload, sort_keys=True, default=str)
            payload_hash = hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

            # Idempotency check: (source_system, source_record_id)
            existing = db.query(ExternalEventLog).filter(
                ExternalEventLog.source_system == norm.source_system,
                ExternalEventLog.source_record_id == norm.source_record_id
            ).first()

            if existing:
                # Deduplicate: do not create duplicate rows
                adapter.records_processed += 1
                continue

            # Geospatial Matching
            match_status, matched_mine_id, matched_zone_id, distance = self.match_spatial_location(
                norm.latitude, norm.longitude, mine, db
            )

            # Generate unique event ID
            event_id = f"EXT-{norm.source_system}-{norm.source_record_id}-{int(datetime.now().timestamp())}"

            event_log = ExternalEventLog(
                event_id=event_id,
                source_system=norm.source_system,
                source_record_id=norm.source_record_id,
                source_mode=norm.source_mode,
                event_type=norm.event_type,
                mine_id=matched_mine_id,
                zone_id=matched_zone_id,
                title=norm.title,
                description=norm.description,
                severity=norm.severity,
                latitude=norm.latitude,
                longitude=norm.longitude,
                spatial_match_status=match_status,
                distance_to_mine_meters=distance,
                raw_payload_hash=payload_hash,
                status="RECEIVED",
                adapter_version=norm.adapter_version,
                received_at=norm.observed_at,
                processed_at=datetime.now(timezone.utc)
            )

            db.add(event_log)
            db.commit()
            db.refresh(event_log)

            # Audit event creation
            AuditService.log_event(
                db=db,
                actor_id=None,  # SYSTEM/INTEGRATION
                action=f"EXTERNAL_{norm.source_system}_INGESTED",
                resource_type="EXTERNAL_INTEGRATION",
                resource_id=event_id,
                mine_id=matched_mine_id,
                after_state={
                    "source_system": norm.source_system,
                    "source_record_id": norm.source_record_id,
                    "event_type": norm.event_type,
                    "spatial_match_status": match_status,
                    "raw_payload_hash": payload_hash
                },
                metadata={
                    "adapter_version": norm.adapter_version,
                    "mode": norm.source_mode,
                    "provenance": adapter.provenance()
                }
            )

            imported_cnt += 1
            adapter.records_processed += 1

        adapter.last_sync_time = datetime.now(timezone.utc)
        return {
            "source_system": source_system,
            "status": "SUCCESS",
            "records_imported": imported_cnt,
            "records_rejected": rejected_cnt,
            "adapter_mode": adapter.mode,
            "circuit_state": adapter.circuit_breaker.state
        }

gateway = IntegrationGateway()
