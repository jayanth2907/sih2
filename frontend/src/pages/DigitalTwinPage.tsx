import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMineContext } from '../context/MineContext';
import { mineService, sensorService } from '../services';
import { DigitalTwinState, Sensor, Camera, Equipment, Incident } from '../types';
import { MineCanvas3D } from '../components/digital-twin/MineCanvas3D';
import { LayerControls } from '../components/digital-twin/LayerControls';
import { ScenePresetControls } from '../components/digital-twin/ScenePresetControls';
import { ObjectInspector } from '../components/digital-twin/ObjectInspector';
import { ReplayTimeline } from '../components/digital-twin/ReplayTimeline';
import { LayerVisibility, ViewMode, SelectedObject, CameraFocusTarget, ReplayState, ReplayKeyframe } from '../components/digital-twin/types';
import { StatusBadge } from '../components/StatusBadge';
import { Layers3, Box, Activity, Video, Cpu, AlertTriangle, Sparkles, ShieldAlert, Radio, Table, Globe } from 'lucide-react';

const INITIAL_LAYERS: LayerVisibility = {
  sensors: true,
  cameras: true,
  cameraFov: true,
  equipment: true,
  ventilation: true,
  mineStructure: true,
  shaftsAndTunnels: true,
  zones: true,
  labels: true,
  proximityLines: true,
  surfaceYard: true
};

const DEFAULT_KEYFRAMES: ReplayKeyframe[] = [
  {
    timestamp: '10:30:00',
    timeOffsetSeconds: 0,
    label: 'Normal Baseline',
    stage: 'NORMAL',
    sensorValues: { 'SN-BDS04-CH4-101': 0.35, 'SN-BDS04-CO-101': 9.2, 'SN-BDS04-VEL-101': 3.2 },
    activeIncident: false,
    riskScore: 24.5,
    zoneRisks: { 'ZN-EAST-LW-102': 'LOW', 'ZN-WEST-DEV-201': 'LOW' },
    description: 'All atmospheric and ventilation parameters within normal DGMS statutory baseline.'
  },
  {
    timestamp: '10:31:15',
    timeOffsetSeconds: 15,
    label: 'Seam Gas Trending Up',
    stage: 'TRENDING_UP',
    sensorValues: { 'SN-BDS04-CH4-101': 0.65, 'SN-BDS04-CO-101': 14.5, 'SN-BDS04-VEL-101': 2.8 },
    activeIncident: false,
    riskScore: 38.0,
    zoneRisks: { 'ZN-EAST-LW-102': 'MEDIUM', 'ZN-WEST-DEV-201': 'LOW' },
    description: 'East Longwall return CH4 concentration rising continuously (+0.30% in 5 min).'
  },
  {
    timestamp: '10:32:30',
    timeOffsetSeconds: 30,
    label: 'Warning Limit Breached',
    stage: 'WARNING',
    sensorValues: { 'SN-BDS04-CH4-101': 0.88, 'SN-BDS04-CO-101': 22.0, 'SN-BDS04-VEL-101': 2.1 },
    activeIncident: false,
    riskScore: 58.5,
    zoneRisks: { 'ZN-EAST-LW-102': 'HIGH', 'ZN-WEST-DEV-201': 'MEDIUM' },
    description: 'Methane crossed warning threshold (0.88% >= 0.75%). Warning alert generated.'
  },
  {
    timestamp: '10:33:45',
    timeOffsetSeconds: 45,
    label: 'Critical Surge (1.82%)',
    stage: 'CRITICAL',
    sensorValues: { 'SN-BDS04-CH4-101': 1.82, 'SN-BDS04-CO-101': 38.0, 'SN-BDS04-VEL-101': 1.1 },
    activeIncident: true,
    riskScore: 91.0,
    zoneRisks: { 'ZN-EAST-LW-102': 'CRITICAL', 'ZN-WEST-DEV-201': 'HIGH' },
    description: 'Critical threshold crossed (1.82% >= 1.25%). Immediate auto-incident dispatched.'
  },
  {
    timestamp: '10:34:30',
    timeOffsetSeconds: 60,
    label: 'Alert & Incident Dispatched',
    stage: 'INCIDENT_CREATED',
    sensorValues: { 'SN-BDS04-CH4-101': 1.88, 'SN-BDS04-CO-101': 42.0, 'SN-BDS04-VEL-101': 0.9 },
    activeIncident: true,
    riskScore: 92.5,
    zoneRisks: { 'ZN-EAST-LW-102': 'CRITICAL', 'ZN-WEST-DEV-201': 'HIGH' },
    description: 'Governance incident INC-BDS04-001 created. Spatial cameras C-02 & C-03 locked.'
  },
  {
    timestamp: '10:36:00',
    timeOffsetSeconds: 75,
    label: 'Auxiliary Vent Ramp-up',
    stage: 'RECOVERING',
    sensorValues: { 'SN-BDS04-CH4-101': 1.05, 'SN-BDS04-CO-101': 24.0, 'SN-BDS04-VEL-101': 2.6 },
    activeIncident: true,
    riskScore: 62.0,
    zoneRisks: { 'ZN-EAST-LW-102': 'HIGH', 'ZN-WEST-DEV-201': 'LOW' },
    description: 'Surface fan airflow increased to 2.6 m/s. Seam methane retreating.'
  },
  {
    timestamp: '10:38:00',
    timeOffsetSeconds: 90,
    label: 'Restabilized Baseline',
    stage: 'RESOLVED',
    sensorValues: { 'SN-BDS04-CH4-101': 0.42, 'SN-BDS04-CO-101': 11.0, 'SN-BDS04-VEL-101': 3.1 },
    activeIncident: false,
    riskScore: 28.0,
    zoneRisks: { 'ZN-EAST-LW-102': 'LOW', 'ZN-WEST-DEV-201': 'LOW' },
    description: 'Atmospheric levels returned to normal. Incident pending verification.'
  }
];

