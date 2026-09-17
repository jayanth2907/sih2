from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("")
def health_check(db: Session = Depends(get_db)):
    """API and Database connectivity health probe."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "HEALTHY"
    except Exception as e:
        db_status = f"UNHEALTHY: {str(e)}"
        
    return {
        "status": "ONLINE",
        "service": "TRINETRA Core API",
        "version": "1.0.0-phase1",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "telemetry_source_mode": "SIMULATED (Production MQTT/SCADA Ready)"
    }
