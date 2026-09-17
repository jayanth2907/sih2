import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { incidentService } from '../services';
import { Incident, IncidentStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AlertTriangle, Clock, ArrowRight, ShieldCheck, CheckCircle2, User, Plus, Crosshair } from 'lucide-react';

const NEXT_STATUS_MAP: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: ['TRIAGED', 'ASSIGNED', 'CLOSED'],
  TRIAGED: ['ASSIGNED', 'IN_PROGRESS', 'CLOSED'],
  ASSIGNED: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'ESCALATED'],
  ESCALATED: ['RESOLVED', 'IN_PROGRESS'],
  RESOLVED: ['VERIFIED', 'IN_PROGRESS'],
  VERIFIED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: []
};

export const IncidentsPage: React.FC = () => {
  const { selectedMine, focusInDigitalTwin } = useMineContext();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [targetStatus, setTargetStatus] = useState<IncidentStatus | ''>('');
  const [comment, setComment] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncidents = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const data = await incidentService.getIncidents(selectedMine.id);
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [selectedMine?.id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !targetStatus) return;
    setIsUpdating(true);
    try {
      await incidentService.updateIncidentStatus(
        selectedIncident.id,
        targetStatus as IncidentStatus,
        comment,
        notes
      );
      setSelectedIncident(null);
      setTargetStatus('');
      setComment('');
      setNotes('');
      await fetchIncidents();
    } catch (err) {
      console.error('Failed to update incident state:', err);
      alert('Failed to update status transition.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Operational Safety Incidents</h2>
          <p className="text-xs text-slate-400 mt-1">
            Governance state machine lifecycle: Triage, Assignment, SLA Tracking, Verification, and Closure.
          </p>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4 font-semibold">Incident Code</th>
              <th className="py-3.5 px-4 font-semibold">Title & Category</th>
              <th className="py-3.5 px-4 font-semibold">Zone / Location</th>
              <th className="py-3.5 px-4 font-semibold">Severity</th>
              <th className="py-3.5 px-4 font-semibold">SLA Status</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No active incidents recorded for this mine.
                </td>
              </tr>
            ) : (
              incidents.map((inc) => {
                const nextOptions = NEXT_STATUS_MAP[inc.status] || [];
                return (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-amber-400">{inc.incident_code}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{inc.title}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[220px]">{inc.category}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-200">{inc.zone_name || 'Working Zone'}</p>
                      <p className="text-[10px] text-slate-500">({inc.x}, {inc.y}, {inc.z})</p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inc.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{inc.sla_hours}h SLA</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inc.status} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            focusInDigitalTwin({
                              type: 'incident',
                              id: inc.id,
                              x: inc.x,
                              y: inc.y,
                              z: inc.z,
                              title: `${inc.incident_code}: ${inc.title}`
                            })
                          }
                          title="Center in 3D Digital Twin"
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold transition-all border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                        >
                          <Crosshair className="w-3 h-3" />
                          <span>3D Focus</span>
                        </button>
                        {nextOptions.length > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedIncident(inc);
                              setTargetStatus(nextOptions[0]);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[11px] font-bold transition-all border border-slate-700 cursor-pointer"
                          >
                            Transition
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* State Machine Transition Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-800">
                  {selectedIncident.incident_code}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedIncident.title}</h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Target State Transition
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as IncidentStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                >
                  {NEXT_STATUS_MAP[selectedIncident.status].map((st) => (
                    <option key={st} value={st}>
                      Transition to {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Governance Comment / Evidence Log
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Detail corrective actions or verification results for the audit trail..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all"
                >
                  {isUpdating ? 'Recording Transition...' : 'Confirm Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
