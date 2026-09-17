import React from 'react';
import { useMineContext } from '../context/MineContext';
import { useAuth } from '../context/AuthContext';
import { Pickaxe, ChevronDown, ShieldCheck } from 'lucide-react';

export const MineSelector: React.FC = () => {
  const { mines, selectedMine, selectedMineId, setSelectedMineId, isLoading } = useMineContext();
  const { user, hasRole } = useAuth();

  const canSwitchMines = hasRole(['SYSTEM_ADMIN', 'REGULATOR']) || (user?.assigned_mine_ids && user.assigned_mine_ids.length > 1);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
        Loading Mines...
      </div>
    );
  }

  if (!selectedMine) {
    return (
      <div className="text-xs text-slate-400 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
        No Mine Scope
      </div>
    );
  }

  if (!canSwitchMines) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-amber-900/40 rounded-lg text-xs font-mono">
        <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-slate-300 font-semibold">{selectedMine.name}</span>
        <span className="px-1.5 py-0.5 bg-amber-950/80 text-amber-300 rounded text-[10px] border border-amber-800/60">
          {selectedMine.code}
        </span>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-amber-500/60 rounded-lg transition-colors cursor-pointer group">
        <Pickaxe className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
        <select
          value={selectedMineId || ''}
          onChange={(e) => setSelectedMineId(Number(e.target.value))}
          aria-label="Select active coal mine"
          className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-4 appearance-none"
        >
          {mines.map((mine) => (
            <option key={mine.id} value={mine.id} className="bg-slate-900 text-slate-200">
              {mine.name} ({mine.code})
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-slate-400 -ml-3 pointer-events-none" />
      </div>
    </div>
  );
};
