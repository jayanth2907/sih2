import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { governanceService } from '../services';
import { Worker, AttendanceRecord } from '../types';
import { Users, Clock, Plus, X, UserCheck, ShieldCheck } from 'lucide-react';

export const WorkforcePage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL');

  // Mark Attendance Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | ''>('');
  const [shiftCode, setShiftCode] = useState<string>('A');
  const [attendanceStatus, setAttendanceStatus] = useState<string>('PRESENT');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const [workersData, attendanceData] = await Promise.all([
        governanceService.getWorkers(selectedMine.id),
        governanceService.getAttendanceRoster(selectedMine.id)
      ]);
      setWorkers(workersData);
      setAttendance(attendanceData);
      if (workersData.length > 0) setSelectedWorkerId(workersData[0].id);
    } catch (err) {
      console.error('Failed to load workforce data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMine?.id]);

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMine || !selectedWorkerId) return;
    setIsSubmitting(true);
    try {
      await governanceService.markAttendance({
        worker_id: Number(selectedWorkerId),
        mine_id: selectedMine.id,
        shift_code: shiftCode,
        status: attendanceStatus,
        verification_mode: 'SIMULATED',
        notes: remarks || undefined
      });
      setIsModalOpen(false);
      setRemarks('');
      await fetchData();
    } catch (err: any) {
      console.error('Failed to record attendance:', err);
      alert(err.response?.data?.detail || 'Failed to record attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedMine) return null;

  const totalWorkers = workers.length;
  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const lateCount = attendance.filter((a) => a.status === 'LATE').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const attendanceRate = totalWorkers > 0 ? ((presentCount + lateCount) / totalWorkers) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Workforce Roster & Shift Attendance
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 text-blue-400 border border-blue-800">
              SIMULATED ROSTER
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track daily underground and surface personnel assignments, contractor staffing, and shift muster rolls.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>MARK ATTENDANCE</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Registered Personnel</span>
          <p className="text-2xl font-bold text-white">{totalWorkers}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Present on Duty</span>
          <p className="text-2xl font-bold text-emerald-400">{presentCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Late / Deviations</span>
          <p className="text-2xl font-bold text-amber-400">{lateCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
          <span className="text-slate-500 text-[10px] uppercase">Muster Roll Compliance</span>
          <p className="text-2xl font-bold text-cyan-400">{attendanceRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Active Shifts Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
        <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Configured Mine Shifts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Shift A</span>
              <span className="text-[10px] text-slate-500 uppercase">Morning General</span>
            </div>
            <p className="text-slate-300 text-xs">06:00 - 14:00</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Shift B</span>
              <span className="text-[10px] text-slate-500 uppercase">Afternoon</span>
            </div>
            <p className="text-slate-300 text-xs">14:00 - 22:00</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400">Shift C</span>
              <span className="text-[10px] text-slate-500 uppercase">Night Deep</span>
            </div>
            <p className="text-slate-300 text-xs">22:00 - 06:00</p>
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <h3 className="font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            Daily Muster & Attendance Log
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Worker ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Designation</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Verification Mode</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No attendance logs recorded for selected mine.
                  </td>
                </tr>
              ) : (
                attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-amber-400">{a.worker_code || `W-${a.worker_id}`}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{a.worker_name || 'Mine Personnel'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{a.designation || 'Technician'}</td>
                    <td className="py-2.5 px-3 text-white">{a.attendance_date}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                        {a.verification_mode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === 'PRESENT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        a.status === 'LATE' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        a.status === 'ON_LEAVE' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-wider">Muster Roll</span>
                <h3 className="text-base font-bold text-white mt-0.5">Record Worker Attendance</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMarkAttendance} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Select Worker</label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.worker_code} - {w.full_name} ({w.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Shift Code</label>
                  <select
                    value={shiftCode}
                    onChange={(e) => setShiftCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500"
                  >
                    <option value="A">Shift A (06:00 - 14:00)</option>
                    <option value="B">Shift B (14:00 - 22:00)</option>
                    <option value="C">Shift C (22:00 - 06:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                  <select
                    value={attendanceStatus}
                    onChange={(e) => setAttendanceStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Gate 2 muster, safety briefing completed..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500"
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
                  {isSubmitting ? 'Recording...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
