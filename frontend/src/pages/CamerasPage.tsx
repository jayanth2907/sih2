import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { cameraService } from '../services';
import { Camera, Equipment } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Video, Cpu, Radio, Shield, Settings, Info } from 'lucide-react';

export const CamerasPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!selectedMine) return;
    setIsLoading(true);
    Promise.all([
      cameraService.getCameras(selectedMine.id),
      cameraService.getEquipment(selectedMine.id)
    ])
      .then(([cData, eqData]) => {
        setCameras(cData);
        setEquipment(eqData);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedMine?.id]);

  if (!selectedMine) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">CCTV Infrastructure & Heavy Machinery</h2>
        <p className="text-xs text-slate-400 mt-1">
          Spatial video nodes and mechanized extraction equipment positioned in 3D coordinate space.
        </p>
      </div>

      {/* Compliance Notice */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-900/50 flex items-start gap-3 text-xs font-mono">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 space-y-1">
          <p className="font-semibold text-amber-300">Statutory Architecture Disclaimer:</p>
          <p className="text-slate-400">
            Camera streams are currently marked as <b className="text-cyan-300 font-bold">SIMULATED / DEMO CONTEXT</b>. 
            The system does not claim unverified live industrial video feeds. Backend metadata holds 3D orientation (yaw, pitch, FOV) ready for RTSP / WebRTC stream binding.
          </p>
        </div>
      </div>

      {/* Cameras Spatial Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Video className="w-4 h-4 text-amber-400" />
          Camera Spatial Deployments ({cameras.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cameras.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-800">
                    {c.camera_code}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1.5">{c.name}</h4>
                  <p className="text-xs text-slate-400">{c.zone_name || 'Working Zone'} • {c.level_name || 'Level'}</p>
                </div>
                <StatusBadge status={c.is_simulated} size="sm" />
              </div>

              {/* Simulated Camera Feed Container */}
              <div className="h-44 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-4 text-center">
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono text-emerald-400 border border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  {c.resolution}
                </div>
                <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-500">
                  FOV: {c.fov}° | Pitch: {c.pitch}° | Yaw: {c.yaw}°
                </div>

                <Video className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs font-mono text-slate-400 font-semibold">{c.camera_type}</p>
                <p className="text-[10px] text-slate-600 font-mono mt-1 max-w-[240px]">
                  RTSP Stream Endpoint Configured: <span className="text-slate-400">{c.stream_url || 'rtsp://mine-lan/stream'}</span>
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                <span>3D Pos: ({c.x}, {c.y}, {c.z})</span>
                <span className="text-slate-500">Status: <b className="text-slate-300">{c.status}</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Machinery & Equipment Grid */}
      <div className="pt-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Heavy Extraction Machinery ({equipment.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipment.map((eq) => (
            <div key={eq.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-amber-400 font-bold">{eq.equipment_code}</span>
                <p className="text-white font-semibold text-sm mt-0.5">{eq.name}</p>
                <p className="text-[11px] text-slate-400">{eq.category} • {eq.manufacturer}</p>
                <p className="text-[10px] text-slate-500 mt-1">3D Location: ({eq.x}, {eq.y}, {eq.z})</p>
              </div>
              <div className="text-right space-y-2">
                <StatusBadge status={eq.status} size="sm" />
                {eq.next_service_due && (
                  <p className="text-[10px] text-slate-500">
                    Service Due: {new Date(eq.next_service_due).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
