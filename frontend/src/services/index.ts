import api from './api';
import type { 
  AuthResponse, User, Mine, MineDetail, Sensor, SensorReading, Camera, Equipment, 
  Incident, IncidentStatus, Violation, RiskScore, AnomalyEvent, Alert, 
  SpatialContextResponse, MineTelemetrySummary, AuditEvent, DigitalTwinState,
  ProductionReport, Worker, AttendanceRecord, Contractor, Contract,
  EnvironmentalObservation, Grievance, ApprovalRequest, RegulatoryReport,
  GovernanceTask, GovernanceDashboardSummary,
  PredictiveRiskSummary, SignalAttribution, MLModelInfo,
  FieldInspection, FieldEvidence, SyncBatchRequest, SyncBatchResponse, ZoneRiskPrediction,
  IntegrationHealthResponse, SystemHealthResponse, ExternalReport, AuditChainVerification, AdapterHealthStatus, SystemHealthComponent,
  DemoPreflightReport, DemoScenarioSummary, DemoScenarioDetail, DemoStepResponse, DemoResetResponse, DemoScenarioStep, DemoPreflightItem
} from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('trinetra_token', res.data.access_token);
      localStorage.setItem('trinetra_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    localStorage.setItem('trinetra_user', JSON.stringify(res.data));
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('trinetra_token');
    localStorage.removeItem('trinetra_user');
  },

  getStoredUser: (): User | null => {
    const raw = localStorage.getItem('trinetra_user');
    return raw ? JSON.parse(raw) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('trinetra_token');
  }
};

export const mineService = {
  getMines: async (): Promise<Mine[]> => {
    const res = await api.get<Mine[]>('/mines');
    return res.data;
  },

  getMineDetail: async (mineId: number): Promise<MineDetail> => {
    const res = await api.get<MineDetail>(`/mines/${mineId}`);
    return res.data;
  },

  getDigitalTwin: async (mineId: number): Promise<DigitalTwinState> => {
    const res = await api.get<DigitalTwinState>(`/mines/${mineId}/digital-twin`);
    return res.data;
  }
};

export const sensorService = {
  getSensors: async (mineId: number, status?: string): Promise<Sensor[]> => {
    const params = status ? { mine_id: mineId, status } : { mine_id: mineId };
    const res = await api.get<Sensor[]>('/sensors', { params });
    return res.data;
  },

  getSensorDetail: async (sensorId: number): Promise<Sensor> => {
    const res = await api.get<Sensor>(`/sensors/${sensorId}`);
    return res.data;
  },

  getSensorReadings: async (sensorId: number, limit = 50): Promise<SensorReading[]> => {
    const res = await api.get<SensorReading[]>(`/sensors/${sensorId}/readings`, { params: { limit } });
    return res.data;
  },

  simulateBatch: async (mineId: number) => {
    const res = await api.post(`/sensors/simulate-batch/${mineId}`);
    return res.data;
  },

  simulateScenario: async (mineId: number, scenario: string, sensorCode?: string) => {
    const res = await api.post(`/sensors/simulate-scenario/${mineId}`, {
      scenario,
      sensor_code: sensorCode
    });
    return res.data;
  },

  getMineSummary: async (mineId: number): Promise<MineTelemetrySummary> => {
    const res = await api.get<MineTelemetrySummary>(`/mines/${mineId}/telemetry/summary`);
    return res.data;
  },

  getAllMinesSummary: async (): Promise<MineTelemetrySummary[]> => {
    const res = await api.get<MineTelemetrySummary[]>('/mines/telemetry/summary-all');
    return res.data;
  }
};

export const cameraService = {
  getCameras: async (mineId: number): Promise<Camera[]> => {
    const res = await api.get<Camera[]>('/cameras', { params: { mine_id: mineId } });
    return res.data;
  },

  getEquipment: async (mineId: number): Promise<Equipment[]> => {
    const res = await api.get<Equipment[]>('/equipment', { params: { mine_id: mineId } });
    return res.data;
  }
};

export const incidentService = {
  getIncidents: async (mineId?: number, status?: string): Promise<Incident[]> => {
    const params: Record<string, any> = {};
    if (mineId) params.mine_id = mineId;
    if (status) params.status = status;
    const res = await api.get<Incident[]>('/incidents', { params });
    return res.data;
  },

  createIncident: async (incident: Partial<Incident>): Promise<Incident> => {
    const res = await api.post<Incident>('/incidents', incident);
    return res.data;
  },

  updateIncidentStatus: async (incidentId: number, status: IncidentStatus, comment?: string, notes?: string): Promise<Incident> => {
    const res = await api.patch<Incident>(`/incidents/${incidentId}/status`, {
      status,
      comment,
      resolution_notes: notes
    });
    return res.data;
  },

  getViolations: async (mineId?: number): Promise<Violation[]> => {
    const params: Record<string, any> = {};
    if (mineId) params.mine_id = mineId;
    const res = await api.get<Violation[]>('/violations', { params });
    return res.data;
  }
};