export const DigitalTwinPage: React.FC = () => {
  const { selectedMine, focusedTarget, setFocusedTarget } = useMineContext();
  const [twinData, setTwinData] = useState<DigitalTwinState | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'3d' | 'matrix'>('3d');
  const [layers, setLayers] = useState<LayerVisibility>(INITIAL_LAYERS);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('OPERATIONAL');
  const [selectedObject, setSelectedObject] = useState<SelectedObject | null>(null);
  const [focusTarget, setFocusTarget] = useState<CameraFocusTarget | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [matrixTab, setMatrixTab] = useState<'sensors' | 'cameras' | 'machinery' | 'incidents'>('sensors');

  // Replay State
  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [replayState, setReplayState] = useState<ReplayState>({
    isPlaying: false,
    currentSecond: 0,
    totalSeconds: 90,
    playbackSpeed: 1,
    activeKeyframeIndex: 0
  });

  // Fetch initial digital twin state
  const loadTwinData = useCallback(async () => {
    if (!selectedMine) return;
    try {
      const data = await mineService.getDigitalTwin(selectedMine.id);
      setTwinData(data);
    } catch (err) {
      console.error('Failed to load digital twin data:', err);
    }
  }, [selectedMine?.id]);

  useEffect(() => {
    loadTwinData();
  }, [loadTwinData]);

  // Handle Handshake with focusedTarget from Incidents/Alerts
  useEffect(() => {
    if (focusedTarget && twinData) {
      setFocusTarget({
        x: focusedTarget.x,
        y: focusedTarget.y,
        z: focusedTarget.z,
        distance: focusedTarget.distance || 45,
        title: focusedTarget.title
      });

      // Find matching entity to open inspector
      if (focusedTarget.type === 'sensor' && focusedTarget.id) {
        const s = twinData.sensors.find((x) => x.id === focusedTarget.id);
        if (s) setSelectedObject({ type: 'sensor', id: s.id, data: s });
      } else if (focusedTarget.type === 'incident' && focusedTarget.id) {
        const inc = twinData.active_incidents.find((x) => x.id === focusedTarget.id);
        if (inc) setSelectedObject({ type: 'incident', id: inc.id, data: inc });
      }

      setFocusedTarget(null); // Consumed
    }
  }, [focusedTarget, twinData, setFocusedTarget]);

  // Real-Time WebSocket Listener for Mine Telemetry & Anomalies
  useEffect(() => {
    if (!selectedMine) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/v1/ws/mines/${selectedMine.id}?token=${token}`;

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'TELEMETRY_ANOMALY' || payload.type === 'CRITICAL_INCIDENT_CREATED') {
            // Refresh twin state to reflect live anomaly/incident
            loadTwinData();
          } else if (payload.type === 'TELEMETRY_READING' && payload.data) {
            setTwinData((prev) => {
              if (!prev) return prev;
              const updatedSensors = prev.sensors.map((s) => {
                if (s.id === payload.data.sensor_id) {
                  return {
                    ...s,
                    last_value: payload.data.value,
                    status: payload.data.value >= s.critical_threshold ? 'CRITICAL' :
                            payload.data.value >= s.warning_threshold ? 'WARNING' : 'ACTIVE'
                  };
                }
                return s;
              });
              return { ...prev, sensors: updatedSensors };
            });
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };
    } catch (e) {
      console.warn('WebSocket connection not available:', e);
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [selectedMine?.id, loadTwinData]);

  // Camera Presets
  const handleResetView = () => {
    setFocusTarget({ x: 0, y: 0, z: 0, distance: 380, title: 'Reset View' });
  };

  const handleFitOverview = () => {
    setFocusTarget({ x: 50, y: 250, z: -100, distance: 480, title: 'Fit Mine Overview' });
  };

  const handleFocusLevel = (lvl: any) => {
    setFocusTarget({ x: 0, y: 200, z: lvl.elevation || -lvl.depth_meters, distance: 120, title: lvl.name });
  };

  // Test Simulation Trigger
  const handleTriggerScenario = async (scenario: string) => {
    if (!selectedMine) return;
    setIsSimulating(true);
    try {
      if (scenario === 'batch') {
        await sensorService.simulateBatch(selectedMine.id);
      } else {
        await sensorService.simulateScenario(selectedMine.id, scenario.toUpperCase());
      }
      await loadTwinData();
    } catch (err) {
      console.error('Simulation trigger failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Replay Controller actions
  const handleReplayKeyframe = (index: number) => {
    setReplayState((prev) => ({
      ...prev,
      activeKeyframeIndex: index,
      currentSecond: DEFAULT_KEYFRAMES[index].timeOffsetSeconds
    }));

    const kf = DEFAULT_KEYFRAMES[index];
    if (twinData) {
      // Update sensor mock values in state
      const updatedSensors = twinData.sensors.map((s) => {
        const val = kf.sensorValues[s.sensor_code];
        if (val !== undefined) {
          return {
            ...s,
            last_value: val,
            status: val >= s.critical_threshold ? 'CRITICAL' :
                    val >= s.warning_threshold ? 'WARNING' : 'ACTIVE'
          };
        }
        return s;
      });
      setTwinData({
        ...twinData,
        sensors: updatedSensors,
        current_risk_score: kf.riskScore
      });
    }
  };

  if (!selectedMine) return null;

  return (
    <div className="space-y-4">
      {/* Top Banner & Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers3 className="w-5 h-5 text-amber-400" />
            3D Digital Mine Operational Twin
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time WebGL spatial twin for {selectedMine.name} ({selectedMine.code}) • Elevation {selectedMine.elevation || -320}m
          </p>
        </div>

        {/* View Tab Switcher: 3D Twin vs Data Matrix */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setActiveViewTab('3d')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeViewTab === '3d'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3D TWIN CANVAS</span>
            </button>
            <button
              onClick={() => setActiveViewTab('matrix')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeViewTab === 'matrix'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>SPATIAL MATRIX</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-900/40 text-xs font-mono text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>WebGL Three.js Engine</span>
          </div>
        </div>
      </div>

      {/* Spatial Foundation Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center font-mono text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-slate-500 text-[10px] uppercase">Seam Levels</span>
          <p className="text-base font-bold text-white mt-0.5">{twinData?.levels.length || 0} Levels</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-slate-500 text-[10px] uppercase">Spatial Zones</span>
          <p className="text-base font-bold text-amber-400 mt-0.5">{twinData?.zones.length || 0} Zones</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-slate-500 text-[10px] uppercase">IoT Sensors</span>
          <p className="text-base font-bold text-cyan-400 mt-0.5">{twinData?.sensors.length || 0} Nodes</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-slate-500 text-[10px] uppercase">CCTV Feeds</span>
          <p className="text-base font-bold text-emerald-400 mt-0.5">{twinData?.cameras.length || 0} Cameras</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-slate-500 text-[10px] uppercase">Hazard Beacons</span>
          <p className="text-base font-bold text-rose-400 mt-0.5">{twinData?.active_incidents.length || 0} Active</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="text-slate-500 text-[10px] uppercase">Seam Risk Score</span>
          <p className="text-base font-bold text-amber-400 mt-0.5">
            {(twinData?.current_risk_score || 24.5).toFixed(1)} / 100
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {activeViewTab === '3d' ? (
        <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          {/* 3D WebGL Canvas */}
          <MineCanvas3D
            twinData={twinData}
            layers={layers}
            viewMode={viewMode}
            selectedObject={selectedObject}
            onSelectObject={setSelectedObject}
            focusTarget={focusTarget}
            onFocusComplete={() => setFocusTarget(null)}
          />

          {/* Floating Layer Controls (Top Left) */}
          <LayerControls
            layers={layers}
            onChange={setLayers}
            isOpen={isLayerPanelOpen}
            onToggleOpen={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
          />

          {/* Floating Scene Presets & Scenarios Toolbar (Top Right) */}
          <ScenePresetControls
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
            levels={twinData?.levels || []}
            onFocusLevel={handleFocusLevel}
            onResetView={handleResetView}
            onFitOverview={handleFitOverview}
            onTriggerScenario={handleTriggerScenario}
            isSimulating={isSimulating}
          />

          {/* Contextual Object Inspector (Top Right Drawer) */}
          <ObjectInspector
            selectedObject={selectedObject}
            onClose={() => setSelectedObject(null)}
            twinData={twinData}
            onFocusTarget={setFocusTarget}
          />

          {/* Replay Timeline Controller (Bottom Bar) */}
          <ReplayTimeline
            replayState={replayState}
            keyframes={DEFAULT_KEYFRAMES}
            onTogglePlay={() => setReplayState((p) => ({ ...p, isPlaying: !p.isPlaying }))}
            onSeekSecond={(sec) => setReplayState((p) => ({ ...p, currentSecond: sec }))}
            onSeekKeyframe={handleReplayKeyframe}
            onChangeSpeed={(spd) => setReplayState((p) => ({ ...p, playbackSpeed: spd }))}
            onReset={() => handleReplayKeyframe(0)}
            isOpen={isReplayOpen}
            onToggleOpen={() => setIsReplayOpen(!isReplayOpen)}
          />
        </div>
      ) : (
        /* Spatial Matrix Tabular View */
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
            {[
              { id: 'sensors', label: 'Sensors Coordinates', icon: Activity, count: twinData?.sensors.length },
              { id: 'cameras', label: 'Camera Orientations (Yaw/Pitch)', icon: Video, count: twinData?.cameras.length },
              { id: 'machinery', label: 'Heavy Machinery Positioning', icon: Cpu, count: twinData?.equipment.length },
              { id: 'incidents', label: 'Active Hazard Markers', icon: AlertTriangle, count: twinData?.active_incidents.length }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = matrixTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMatrixTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
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

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Identifier</th>
                  <th className="py-3 px-4">Entity Name</th>
                  <th className="py-3 px-4">Coordinate X (Meters)</th>
                  <th className="py-3 px-4">Coordinate Y (Meters)</th>
                  <th className="py-3 px-4">Coordinate Z / Depth (Meters)</th>
                  <th className="py-3 px-4">Spatial Details</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {matrixTab === 'sensors' &&
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

                {matrixTab === 'cameras' &&
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

                {matrixTab === 'machinery' &&
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

                {matrixTab === 'incidents' &&
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
      )}
    </div>
  );
};
