import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { mineService } from '../services';
import { DigitalTwinState } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Layers3, Box, Activity, Video, Cpu, AlertTriangle, Radio, Sparkles } from 'lucide-react';

export const DigitalTwinPreviewPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [twinData, setTwinData] = useState<DigitalTwinState | null>(null);
  const [activeTab, setActiveTab] = useState<'sensors' | 'cameras' | 'machinery' | 'incidents'>('sensors');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedMine) return;
    setIsLoading(true);
    mineService.getDigitalTwin(selectedMine.id)
      .then(setTwinData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedMine?.id]);

  if (!selectedMine) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers3 className="w-5 h-5 text-amber-400" />
            3D Digital Mine Twin Spatial Foundation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Backend spatial aggregation endpoint (`/api/v1/mines/{selectedMine.id}/digital-twin`) mapping levels, zones, and 3D coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-900/50 text-xs font-mono text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Three.js / WebGL Spatial Ready</span>
        </div>
      </div>

      {/* Spatial Foundation Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase">Underground Seams</span>
            <p className="text-lg font-bold text-white mt-1">{twinData?.levels.length || 0} Levels</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase">Spatial Zones</span>
            <p className="text-lg font-bold text-amber-400 mt-1">{twinData?.zones.length || 0} Zones</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase">Sensors in 3D Space</span>
            <p className="text-lg font-bold text-cyan-400 mt-1">{twinData?.sensors.length || 0} Nodes</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase">Spatial Cameras</span>
            <p className="text-lg font-bold text-emerald-400 mt-1">{twinData?.cameras.length || 0} Feeds</p>
          </div>
        </div>
      </div>

      {/* Spatial Asset Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
        {[
          { id: 'sensors', label: 'Sensors Coordinates', icon: Activity, count: twinData?.sensors.length },
          { id: 'cameras', label: 'Camera Orientations (Yaw/Pitch)', icon: Video, count: twinData?.cameras.length },
          { id: 'machinery', label: 'Heavy Machinery Positioning', icon: Cpu, count: twinData?.equipment.length },
          { id: 'incidents', label: 'Active Hazard Markers', icon: AlertTriangle, count: twinData?.active_incidents.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 bg-slate-800 rounded text-[10px]">{tab.count || 0}</span>
            </button>
          );
        })}
      </div>

      {/* Spatial Matrix Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Identifier</th>
              <th className="py-3 px-4">Entity Name</th>
              <th className="py-3 px-4">Coordinate X (Meters)</th>
              <th className="py-3 px-4">Coordinate Y (Meters)</th>
              <th className="py-3 px-4">Coordinate Z / Depth (Meters)</th>
              <th className="py-3 px-4">Spatial Orientation / Details</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {activeTab === 'sensors' &&
              twinData?.sensors.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-amber-400">{s.sensor_code}</td>
                  <td className="py-2.5 px-4">{s.name}</td>
                  <td className="py-2.5 px-4 text-cyan-400">{s.x.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-cyan-400">{s.y.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-rose-400">{s.z.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-slate-400">{s.unit} ({s.warning_threshold}/{s.critical_threshold})</td>
                  <td className="py-2.5 px-4"><StatusBadge status={s.status} size="sm" /></td>
                </tr>
              ))}

            {activeTab === 'cameras' &&
              twinData?.cameras.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-amber-400">{c.camera_code}</td>
                  <td className="py-2.5 px-4">{c.name}</td>
                  <td className="py-2.5 px-4 text-cyan-400">{c.x.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-cyan-400">{c.y.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-rose-400">{c.z.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-slate-400">Yaw: {c.yaw}° | Pitch: {c.pitch}° | FOV: {c.fov}°</td>
                  <td className="py-2.5 px-4"><StatusBadge status={c.status} size="sm" /></td>
                </tr>
              ))}

            {activeTab === 'machinery' &&
              twinData?.equipment.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-amber-400">{eq.equipment_code}</td>
                  <td className="py-2.5 px-4">{eq.name}</td>
                  <td className="py-2.5 px-4 text-cyan-400">{eq.x.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-cyan-400">{eq.y.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-rose-400">{eq.z.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-slate-400">{eq.category}</td>
                  <td className="py-2.5 px-4"><StatusBadge status={eq.status} size="sm" /></td>
                </tr>
              ))}

            {activeTab === 'incidents' &&
              twinData?.active_incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-amber-400">{inc.incident_code}</td>
                  <td className="py-2.5 px-4">{inc.title}</td>
                  <td className="py-2.5 px-4 text-cyan-400">{inc.x.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-cyan-400">{inc.y.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-rose-400">{inc.z.toFixed(1)}m</td>
                  <td className="py-2.5 px-4 text-slate-400">{inc.category}</td>
                  <td className="py-2.5 px-4"><StatusBadge status={inc.status} size="sm" /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
