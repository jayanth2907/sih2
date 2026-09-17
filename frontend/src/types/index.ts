export type RoleType = 
  | 'SYSTEM_ADMIN' 
  | 'MINE_MANAGER' 
  | 'MINE_SAFETY_OFFICER' 
  | 'FIELD_INSPECTOR' 
  | 'CONTRACTOR_MANAGER' 
  | 'REGULATOR';

export interface User {
  id: number;
  email: string;
  full_name: string;
  designation?: string;
  department?: string;
  roles: RoleType[];
  assigned_mine_ids: number[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: User;
}

export interface Mine {
  id: number;
  code: string;
  name: string;
  description?: string;
  mine_type: string;
  state: string;
  district: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MineZone {
  id: number;
  code: string;
  name: string;
  zone_type: string;
  risk_category: string;
  origin_x: number;
  origin_y: number;
  origin_z: number;
  width: number;
  length: number;
  height: number;
  level_id?: number;
}

export interface MineLevel {
  id: number;
  code: string;
  name: string;
  depth_meters: number;
  elevation?: number;
  sequence_order: number;
  zones: MineZone[];
}

export interface MineDetail extends Mine {
  levels: MineLevel[];
  total_sensors: number;
  total_cameras: number;
  active_incidents: number;
  risk_score?: number;
  risk_severity?: string;
}

export interface Sensor {
  id: number;
  sensor_code: string;
  mine_id: number;
  level_id?: number;
  zone_id?: number;
  sensor_type_id: number;
  name: string;
  unit: string;
  normal_min?: number;
  normal_max?: number;
  warning_threshold: number;
  critical_threshold: number;
  x: number;
  y: number;
  z: number;
  latitude?: number;
  longitude?: number;
  status: 'ACTIVE' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'MAINTENANCE';
  last_value?: number;
  last_reading_at?: string;
  sensor_type_code?: string;
  zone_name?: string;
  level_name?: string;
}

export interface SensorReading {
  id: number;
  sensor_id: number;
  timestamp: string;
  value: number;
  unit: string;
  quality: string;
  source: string;
  ingestion_timestamp: string;
}

export interface Camera {
  id: number;
  camera_code: string;
  mine_id: number;
  name: string;
  camera_type: string;
  stream_url?: string;
  status: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  fov: number;
  resolution?: string;
  is_simulated: string;
  zone_name?: string;
  level_name?: string;
}

export interface Equipment {
  id: number;
  equipment_code: string;
  mine_id: number;
  name: string;
  category: string;
  status: string;
  manufacturer?: string;
  model_number?: string;
  x: number;
  y: number;
  z: number;
  last_serviced_at?: string;
  next_service_due?: string;
  zone_name?: string;
}

export type IncidentStatus = 
  | 'OPEN' 
  | 'TRIAGED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'VERIFIED' 
  | 'CLOSED' 
  | 'ESCALATED';

export interface IncidentEvent {
  id: number;
  actor_id?: number;
  from_status?: string;
  to_status: string;
  comment?: string;
  created_at: string;
}

export interface Incident {
  id: number;
  incident_code: string;
  mine_id: number;
  title: string;
  description: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: IncidentStatus;
  sla_hours: number;
  sla_due_at?: string;
  is_escalated: string;
  escalation_level: number;
  resolution_notes?: string;
  resolved_at?: string;
  verified_at?: string;
  closed_at?: string;
  x: number;
  y: number;
  z: number;
  created_at: string;
  reporter_name?: string;
  assignee_name?: string;
  zone_name?: string;
  mine_name?: string;
  events?: IncidentEvent[];
}

export interface CorrectiveAction {
  id: number;
  violation_id: number;
  action_text: string;
  target_completion_date: string;
  status: string;
  assignee_name?: string;
  completed_at?: string;
}

export interface Violation {
  id: number;
  violation_code: string;
  mine_id: number;
  title: string;
  description: string;
  regulatory_clause: string;
  statute: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  remedial_deadline?: string;
  financial_penalty_amount: number;
  created_at: string;
  inspector_name?: string;
  zone_name?: string;
  mine_name?: string;
  corrective_actions: CorrectiveAction[];
}

export interface RiskFactor {
  id: number;
  factor_name: string;
  weight: number;
  contribution_points: number;
  details?: string;
}

export interface RiskScore {
  id: number;
  mine_id: number;
  score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  rule_score: number;
  ml_score: number;
  silence_risk_score: number;
  explanation: string;
  model_version: string;
  rule_version: string;
  generated_at: string;
  factors: RiskFactor[];
}

export interface AnomalyEvent {
  id: number;
  mine_id: number;
  sensor_id?: number;
  level_id?: number;
  zone_id?: number;
  incident_id?: number;
  anomaly_type: string;
  severity: string;
  observed_value?: number;
  expected_range?: string;
  threshold_limit?: number;
  unit?: string;
  description: string;
  x: number;
  y: number;
  z: number;
  source: string;
  status: string;
  detected_at: string;
  resolved_at?: string;
  sensor_code?: string;
  zone_name?: string;
  level_name?: string;
  mine_name?: string;
}

export interface Alert {
  id: number;
  mine_id: number;
  sensor_id?: number;
  anomaly_id?: number;
  incident_id?: number;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  status: 'UNREAD' | 'READ' | 'ACKNOWLEDGED' | 'RESOLVED';
  source: string;
  recipient_scope: string;
  location_context?: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  sensor_code?: string;
  mine_name?: string;
}

export interface NearbyCameraDTO {
  id: number;
  camera_code: string;
  name: string;
  camera_type: string;
  x: number;
  y: number;
  z: number;
  distance_meters: number;
  yaw: number;
  pitch: number;
  fov: number;
  stream_url?: string;
  is_simulated: string;
}

export interface NearbyEquipmentDTO {
  id: number;
  equipment_code: string;
  name: string;
  category: string;
  status: string;
  x: number;
  y: number;
  z: number;
  distance_meters: number;
  last_serviced_at?: string;
}

export interface SpatialContextResponse {
  anomaly_id: number;
  anomaly_type: string;
  severity: string;
  detected_at: string;
  observed_value?: number;
  threshold_limit?: number;
  explanation: string;
  mine: {
    id: number;
    code: string;
    name: string;
    state: string;
    district: string;
  };
  level?: {
    id: number;
    code: string;
    name: string;
    depth_meters: number;
  };
  zone?: {
    id: number;
    code: string;
    name: string;
    zone_type: string;
    risk_category: string;
  };
  sensor: {
    id: number;
    code: string;
    name: string;
    unit: string;
    status: string;
  };
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  nearby_cameras: NearbyCameraDTO[];
  nearby_equipment: NearbyEquipmentDTO[];
  related_incident?: {
    id: number;
    code: string;
    title: string;
    status: string;
    severity: string;
  };
}

export interface MineTelemetrySummary {
  mine_id: number;
  mine_code: string;
  mine_name: string;
  total_sensors: number;
  online_sensors: number;
  offline_sensors: number;
  normal_sensors: number;
  warning_sensors: number;
  critical_sensors: number;
  active_anomalies: number;
  active_alerts: number;
  critical_alerts: number;
  open_incidents: number;
  current_risk_score: number;
  current_risk_severity: string;
  generated_at: string;
}

export interface AuditEvent {
  id: number;
  actor_id?: number;
  action: string;
  resource_type: string;
  resource_id?: string;
  mine_id?: number;
  before_state?: string;
  after_state?: string;
  metadata_json?: string;
  current_event_hash?: string;
  timestamp: string;
}

export interface DigitalTwinState {
  mine: Mine;
  levels: MineLevel[];
  zones: MineZone[];
  sensors: any[];
  cameras: any[];
  equipment: any[];
  active_incidents: any[];
  anomalies: any[];
  current_risk_score?: number;
  current_risk_severity?: string;
}

export interface ProductionReport {
  id: number;
  report_code: string;
  mine_id: number;
  report_date: string;
  shift: string;
  material_type: string;
  planned_quantity: number;
  actual_quantity: number;
  unit: string;
  variance_quantity: number;
  variance_percentage: number;
  status: string;
  deviation_flag: string;
  reporting_officer_id?: number;
  notes?: string;
  created_at: string;
}

export interface Worker {
  id: number;
  worker_code: string;
  full_name: string;
  designation: string;
  trade_category: string;
  mine_id: number;
  contractor_id?: number;
  is_contractual: boolean;
  emergency_contact?: string;
  blood_group?: string;
  status: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  worker_id: number;
  mine_id: number;
  worker_code?: string;
  worker_name?: string;
  designation?: string;
  attendance_date: string;
  status: string;
  verification_mode: string;
  check_in_time?: string;
  created_at: string;
}

export interface Contractor {
  id: number;
  contractor_code: string;
  company_name: string;
  registration_number: string;
  contact_person: string;
  email: string;
  phone: string;
  safety_rating: number;
  status: string;
  created_at: string;
}

export interface Contract {
  id: number;
  contract_code: string;
  contractor_id: number;
  mine_id: number;
  work_scope: string;
  description?: string;
  start_date: string;
  end_date: string;
  total_value: number;
  status: string;
  compliance_status: string;
  created_at: string;
  contractor_name?: string;
}

export interface EnvironmentalObservation {
  id: number;
  mine_id: number;
  parameter_name: string;
  observed_value: number;
  threshold_limit: number;
  unit: string;
  severity: string;
  status: string;
  location_context?: string;
  x: number;
  y: number;
  z: number;
  detected_at: string;
}

export interface Grievance {
  id: number;
  grievance_code: string;
  mine_id: number;
  category: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  anonymous: boolean;
  sla_hours: number;
  due_at: string;
  is_escalated: boolean;
  resolution_notes?: string;
  created_at: string;
  submitted_by_name?: string;
}

export interface ApprovalRequest {
  id: number;
  request_code: string;
  resource_type: string;
  resource_id: string;
  mine_id: number;
  title: string;
  description?: string;
  requester_id: number;
  required_role: string;
  status: string;
  created_at: string;
  requester_name?: string;
  actions?: Array<{
    id: number;
    action: string;
    comments?: string;
    performed_at: string;
    approver?: { name: string };
  }>;
}

export interface RegulatoryReport {
  id: number;
  report_code: string;
  mine_id: number;
  report_type: string;
  title: string;
  reporting_period_start: string;
  reporting_period_end: string;
  status: string;
  current_version: number;
  generated_at: string;
  generated_by_id: number;
  summary_data?: any;
}

export interface GovernanceTask {
  id: number;
  task_code: string;
  mine_id: number;
  domain: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  sla_status: string;
  due_at: string;
  escalation_level: number;
  created_at: string;
}

export interface GovernanceDashboardSummary {
  mine_id: number;
  mine_name: string;
  production_today_tonnes: number;
  production_planned_tonnes: number;
  production_variance_pct: number;
  attendance_headcount: number;
  attendance_present_pct: number;
  active_contracts: number;
  contracts_expiring_soon: number;
  open_environmental_observations: number;
  open_grievances: number;
  grievances_sla_breached: number;
  pending_approvals: number;
  reports_generated_month: number;
  open_governance_tasks: number;
  governance_risk_score: number;
  governance_risk_severity: string;
}

export interface SignalAttribution {
  feature: string;
  label: string;
  direction: 'INCREASING_RISK' | 'MITIGATING_RISK' | 'NEUTRAL';
  symbol: string;
  current_value: number;
  unit: string;
  normal_reference: number;
  threshold_reference: number;
  contribution_points: number;
  explanation: string;
}

export interface PredictiveRiskSummary {
  mine_id: number;
  mine_name: string;
  current_risk_score: number;
  current_severity: string;
  predicted_risk_score: number;
  predicted_severity: string;
  risk_delta: number;
  trend_direction: 'UP' | 'DOWN' | 'STABLE';
  probability: number;
  horizon_minutes: number;
  model_name: string;
  model_version: string;
  dataset_provenance: string;
  data_quality_score: number;
  data_quality_notes: string;
  is_alert_active: boolean;
  top_signals: SignalAttribution[];
  evaluated_at: string;
}

export interface MLModelInfo {
  id: number;
  model_name: string;
  version: string;
  algorithm: string;
  target_variable: string;
  horizon_minutes: number;
  status: string;
  is_default: boolean;
  dataset_source: string;
  metrics_json: string;
  trained_at: string;
  trained_by: string;
  description?: string;
}

// Phase 6 Copilot & Multilingual Interfaces
export interface EvidenceItem {
  source_type: string;
  entity_id?: string;
  title: string;
  description: string;
  status_or_value: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO';
  deep_link?: {
    tab?: string;
    target_type?: string;
    target_id?: string;
    coordinates?: { x: number; y: number; z: number };
  };
}

export interface CopilotAction {
  action_type: string;
  label: string;
  payload: Record<string, any>;
}

export interface PredictiveSignalSummary {
  current_risk_score: number;
  predicted_risk_score: number;
  horizon: string;
  probability: number;
  top_signals: string[];
}

export interface CopilotQueryRequest {
  mine_id: number;
  query: string;
  conversation_id?: string;
  language?: 'en' | 'hi' | 'te';
}

export interface CopilotQueryResponse {
  conversation_id: string;
  mine_id: number;
  mine_name: string;
  language: 'en' | 'hi' | 'te';
  query: string;
  intent: string;
  tools_invoked: string[];
  summary: string;
  evidence: EvidenceItem[];
  predictive_signal?: PredictiveSignalSummary;
  recommended_next_step: string;
  actions: CopilotAction[];
  answer_markdown: string;
  data_provenance: string;
  provider_used: string;
  data_coverage: string;
  timestamp: string;
}

export interface CopilotQuickPrompt {
  id: string;
  category: string;
  prompt_en: string;
  prompt_hi: string;
  prompt_te: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  allowed_roles: string[];
  parameters: Record<string, any>;
}

// Phase 7: Field Operations & Offline Sync Types
export interface ChecklistItem {
  id: string;
  category: string;
  item_text: string;
  status: 'PENDING' | 'PASS' | 'FAIL' | 'FLAG';
  notes?: string;
}

export interface FieldInspection {
  id: number;
  inspection_code: string;
  mine_id: number;
  level_id?: number;
  zone_id?: number;
  inspector_id?: number;
  title: string;
  description?: string;
  inspection_type: string;
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  checklist_items?: ChecklistItem[];
  findings_summary?: string;
  overall_severity?: string;
  created_at: string;
  updated_at: string;
  mine_name?: string;
  zone_name?: string;
  level_name?: string;
  inspector_name?: string;
}

export interface FieldEvidence {
  id: number;
  evidence_code: string;
  mine_id: number;
  inspection_id?: number;
  observation_id?: number;
  incident_id?: number;
  captured_by_id?: number;
  evidence_type: string;
  title: string;
  description?: string;
  file_url_or_path?: string;
  file_hash_sha256: string;
  captured_at: string;
  server_received_at: string;
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number;
  sync_status: string;
  created_at: string;
}

export interface SyncOperationItem {
  operation_id: string;
  entity_type: string;
  entity_id?: string;
  operation: string;
  payload: Record<string, any>;
  client_timestamp?: string;
  client_version?: string;
}

export interface SyncBatchRequest {
  client_version?: string;
  mine_id: number;
  operations: SyncOperationItem[];
}

export interface SyncOperationResult {
  operation_id: string;
  entity_type: string;
  entity_id: string;
  server_id?: number;
  status: 'ACCEPTED' | 'REJECTED' | 'CONFLICT' | 'ALREADY_PROCESSED';
  error_message?: string;
  server_timestamp?: string;
}

export interface SyncBatchResponse {
  batch_id: string;
  mine_id: number;
  total_operations: number;
  accepted_operations: number;
  rejected_operations: number;
  conflict_operations: number;
  results: SyncOperationResult[];
  processed_at: string;
}

export interface ZoneRiskPrediction {
  zone_id: number;
  zone_name: string;
  current_risk_score: number;
  predicted_risk_score: number;
  predicted_risk_level: string;
  horizon_minutes: number;
  probability: number;
}

// Phase 8: External Integrations & System Health Types
export interface AdapterHealthStatus {
  name: string;
  source_system: string;
  mode: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  circuit_state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  latency_ms: number;
  last_sync_time?: string;
  last_error?: string;
  records_processed: number;
  records_rejected: number;
  adapter_version: string;
}

export interface IntegrationHealthResponse {
  overall_health: string;
  total_adapters: number;
  adapters: AdapterHealthStatus[];
  timestamp: string;
}

export interface ExternalReport {
  id: number;
  event_id: string;
  source_system: string;
  source_record_id: string;
  source_mode: string;
  event_type: string;
  mine_id?: number;
  mine_code?: string;
  zone_id?: number;
  zone_name?: string;
  title: string;
  description?: string;
  severity: string;
  latitude?: number;
  longitude?: number;
  spatial_match_status: string;
  distance_to_mine_meters?: number;
  raw_payload_hash: string;
  status: string;
  verification_notes?: string;
  adapter_version: string;
  received_at: string;
  created_at: string;
}

export interface AuditChainVerification {
  status: 'VALID' | 'TAMPER_DETECTED';
  total_events: number;
  chain_head_hash?: string;
  corrupted_event_id?: number;
  failure_reason?: string;
  verified_at: string;
}

export interface SystemHealthComponent {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  details: string;
  latency_ms?: number;
}

export interface SystemHealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  version: string;
  environment: string;
  components: SystemHealthComponent[];
  timestamp: string;
}

// ==========================================
// PHASE 9: SIH DEMO SCENARIO ENGINE TYPES
// ==========================================
export interface DemoScenarioStep {
  step_id: number;
  step_key: string;
  title: string;
  description: string;
  system_component: string;
  expected_state: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  executed_at?: string;
  details?: Record<string, any>;
}

export interface DemoScenarioSummary {
  scenario_id: string;
  name: string;
  category: string;
  target_mine_id: string;
  target_zone_id?: string;
  description: string;
  total_steps: number;
  current_step_index: number;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  last_run_id?: string;
  last_executed_at?: string;
}

export interface DemoScenarioDetail extends DemoScenarioSummary {
  steps: DemoScenarioStep[];
  key_takeaway: string;
  governance_boundary: string;
}

export interface DemoPreflightItem {
  component: string;
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  latency_ms: number;
  message: string;
  is_critical: boolean;
}

export interface DemoPreflightReport {
  is_ready: boolean;
  overall_status: 'READY' | 'DEGRADED' | 'NOT_READY';
  mode: string;
  timestamp: string;
  checks: DemoPreflightItem[];
  active_scenario_id?: string;
}

export interface DemoStepResponse {
  scenario_id: string;
  run_id: string;
  step_index: number;
  step_key: string;
  title: string;
  status: string;
  completed: boolean;
  next_step_available: boolean;
  state_updates: Record<string, any>;
  message: string;
}

export interface DemoResetResponse {
  success: boolean;
  scenario_id?: string;
  message: string;
  records_reset: Record<string, number>;
  timestamp: string;
}