export const alertService = {
  getAlerts: async (mineId?: number, status?: string, severity?: string): Promise<Alert[]> => {
    const params: Record<string, any> = {};
    if (mineId) params.mine_id = mineId;
    if (status) params.status = status;
    if (severity) params.severity = severity;
    const res = await api.get<Alert[]>('/alerts', { params });
    return res.data;
  },

  updateAlertStatus: async (alertId: number, status: string): Promise<Alert> => {
    const res = await api.patch<Alert>(`/alerts/${alertId}/status`, { status });
    return res.data;
  }
};

export const riskService = {
  getMineRisk: async (mineId: number, recalculate = false): Promise<RiskScore> => {
    const res = await api.get<RiskScore>(`/risk/${mineId}`, { params: { recalculate } });
    return res.data;
  },

  getAnomalies: async (mineId?: number, status?: string): Promise<AnomalyEvent[]> => {
    const params: Record<string, any> = {};
    if (mineId) params.mine_id = mineId;
    if (status) params.status = status;
    const res = await api.get<AnomalyEvent[]>('/anomalies', { params });
    return res.data;
  },

  getAnomalySpatialContext: async (anomalyId: number, radius = 250): Promise<SpatialContextResponse> => {
    const res = await api.get<SpatialContextResponse>(`/anomalies/${anomalyId}/context`, { params: { radius_meters: radius } });
    return res.data;
  },

  getAuditTrail: async (mineId?: number, resourceType?: string): Promise<AuditEvent[]> => {
    const params: Record<string, any> = {};
    if (mineId) params.mine_id = mineId;
    if (resourceType) params.resource_type = resourceType;
    const res = await api.get<AuditEvent[]>('/audit', { params });
    return res.data;
  }
};

