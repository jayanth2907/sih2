import React, { useEffect, useState } from 'react';
import { riskService } from '../services';
import type { SpatialContextResponse } from '../types';
import { StatusBadge } from './StatusBadge';
import { MapPin, Video, Cpu, AlertTriangle, Radio, X, Crosshair, Navigation } from 'lucide-react';

interface AnomalySpatialModalProps {
  anomalyId: number | null;
  onClose: () => void;
}

export const AnomalySpatialModal: React.FC<AnomalySpatialModalProps> = ({ anomalyId, onClose }) => {
  const [context, setContext] = useState<SpatialContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!anomalyId) return;
    setIsLoading(true);
    riskService.getAnomalySpatialContext(anomalyId, 300)
      .then(setContext)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [anomalyId]);

  if (!anomalyId) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 text-xs font-mono font-bold border border-rose-800/60">
                {context?.anomaly_type || 'ANOMALY'}
              </span>
              <StatusBadge status={context?.severity || 'HIGH'} size="sm" />
            </div>
            <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-400" />
              Spatial Proximity & Asset Inspector
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span>RESOLVING 3D SPATIAL PROXIMITY MATRIX...</span>
          </div>
        ) : context ? (
          <div className="space-y-5 font-mono text-xs">
            {/* Anomaly Location Details */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Mine: <b className="text-white">{context.mine.name} ({context.mine.code})</b></span>
                <span>Depth / Elevation: <b className="text-rose-400">{context.coordinates.z}m</b></span>
              </div>
              <p className="text-slate-300">
                Seam / Zone: <b className="text-amber-400">{context.level?.name || 'Level'}</b> &gt; <b className="text-amber-400">{context.zone?.name || 'Zone'}</b>
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Coordinates: <b>({context.coordinates.x.toFixed(1)}, {context.coordinates.y.toFixed(1)}, {context.coordinates.z.toFixed(1)})</b></span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 italic font-sans">{context.explanation}</p>
            </div>

            {/* Nearby Cameras in 3D Space */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-sans">
                <Video className="w-3.5 h-3.5 text-amber-400" />
                Nearby Spatial Cameras ({context.nearby_cameras.length})
              </h4>
              {context.nearby_cameras.length === 0 ? (
                <p className="text-slate-600 text-[11px]">No camera nodes within search radius.</p>
              ) : (
                <div className="space-y-1.5">
                  {context.nearby_cameras.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{c.camera_code}</span>
                          <span className="text-[10px] text-slate-400">{c.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          FOV: {c.fov}° | Pitch: {c.pitch}° | Yaw: {c.yaw}° • <b>{c.is_simulated}</b>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-bold text-[11px]">
                          {c.distance_meters}m away
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nearby Equipment Machinery */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 font-sans">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Nearby Machinery & Ventilation Units ({context.nearby_equipment.length})
              </h4>
              {context.nearby_equipment.length === 0 ? (
                <p className="text-slate-600 text-[11px]">No equipment within search radius.</p>
              ) : (
                <div className="space-y-1.5">
                  {context.nearby_equipment.map((eq) => (
                    <div key={eq.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-amber-400">{eq.equipment_code}</span>
                        <p className="text-white text-[11px]">{eq.name}</p>
                        <p className="text-[10px] text-slate-500">{eq.category}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50 font-bold text-[11px]">
                          {eq.distance_meters}m away
                        </span>
                        <div>
                          <StatusBadge status={eq.status} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
