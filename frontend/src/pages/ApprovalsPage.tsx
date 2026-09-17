import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { useAuth } from '../context/AuthContext';
import { governanceService } from '../services';
import { ApprovalRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldCheck, CheckCircle, XCircle, Clock, X, FileCheck } from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const { user, isSystemAdmin, hasRole } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Decision Modal
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<string>('APPROVE');
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchApprovals = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const data = await governanceService.getApprovalRequests(selectedMine.id);
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approval requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [selectedMine?.id]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;
    setIsProcessing(true);
    try {
      await governanceService.processApprovalDecision(
        selectedApproval.id,
        decisionAction,
        comments || undefined
      );
      setSelectedApproval(null);
      setComments('');
      await fetchApprovals();
      alert(`Approval request successfully updated.`);
    } catch (err: any) {
      console.error('Approval decision failed:', err);
      alert(err.response?.data?.detail || 'Failed to process approval decision');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedMine) return null;

  const pendingRequests = approvals.filter((a) => a.status === 'PENDING');
  const decidedRequests = approvals.filter((a) => a.status !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Digital Sign-off & Separation of Duties Queue
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              SHA-256 AUDITED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enforce statutory four-eyes principle, executive review of mine dossiers, and non-repudiable audit trails.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Pending Decision</span>
          <p className="text-2xl font-bold text-amber-400">{pendingRequests.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Approved Sign-offs</span>
          <p className="text-2xl font-bold text-emerald-400">
            {decidedRequests.filter((d) => d.status === 'APPROVED').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Separation of Duties</span>
          <p className="text-2xl font-bold text-cyan-400">ENFORCED</p>
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md space-y-3 p-4">
        <h3 className="font-mono text-xs font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Pending Digital Approval Requests
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Request Code</th>
                <th className="py-2.5 px-3">Subject / Document</th>
                <th className="py-2.5 px-3">Resource Type</th>
                <th className="py-2.5 px-3">Requested By</th>
                <th className="py-2.5 px-3">Required Signer Role</th>
                <th className="py-2.5 px-3">Submitted</th>
                <th className="py-2.5 px-3 text-right">Sign-off Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No pending approval requests in the queue.
                  </td>
                </tr>
              ) : (
                pendingRequests.map((req) => {
                  const isRequester = user && req.requester_id === user.id;
                  const canSign = isSystemAdmin || (req.required_role ? hasRole([req.required_role as any]) : true);

                  return (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-amber-400">{req.request_code}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-white">{req.title}</p>
                        <p className="text-[10px] text-slate-500">{req.description || 'Routine sign-off'}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-bold">{req.resource_type}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {req.requester_name || `User #${req.requester_id}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold">
                          {req.required_role || 'ANY_OFFICER'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isRequester ? (
                          <span className="text-[10px] text-slate-500 italic bg-slate-900 px-2 py-1 rounded border border-slate-800">
                            Self-Sign Prohibited
                          </span>
                        ) : canSign ? (
                          <button
                            onClick={() => {
                              setSelectedApproval(req);
                              setDecisionAction('APPROVE');
                              setComments('');
                            }}
                            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold uppercase transition-all cursor-pointer"
                          >
                            SIGN / REVIEW
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500">Role Insufficient</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Decisions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md space-y-3 p-4">
        <h3 className="font-mono text-xs font-bold text-white flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          Completed Sign-off History & Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Request Code</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {decidedRequests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No completed approval entries recorded yet.
                  </td>
                </tr>
              ) : (
                decidedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-amber-400">{req.request_code}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{req.title}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-wider">Digital Sign-off Action</span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedApproval.request_code}</h3>
              </div>
              <button onClick={() => setSelectedApproval(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 font-semibold">{selectedApproval.title}</p>

            <form onSubmit={handleDecisionSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Decision Sign-off</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecisionAction('APPROVE')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border font-bold text-xs cursor-pointer ${
                      decisionAction === 'APPROVE'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    APPROVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionAction('REJECT')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border font-bold text-xs cursor-pointer ${
                      decisionAction === 'REJECT'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    REJECT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Sign-off Comments / Audit Rationale</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Verified against shift extraction logs and DGMS standards..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500 font-sans"
                />
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-400">
                <span className="font-bold text-amber-400 block mb-0.5">Audit Stamp Notice:</span>
                This action will be committed to the SHA-256 hash-chained governance ledger under your authenticated user credentials.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApproval(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  {isProcessing ? 'Recording...' : 'Commit Sign-off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
