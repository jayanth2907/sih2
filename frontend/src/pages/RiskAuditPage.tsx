import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { riskService } from '../services';
import { RiskScore, AuditEvent } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldAlert, History, Hash, CheckCircle2, ShieldCheck, Lock, RefreshCw } from 'lucide-react';

export const RiskAuditPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async (recalculate = false) => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const [rData, aData] = await Promise.all([
        riskService.getMineRisk(selectedMine.id, recalculate),
        riskService.getAuditTrail(selectedMine.id)
      ]);
      setRisk(rData);
      setAuditLogs(aData);
    } catch (err) {
      console.error('Failed to load risk/audit data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMine?.id]);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await fetchData(true);
    setIsRecalculating(false);
  };

  if (!selectedMine) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Risk Intelligence & Immutable Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-1">
            Explainable multi-factor risk scores and cryptographic SHA-256 hash-chained governance log.
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
          {isRecalculating ? 'Evaluating...' : 'Recalculate Risk Engine'}
        </button>
      </div>

      {/* Risk Factors Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Active Risk Engine Breakdown</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Total Risk Index:</span>
            <span className="text-lg font-black font-mono text-amber-400">{risk?.score} / 100</span>
            <StatusBadge status={risk?.severity || 'LOW'} size="sm" />
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          {risk?.explanation}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] uppercase font-mono text-slate-500">Statutory & Incident Rule Score</p>
            <p className="text-xl font-bold font-mono text-amber-400 mt-1">{risk?.rule_score} pts</p>
            <p className="text-[11px] text-slate-400 mt-1">Open violations, overdue SLAs, and safety incidents.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] uppercase font-mono text-slate-500">Sensor Anomaly Machine Score</p>
            <p className="text-xl font-bold font-mono text-cyan-400 mt-1">{risk?.ml_score} pts</p>
            <p className="text-[11px] text-slate-400 mt-1">Gas spikes, ventilation stalls, and thermal triggers.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] uppercase font-mono text-slate-500">Silence-to-Risk (Reporting Drift)</p>
            <p className="text-xl font-bold font-mono text-rose-400 mt-1">{risk?.silence_risk_score} pts</p>
            <p className="text-[11px] text-slate-400 mt-1">Unreported telemetry gaps and dormant node intervals.</p>
          </div>
        </div>
      </div>

      {/* Cryptographic Audit Trail */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            Cryptographic SHA-256 Hash Chain ({auditLogs.length} Events)
          </h3>
          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            Tamper-evident verification active
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">State Delta</th>
                <th className="py-3 px-4">SHA-256 Hash Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-slate-400 text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-amber-400">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-300">{log.resource_type} #{log.resource_id}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] truncate max-w-[200px]">
                      {log.after_state || log.metadata_json || 'Genesis state'}
                    </td>
                    <td className="py-2.5 px-4 text-emerald-400 text-[10px] font-mono">
                      {log.current_event_hash ? `${log.current_event_hash.substring(0, 16)}...` : 'HASH_PENDING'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
