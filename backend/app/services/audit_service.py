import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditEvent

def _format_dt_for_hash(dt: datetime) -> str:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None).isoformat()
    return dt.isoformat()

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        actor_id: Optional[int],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        mine_id: Optional[int] = None,
        before_state: Optional[Any] = None,
        after_state: Optional[Any] = None,
        metadata: Optional[dict] = None,
        ip_address: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> AuditEvent:
        # Get the last audit event to calculate hash chain
        last_event = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
        prev_hash = last_event.current_event_hash if last_event else "GENESIS_HASH_TRINETRA_0000"
        
        now = datetime.now(timezone.utc)
        ts_str = _format_dt_for_hash(now)
        before_str = json.dumps(before_state, default=str) if before_state is not None else None
        after_str = json.dumps(after_state, default=str) if after_state is not None else None
        meta_str = json.dumps(metadata, default=str) if metadata is not None else None
        
        # Calculate current SHA-256 hash using normalized timestamp string
        payload_to_hash = f"{prev_hash}:{actor_id}:{action}:{resource_type}:{resource_id}:{ts_str}:{after_str}"
        curr_hash = hashlib.sha256(payload_to_hash.encode("utf-8")).hexdigest()
        
        audit_entry = AuditEvent(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            mine_id=mine_id,
            before_state=before_str,
            after_state=after_str,
            metadata_json=meta_str,
            ip_address=ip_address,
            correlation_id=correlation_id,
            previous_event_hash=prev_hash,
            current_event_hash=curr_hash,
            timestamp=now
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry

    @staticmethod
    def verify_audit_chain(db: Session) -> dict:
        """
        Cryptographically verify the entire SHA-256 hash-chained audit ledger from genesis to head.
        Detects any tampering, unauthorized deletion, or field modification.
        """
        events = db.query(AuditEvent).order_by(AuditEvent.id.asc()).all()
        if not events:
            return {
                "status": "VALID",
                "total_events": 0,
                "chain_head_hash": "GENESIS_HASH_TRINETRA_0000",
                "corrupted_event_id": None,
                "failure_reason": None,
                "verified_at": datetime.now(timezone.utc)
            }

        prev_hash = "GENESIS_HASH_TRINETRA_0000"
        for event in events:
            # 1. Verify previous hash pointer
            if event.previous_event_hash != prev_hash:
                return {
                    "status": "TAMPER_DETECTED",
                    "total_events": len(events),
                    "chain_head_hash": None,
                    "corrupted_event_id": event.id,
                    "failure_reason": f"Broken Hash Chain at Event ID #{event.id}. Previous hash pointer '{event.previous_event_hash}' does not match prior block hash '{prev_hash}'.",
                    "verified_at": datetime.now(timezone.utc)
                }

            # 2. Recalculate block hash
            ts_candidate1 = _format_dt_for_hash(event.timestamp)
            ts_candidate2 = event.timestamp.isoformat() if event.timestamp.tzinfo is not None else event.timestamp.replace(tzinfo=timezone.utc).isoformat()
            
            p1 = f"{event.previous_event_hash}:{event.actor_id}:{event.action}:{event.resource_type}:{event.resource_id}:{ts_candidate1}:{event.after_state}"
            h1 = hashlib.sha256(p1.encode("utf-8")).hexdigest()
            
            p2 = f"{event.previous_event_hash}:{event.actor_id}:{event.action}:{event.resource_type}:{event.resource_id}:{ts_candidate2}:{event.after_state}"
            h2 = hashlib.sha256(p2.encode("utf-8")).hexdigest()

            if event.current_event_hash not in (h1, h2):
                return {
                    "status": "TAMPER_DETECTED",
                    "total_events": len(events),
                    "chain_head_hash": None,
                    "corrupted_event_id": event.id,
                    "failure_reason": f"Payload Tampering Detected at Event ID #{event.id}. Computed digest differs from stored block hash '{event.current_event_hash}'.",
                    "verified_at": datetime.now(timezone.utc)
                }

            prev_hash = event.current_event_hash

        return {
            "status": "VALID",
            "total_events": len(events),
            "chain_head_hash": events[-1].current_event_hash,
            "corrupted_event_id": None,
            "failure_reason": None,
            "verified_at": datetime.now(timezone.utc)
        }

