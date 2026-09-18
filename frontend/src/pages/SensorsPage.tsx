import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { sensorService } from '../services';
import type { Sensor, SensorReading } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, PageLoadingState } from '../components/ui/EmptyState';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import {
  Activity, RefreshCw, Flame, Wind, Thermometer,
  CloudFog, X, TrendingUp, TrendingDown, Minus,
  ChevronDown, Eye
} from 'lucide-react';

/** Map sensor code prefix to a human-friendly name */
function friendlyName(sensorCode: string, fallback?: string): string {
  const map: Record<string, string> = {
    CH4: 'Methane', CO: 'Carbon Monoxide', CO2: 'Carbon Dioxide',
    O2: 'Oxygen', TEMP: 'Temperature', H2S: 'Hydrogen Sulfide',
    DUST: 'Dust (PM)', AIR: 'Air Velocity', VENT: 'Ventilation',
    HUM: 'Humidity', NOISE: 'Noise', SEIS: 'Seismic',
    PRES: 'Air Pressure',
  };
  const prefix = sensorCode?.split(/[-_\d]/)[0]?.toUpperCase() ?? '';
  return map[prefix] ?? fallback ?? sensorCode;
}

function sensorIcon(code: string) {
  const p = code?.toUpperCase();
  if (p?.includes('CH4') || p?.includes('CO') || p?.includes('H2S')) return Flame;
  if (p?.includes('TEMP')) return Thermometer;
  if (p?.includes('AIR') || p?.includes('VENT') || p?.includes('WIND')) return Wind;
  if (p?.includes('DUST') || p?.includes('PM')) return CloudFog;
  return Activity;
}

