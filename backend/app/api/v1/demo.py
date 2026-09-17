from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.core.exceptions import PermissionDeniedError, BusinessRuleViolationError
from app.core.authz import get_current_active_user, get_user_roles
from app.models.user import User
from app.schemas.demo import (
    DemoScenarioSummary, DemoScenarioDetail, DemoPreflightReport,
    DemoStepResponse, DemoStepRequest, DemoResetResponse, DemoResetRequest
)
from app.services.demo_scenario_service import DemoScenarioService

router = APIRouter(prefix="/demo", tags=["SIH Demo Scenario Engine"])

def verify_demo_mode_guard():
    """Safety guard: prevents demo orchestration endpoints from mutating non-demo environments"""
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo Engine disabled: DEMO_MODE is not enabled in server configuration."
        )

def require_admin_or_safety(user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    roles = get_user_roles(user, db)
    if "SYSTEM_ADMIN" not in roles and "MINE_SAFETY_OFFICER" not in roles and not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin or Safety Officer role required for global demo reset."
        )
    return user

@router.get("/preflight", response_model=DemoPreflightReport)
def get_demo_preflight_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Executes a pre-flight system check across Database, Telemetry, Predictive ML,
    3D Spatial Twin, AI Copilot, Audit Ledger, and External Adapters.
    """
    verify_demo_mode_guard()
    return DemoScenarioService.get_preflight_report(db)

@router.get("/scenarios", response_model=List[DemoScenarioSummary])
def list_demo_scenarios(
    current_user: User = Depends(get_current_active_user)
):
    """Lists all available deterministic SIH demonstration scenarios and their active progress."""
    verify_demo_mode_guard()
    return DemoScenarioService.get_all_scenarios()

@router.get("/scenarios/{scenario_id}", response_model=DemoScenarioDetail)
def get_demo_scenario_detail(
    scenario_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Retrieves step-by-step definition, current progress, and governance boundaries for a scenario."""
    verify_demo_mode_guard()
    return DemoScenarioService.get_scenario_detail(scenario_id)

@router.post("/scenarios/{scenario_id}/step", response_model=DemoStepResponse)
def execute_scenario_step(
    scenario_id: str,
    payload: Optional[DemoStepRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Executes the next sequential event in the scenario timeline deterministically.
    Idempotent on repeated calls with the same run identifier.
    """
    verify_demo_mode_guard()
    run_id = payload.run_id if payload else None
    force = payload.force if payload else False
    return DemoScenarioService.execute_next_step(db, scenario_id, run_id=run_id, force=force)

@router.post("/scenarios/{scenario_id}/run-all", response_model=List[DemoStepResponse])
def run_all_scenario_steps(
    scenario_id: str,
    payload: Optional[DemoStepRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Fast-forwards and executes all sequential steps in the scenario in controlled order."""
    verify_demo_mode_guard()
    run_id = payload.run_id if payload else None
    return DemoScenarioService.run_all_steps(db, scenario_id, run_id=run_id)

@router.post("/scenarios/{scenario_id}/reset", response_model=DemoResetResponse)
def reset_single_scenario(
    scenario_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Resets the state of a single scenario to baseline without affecting other entities."""
    verify_demo_mode_guard()
    return DemoScenarioService.reset_scenario(db, scenario_id=scenario_id)

@router.post("/reset-all", response_model=DemoResetResponse)
def reset_all_demo_data(
    payload: Optional[DemoResetRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_safety)
):
    """
    Global demo reset: Restores scenario states, resets circuit breakers, and re-establishes baseline.
    Protected by SUPER_ADMIN / SAFETY_OFFICER role validation and DEMO_MODE safety guard.
    """
    verify_demo_mode_guard()
    return DemoScenarioService.reset_scenario(db, scenario_id=None)
