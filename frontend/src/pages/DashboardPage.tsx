import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { sensorService, incidentService, riskService, predictiveRiskService, governanceService } from '../services';
import { Sensor, Incident, Violation, RiskScore, AnomalyEvent, PredictiveRiskSummary } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  Layers, 
  Clock, 
  Cpu,
  BrainCircuit,
  Eye,
  CheckCircle2,
  TrendingUp,
  Radio,
  ArrowRight,
  ClipboardCheck
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { selectedMine, setCurrentTab, focusInDigitalTwin } = useMineContext();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [predictiveSummary, setPredictiveSummary] = useState<PredictiveRiskSummary | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const [sData, iData, vData, rData, aData, pData] = await Promise.all([
        sensorService.getSensors(selectedMine.id),
        incidentService.getIncidents(selectedMine.id),
        incidentService.getViolations(selectedMine.id),
        riskService.getMineRisk(selectedMine.id, true),
        riskService.getAnomalies(selectedMine.id),
        predictiveRiskService.getLatestPredictiveRisk(selectedMine.id).catch(() => null)
      ]);
      setSensors(sData);
      setIncidents(iData);
      setViolations(vData);
      setRisk(rData);
      setAnomalies(aData);
      setPredictiveSummary(pData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMine?.id]);

  const handleSimulateTick = async () => {
    if (!selectedMine) return;
    setIsSimulating(true);
    try {
      await sensorService.simulateBatch(selectedMine.id);
      await fetchData();
    } catch (err) {
      console.error('Simulation tick error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!selectedMine) {
    return (
      <div className="p-12 text-center text-slate-400 surface-card rounded-md">
        <p className="font-mono text-sm">Please select an operational mine from the top navigation.</p>
      </div>
    );
  }

  const activeSensorsCount = sensors.filter((s) => s.status === 'ACTIVE').length;
  const criticalSensorsCount = sensors.filter((s) => s.status === 'CRITICAL' || s.status === 'WARNING').length;
  const openIncidentsCount = incidents.filter((i) => i.status !== 'CLOSED').length;
  const openViolationsCount = violations.filter((v) => v.status !== 'CLOSED').length;
  const highRiskEscalation = predictiveSummary && (predictiveSummary.predicted_severity === 'CRITICAL' || predictiveSummary.predicted_severity === 'HIGH');

  return (
    <div className="space-y-5">
      {/* Top Banner with Mine Overview & Operational Actions */}
      <div className="p-4 md:p-5 rounded-md bg-[#0D100F] border border-[#1B211E] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-white tracking-tight">{selectedMine.name}</h2>
            <span className="px-2 py-0.5 rounded bg-[#171B18] text-amber-400 text-xs font-mono font-bold border border-amber-500/30">
              {selectedMine.code}
            </span>
            <StatusBadge status={selectedMine.status} size="sm" />
            <span className="text-[11px] font-mono text-slate-400 border-l border-[#1B211E] pl-3">
              {selectedMine.mine_type} • {selectedMine.district}, {selectedMine.state} • Elev: {selectedMine.elevation}m
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentTab('digital-twin')}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#121614] hover:bg-[#171B18] text-amber-400 border border-[#1B211E] hover:border-amber-500/40 text-xs font-mono font-semibold transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>OPEN 3D TWIN</span>
          </button>
          
          <button
            onClick={handleSimulateTick}
            disabled={isSimulating}
            className="flex items-center gap-2 px-3.5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-[#080A09] font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-sm shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Ingesting...' : 'Simulate Telemetry Tick'}
          </button>
        </div>
      </div>

      {/* Metric Cards Grid - Compact High Density */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Overall Risk"
          value={`${risk?.score || 0} / 100`}
          subtitle={risk?.severity || 'LOW'}
          icon={ShieldAlert}
          variant={
            risk?.severity === 'CRITICAL' ? 'rose' :
            risk?.severity === 'HIGH' ? 'amber' :
            risk?.severity === 'MEDIUM' ? 'cyan' : 'emerald'
          }
          onClick={() => setCurrentTab('risk-audit')}
        />
        <StatCard
          title="Critical Nodes"
          value={`${criticalSensorsCount}`}
          subtitle={`${activeSensorsCount}/${sensors.length} online`}
          icon={Activity}
          variant={criticalSensorsCount > 0 ? 'rose' : 'emerald'}
          onClick={() => setCurrentTab('sensors')}
        />
        <StatCard
          title="Open Incidents"
          value={openIncidentsCount}
          subtitle="Triage in progress"
          icon={AlertTriangle}
          variant={openIncidentsCount > 0 ? 'amber' : 'default'}
          onClick={() => setCurrentTab('incidents')}
        />
        <StatCard
          title="Violations"
          value={openViolationsCount}
          subtitle="DGMS compliance notices"
          icon={FileText}
          variant={openViolationsCount > 0 ? 'rose' : 'default'}
          onClick={() => setCurrentTab('violations')}
        />
        <StatCard
          title="Predicted Risk"
          value={predictiveSummary?.predicted_risk_score !== undefined ? `${predictiveSummary.predicted_risk_score}/100` : 'N/A'}
          subtitle={predictiveSummary?.predicted_severity || 'NORMAL'}
          icon={BrainCircuit}
          variant={highRiskEscalation ? 'rose' : 'cyan'}
          onClick={() => setCurrentTab('predictive-risk')}
        />
        <StatCard
          title="Field Tasks"
          value="4"
          subtitle="1 sync queued"
          icon={ClipboardCheck}
          variant="default"
          onClick={() => setCurrentTab('field-operations')}
        />
      </div>

      {/* Main Grid: Telemetry Matrix + Explainable Risk Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Live Telemetry Nodes */}
        <div className="lg:col-span-2 bg-[#0D100F] border border-[#1B211E] rounded-md p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1B211E]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Sensor Telemetry & Spatial Positioning
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Source: <span className="text-amber-400 font-semibold">SIMULATED (MQTT READY)</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1B211E] text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-2 font-semibold">Code / Name</th>
                  <th className="pb-2 font-semibold">Zone & Level</th>
                  <th className="pb-2 font-semibold">Reading</th>
                  <th className="pb-2 font-semibold">Thresholds</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B211E] text-slate-300">
                {sensors.map((s) => (
                  <tr key={s.id} className="hover:bg-[#121614] transition-colors">
                    <td className="py-2 pr-2">
                      <p className="font-bold text-white text-[11px]">{s.sensor_code}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{s.name}</p>
                    </td>
                    <td className="py-2 pr-2 text-[10.5px]">
                      <p className="text-slate-200">{s.zone_name || 'Main Zone'}</p>
                      <p className="text-[9.5px] text-slate-500">{s.level_name || 'Level 1'}</p>
                    </td>
                    <td className="py-2 pr-2">
                      <span className={`text-xs font-bold ${
                        s.status === 'CRITICAL' ? 'text-rose-400' :
                        s.status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {s.last_value !== undefined ? `${s.last_value} ${s.unit}` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-slate-400 text-[10.5px]">
                      {s.warning_threshold} / {s.critical_threshold} {s.unit}
                    </td>
                    <td className="py-2 pr-2">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => focusInDigitalTwin({ type: 'sensor', id: s.id, x: s.x, y: s.y, z: s.z, title: s.sensor_code })}
                        className="px-2 py-1 rounded bg-[#171B18] hover:bg-amber-500/20 text-amber-400 border border-[#1B211E] hover:border-amber-500/40 text-[10px] font-mono transition-colors cursor-pointer"
                        title="Focus sensor in 3D Digital Twin"
                      >
                        FOCUS 3D
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Explainable Risk Intelligence & Priority Queue */}
        <div className="space-y-4">
          <div className="bg-[#0D100F] border border-[#1B211E] rounded-md p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1B211E]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Risk Engine Breakdown
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">EXPLAINABLE</span>
            </div>

            <p className="text-[11.5px] text-slate-300 leading-relaxed mb-3">
              {risk?.explanation || 'Computing active safety and compliance indicators...'}
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-[#080A09] border border-[#1B211E]">
                <span className="text-slate-400 text-[11px]">Rule Compliance</span>
                <span className="font-bold text-amber-400">{risk?.rule_score || 0} pts</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#080A09] border border-[#1B211E]">
                <span className="text-slate-400 text-[11px]">Sensor Anomaly Spikes</span>
                <span className="font-bold text-cyan-400">{risk?.ml_score || 0} pts</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#080A09] border border-[#1B211E]">
                <span className="text-slate-400 text-[11px]">Silence-to-Risk Drift</span>
                <span className="font-bold text-rose-400">{risk?.silence_risk_score || 0} pts</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#1B211E] text-[9.5px] text-slate-500 font-mono flex items-center justify-between">
              <span>Model: {risk?.model_version || 'TRINETRA-RISK-v2.0'}</span>
              <span>Rule: {risk?.rule_version || 'DGMS-2026.1'}</span>
            </div>
          </div>

          {/* Priority Anomaly & Alert Feed */}
          <div className="bg-[#0D100F] border border-[#1B211E] rounded-md p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1B211E]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Priority Anomalies
                </h3>
              </div>
              <button 
                onClick={() => setCurrentTab('alerts')}
                className="text-[10px] font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                VIEW ALL <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
              {anomalies.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center font-mono">No active anomaly triggers</p>
              ) : (
                anomalies.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-2.5 rounded bg-[#080A09] border border-[#1B211E] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-rose-400 text-[11px] font-mono">{a.anomaly_type}</span>
                      <StatusBadge status={a.severity} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{a.description}</p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#1B211E]/60 text-[9.5px] text-slate-500 font-mono">
                      <span>{new Date(a.detected_at).toLocaleTimeString()}</span>
                      <button
                        onClick={() => setCurrentTab('alerts')}
                        className="text-amber-400 hover:underline cursor-pointer"
                      >
                        TRIAGE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
