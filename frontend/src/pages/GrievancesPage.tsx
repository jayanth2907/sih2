import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { governanceService } from '../services';
import { Grievance } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MessageSquare, AlertCircle, Clock, Plus, X, CheckCircle2 } from 'lucide-react';

export const GrievancesPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Submit Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('SAFETY');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update / Resolve Modal
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchGrievances = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const data = await governanceService.getGrievances(selectedMine.id);
      setGrievances(data);
    } catch (err) {
      console.error('Failed to load grievances:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, [selectedMine?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMine) return;
    setIsSubmitting(true);
    try {
      await governanceService.submitGrievance({
        mine_id: selectedMine.id,
        title,
        category,
        priority,
        description,
        anonymous: false
      });
      setIsSubmitModalOpen(false);
      setTitle('');
      setDescription('');
      await fetchGrievances();
    } catch (err: any) {
      console.error('Failed to submit grievance:', err);
      alert(err.response?.data?.detail || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance) return;
    setIsUpdating(true);
    try {
      await governanceService.updateGrievanceStatus(
        selectedGrievance.id,
        newStatus || selectedGrievance.status,
        resolutionNotes || undefined
      );
      setSelectedGrievance(null);
      await fetchGrievances();
    } catch (err: any) {
      console.error('Failed to update grievance:', err);
      alert(err.response?.data?.detail || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!selectedMine) return null;

  const totalGrievances = grievances.length;
  const openCount = grievances.filter((g) => ['SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'ESCALATED'].includes(g.status)).length;
  const escalatedCount = grievances.filter((g) => g.is_escalated).length;
  const resolvedCount = grievances.filter((g) => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(g.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Workforce Grievance Redressal & SLA Tracking
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 text-blue-400 border border-blue-800">
              DGMS LABOUR & SAFETY OMBUDSMAN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auditable dispute resolution, safety hazard complaints, contractor grievances, and automated escalation timers.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>LODGE GRIEVANCE</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Total Lodged</span>
          <p className="text-2xl font-bold text-white">{totalGrievances}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Active & In-Progress</span>
          <p className="text-2xl font-bold text-amber-400">{openCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Escalated</span>
          <p className="text-2xl font-bold text-rose-400">{escalatedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Resolved / Closed</span>
          <p className="text-2xl font-bold text-emerald-400">{resolvedCount}</p>
        </div>
      </div>

      {/* Grievance Ledger Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md space-y-3 p-4">
        <h3 className="font-mono text-xs font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Grievance Ledger & Resolution Workflow
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Case Code</th>
                <th className="py-2.5 px-3">Category & Title</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Due By (SLA)</th>
                <th className="py-2.5 px-3">Escalated?</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {grievances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No active grievances lodged for this mine.
                  </td>
                </tr>
              ) : (
                grievances.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-amber-400">{g.grievance_code}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-white">{g.title}</p>
                      <p className="text-[10px] text-slate-500">Category: {g.category}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={g.priority} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {g.due_at ? new Date(g.due_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3">
                      {g.is_escalated ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          ESCALATED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                          STANDARD
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={g.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedGrievance(g);
                          setNewStatus(g.status);
                          setResolutionNotes(g.resolution_notes || '');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 text-[10px] font-bold cursor-pointer"
                      >
                        MANAGE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lodge Grievance Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-wider">Formal Ombudsman</span>
                <h3 className="text-base font-bold text-white mt-0.5">Lodge Formal Mine Grievance</h3>
              </div>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Grievance Title / Subject</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Inadequate ventilation at Headings 4B..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500"
                  >
                    <option value="SAFETY">Safety Hazard</option>
                    <option value="ENVIRONMENT">Environmental</option>
                    <option value="LABOUR">Labour & Welfare</option>
                    <option value="CONTRACTOR">Contractor Issue</option>
                    <option value="FACILITIES">Mine Facilities</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Detailed Description & Location</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise details of the safety concern or grievance..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Register Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Grievance Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-wider">{selectedGrievance.grievance_code} • Workflow Action</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedGrievance.title}</h3>
              </div>
              <button onClick={() => setSelectedGrievance(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 text-xs font-sans">
              <p className="font-semibold text-white mb-1">Details:</p>
              <p>{selectedGrievance.description}</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500 font-mono"
                >
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="ESCALATED">ESCALATED</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Resolution Summary / Action Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Auxiliary fan replaced and airflow restored to 28 m3/min..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGrievance(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  {isUpdating ? 'Updating...' : 'Save Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
