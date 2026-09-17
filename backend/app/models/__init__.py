from app.db.base import Base
from app.models.role import Role, Permission, UserRole, role_permissions
from app.models.user import User, UserMineAssignment
from app.models.mine import Mine
from app.models.spatial import MineLevel, MineZone
from app.models.sensor import SensorType, Sensor, SensorReading
from app.models.camera import Camera
from app.models.equipment import Equipment
from app.models.incident import Incident, IncidentEvent
from app.models.violation import Violation, CorrectiveAction, Escalation
from app.models.risk import RiskScore, RiskFactor, AnomalyEvent
from app.models.alert import Alert
from app.models.document import Document, ExtractedDocumentField
from app.models.audit import AuditEvent
from app.models.notification import Notification
from app.models.production import ProductionReport
from app.models.workforce import Worker, Shift, AttendanceRecord
from app.models.contractor import Contractor, Contract, ContractRequirement
from app.models.environmental import EnvironmentalRule, EnvironmentalObservation
from app.models.grievance import Grievance
from app.models.approval import ApprovalRequest, ApprovalAction
from app.models.report import RegulatoryReport, ReportVersion
from app.models.governance_task import GovernanceTask
from app.models.risk_prediction import RiskPrediction
from app.models.ml_registry import MLModelRegistry
from app.models.copilot import CopilotHistory
from app.models.field_operation import FieldInspection, FieldEvidence, FieldSyncLog
from app.models.external_integration import ExternalEventLog

__all__ = [
    "Base",
    "Role",
    "Permission",
    "UserRole",
    "role_permissions",
    "User",
    "UserMineAssignment",
    "Mine",
    "MineLevel",
    "MineZone",
    "SensorType",
    "Sensor",
    "SensorReading",
    "Camera",
    "Equipment",
    "Incident",
    "IncidentEvent",
    "Violation",
    "CorrectiveAction",
    "Escalation",
    "RiskScore",
    "RiskFactor",
    "AnomalyEvent",
    "Alert",
    "Document",
    "ExtractedDocumentField",
    "AuditEvent",
    "Notification",
    "ProductionReport",
    "Worker",
    "Shift",
    "AttendanceRecord",
    "Contractor",
    "Contract",
    "ContractRequirement",
    "EnvironmentalRule",
    "EnvironmentalObservation",
    "Grievance",
    "ApprovalRequest",
    "ApprovalAction",
    "RegulatoryReport",
    "ReportVersion",
    "GovernanceTask",
    "RiskPrediction",
    "MLModelRegistry",
    "CopilotHistory",
    "FieldInspection",
    "FieldEvidence",
    "FieldSyncLog"
]
