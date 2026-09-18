from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.authz import get_current_active_user, require_mine_access
from app.models.user import User
from app.schemas.field_operation import (
    FieldInspectionCreate, FieldInspectionUpdate, FieldInspectionRead,
    FieldEvidenceCreate, FieldEvidenceRead,
    SyncBatchRequest, SyncBatchResponse
)
from app.services.field_service import FieldService

router = APIRouter(prefix="/mobile", tags=["Field Operations & Mobile Sync"])

@router.post("/sync", response_model=SyncBatchResponse, status_code=status.HTTP_200_OK)
def sync_field_batch(
    request: SyncBatchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Idempotent batch synchronization endpoint for offline mobile field operations.
    Validates authorizations, records sync logs, and updates inspections, observations, incidents, and evidence.
    """
    return FieldService.process_sync_batch(db, current_user, request)

@router.get("/inspections", response_model=List[dict])
@router.get("/inspections/assigned", response_model=List[dict])
def get_assigned_inspections(
    mine_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Returns assigned field inspections enriched with level, zone, and real-time/predictive risk context."""
    return FieldService.get_inspector_inspections(db, current_user, mine_id)

@router.post("/inspections", status_code=status.HTTP_201_CREATED)
def create_field_inspection(
    data: FieldInspectionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new field inspection."""
    insp = FieldService.create_inspection(db, current_user, data)
    return {"status": "SUCCESS", "inspection_code": insp.inspection_code, "id": insp.id}

@router.put("/inspections/{inspection_id}", status_code=status.HTTP_200_OK)
def update_field_inspection(
    inspection_id: int,
    data: FieldInspectionUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update inspection checklist, notes, and workflow status."""
    insp = FieldService.update_inspection(db, inspection_id, current_user, data)
    return {"status": "SUCCESS", "inspection_code": insp.inspection_code, "id": insp.id}

@router.post("/evidence", status_code=status.HTTP_201_CREATED)
def record_field_evidence(
    data: FieldEvidenceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Record geo-tagged and SHA-256 hashed field evidence."""
    ev = FieldService.save_evidence(db, current_user, data)
    return {"status": "SUCCESS", "evidence_code": ev.evidence_code, "id": ev.id}
