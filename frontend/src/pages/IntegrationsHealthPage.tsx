import React, { useState, useEffect, useCallback } from 'react';
import { 
  Network, 
  ShieldCheck, 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Layers3, 
  Clock, 
  ExternalLink, 
  Key, 
  Power, 
  Database, 
  BrainCircuit, 
  Bot, 
  Compass, 
  Lock,
  Radio,
  Zap,
  CheckSquare
} from 'lucide-react';
import { useMineContext } from '../context/MineContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  integrationsApi, 
  AdapterHealthStatus, 
  ExternalReport, 
  AuditChainVerification, 
  SystemHealthResponse 
} from '../services';
import clsx from 'clsx';

export const IntegrationsHealthPage: React.FC = () => {
  const { selectedMine, setCurrentTab, focusInDigitalTwin } = useMineContext();
  const { user, isSystemAdmin } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState<boolean>(true);
  const [adapters, setAdapters] = useState<AdapterHealthStatus[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null);
  const [externalReports, setExternalReports] = useState<ExternalReport[]>([]);
  const [auditVerification, setAuditVerification] = useState<AuditChainVerification | null>(null);
  const [verifyingAudit, setVerifyingAudit] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Fetch all health & integration data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthData, sysHealthData, reportsData] = await Promise.all([
        integrationsApi.getHealth(),
        integrationsApi.getSystemHealth(),
        integrationsApi.getExternalReports(selectedMine?.id)
      ]);
      setAdapters(healthData.adapters);
      setSystemHealth(sysHealthData);
      setExternalReports(reportsData);
    } catch (err: any) {
      console.error('Failed to load integrations data', err);
      setStatusMessage({
        type: 'error',
        text: `Failed to load integration status: ${err?.response?.data?.detail || err.message}`
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMine]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Sync Adapter
  const handleSyncAdapter = async (sourceSystem: string) => {
    setActionLoading(`sync-${sourceSystem}`);
    setStatusMessage(null);
    try {
      const res = await integrationsApi.syncAdapter(sourceSystem, selectedMine?.id);
      setStatusMessage({
        type: 'success',
        text: `${sourceSystem} Sync Completed: ${res.records_imported} imported, ${res.records_rejected} rejected. Mode: ${res.adapter_mode}`
      });
      loadData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `${sourceSystem} sync failed: ${err?.response?.data?.detail || err.message}`
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Simulate Circuit Breaker Outage
  const handleSimulateOutage = async (sourceSystem: string) => {
    setActionLoading(`outage-${sourceSystem}`);
    setStatusMessage(null);
    try {
      const res = await integrationsApi.simulateFailure(sourceSystem);
      setStatusMessage({
        type: 'warning',
        text: res.message
      });
      loadData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Outage simulation failed: ${err?.response?.data?.detail || err.message}`
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Simulate Recovery
  const handleSimulateRecovery = async (sourceSystem: string) => {
    setActionLoading(`recovery-${sourceSystem}`);
    setStatusMessage(null);
    try {
      const res = await integrationsApi.simulateRecovery(sourceSystem);
      setStatusMessage({
        type: 'success',
        text: res.message
      });
      loadData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Recovery failed: ${err?.response?.data?.detail || err.message}`
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Cryptographic Audit Verification
  const handleVerifyAuditChain = async () => {
    setVerifyingAudit(true);
    setStatusMessage(null);
    try {
      const res = await integrationsApi.verifyAuditChain();
      setAuditVerification(res);
      setStatusMessage({
        type: res.status === 'VALID' ? 'success' : 'error',
        text: res.status === 'VALID'
          ? `Audit Ledger Verification PASSED: ${res.total_events} blocks cryptographically verified with SHA-256 hash chain.`
          : `SECURITY ALERT: ${res.failure_reason}`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Audit verification failed: ${err?.response?.data?.detail || err.message}`
      });
    } finally {
      setVerifyingAudit(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {t('integrationsHealth')}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 font-mono">
                  ENTERPRISE GATEWAY
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Government Ecosystem Adapters (CMSMS, PARIVESH, DGMS), Circuit Breakers & SHA-256 Audit Integrity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyAuditChain}
              disabled={verifyingAudit}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <ShieldCheck className={clsx('w-4 h-4', verifyingAudit && 'animate-spin')} />
              <span>{verifyingAudit ? 'Verifying...' : 'Verify Cryptographic Audit Ledger'}</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Source Disclaimer Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-mono text-slate-300">
              Provenance Boundary: <strong className="text-amber-400">SIMULATED ADAPTER ARCHITECTURE</strong>
            </span>
            <span className="text-[11px] text-slate-500">
              (Live connections require official Ministry API credentials)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Mine Context: <strong className="text-slate-200">{selectedMine?.code || 'ALL MINES'}</strong></span>
            <span>Auth User: <strong className="text-amber-400">{user?.full_name}</strong></span>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {statusMessage && (
        <div className={clsx(
          'p-4 rounded-xl text-xs font-medium border flex items-center justify-between gap-3 animate-fadeIn',
          statusMessage.type === 'success' && 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60',
          statusMessage.type === 'warning' && 'bg-amber-950/40 text-amber-300 border-amber-800/60',
          statusMessage.type === 'error' && 'bg-rose-950/40 text-rose-300 border-rose-800/60'
        )}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)} 
            className="text-slate-400 hover:text-slate-200 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid: External Integration Adapters */}
      <div>
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          External Government Ecosystem Adapters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adapters.map((adapter) => {
            const isOutage = adapter.circuit_state === 'OPEN';
            const isHealthy = adapter.status === 'HEALTHY' && !isOutage;

            return (
              <div 
                key={adapter.source_system}
                className={clsx(
                  'p-5 rounded-xl border transition-all duration-150 bg-slate-900/80 space-y-3.5 flex flex-col justify-between',
                  isHealthy ? 'border-slate-800 hover:border-slate-700' : 'border-rose-500/40 bg-rose-950/10'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-100 text-sm">
                      {adapter.source_system}
                    </span>
                    <span className={clsx(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono uppercase',
                      adapter.mode === 'LIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    )}>
                      {adapter.mode}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-300 mt-1">
                    {adapter.name}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-[11px] text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <strong className={clsx(isHealthy ? 'text-emerald-400' : 'text-rose-400')}>
                        {isOutage ? 'CIRCUIT OPEN' : adapter.status}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Circuit State:</span>
                      <span className={clsx(
                        'px-1.5 py-0.2 rounded text-[10px] font-bold',
                        adapter.circuit_state === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      )}>
                        {adapter.circuit_state}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span>{adapter.latency_ms} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Records Processed:</span>
                      <span className="text-slate-200">{adapter.records_processed}</span>
                    </div>
                  </div>
                </div>

                {/* Adapter Actions */}
                {adapter.source_system !== 'TELEMETRY' && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleSyncAdapter(adapter.source_system)}
                      disabled={actionLoading !== null || isOutage}
                      className={clsx(
                        'w-full py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm',
                        isOutage 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                      )}
                    >
                      <RefreshCw className={clsx('w-3.5 h-3.5', actionLoading === `sync-${adapter.source_system}` && 'animate-spin')} />
                      <span>Trigger Ingest Sync</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleSimulateOutage(adapter.source_system)}
                        disabled={actionLoading !== null || isOutage}
                        className="py-1 rounded text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                        title="Force circuit breaker OPEN to demonstrate resilience"
                      >
                        Fail Circuit
                      </button>
                      <button
                        onClick={() => handleSimulateRecovery(adapter.source_system)}
                        disabled={actionLoading !== null || !isOutage}
                        className="py-1 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                        title="Restore circuit breaker to CLOSED"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* System Health Breakdown & Cryptographic Audit Ledger Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Components */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Production Hardening & System Health
            </h2>
            <span className={clsx(
              'text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border',
              systemHealth?.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            )}>
              OVERALL: {systemHealth?.status || 'HEALTHY'}
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {systemHealth?.components.map((c) => (
              <div key={c.name} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{c.name}</span>
                    <span className={clsx(
                      'text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold',
                      c.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    )}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{c.details}</p>
                </div>
                {c.latency_ms !== undefined && c.latency_ms !== null && (
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {c.latency_ms} ms
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic Audit Ledger Verification Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Cryptographic Audit Ledger</h3>
                <p className="text-[11px] text-slate-400">SHA-256 Hash Chain Integrity</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              TRINETRA guarantees tamper-evidence by cryptographically linking every governance signoff, inspection, incident status change, and external signal into an immutable SHA-256 block chain.
            </p>

            {auditVerification && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span>Chain Status:</span>
                  <strong className={clsx(
                    auditVerification.status === 'VALID' ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {auditVerification.status}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Verified Blocks:</span>
                  <span className="text-slate-200">{auditVerification.total_events} events</span>
                </div>
                {auditVerification.chain_head_hash && (
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-500 block">Ledger Head Hash:</span>
                    <span className="text-[10px] text-amber-400 break-all font-mono">
                      {auditVerification.chain_head_hash}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleVerifyAuditChain}
            disabled={verifyingAudit}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <ShieldCheck className={clsx('w-4 h-4', verifyingAudit && 'animate-spin')} />
            <span>{verifyingAudit ? 'Verifying Audit Chain...' : 'Run Full Ledger Cryptographic Audit'}</span>
          </button>
        </div>
      </div>

      {/* External Normalized Reports Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              Normalized External Reports Ledger (CMSMS / PARIVESH / DGMS)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Geospatially validated external signals with cryptographic payload hashes and provenance metadata.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {externalReports.length} reports logged
          </span>
        </div>

        {externalReports.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No external reports currently logged. Click "Trigger Ingest Sync" above to ingest external records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Source & ID</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Title & Description</th>
                  <th className="p-3">Spatial Match</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Raw Payload Hash</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {externalReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-800/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-bold font-mono',
                          report.source_system === 'CMSMS' && 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
                          report.source_system === 'PARIVESH' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
                          report.source_system === 'DGMS' && 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        )}>
                          {report.source_system}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {report.source_record_id}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-slate-300 text-[11px]">
                      {report.event_type}
                    </td>

                    <td className="p-3 max-w-xs">
                      <span className="font-semibold text-slate-200 block">{report.title}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{report.description}</span>
                    </td>

                    <td className="p-3">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-bold font-mono',
                        report.spatial_match_status === 'MATCHED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      )}>
                        {report.spatial_match_status}
                      </span>
                      {report.distance_to_mine_meters && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {report.distance_to_mine_meters}m from center
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono',
                        report.severity === 'CRITICAL' && 'bg-rose-500/10 text-rose-400',
                        report.severity === 'HIGH' && 'bg-amber-500/10 text-amber-400',
                        report.severity === 'MEDIUM' && 'bg-blue-500/10 text-blue-400',
                        report.severity === 'LOW' && 'bg-slate-800 text-slate-300'
                      )}>
                        {report.severity}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-[10px] text-slate-500 max-w-[120px] truncate" title={report.raw_payload_hash}>
                      {report.raw_payload_hash.substring(0, 16)}...
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => setCurrentTab('digital-twin')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono transition cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <Layers3 className="w-3 h-3" />
                        <span>[3D]</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default IntegrationsHealthPage;
