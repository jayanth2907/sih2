import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { alertService } from '../services';
import type { Alert } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AnomalySpatialModal } from '../components/AnomalySpatialModal';
import { Bell, ShieldAlert, CheckCircle2, Crosshair, Filter, Clock, MapPin, Eye } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { selectedMine, focusInDigitalTwin } = useMineContext();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inspectAnomalyId, setInspectAnomalyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAlerts = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const data = await alertService.getAlerts(
        selectedMine.id,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedMine?.id, statusFilter]);

  const handleUpdateStatus = async (alertId: number, newStatus: string) => {
    try {
      await alertService.updateAlertStatus(alertId, newStatus);
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to update alert status:', err);
    }
  };

  if (!selectedMine) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Operational Alarm & Alert Dispatch
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time hazard notifications, threshold alerts, and incident links with deduplication.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
          {['ALL', 'UNREAD', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded transition-colors ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 font-mono text-xs">
            No active alerts matching filter.
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">ALERT #{a.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {a.source}
                    </span>
                    <StatusBadge status={a.severity} size="sm" />
                    <StatusBadge status={a.status} size="sm" />
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{a.title}</h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 font-mono text-xs">
                  {a.sensor_id && (
                    <button
                      onClick={() =>
                        focusInDigitalTwin({
                          type: 'sensor',
                          id: a.sensor_id,
                          x: 145.0, // Defaults to seam coords if exact not on alert
                          y: 470.0,
                          z: -318.0,
                          title: a.title
                        })
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      3D Focus
                    </button>
                  )}
                  {a.anomaly_id && (
                    <button
                      onClick={() => setInspectAnomalyId(a.anomaly_id || null)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect Proximity
                    </button>
                  )}
                  {a.status === 'UNREAD' && (
                    <button
                      onClick={() => handleUpdateStatus(a.id, 'ACKNOWLEDGED')}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all"
                    >
                      Acknowledge
                    </button>
                  )}
                  {a.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(a.id, 'RESOLVED')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 border border-slate-700 text-[11px] transition-all"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{a.message}</p>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  {a.location_context || 'Location N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Spatial Inspector Modal */}
      <AnomalySpatialModal
        anomalyId={inspectAnomalyId}
        onClose={() => setInspectAnomalyId(null)}
      />
    </div>
  );
};
