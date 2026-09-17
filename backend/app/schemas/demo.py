from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class DemoScenarioStep(BaseModel):
    step_id: int
    step_key: str
    title: str
    description: str
    system_component: str
    expected_state: str
    status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    executed_at: Optional[datetime] = None
    details: Optional[Dict[str, Any]] = None

class DemoScenarioSummary(BaseModel):
    scenario_id: str
    name: str
    category: str
    target_mine_id: str
    target_zone_id: Optional[str] = None
    description: str
    total_steps: int
    current_step_index: int
    status: str  # IDLE, RUNNING, PAUSED, COMPLETED, FAILED
    last_run_id: Optional[str] = None
    last_executed_at: Optional[datetime] = None

class DemoScenarioDetail(DemoScenarioSummary):
    steps: List[DemoScenarioStep]
    key_takeaway: str
    governance_boundary: str

class DemoPreflightItem(BaseModel):
    component: str
    name: str
    status: str  # PASS, WARN, FAIL
    latency_ms: float
    message: str
    is_critical: bool

class DemoPreflightReport(BaseModel):
    is_ready: bool
    overall_status: str  # READY, DEGRADED, NOT_READY
    mode: str
    timestamp: datetime
    checks: List[DemoPreflightItem]
    active_scenario_id: Optional[str] = None

class DemoStepRequest(BaseModel):
    run_id: Optional[str] = None
    force: bool = False

class DemoStepResponse(BaseModel):
    scenario_id: str
    run_id: str
    step_index: int
    step_key: str
    title: str
    status: str
    completed: bool
    next_step_available: bool
    state_updates: Dict[str, Any]
    message: str

class DemoResetRequest(BaseModel):
    scenario_id: Optional[str] = None
    preserve_audit: bool = True

class DemoResetResponse(BaseModel):
    success: bool
    scenario_id: Optional[str] = None
    message: str
    records_reset: Dict[str, int]
    timestamp: datetime
