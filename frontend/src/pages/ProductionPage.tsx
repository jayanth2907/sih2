import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { governanceService } from '../services';
import { ProductionReport } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Pickaxe, TrendingUp, TrendingDown, Plus, AlertCircle, CheckCircle2, X } from 'lucide-react';

export const ProductionPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [reports, setReports] = useState<ProductionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [shift, setShift] = useState('A');
  const [materialType, setMaterialType] = useState('COAL_RAW');
  const [planned, setPlanned] = useState('4500');
  const [actual, setActual] = useState('4120');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReports = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const data = await governanceService.getProductionReports(selectedMine.id);
      setReports(data);
    } catch (err) {
      console.error('Failed to load production reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedMine?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMine) return;
    setIsSubmitting(true);
    try {
      await governanceService.submitProductionReport({
        mine_id: selectedMine.id,
        shift,
        material_type: materialType,
        planned_quantity: parseFloat(planned),
        actual_quantity: parseFloat(actual),
        unit: 'TONNES',
        notes
      });
      setIsModalOpen(false);
      setNotes('');
      await fetchReports();
    } catch (err: any) {
      console.error('Production submission failed:', err);
      alert(err.response?.data?.detail || 'Failed to submit production report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedMine) return null;

  const totalPlanned = reports.reduce((acc, r) => acc + r.planned_quantity, 0);
  const totalActual = reports.reduce((acc, r) => acc + r.actual_quantity, 0);
  const overallVariancePct = totalPlanned > 0 ? ((totalActual - totalPlanned) / totalPlanned) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Pickaxe className="w-5 h-5 text-amber-400" />
            Coal Production Governance & Shift Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track planned vs actual extraction, seam output variances, and automated production deviation reviews.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>LOG SHIFT PRODUCTION</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Total Planned Target</span>
          <p className="text-2xl font-bold text-white">{totalPlanned.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Tonnes</span></p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Actual Extracted Output</span>
          <p className="text-2xl font-bold text-amber-400">{totalActual.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Tonnes</span></p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Output Variance</span>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-bold ${overallVariancePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {overallVariancePct.toFixed(2)}%
            </p>
            {overallVariancePct >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-400" />
            )}
          </div>
        </div>
      </div>

      {/* Production Reports Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Report Code</th>
              <th className="py-3 px-4">Date & Shift</th>
              <th className="py-3 px-4">Material</th>
              <th className="py-3 px-4">Planned Target</th>
              <th className="py-3 px-4">Actual Output</th>
              <th className="py-3 px-4">Variance</th>
              <th className="py-3 px-4">Deviation Flag</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No production shift records found for this mine.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-amber-400">{r.report_code}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">{r.report_date}</p>
                    <p className="text-[10px] text-slate-500">Shift {r.shift}</p>
                  </td>
                  <td className="py-3 px-4">{r.material_type}</td>
                  <td className="py-3 px-4 font-bold text-slate-300">{r.planned_quantity.toLocaleString()} {r.unit}</td>
                  <td className="py-3 px-4 font-bold text-amber-400">{r.actual_quantity.toLocaleString()} {r.unit}</td>
                  <td className="py-3 px-4 font-bold">
                    <span className={r.variance_percentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {r.variance_quantity > 0 ? `+${r.variance_quantity}` : r.variance_quantity} {r.unit} ({r.variance_percentage}%)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.deviation_flag === 'CRITICAL_SHORTFALL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      r.deviation_flag === 'DEVIATION_REVIEW_REQUIRED' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {r.deviation_flag}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={r.status} size="sm" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Shift Production Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-wider">Operational Entry</span>
                <h3 className="text-base font-bold text-white mt-0.5">Log Shift Production Output</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Shift</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500"
                  >
                    <option value="A">Shift A (Morning 06:00 - 14:00)</option>
                    <option value="B">Shift B (Afternoon 14:00 - 22:00)</option>
                    <option value="C">Shift C (Night 22:00 - 06:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Material Type</label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500"
                  >
                    <option value="COAL_RAW">Raw Seam Coal (ROM)</option>
                    <option value="COAL_WASHED">Washed Coal</option>
                    <option value="OVERBURDEN">Overburden (BCM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Planned Target (Tonnes)</label>
                  <input
                    type="number"
                    required
                    value={planned}
                    onChange={(e) => setPlanned(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Actual Extracted (Tonnes)</label>
                  <input
                    type="number"
                    required
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Operational Shift Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Face cutting conditions, shearer availability, bunker level notes..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Submit Shift Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
