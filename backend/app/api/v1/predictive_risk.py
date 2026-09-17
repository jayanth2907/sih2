from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.core.authz import get_current_active_user, require_mine_access, get_user_roles
from app.schemas.predictive_risk import (
    PredictiveRiskSummary,
    RiskPredictionRead,
    MLModelRead
)
from app.services.predictive_risk_service import PredictiveRiskService

router = APIRouter(prefix="/predictive-risk", tags=["Predictive AI/ML Risk Intelligence"])

@router.post("/evaluate/{mine_id}", response_model=PredictiveRiskSummary)
def evaluate_mine_predictive_risk(
    mine_id: int,
    zone_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates forward-looking ML risk intelligence for the selected mine over a 30-minute horizon.
    Enforces tenant mine scoping and RBAC authorization.
    """
    require_mine_access(mine_id, current_user, db)
    return PredictiveRiskService.generate_prediction(
        db=db,
        mine_id=mine_id,
        zone_id=zone_id
    )

@router.get("/latest/{mine_id}", response_model=PredictiveRiskSummary)
def get_latest_predictive_risk(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the latest forward-looking ML risk intelligence prediction for a mine.
    """
    require_mine_access(mine_id, current_user, db)
    return PredictiveRiskService.generate_prediction(
        db=db,
        mine_id=mine_id
    )

@router.get("/history/{mine_id}", response_model=List[RiskPredictionRead])
def get_predictions_history(
    mine_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves historical predictions log with input feature snapshots and attributions for audit.
    """
    require_mine_access(mine_id, current_user, db)
    return PredictiveRiskService.get_predictions_history(db, mine_id, limit)

@router.get("/models", response_model=List[MLModelRead])
def list_registered_ml_models(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lists registered ML models, validation benchmarks, and metadata.
    """
    return PredictiveRiskService.get_registered_models(db)

@router.get("/health")
def get_model_health(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns lightweight model operational health, feature availability, and inference statistics.
    """
    return PredictiveRiskService.get_model_health_summary(db)
