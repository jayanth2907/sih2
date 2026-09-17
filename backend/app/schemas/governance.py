from typing import List, Optional, Any, Dict
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict

# --- Production Schemas ---
class ProductionReportCreate(BaseModel):
    mine_id: int
    report_date: Optional[date] = None
    shift: str = "A"
    material_type: str = "COAL_RAW"
    planned_quantity: float
    actual_quantity: float
    unit: str = "TONNES"
    notes: Optional[str] = None

class ProductionReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    report_code: str
    mine_id: int
    report_date: date
    shift: str
    material_type: str
    planned_quantity: float
    actual_quantity: float
    unit: str
    variance_quantity: float
    variance_percentage: float
    status: str
    deviation_flag: str
    reporting_officer_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

# --- Workforce & Attendance Schemas ---
class WorkerCreate(BaseModel):
    mine_id: int
    worker_code: str
    full_name: str
    designation: str
    trade_category: str = "MINER"
    contractor_id: Optional[int] = None
    is_contractual: bool = False
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None

class WorkerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    worker_code: str
    full_name: str
    designation: str
    trade_category: str
    mine_id: int
    contractor_id: Optional[int] = None
    is_contractual: bool
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    status: str
    created_at: datetime

class AttendanceLogCreate(BaseModel):
    worker_id: int
    mine_id: int
    shift_code: str = "A"
    status: str = "PRESENT" # PRESENT, ABSENT, LATE, ON_LEAVE
    verification_mode: str = "SIMULATED"
    notes: Optional[str] = None

class AttendanceRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    worker_id: int
    mine_id: int
    attendance_date: date
    status: str
    verification_mode: str
    check_in_time: Optional[datetime] = None
    created_at: datetime
    worker_name: Optional[str] = None
    worker_code: Optional[str] = None

# --- Contractor Schemas ---
class ContractorCreate(BaseModel):
    contractor_code: str
    company_name: str
    registration_number: str
    contact_person: str
    email: str
    phone: str
    pan_number: Optional[str] = None
    gst_number: Optional[str] = None

class ContractorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    contractor_code: str
    company_name: str
    registration_number: str
    contact_person: str
    email: str
    phone: str
    safety_rating: float
    status: str
    created_at: datetime

class ContractCreate(BaseModel):
    contractor_id: int
    mine_id: int
    contract_code: str
    work_scope: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    total_value: float

class ContractRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    contract_code: str
    contractor_id: int
    mine_id: int
    work_scope: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    total_value: float
    status: str
    compliance_status: str
    created_at: datetime
    contractor_name: Optional[str] = None

# --- Environmental Schemas ---
class EnvironmentalObservationCreate(BaseModel):
    mine_id: int
    parameter_name: str
    observed_value: float
    threshold_limit: float
    unit: str
    severity: str = "MEDIUM"
    location_context: Optional[str] = None
    x: Optional[float] = 0.0
    y: Optional[float] = 0.0
    z: Optional[float] = 0.0
    action_taken: Optional[str] = None

class EnvironmentalObservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    mine_id: int
    parameter_name: str
    observed_value: float
    threshold_limit: float
    unit: str
    severity: str
    status: str
    location_context: Optional[str] = None
    x: float
    y: float
    z: float
    detected_at: datetime

# --- Grievance Schemas ---
class GrievanceCreate(BaseModel):
    mine_id: int
    category: str = "SAFETY"
    title: str
    description: str
    priority: str = "MEDIUM"
    anonymous: bool = False

class GrievanceUpdate(BaseModel):
    status: str
    resolution_notes: Optional[str] = None
    assigned_to_id: Optional[int] = None

class GrievanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    grievance_code: str
    mine_id: int
    category: str
    title: str
    description: str
    priority: str
    status: str
    anonymous: bool
    sla_hours: int
    due_at: datetime
    is_escalated: bool
    resolution_notes: Optional[str] = None
    created_at: datetime
    submitted_by_name: Optional[str] = None

# --- Digital Approvals Schemas ---
class ApprovalRequestCreate(BaseModel):
    resource_type: str
    resource_id: str
    mine_id: int
    title: str
    description: Optional[str] = None
    required_role: str = "MINE_MANAGER"

class ApprovalDecision(BaseModel):
    action: str # APPROVE, REJECT, REQUEST_CHANGES
    comments: Optional[str] = None

class ApprovalRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    request_code: str
    resource_type: str
    resource_id: str
    mine_id: int
    title: str
    description: Optional[str] = None
    requester_id: int
    required_role: str
    status: str
    created_at: datetime
    requester_name: Optional[str] = None

# --- Regulatory Report Schemas ---
class ReportGenerateRequest(BaseModel):
    mine_id: int
    report_type: str # COMPLIANCE_SUMMARY, SAFETY_INSPECTION_SUMMARY, INCIDENT_SUMMARY, ENVIRONMENTAL_SUMMARY, PRODUCTION_SUMMARY, MINE_GOVERNANCE_SUMMARY
    title: str
    reporting_period_start: date
    reporting_period_end: date

class RegulatoryReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    report_code: str
    mine_id: int
    report_type: str
    title: str
    reporting_period_start: date
    reporting_period_end: date
    status: str
    current_version: int
    generated_at: datetime
    generated_by_id: int
    summary_data: Optional[Dict[str, Any]] = None

# --- Governance Task & SLA Schemas ---
class GovernanceTaskCreate(BaseModel):
    mine_id: int
    domain: str = "SAFETY"
    title: str
    description: str
    priority: str = "MEDIUM"
    assignee_id: Optional[int] = None
    due_at: datetime
    source_resource_type: Optional[str] = None
    source_resource_id: Optional[str] = None

class GovernanceTaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    task_code: str
    mine_id: int
    domain: str
    title: str
    description: str
    priority: str
    status: str
    sla_status: str
    due_at: datetime
    escalation_level: int
    assignee_id: Optional[int] = None
    created_at: datetime

# --- Unified Governance Dashboard Summary ---
class GovernanceDashboardSummary(BaseModel):
    mine_id: int
    mine_name: str
    production_today_tonnes: float
    production_planned_tonnes: float
    production_variance_pct: float
    attendance_headcount: int
    attendance_present_pct: float
    active_contracts: int
    contracts_expiring_soon: int
    open_environmental_observations: int
    open_grievances: int
    grievances_sla_breached: int
    pending_approvals: int
    reports_generated_month: int
    open_governance_tasks: int
    governance_risk_score: float
    governance_risk_severity: str
