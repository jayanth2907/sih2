import React from 'react';
import { ViewMode, CameraFocusTarget } from './types';
import { MineLevel } from '../../types';
import { RotateCcw, Maximize2, ShieldAlert, Activity, Flame, Wind, CheckCircle2, ChevronDown } from 'lucide-react';

interface ScenePresetControlsProps {
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  levels: MineLevel[];
  onFocusLevel: (lvl: MineLevel) => void;
  onResetView: () => void;
  onFitOverview: () => void;
  onTriggerScenario: (scenario: string) => void;
  isSimulating: boolean;
}

export const ScenePresetControls: React.FC<ScenePresetControlsProps> = ({
  viewMode,
  onToggleViewMode,
  levels,
  onFocusLevel,
  onResetView,
  onFitOverview,
  onTriggerScenario,
  isSimulating
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center gap-2 font-mono text-xs">
      {/* View Mode Toggle: Operational vs Risk Heatmap */}
      <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl">
        <button
          onClick={() => onToggleViewMode('OPERATIONAL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            viewMode === 'OPERATIONAL'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          OPERATIONAL
        </button>
        <button
          onClick={() => onToggleViewMode('RISK_HEATMAP')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            viewMode === 'RISK_HEATMAP'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          RISK HEATMAP
        </button>
      </div>

      {/* Level Selector */}
      {levels && levels.length > 0 && (
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-slate-200 cursor-pointer">
            <span>LEVELS ({levels.length})</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <div className="absolute right-0 top-full mt-1.5 w-52 p-2 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl hidden group-hover:block hover:block z-30">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => onFocusLevel(lvl)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-900 text-slate-300 hover:text-amber-400 text-xs transition-all flex items-center justify-between"
              >
                <span className="truncate">{lvl.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{lvl.depth_meters}m</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera Reset Actions */}
      <button
        onClick={onResetView}
        title="Reset Camera Orientation"
        className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-slate-300 hover:text-white transition-all cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <button
        onClick={onFitOverview}
        title="Fit Entire Mine"
        className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md text-slate-300 hover:text-white transition-all cursor-pointer"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Simulation Scenario Trigger Dropdown */}
      <div className="relative group">
        <button
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 font-bold backdrop-blur-md transition-all cursor-pointer disabled:opacity-50"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>{isSimulating ? 'SIMULATING...' : 'TEST SCENARIO'}</span>
          <ChevronDown className="w-3 h-3 ml-0.5 text-amber-400" />
        </button>
        <div className="absolute right-0 top-full mt-1.5 w-60 p-2 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl hidden group-hover:block hover:block z-30 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">
            Deterministic Test Injections
          </div>
          <button
            onClick={() => onTriggerScenario('methane_spike')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-950/40 hover:text-rose-400 text-slate-300 text-xs transition-all flex items-center gap-2"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Methane Critical Surge (CH4)</span>
          </button>
          <button
            onClick={() => onTriggerScenario('co_spike')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-950/40 hover:text-amber-400 text-slate-300 text-xs transition-all flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Spontaneous CO Rise (Goaf)</span>
          </button>
          <button
            onClick={() => onTriggerScenario('ventilation_drop')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-sky-950/40 hover:text-sky-400 text-slate-300 text-xs transition-all flex items-center gap-2"
          >
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>Airway Velocity Drop</span>
          </button>
          <button
            onClick={() => onTriggerScenario('sensor_offline')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-slate-400 text-slate-400 text-xs transition-all flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span>Simulate Sensor Silence / Offline</span>
          </button>
          <button
            onClick={() => onTriggerScenario('normal')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-950/40 hover:text-emerald-400 text-slate-300 text-xs transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restore Normal Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
