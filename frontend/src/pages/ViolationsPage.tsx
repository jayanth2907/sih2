import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { incidentService } from '../services';
import { Violation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, ShieldAlert, CheckCircle2, Clock, Scale } from 'lucide-react';

export const ViolationsPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!selectedMine) return;
    setIsLoading(true);
    incidentService.getViolations(selectedMine.id)
      .then(setViolations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedMine?.id]);

  if (!selectedMine) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Statutory DGMS Compliance & Violations</h2>
        <p className="text-xs text-slate-400 mt-1">
          Regulatory breach log citing Coal Mines Regulations (CMR 2017) and statutory remedial deadlines.
        </p>
      </div>

      <div className="space-y-4">
        {violations.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 font-mono text-xs">
            No statutory non-compliance violations recorded for this mine.
          </div>
        ) : (
          violations.map((v) => (
            <div key={v.id} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 text-xs font-mono font-bold border border-rose-800/60">
                      {v.violation_code}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{v.statute}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">{v.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={v.severity} size="sm" />
                  <StatusBadge status={v.status} size="sm" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-start gap-2 text-amber-300">
                  <Scale className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-mono font-semibold">{v.regulatory_clause}</p>
                </div>
                <p className="text-slate-300 leading-relaxed pl-6">{v.description}</p>
              </div>

              {/* Corrective Actions Section */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Assigned Remedial Actions:
                </p>
                {v.corrective_actions.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono">No corrective actions assigned yet.</p>
                ) : (
                  v.corrective_actions.map((ca) => (
                    <div key={ca.id} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/60 flex items-center justify-between text-xs font-mono">
                      <div>
                        <p className="text-slate-200">{ca.action_text}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Target Deadline: {new Date(ca.target_completion_date).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={ca.status} size="sm" />
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-800/60">
                <span>Inspector: <b className="text-slate-300">{v.inspector_name || 'DGMS Officer'}</b></span>
                <span>Penalty Liability: <b className="text-rose-400">₹{v.financial_penalty_amount.toLocaleString()}</b></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
