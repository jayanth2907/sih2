from typing import List, Optional
from fastapi import APIRouter, Depends, status, Response, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.authz import get_current_active_user, get_user_roles, require_mine_access, require_roles
from app.core.permissions import RoleEnum
from app.models.user import User
from app.schemas.governance import (
    ProductionReportCreate, ProductionReportRead,
    WorkerRead, AttendanceLogCreate, AttendanceRecordRead,
    ContractorRead, ContractRead,
    EnvironmentalObservationCreate, EnvironmentalObservationRead,
    GrievanceCreate, GrievanceUpdate, GrievanceRead,
    ApprovalRequestCreate, ApprovalDecision, ApprovalRequestRead,
    ReportGenerateRequest, RegulatoryReportRead,
    GovernanceTaskCreate, GovernanceTaskRead,
    GovernanceDashboardSummary
)
from app.services.governance_service import GovernanceService

router = APIRouter(prefix="/governance", tags=["Governance & Statutory Compliance"])

# -------------------------------------------------------------
# 1. PRODUCTION REPORTING
# -------------------------------------------------------------
@router.post("/production", response_model=ProductionReportRead, status_code=status.HTTP_201_CREATED)
def submit_production_report(
    payload: ProductionReportCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(payload.mine_id, current_user, db)
    return GovernanceService.create_production_report(
        db=db,
        mine_id=payload.mine_id,
        planned=payload.planned_quantity,
        actual=payload.actual_quantity,
        shift=payload.shift,
        material_type=payload.material_type,
        unit=payload.unit,
        report_date=payload.report_date,
        officer_id=current_user.id,
        notes=payload.notes
    )

@router.get("/production/{mine_id}", response_model=List[ProductionReportRead])
def list_production_reports(
    mine_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(mine_id, current_user, db)
    return GovernanceService.get_production_reports(db, mine_id, limit=limit)

# -------------------------------------------------------------
# 2. WORKFORCE & ATTENDANCE
# -------------------------------------------------------------
@router.get("/workers/{mine_id}", response_model=List[WorkerRead])
def list_workers(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(mine_id, current_user, db)
    return GovernanceService.get_workers(db, mine_id)

@router.post("/attendance", response_model=AttendanceRecordRead, status_code=status.HTTP_201_CREATED)
def mark_attendance(
    payload: AttendanceLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(payload.mine_id, current_user, db)
    return GovernanceService.log_attendance(
        db=db,
        worker_id=payload.worker_id,
        mine_id=payload.mine_id,
        status=payload.status,
        shift_code=payload.shift_code,
        verification_mode=payload.verification_mode,
        marked_by_id=current_user.id,
        notes=payload.notes
    )

@router.get("/attendance/{mine_id}", response_model=List[AttendanceRecordRead])
def get_attendance_roster(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(mine_id, current_user, db)
    return GovernanceService.get_attendance_roster(db, mine_id)

# -------------------------------------------------------------
# 3. CONTRACTORS & CONTRACTS
# -------------------------------------------------------------
@router.get("/contractors", response_model=List[ContractorRead])
def list_contractors(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return GovernanceService.get_contractors(db)

@router.get("/contracts/{mine_id}", response_model=List[ContractRead])
def list_mine_contracts(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(mine_id, current_user, db)
    return GovernanceService.get_contracts(db, mine_id)

# -------------------------------------------------------------
# 4. ENVIRONMENTAL COMPLIANCE & OBSERVATIONS
# -------------------------------------------------------------
@router.get("/environment/observations/{mine_id}", response_model=List[EnvironmentalObservationRead])
def list_environmental_observations(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(mine_id, current_user, db)
    return GovernanceService.get_environmental_observations(db, mine_id)

@router.post("/environment/observations", response_model=EnvironmentalObservationRead, status_code=status.HTTP_201_CREATED)
def create_environmental_observation(
    payload: EnvironmentalObservationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(payload.mine_id, current_user, db)
    return GovernanceService.create_environmental_observation(
        db=db,
        mine_id=payload.mine_id,
        parameter_name=payload.parameter_name,
        observed_value=payload.observed_value,
        threshold_limit=payload.threshold_limit,
        unit=payload.unit,
        severity=payload.severity,
        location_context=payload.location_context,
        x=payload.x or 0.0,
        y=payload.y or 0.0,
        z=payload.z or 0.0,
        action_taken=payload.action_taken
    )

# -------------------------------------------------------------
# 5. GRIEVANCE MANAGEMENT
# -------------------------------------------------------------
@router.post("/grievances", response_model=GrievanceRead, status_code=status.HTTP_201_CREATED)
def submit_grievance(
    payload: GrievanceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(payload.mine_id, current_user, db)
    return GovernanceService.create_grievance(
        db=db,
        mine_id=payload.mine_id,
        category=payload.category,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        anonymous=payload.anonymous,
        user_id=current_user.id
    )

@router.get("/grievances/{mine_id}", response_model=List[GrievanceRead])
def list_mine_grievances(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(mine_id, current_user, db)
    return GovernanceService.get_grievances(db, mine_id)

@router.patch("/grievances/{grievance_id}/status", response_model=GrievanceRead)
def update_grievance_status(
    grievance_id: int,
    payload: GrievanceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return GovernanceService.update_grievance_status(
        db=db,
        grievance_id=grievance_id,
        new_status=payload.status,
        actor_id=current_user.id,
        notes=payload.resolution_notes
    )

# -------------------------------------------------------------
# 6. DIGITAL APPROVAL WORKFLOW
# -------------------------------------------------------------
@router.post("/approvals/request", response_model=ApprovalRequestRead, status_code=status.HTTP_201_CREATED)
def create_approval_request(
    payload: ApprovalRequestCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(payload.mine_id, current_user, db)
    return GovernanceService.create_approval_request(
        db=db,
        mine_id=payload.mine_id,
        resource_type=payload.resource_type,
        resource_id=payload.resource_id,
        title=payload.title,
        requester_id=current_user.id,
        required_role=payload.required_role,
        description=payload.description
    )

@router.post("/approvals/{request_id}/decision", response_model=ApprovalRequestRead)
def process_approval_decision(
    request_id: int,
    payload: ApprovalDecision,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_roles = get_user_roles(current_user, db)
    return GovernanceService.process_approval_decision(
        db=db,
        request_id=request_id,
        actor=current_user,
        user_roles=user_roles,
        action=payload.action,
        comments=payload.comments
    )

@router.get("/approvals/{mine_id}", response_model=List[ApprovalRequestRead])
def list_mine_approvals(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(mine_id, current_user, db)
    from app.models.approval import ApprovalRequest
    return db.query(ApprovalRequest).filter(ApprovalRequest.mine_id == mine_id).order_by(ApprovalRequest.created_at.desc()).all()

# -------------------------------------------------------------
# 7. REGULATORY REPORT GENERATION & PDF DOWNLOAD
# -------------------------------------------------------------
@router.post("/reports/generate", response_model=RegulatoryReportRead, status_code=status.HTTP_201_CREATED)
def generate_regulatory_report(
    payload: ReportGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(payload.mine_id, current_user, db)
    return GovernanceService.generate_report(
        db=db,
        mine_id=payload.mine_id,
        report_type=payload.report_type,
        title=payload.title,
        period_start=payload.reporting_period_start,
        period_end=payload.reporting_period_end,
        user_id=current_user.id
    )

@router.get("/reports/{mine_id}", response_model=List[RegulatoryReportRead])
def list_mine_reports(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(mine_id, current_user, db)
    from app.models.report import RegulatoryReport
    return db.query(RegulatoryReport).filter(RegulatoryReport.mine_id == mine_id).order_by(RegulatoryReport.generated_at.desc()).all()

@router.get("/reports/{report_id}/pdf")
def download_report_pdf(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    pdf_bytes = GovernanceService.get_report_pdf_bytes(db, report_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=TRINETRA_Statutory_Report_{report_id}.pdf"}
    )

# -------------------------------------------------------------
# 8. UNIFIED GOVERNANCE DASHBOARD SUMMARY & TASKS
# -------------------------------------------------------------
@router.get("/summary/{mine_id}", response_model=GovernanceDashboardSummary)
def get_governance_summary(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(mine_id, current_user, db)
    return GovernanceService.get_governance_dashboard_summary(db, mine_id)

@router.get("/tasks/{mine_id}", response_model=List[GovernanceTaskRead])
def list_governance_tasks(
    mine_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    require_mine_access(mine_id, current_user, db)
    from app.models.governance_task import GovernanceTask
    return db.query(GovernanceTask).filter(GovernanceTask.mine_id == mine_id).order_by(GovernanceTask.created_at.desc()).all()
