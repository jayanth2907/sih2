import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { governanceService } from '../services';
import { EnvironmentalObservation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Leaf, Wind, Eye, ShieldAlert } from 'lucide-react';

export const EnvironmentPage: React.FC = () => {
  const { selectedMine, focusInDigitalTwin } = useMineContext();
  const [observations, setObservations] = useState<EnvironmentalObservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const obsData = await governanceService.getEnvironmentalObservations(selectedMine.id);
      setObservations(obsData);
    } catch (err) {
      console.error('Failed to load environmental data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMine?.id]);

  if (!selectedMine) return null;

  const activeObservations = observations.filter((o) => o.status === 'OPEN' || o.status === 'INVESTIGATING').length;
  const criticalCount = observations.filter((o) => o.severity === 'CRITICAL' || o.severity === 'HIGH').length;

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Environmental Monitoring</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Air quality, dust, water discharge, and atmospheric safety observations for this mine.
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
        <div className="metric-card">
          <p className="metric-label">Total Observations</p>
          <p className="metric-value">{observations.length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Active Issues</p>
          <p className="metric-value" style={{ color: activeObservations > 0 ? 'var(--color-warning-text)' : 'var(--text-primary)' }}>{activeObservations}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">High / Critical</p>
          <p className="metric-value" style={{ color: criticalCount > 0 ? 'var(--color-critical-text)' : 'var(--text-primary)' }}>{criticalCount}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Live Sensor Link</p>
          <p className="text-2xl font-bold text-emerald-400">ONLINE</p>
        </div>
      </div>

      {/* Statutory Rules Reference Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Wind className="w-4 h-4 text-amber-400" />
            Configured Statutory Thresholds & Monitoring Parameters
          </h3>
          <span className="text-slate-500 text-[10px]">DEMO CONFIGURATION • DGMS GUIDELINE ALIGNED</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Methane (CH4)</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300">CRITICAL</span>
            </div>
            <p className="text-slate-400 text-[11px]">General mine atmosphere limit</p>
            <p className="text-white font-bold text-sm">Threshold: ≤ 0.75 %</p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">Source: CMR 2017 Reg 153</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Carbon Monoxide (CO)</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300">CRITICAL</span>
            </div>
            <p className="text-slate-400 text-[11px]">Spontaneous combustion trigger</p>
            <p className="text-white font-bold text-sm">Threshold: ≤ 50.0 PPM</p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">Source: DGMS Safety Circular</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Respirable Dust (PM10)</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300">HIGH</span>
            </div>
            <p className="text-slate-400 text-[11px]">8-hour time weighted average</p>
            <p className="text-white font-bold text-sm">Threshold: ≤ 3.0 mg/m³</p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">Source: DGMS Standard Rule</p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Mine Air Temperature</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-950 text-blue-300">MEDIUM</span>
            </div>
            <p className="text-slate-400 text-[11px]">Underground face wet-bulb</p>
            <p className="text-white font-bold text-sm">Threshold: ≤ 33.5 °C</p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">Source: CMR 2017 Reg 155</p>
          </div>
        </div>
      </div>

      {/* Environmental Observations Log */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md space-y-3 p-4">
        <h3 className="font-mono text-xs font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Atmospheric Anomalies & Governance Observations
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Parameter & Reading</th>
                <th className="py-2.5 px-3">Location Context</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Detected At</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">3D Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {observations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No active environmental observations. Atmosphere within normal regulatory thresholds.
                  </td>
                </tr>
              ) : (
                observations.map((obs) => (
                  <tr key={obs.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-white">{obs.parameter_name}</p>
                      <p className="text-[10px] text-rose-400 font-bold">
                        Observed: {obs.observed_value} {obs.unit} (Limit: {obs.threshold_limit} {obs.unit})
                      </p>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="text-white">{obs.location_context || 'Underground Seam'}</p>
                      <p className="text-[10px] text-slate-500">Coords: ({obs.x}, {obs.y}, {obs.z})</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={obs.severity} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{obs.detected_at ? new Date(obs.detected_at).toLocaleString() : 'Recent'}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={obs.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() =>
                          focusInDigitalTwin({
                            type: 'anomaly',
                            x: obs.x || 0,
                            y: obs.y || 0,
                            z: obs.z || 0,
                            title: `${obs.parameter_name} Exceedance (${obs.observed_value} ${obs.unit})`
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-[10px] font-bold cursor-pointer transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        <span>FOCUS IN 3D</span>
                      </button>
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
