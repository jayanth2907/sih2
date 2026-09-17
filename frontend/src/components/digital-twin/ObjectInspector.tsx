import React from 'react';
import { SelectedObject, CameraFocusTarget } from './types';
import { DigitalTwinState, Camera, Equipment, Sensor } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { X, MapPin, Eye, Video, Cpu, Wind, AlertTriangle, Radio, Crosshair, Sparkles, Activity } from 'lucide-react';

interface ObjectInspectorProps {
  selectedObject: SelectedObject | null;
  onClose: () => void;
  twinData: DigitalTwinState | null;
  onFocusTarget: (target: CameraFocusTarget) => void;
  onViewIncidentDetail?: (incidentId: number) => void;
}

export const ObjectInspector: React.FC<ObjectInspectorProps> = ({
  selectedObject,
  onClose,
  twinData,
  onFocusTarget,
  onViewIncidentDetail
}) => {
  if (!selectedObject) return null;

  const { type, data } = selectedObject;

  // Compute nearby cameras and equipment for selected sensor
  let nearbyCameras: { camera: Camera; distance: number }[] = [];
  let nearbyEquipment: { equipment: Equipment; distance: number }[] = [];

  if (type === 'sensor' && twinData) {
    const s = data as Sensor;
    twinData.cameras.forEach((c: Camera) => {
      const dist = Math.sqrt(
        Math.pow(s.x - c.x, 2) + Math.pow(s.y - c.y, 2) + Math.pow(s.z - c.z, 2)
      );
      if (dist <= 100) nearbyCameras.push({ camera: c, distance: dist });
    });
    nearbyCameras.sort((a, b) => a.distance - b.distance);

    twinData.equipment.forEach((eq: Equipment) => {
      const dist = Math.sqrt(
        Math.pow(s.x - eq.x, 2) + Math.pow(s.y - eq.y, 2) + Math.pow(s.z - eq.z, 2)
      );
      if (dist <= 100) nearbyEquipment.push({ equipment: eq, distance: dist });
    });
    nearbyEquipment.sort((a, b) => a.distance - b.distance);
  }

  const handleFocus = () => {
    if (data.x !== undefined && data.y !== undefined && data.z !== undefined) {
      onFocusTarget({
        x: data.x,
        y: data.y,
        z: data.z,
        distance: 45,
        title: data.name || data.sensor_code || data.camera_code
      });
    }
  };

  return (
    <div className="absolute top-20 right-4 z-20 w-80 md:w-96 max-h-[calc(100%-160px)] overflow-y-auto p-4 rounded-2xl bg-slate-950/95 border border-slate-800 backdrop-blur-xl shadow-2xl font-mono text-xs text-slate-300 animate-in fade-in slide-in-from-right-4 duration-200 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {type === 'sensor' && <Activity className="w-4 h-4" />}
            {type === 'camera' && <Video className="w-4 h-4" />}
            {type === 'equipment' && <Cpu className="w-4 h-4" />}
            {type === 'incident' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {type === 'zone' && <MapPin className="w-4 h-4 text-cyan-400" />}
          </span>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">{type} INSPECTION</span>
            <h3 className="text-sm font-bold text-white truncate max-w-[200px]">
              {data.sensor_code || data.camera_code || data.equipment_code || data.incident_code || data.code || data.name}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleFocus}
            title="Focus in 3D"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sensor Specific Context */}
      {type === 'sensor' && (
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-200 font-bold">{data.name}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Level: {data.level_name || 'Underground Seam'} | Zone: {data.zone_name || 'Workings'}
            </div>
          </div>

          {/* Value and Status */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase">Telemetry Value</span>
              <StatusBadge status={data.status} size="sm" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${
                data.status === 'CRITICAL' ? 'text-rose-400 animate-pulse' :
                data.status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {data.last_value !== undefined ? data.last_value.toFixed(2) : '--'}
              </span>
              <span className="text-sm text-slate-400">{data.unit}</span>
            </div>

            {/* Threshold Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Norm: {data.normal_min || 0} - {data.normal_max || 0.5}</span>
                <span>Warn: {data.warning_threshold}</span>
                <span className="text-rose-400">Crit: {data.critical_threshold}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: '40%' }} />
                <div className="bg-amber-500 h-full" style={{ width: '30%' }} />
                <div className="bg-rose-500 h-full" style={{ width: '30%' }} />
              </div>
            </div>
          </div>

          {/* Spatial Coordinates */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500">X (East)</span>
              <p className="font-bold text-cyan-400">{data.x?.toFixed(1)}m</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Y (North)</span>
              <p className="font-bold text-cyan-400">{data.y?.toFixed(1)}m</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500">Z (Depth)</span>
              <p className="font-bold text-rose-400">{data.z?.toFixed(1)}m</p>
            </div>
          </div>

          {/* Nearby Cameras in 3D Space */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
              <span>Nearby Cameras ({nearbyCameras.length})</span>
              <span className="text-sky-400">3D Proximity</span>
            </div>
            {nearbyCameras.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic">No cameras within 100m radius.</p>
            ) : (
              nearbyCameras.slice(0, 3).map(({ camera, distance }) => (
                <div key={camera.id} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-sky-400" />
                    <div>
                      <span className="font-bold text-white">{camera.camera_code}</span>
                      <span className="text-[9px] text-slate-500 ml-1.5">{camera.camera_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 text-[10px] font-bold">
                      {distance.toFixed(1)}m
                    </span>
                    <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px]">
                      {camera.is_simulated || 'SIMULATED'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Nearby Heavy Machinery / Ventilation */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
              <span>Nearby Equipment ({nearbyEquipment.length})</span>
              <span className="text-amber-400">Machinery</span>
            </div>
            {nearbyEquipment.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic">No equipment within 100m radius.</p>
            ) : (
              nearbyEquipment.slice(0, 3).map(({ equipment, distance }) => (
                <div key={equipment.id} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" />
                    <div>
                      <span className="font-bold text-white">{equipment.equipment_code}</span>
                      <span className="text-[9px] text-slate-500 ml-1.5">{equipment.category}</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-bold">
                    {distance.toFixed(1)}m
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Camera Specific Context */}
      {type === 'camera' && (
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-200 font-bold">{data.name}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Stream: {data.camera_type}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase">Optical Feed</span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] border border-amber-900 font-bold">
                SIMULATED METADATA
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
              <div className="p-1.5 bg-slate-950 rounded">
                <span className="text-slate-500">Yaw</span>
                <p className="text-cyan-400 font-bold">{data.yaw}°</p>
              </div>
              <div className="p-1.5 bg-slate-950 rounded">
                <span className="text-slate-500">Pitch</span>
                <p className="text-cyan-400 font-bold">{data.pitch}°</p>
              </div>
              <div className="p-1.5 bg-slate-950 rounded">
                <span className="text-slate-500">FOV</span>
                <p className="text-sky-400 font-bold">{data.fov}°</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 pt-1 italic">
              RTSP stream metadata ready for edge computer vision integration.
            </p>
          </div>
        </div>
      )}

      {/* Equipment Specific Context */}
      {type === 'equipment' && (
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-200 font-bold">{data.name}</div>
            <div className="text-[10px] text-amber-400 mt-0.5">Category: {data.category}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Manufacturer</span>
              <span className="text-white font-bold">{data.manufacturer || 'Komatsu / Elecon'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Operational State</span>
              <StatusBadge status={data.status || 'OPERATIONAL'} size="sm" />
            </div>
          </div>
        </div>
      )}

      {/* Incident Specific Context */}
      {type === 'incident' && (
        <div className="space-y-3">
          <div>
            <div className="text-xs text-rose-300 font-bold">{data.title}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Category: {data.category}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Severity</span>
              <StatusBadge status={data.severity} size="sm" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Lifecycle State</span>
              <StatusBadge status={data.status} size="sm" />
            </div>
          </div>
          {onViewIncidentDetail && (
            <button
              onClick={() => onViewIncidentDetail(data.id)}
              className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all text-xs cursor-pointer shadow-lg shadow-rose-900/40"
            >
              OPEN INCIDENT LIFECYCLE
            </button>
          )}
        </div>
      )}

      {/* Credibility Footer Banner */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[9px] text-slate-500">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>TRINETRA 3D Spatial Engine • Real 3D Coordinate Mapping</span>
      </div>
    </div>
  );
};
