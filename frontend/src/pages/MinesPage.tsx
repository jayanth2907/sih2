import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { mineService } from '../services';
import { Mine, MineDetail } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Pickaxe, MapPin, Layers, Activity, Video, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const MinesPage: React.FC = () => {
  const { mines, setSelectedMineId, selectedMineId } = useMineContext();
  const [selectedMineDetail, setSelectedMineDetail] = useState<MineDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    if (selectedMineId) {
      setIsLoadingDetail(true);
      mineService.getMineDetail(selectedMineId)
        .then(setSelectedMineDetail)
        .catch(console.error)
        .finally(() => setIsLoadingDetail(false));
    }
  }, [selectedMineId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Coal Mines & Spatial Hierarchy</h2>
        <p className="text-xs text-slate-400 mt-1">
          Multi-mine governance directory. Explore geological seams, underground galleries, and surface infrastructure.
        </p>
      </div>

      {/* Mines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {mines.map((mine) => {
          const isCurrent = mine.id === selectedMineId;
          return (
            <div
              key={mine.id}
              onClick={() => setSelectedMineId(mine.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                isCurrent
                  ? 'bg-slate-900 border-amber-500/70 shadow-xl shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 text-[10px] font-mono font-bold border border-amber-800/60">
                    {mine.code}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{mine.name}</h3>
                </div>
                <StatusBadge status={mine.status} size="sm" />
              </div>

              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{mine.description}</p>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {mine.district}, {mine.state}
                </span>
                <span className="text-slate-300 font-bold">{mine.mine_type}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Drilldown: Selected Mine Levels & Zones */}
      {selectedMineDetail && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Underground Seams & Levels: {selectedMineDetail.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Spatial breakdown of extraction levels, ventilation galleries, and working faces.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">Total Sensors: <b className="text-white">{selectedMineDetail.total_sensors}</b></span>
              <span className="text-slate-400">Cameras: <b className="text-white">{selectedMineDetail.total_cameras}</b></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedMineDetail.levels.map((lvl) => (
              <div key={lvl.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-800">
                      {lvl.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-200 mt-1">{lvl.name}</h4>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Depth: <b className="text-white">{lvl.depth_meters}m</b>
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Spatial Zones:</p>
                  {lvl.zones.length === 0 ? (
                    <p className="text-xs text-slate-600 font-mono">No zones defined</p>
                  ) : (
                    lvl.zones.map((z) => (
                      <div key={z.id} className="p-2 rounded bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-slate-300 font-medium">{z.name}</span>
                          <span className="text-[10px] text-slate-500 block">
                            Origin: ({z.origin_x}, {z.origin_y}, {z.origin_z}) • Dim: {z.width}x{z.length}m
                          </span>
                        </div>
                        <StatusBadge status={z.risk_category} size="sm" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