export const governanceService = {
  // Production
  getProductionReports: async (mineId: number): Promise<ProductionReport[]> => {
    const res = await api.get<ProductionReport[]>(`/governance/production/${mineId}`);
    return res.data;
  },

  submitProductionReport: async (payload: Partial<ProductionReport>): Promise<ProductionReport> => {
    const res = await api.post<ProductionReport>('/governance/production', payload);
    return res.data;
  },

  // Workforce & Attendance
  getWorkers: async (mineId: number): Promise<Worker[]> => {
    const res = await api.get<Worker[]>(`/governance/workers/${mineId}`);
    return res.data;
  },

  markAttendance: async (payload: { worker_id: number; mine_id: number; shift_code?: string; status?: string; verification_mode?: string; notes?: string }): Promise<AttendanceRecord> => {
    const res = await api.post<AttendanceRecord>('/governance/attendance', payload);
    return res.data;
  },

  getAttendanceRoster: async (mineId: number): Promise<AttendanceRecord[]> => {
    const res = await api.get<AttendanceRecord[]>(`/governance/attendance/${mineId}`);
    return res.data;
  },

  // Contractors
  getContractors: async (): Promise<Contractor[]> => {
    const res = await api.get<Contractor[]>('/governance/contractors');
    return res.data;
  },

  getContracts: async (mineId: number): Promise<Contract[]> => {
    const res = await api.get<Contract[]>(`/governance/contracts/${mineId}`);
    return res.data;
  },

  // Environment
  getEnvironmentalObservations: async (mineId: number): Promise<EnvironmentalObservation[]> => {
    const res = await api.get<EnvironmentalObservation[]>(`/governance/environment/observations/${mineId}`);
    return res.data;
  },

  createEnvironmentalObservation: async (payload: Partial<EnvironmentalObservation>): Promise<EnvironmentalObservation> => {
    const res = await api.post<EnvironmentalObservation>('/governance/environment/observations', payload);
    return res.data;
  },

  // Grievances
  getGrievances: async (mineId: number): Promise<Grievance[]> => {
    const res = await api.get<Grievance[]>(`/governance/grievances/${mineId}`);
    return res.data;
  },

  submitGrievance: async (payload: Partial<Grievance>): Promise<Grievance> => {
    const res = await api.post<Grievance>('/governance/grievances', payload);
    return res.data;
  },

  updateGrievanceStatus: async (grievanceId: number, status: string, notes?: string): Promise<Grievance> => {
    const res = await api.patch<Grievance>(`/governance/grievances/${grievanceId}/status`, { status, resolution_notes: notes });
    return res.data;
  },

  // Approvals
  getApprovalRequests: async (mineId: number): Promise<ApprovalRequest[]> => {
    const res = await api.get<ApprovalRequest[]>(`/governance/approvals/${mineId}`);
    return res.data;
  },

  createApprovalRequest: async (payload: Partial<ApprovalRequest>): Promise<ApprovalRequest> => {
    const res = await api.post<ApprovalRequest>('/governance/approvals/request', payload);
    return res.data;
  },

  processApprovalDecision: async (requestId: number, action: string, comments?: string): Promise<ApprovalRequest> => {
    const res = await api.post<ApprovalRequest>(`/governance/approvals/${requestId}/decision`, { action, comments });
    return res.data;
  },

  // Regulatory Reports
  getReports: async (mineId: number): Promise<RegulatoryReport[]> => {
    const res = await api.get<RegulatoryReport[]>(`/governance/reports/${mineId}`);
    return res.data;
  },

  generateReport: async (payload: { mine_id: number; report_type: string; title: string; reporting_period_start: string; reporting_period_end: string }): Promise<RegulatoryReport> => {
    const res = await api.post<RegulatoryReport>('/governance/reports/generate', payload);
    return res.data;
  },

  downloadReportPdf: async (reportId: number) => {
    const res = await api.get(`/governance/reports/${reportId}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TRINETRA_Statutory_Report_${reportId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Summary & Tasks
  getGovernanceSummary: async (mineId: number): Promise<GovernanceDashboardSummary> => {
    const res = await api.get<GovernanceDashboardSummary>(`/governance/summary/${mineId}`);
    return res.data;
  },

  getGovernanceTasks: async (mineId: number): Promise<GovernanceTask[]> => {
    const res = await api.get<GovernanceTask[]>(`/governance/tasks/${mineId}`);
    return res.data;
  }
};

export const predictiveRiskService = {
  getLatestPredictiveRisk: async (mineId: number): Promise<PredictiveRiskSummary> => {
    const res = await api.get<PredictiveRiskSummary>(`/predictive-risk/latest/${mineId}`);
    return res.data;
  },

  evaluatePredictiveRisk: async (mineId: number, zoneId?: number): Promise<PredictiveRiskSummary> => {
    const res = await api.post<PredictiveRiskSummary>(`/predictive-risk/evaluate/${mineId}`, null, {
      params: zoneId ? { zone_id: zoneId } : {}
    });
    return res.data;
  },

  getPredictionsHistory: async (mineId: number, limit = 50): Promise<any[]> => {
    const res = await api.get<any[]>(`/predictive-risk/history/${mineId}`, {
      params: { limit }
    });
    return res.data;
  },

  getRegisteredModels: async (): Promise<MLModelInfo[]> => {
    const res = await api.get<MLModelInfo[]>('/predictive-risk/models');
    return res.data;
  }
};

export const copilotService = {
  query: async (request: { mine_id: number; query: string; conversation_id?: string; language?: string }): Promise<any> => {
    const res = await api.post('/copilot/query', request);
    return res.data;
  },

  getQuickPrompts: async (): Promise<any[]> => {
    const res = await api.get('/copilot/quick-prompts');
    return res.data;
  },

  getTools: async (): Promise<any[]> => {
    const res = await api.get('/copilot/tools');
    return res.data;
  },

  getHistory: async (mineId: number, limit = 20): Promise<any[]> => {
    const res = await api.get(`/copilot/history/${mineId}`, { params: { limit } });
    return res.data;
  }
};

export const mobileService = {
  getAssignedInspections: async (mineId: number): Promise<FieldInspection[]> => {
    const res = await api.get<FieldInspection[]>(`/mobile/inspections/assigned`, { params: { mine_id: mineId } });
    return res.data;
  },

  createInspection: async (data: any): Promise<FieldInspection> => {
    const res = await api.post<FieldInspection>('/mobile/inspections', data);
    return res.data;
  },

  updateInspection: async (id: number, data: any): Promise<FieldInspection> => {
    const res = await api.put<FieldInspection>(`/mobile/inspections/${id}`, data);
    return res.data;
  },

  recordEvidence: async (data: any): Promise<FieldEvidence> => {
    const res = await api.post<FieldEvidence>('/mobile/evidence', data);
    return res.data;
  },

  syncBatch: async (data: SyncBatchRequest): Promise<SyncBatchResponse> => {
    const res = await api.post<SyncBatchResponse>('/mobile/sync', data);
    return res.data;
  },

  getSyncStatus: async (mineId: number): Promise<any> => {
    const res = await api.get('/mobile/sync/status', { params: { mine_id: mineId } });
    return res.data;
  }
};

export const mobileApi = mobileService;
export const predictiveRiskApi = {
  getSummary: async (mineId: number) => {
    return predictiveRiskService.getLatestPredictiveRisk(mineId);
  }
};

export const integrationsService = {
  getHealth: async (): Promise<IntegrationHealthResponse> => {
    const res = await api.get<IntegrationHealthResponse>('/integrations/health');
    return res.data;
  },

  getSystemHealth: async (): Promise<SystemHealthResponse> => {
    const res = await api.get<SystemHealthResponse>('/integrations/system-health');
    return res.data;
  },

  getExternalReports: async (mineId?: number, sourceSystem?: string): Promise<ExternalReport[]> => {
    const res = await api.get<ExternalReport[]>('/integrations/reports', {
      params: {
        ...(mineId ? { mine_id: mineId } : {}),
        ...(sourceSystem ? { source_system: sourceSystem } : {})
      }
    });
    return res.data;
  },

  syncAdapter: async (sourceSystem: string, mineId?: number): Promise<any> => {
    const res = await api.post(`/integrations/sync/${sourceSystem}`, null, {
      params: mineId ? { mine_id: mineId } : {}
    });
    return res.data;
  },

  simulateFailure: async (sourceSystem: string): Promise<any> => {
    const res = await api.post(`/integrations/simulate-failure/${sourceSystem}`);
    return res.data;
  },

  simulateRecovery: async (sourceSystem: string): Promise<any> => {
    const res = await api.post(`/integrations/simulate-recovery/${sourceSystem}`);
    return res.data;
  },

  verifyAuditChain: async (): Promise<AuditChainVerification> => {
    const res = await api.get<AuditChainVerification>('/integrations/audit-verify');
    return res.data;
  }
};

export const integrationsApi = integrationsService;

export const demoService = {
  getPreflightCheck: async (): Promise<DemoPreflightReport> => {
    const res = await api.get<DemoPreflightReport>('/demo/preflight');
    return res.data;
  },

  getScenarios: async (): Promise<DemoScenarioSummary[]> => {
    const res = await api.get<DemoScenarioSummary[]>('/demo/scenarios');
    return res.data;
  },

  getScenarioDetail: async (scenarioId: string): Promise<DemoScenarioDetail> => {
    const res = await api.get<DemoScenarioDetail>(`/demo/scenarios/${scenarioId}`);
    return res.data;
  },

  executeStep: async (scenarioId: string, runId?: string, force?: boolean): Promise<DemoStepResponse> => {
    const res = await api.post<DemoStepResponse>(`/demo/scenarios/${scenarioId}/step`, {
      run_id: runId,
      force: force ?? false
    });
    return res.data;
  },

  runAllSteps: async (scenarioId: string, runId?: string): Promise<DemoStepResponse[]> => {
    const res = await api.post<DemoStepResponse[]>(`/demo/scenarios/${scenarioId}/run-all`, {
      run_id: runId
    });
    return res.data;
  },

  resetScenario: async (scenarioId: string): Promise<DemoResetResponse> => {
    const res = await api.post<DemoResetResponse>(`/demo/scenarios/${scenarioId}/reset`);
    return res.data;
  },

  resetAllDemoData: async (): Promise<DemoResetResponse> => {
    const res = await api.post<DemoResetResponse>('/demo/reset-all');
    return res.data;
  }
};

export const demoApi = demoService;

export type { 
  FieldInspection, 
  FieldEvidence, 
  ChecklistItem, 
  SyncOperationItem, 
  SyncBatchRequest, 
  SyncOperationResult, 
  SyncBatchResponse, 
  ZoneRiskPrediction,
  AdapterHealthStatus,
  IntegrationHealthResponse,
  ExternalReport,
  AuditChainVerification,
  SystemHealthComponent,
  SystemHealthResponse,
  DemoScenarioStep,
  DemoScenarioSummary,
  DemoScenarioDetail,
  DemoPreflightItem,
  DemoPreflightReport,
  DemoStepResponse,
  DemoResetResponse
} from '../types';





