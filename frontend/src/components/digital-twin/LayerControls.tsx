import React from 'react';
import { LayerVisibility } from './types';
import { Layers, Activity, Video, Cpu, Wind, Box, Flame, GitCommit, Eye } from 'lucide-react';

interface LayerControlsProps {
  layers: LayerVisibility;
  onChange: (layers: LayerVisibility) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  onChange,
  isOpen,
  onToggleOpen
}) => {
  const toggle = (key: keyof LayerVisibility) => {
    onChange({ ...layers, [key]: !layers[key] });
  };

  const layerItems: { key: keyof LayerVisibility; label: string; icon: any; color: string }[] = [
    { key: 'sensors', label: 'IoT Sensors', icon: Activity, color: 'text-emerald-400' },
    { key: 'cameras', label: 'CCTV Cameras', icon: Video, color: 'text-sky-400' },
    { key: 'cameraFov', label: 'Camera FOV Cones', icon: Eye, color: 'text-sky-300' },
    { key: 'equipment', label: 'Heavy Machinery', icon: Cpu, color: 'text-amber-400' },
    { key: 'ventilation', label: 'Hazard & Incident Beacons', icon: Flame, color: 'text-rose-400' },
    { key: 'mineStructure', label: 'Shafts & Tunnels', icon: Box, color: 'text-slate-300' },
    { key: 'proximityLines', label: '3D Proximity Links', icon: GitCommit, color: 'text-cyan-400' }
  ];

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col items-start font-mono text-xs">
      <button
        onClick={onToggleOpen}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md shadow-xl text-slate-200 transition-all cursor-pointer"
      >
        <Layers className="w-4 h-4 text-amber-400" />
        <span className="font-bold tracking-wider">LAYERS</span>
        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-400">
          {Object.values(layers).filter(Boolean).length}
        </span>
      </button>

      {isOpen && (
        <div className="mt-2 w-56 p-3 rounded-2xl bg-slate-950/95 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1">
            Layer Visibility
          </div>
          {layerItems.map((item) => {
            const Icon = item.icon;
            const isChecked = layers[item.key];
            return (
              <label
                key={item.key}
                onClick={() => toggle(item.key)}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-900/80 cursor-pointer text-slate-300 transition-all select-none"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span className="text-xs">{item.label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};
