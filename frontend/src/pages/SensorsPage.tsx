import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { sensorService } from '../services';
import type { Sensor, SensorReading } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Activity, 
  RefreshCw, 
  Radio, 
  Flame, 
  Wind, 
  WifiOff, 
  TrendingUp, 
  History, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Crosshair
} from 'lucide-react';

export const SensorsPage: React.FC = () => {
  const { selectedMine, focusInDigitalTwin } = useMineContext();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSensorReadings, setSelectedSensorReadings] = useState<{ sensor: Sensor; readings: SensorReading[] } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('NORMAL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSensors = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const data = await sensorService.getSensors(
        selectedMine.id,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setSensors(data);
    } catch (err) {
      console.error('Failed to load sensors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, [selectedMine?.id, statusFilter]);

  const handleTriggerScenario = async (scenario: string) => {
    if (!selectedMine) return;
    setIsSimulating(true);
    setActiveScenario(scenario);
    try {
      await sensorService.simulateScenario(selectedMine.id, scenario);
      await fetchSensors();
    } catch (err) {
      console.error('Scenario simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleOpenReadings = async (sensor: Sensor) => {
    try {
      const readings = await sensorService.getSensorReadings(sensor.id, 20);
      setSelectedSensorReadings({ sensor, readings });
    } catch (err) {
      console.error('Failed to load sensor readings:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Environmental & Telemetry Nodes</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time gas concentration, air velocity, dust PM, and strata seismic monitoring with deterministic simulation.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
          {['ALL', 'ACTIVE', 'WARNING', 'CRITICAL', 'OFFLINE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Deterministic Simulation Scenario Control Center */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Deterministic Simulation Scenario Controls (SIH Testing)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">Source: SIMULATED (MQTT Ready)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1 font-mono text-xs">
          <button
            onClick={() => handleTriggerScenario('NORMAL')}
            disabled={isSimulating}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
              activeScenario === 'NORMAL'
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-bold'
                : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px]">Normal Baseline</span>
          </button>

          <button
            onClick={() => handleTriggerScenario('METHANE_SPIKE')}
            disabled={isSimulating}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
              activeScenario === 'METHANE_SPIKE'
                ? 'bg-rose-950/80 border-rose-600 text-rose-300 font-bold'
                : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-400" />
            <span className="text-[11px]">Methane Spike</span>
          </button>

          <button
            onClick={() => handleTriggerScenario('CO_SPIKE')}
            disabled={isSimulating}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
              activeScenario === 'CO_SPIKE'
                ? 'bg-amber-950/80 border-amber-600 text-amber-300 font-bold'
                : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-[11px]">CO Gas Surge</span>
          </button>

          <button
            onClick={() => handleTriggerScenario('VENTILATION_DROP')}
            disabled={isSimulating}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
              activeScenario === 'VENTILATION_DROP'
                ? 'bg-cyan-950/80 border-cyan-600 text-cyan-300 font-bold'
                : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <Wind className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px]">Ventilation Drop</span>
          </button>

          <button
            onClick={() => handleTriggerScenario('SENSOR_OFFLINE')}
            disabled={isSimulating}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
              activeScenario === 'SENSOR_OFFLINE'
                ? 'bg-purple-950/80 border-purple-600 text-purple-300 font-bold'
                : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <WifiOff className="w-4 h-4 text-purple-400" />
            <span className="text-[11px]">Sensor Silence</span>
          </button>

          <button
            onClick={() => handleTriggerScenario('MULTI_SENSOR_ANOMALY')}
            disabled={isSimulating}
            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
              activeScenario === 'MULTI_SENSOR_ANOMALY'
                ? 'bg-rose-950/80 border-rose-600 text-rose-300 font-bold'
                : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <span className="text-[11px]">Multi-Hazard Spike</span>
          </button>
        </div>
      </div>

      {/* Sensor Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4 font-semibold">Sensor Code</th>
              <th className="py-3.5 px-4 font-semibold">Sensor Name / Type</th>
              <th className="py-3.5 px-4 font-semibold">Zone / Level</th>
              <th className="py-3.5 px-4 font-semibold">Live Telemetry</th>
              <th className="py-3.5 px-4 font-semibold">Thresholds (Warn / Crit)</th>
              <th className="py-3.5 px-4 font-semibold">3D Coords (x,y,z)</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold">History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {sensors.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 font-bold text-amber-400">{s.sensor_code}</td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="text-[10px] text-slate-500">{s.sensor_type_code}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="text-slate-200">{s.zone_name || 'Mine Zone'}</p>
                  <p className="text-[10px] text-slate-500">{s.level_name || 'Level'}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-sm font-bold ${
                    s.status === 'CRITICAL' ? 'text-rose-400' :
                    s.status === 'WARNING' ? 'text-amber-400' :
                    s.status === 'OFFLINE' ? 'text-purple-400' : 'text-emerald-400'
                  }`}>
                    {s.last_value !== undefined ? `${s.last_value} ${s.unit}` : 'OFFLINE'}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400">
                  <span className="text-amber-300">{s.warning_threshold}</span> / <span className="text-rose-400">{s.critical_threshold}</span> {s.unit}
                </td>
                <td className="py-3 px-4 text-slate-500 text-[10px]">
                  ({s.x}, {s.y}, {s.z})
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={s.status} size="sm" />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        focusInDigitalTwin({
                          type: 'sensor',
                          id: s.id,
                          x: s.x,
                          y: s.y,
                          z: s.z,
                          title: `${s.sensor_code}: ${s.name}`
                        })
                      }
                      className="p-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors border border-amber-500/30 cursor-pointer"
                      title="Center in 3D Digital Twin"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenReadings(s)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="View Telemetry Reading History"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reading History Drawer */}
      {selectedSensorReadings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {selectedSensorReadings.sensor.sensor_code}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedSensorReadings.sensor.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSensorReadings(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span>Thresholds: <b className="text-amber-300">{selectedSensorReadings.sensor.warning_threshold}</b> (Warn) / <b className="text-rose-400">{selectedSensorReadings.sensor.critical_threshold}</b> (Crit) {selectedSensorReadings.sensor.unit}</span>
              <StatusBadge status={selectedSensorReadings.sensor.status} size="sm" />
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {selectedSensorReadings.readings.map((r) => (
                <div key={r.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="font-bold text-white text-sm">{r.value} {r.unit}</span>
                    <span className="text-[10px] text-slate-500 ml-2">Source: {r.source}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(r.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
