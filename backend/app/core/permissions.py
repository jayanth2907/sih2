from enum import Enum

class RoleEnum(str, Enum):
    SYSTEM_ADMIN = "SYSTEM_ADMIN"
    MINE_MANAGER = "MINE_MANAGER"
    MINE_SAFETY_OFFICER = "MINE_SAFETY_OFFICER"
    FIELD_INSPECTOR = "FIELD_INSPECTOR"
    CONTRACTOR_MANAGER = "CONTRACTOR_MANAGER"
    REGULATOR = "REGULATOR"

class PermissionEnum(str, Enum):
    # Mine
    MINE_VIEW_ALL = "mine:view_all"
    MINE_VIEW_ASSIGNED = "mine:view_assigned"
    MINE_CREATE = "mine:create"
    MINE_UPDATE = "mine:update"
    
    # Sensors & Telemetry
    SENSOR_VIEW = "sensor:view"
    SENSOR_MANAGE = "sensor:manage"
    TELEMETRY_INGEST = "telemetry:ingest"
    
    # Cameras
    CAMERA_VIEW = "camera:view"
    CAMERA_MANAGE = "camera:manage"
    
    # Inspections & Observations
    INSPECTION_CREATE = "inspection:create"
    INSPECTION_VIEW = "inspection:view"
    INSPECTION_SUBMIT = "inspection:submit"
    
    # Incidents & Violations
    INCIDENT_CREATE = "incident:create"
    INCIDENT_VIEW = "incident:view"
    INCIDENT_UPDATE = "incident:update"
    INCIDENT_ASSIGN = "incident:assign"
    INCIDENT_VERIFY = "incident:verify"
    INCIDENT_CLOSE = "incident:close"
    
    VIOLATION_VIEW = "violation:view"
    VIOLATION_CREATE = "violation:create"
    VIOLATION_RESOLVE = "violation:resolve"
    
    # Risk & Governance
    RISK_VIEW = "risk:view"
    AUDIT_VIEW = "audit:view"
    USERS_MANAGE = "users:manage"

class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    TRIAGED = "TRIAGED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"
    ESCALATED = "ESCALATED"

class ViolationStatus(str, Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    CORRECTIVE_ACTION_REQUIRED = "CORRECTIVE_ACTION_REQUIRED"
    RECTIFIED = "RECTIFIED"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"

class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TelemetrySource(str, Enum):
    SIMULATED = "SIMULATED"
    MQTT = "MQTT"
    API = "API"
    SCADA = "SCADA"
    EXTERNAL = "EXTERNAL"

class SensorStatus(str, Enum):
    ACTIVE = "ACTIVE"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    OFFLINE = "OFFLINE"
    MAINTENANCE = "MAINTENANCE"