export const SensorsPage: React.FC = () => {
  const { selectedMine, focusInDigitalTwin } = useMineContext();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [detailSensor, setDetailSensor] = useState<{ sensor: Sensor; readings: SensorReading[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchSensors = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const data = await sensorService.getSensors(
        selectedMine.id,
        statusFilter === 'ALL' ? undefined : statusFilter,
      );
      setSensors(data);
    } catch (err) {
      console.error('Failed to load sensors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSensors(); }, [selectedMine?.id, statusFilter]);

  const handleOpenDetail = async (sensor: Sensor) => {
    try {
      const readings = await sensorService.getSensorReadings(sensor.id, 20);
      setDetailSensor({ sensor, readings });
    } catch (err) {
      console.error('Failed to load sensor readings:', err);
    }
  };

  const handleSimulate = async (scenario: string) => {
    if (!selectedMine) return;
    setIsSimulating(true);
    try {
      await sensorService.simulateScenario(selectedMine.id, scenario);
      await fetchSensors();
    } catch (err) {
      console.error('Scenario failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!selectedMine) return null;

  const criticalCount = sensors.filter(s => s.status === 'CRITICAL').length;
  const warningCount  = sensors.filter(s => s.status === 'WARNING').length;
  const offlineCount  = sensors.filter(s => s.status === 'OFFLINE' || s.status === 'MAINTENANCE').length;

  const FILTERS = [
    { value: 'ALL',      label: 'All' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'WARNING',  label: 'Attention' },
    { value: 'ACTIVE',   label: 'Normal' },
    { value: 'OFFLINE',  label: 'Offline' },
  ];

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Live Environmental Monitoring"
        subtitle="Real-time gas, air quality, temperature and safety sensor readings across all mine zones."
        badge={
          criticalCount > 0 ? (
            <span className="badge status-critical"><span className="badge-dot" />{criticalCount} critical</span>
          ) : warningCount > 0 ? (
            <span className="badge status-warning"><span className="badge-dot" />{warningCount} need attention</span>
          ) : undefined
        }
        actions={
          <button onClick={fetchSensors} disabled={isLoading} className="btn btn-secondary btn-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Summary pills */}
      {sensors.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="badge status-success"><span className="badge-dot" />{sensors.filter(s => s.status === 'ACTIVE').length} normal</span>
          {warningCount > 0 && <span className="badge status-warning"><span className="badge-dot" />{warningCount} attention</span>}
          {criticalCount > 0 && <span className="badge status-critical"><span className="badge-dot" />{criticalCount} critical</span>}
          {offlineCount > 0 && <span className="badge status-neutral"><span className="badge-dot" />{offlineCount} offline</span>}
        </div>
      )}

      {/* Filter */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg w-fit"
        style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-base)' }}
        role="group"
        aria-label="Filter by sensor status"
      >
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            aria-pressed={statusFilter === f.value}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: statusFilter === f.value ? 'var(--brand-primary)' : 'transparent',
              color: statusFilter === f.value ? '#0A0F0D' : 'var(--text-muted)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoadingState message="Loading sensor readings…" />
      ) : sensors.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={Activity}
            title="No sensors found"
            description="No sensors matching the selected filter are currently configured for this mine."
            compact
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sensors.map((s) => {
            const Icon = sensorIcon(s.sensor_code);
            const isNormal   = s.status === 'ACTIVE';
            const isWarning  = s.status === 'WARNING';
            const isCritical = s.status === 'CRITICAL';

            const valueColor = isCritical ? 'var(--color-critical-text)'
              : isWarning ? 'var(--color-warning-text)'
              : isNormal  ? 'var(--color-success-text)'
              : 'var(--text-muted)';

            return (
              <div key={s.id} className="surface-card p-4 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {friendlyName(s.sensor_code, s.name)}
                    </span>
                  </div>
                  <StatusBadge status={s.status} size="sm" />
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold leading-none" style={{ color: valueColor }}>
                    {s.last_value !== undefined ? s.last_value : '—'}
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">{s.unit}</span>
                </div>

                {/* Zone */}
                <p className="text-xs text-[var(--text-muted)]">
                  {s.zone_name || 'Main Zone'} · {s.level_name || 'Level 1'}
                </p>

                {/* Threshold bar */}
                <div>
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                    <span>Safe limit: {s.warning_threshold} {s.unit}</span>
                    <span>Critical: {s.critical_threshold} {s.unit}</span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-muted)' }}
                    role="progressbar"
                    aria-label={`${friendlyName(s.sensor_code)} reading`}
                    aria-valuenow={s.last_value}
                    aria-valuemax={s.critical_threshold}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: s.last_value !== undefined && s.critical_threshold
                          ? `${Math.min((s.last_value / s.critical_threshold) * 100, 100)}%`
                          : '0%',
                        backgroundColor: isCritical ? 'var(--color-critical)'
                          : isWarning ? 'var(--color-warning)'
                          : 'var(--color-success)',
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--border-base)' }}>
                  <button
                    onClick={() => handleOpenDetail(s)}
                    className="btn btn-ghost btn-sm flex-1 justify-center text-xs"
                  >
                    View history
                  </button>
                  <button
                    onClick={() => focusInDigitalTwin({ type: 'sensor', id: s.id, x: s.x, y: s.y, z: s.z, title: friendlyName(s.sensor_code) })}
                    className="btn btn-ghost btn-sm p-1.5"
                    title="View in mine map"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sensor detail drawer */}
      {detailSensor && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-lg rounded-xl shadow-2xl max-h-[80vh] flex flex-col"
            style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-muted)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Sensor details"
          >
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-base)' }}>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {friendlyName(detailSensor.sensor.sensor_code, detailSensor.sensor.name)}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {detailSensor.sensor.zone_name || 'Main Zone'} · {detailSensor.sensor.level_name}
                </p>
              </div>
              <button onClick={() => setDetailSensor(null)} className="btn btn-ghost btn-sm p-1.5" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Technical details — clearly labelled as such */}
              <details className="rounded-md overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border-base)' }}>
                <summary className="px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-secondary)]">
                  Technical sensor information
                </summary>
                <div className="px-4 pb-3 grid grid-cols-2 gap-y-2 gap-x-4">
                  {[
                    ['Sensor ID', detailSensor.sensor.sensor_code],
                    ['Device status', detailSensor.sensor.status],
                    ['Warning threshold', `${detailSensor.sensor.warning_threshold} ${detailSensor.sensor.unit}`],
                    ['Critical threshold', `${detailSensor.sensor.critical_threshold} ${detailSensor.sensor.unit}`],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-[var(--text-muted)]">{label}</p>
                      <p className="text-xs font-medium text-[var(--text-secondary)] tech-value">{val}</p>
                    </div>
                  ))}
                </div>
              </details>

              {/* Reading history */}
              <SectionHeader title="Reading History" />
              {detailSensor.readings.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No historical readings available.</p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {detailSensor.readings.map((r, i) => (
                    <div
                      key={r.id ?? i}
                      className="flex items-center justify-between p-2.5 rounded-md"
                      style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border-base)' }}
                    >
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {r.value} {detailSensor.sensor.unit}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] tech-value">
                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
