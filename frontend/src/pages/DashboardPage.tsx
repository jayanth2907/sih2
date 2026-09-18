import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import {
  sensorService, incidentService, riskService,
  predictiveRiskService, alertService,
} from '../services';
import { Sensor, Incident, Violation, RiskScore, AnomalyEvent, Alert, PredictiveRiskSummary } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { AttentionCard } from '../components/ui/AttentionCard';
import { EmptyState, PageLoadingState } from '../components/ui/EmptyState';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import {
  ShieldAlert, Activity, AlertTriangle, FileText,
  BrainCircuit, ClipboardCheck, RefreshCw, Layers,
  ArrowRight, Wind, Thermometer, Flame, CloudFog,
  CheckCircle2, Bell, Eye,
} from 'lucide-react';

/** Friendly sensor type label */
function sensorTypeLabel(type: string): string {
  const map: Record<string, string> = {
    CH4: 'Methane',
    CO: 'Carbon Monoxide',
    CO2: 'Carbon Dioxide',
    O2: 'Oxygen',
    TEMP: 'Temperature',
    HUMIDITY: 'Humidity',
    DUST: 'Dust / PM',
    AIR_VELOCITY: 'Air Velocity',
    NOISE: 'Noise Level',
    SEISMIC: 'Seismic Activity',
    PRESSURE: 'Air Pressure',
    H2S: 'Hydrogen Sulfide',
  };
  // Try to match sensor_type or derive from sensor_code
  if (map[type?.toUpperCase()]) return map[type.toUpperCase()];
  // Extract type prefix from sensor_code like CH4-07
  const prefix = type?.split(/[-_\d]/)[0]?.toUpperCase();
  return map[prefix] ?? type;
}

function sensorIcon(sensorCode: string) {
  const code = sensorCode?.toUpperCase() ?? '';
  if (code.includes('CH4') || code.includes('CO') || code.includes('H2S') || code.includes('GAS')) return Flame;
  if (code.includes('TEMP')) return Thermometer;
  if (code.includes('AIR') || code.includes('VENT') || code.includes('WIND')) return Wind;
  if (code.includes('DUST') || code.includes('PM')) return CloudFog;
  return Activity;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const DashboardPage: React.FC = () => {
  const { selectedMine, setCurrentTab, focusInDigitalTwin } = useMineContext();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [predictiveSummary, setPredictiveSummary] = useState<PredictiveRiskSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const [sData, iData, vData, rData, aData, pData, alData] = await Promise.all([
        sensorService.getSensors(selectedMine.id),
        incidentService.getIncidents(selectedMine.id),
        incidentService.getViolations(selectedMine.id),
        riskService.getMineRisk(selectedMine.id, true),
        riskService.getAnomalies(selectedMine.id),
        predictiveRiskService.getLatestPredictiveRisk(selectedMine.id).catch(() => null),
        alertService.getAlerts(selectedMine.id, 'UNREAD').catch(() => []),
      ]);
      setSensors(sData);
      setIncidents(iData);
      setViolations(vData);
      setRisk(rData);
      setAnomalies(aData);
      setPredictiveSummary(pData);
      setAlerts(alData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedMine?.id]);

  if (!selectedMine) {
    return (
      <div className="surface-card">
        <EmptyState
          icon={Layers}
          title="No mine selected"
          description="Please select a mine from the dropdown at the top of the screen to view the operations dashboard."
        />
      </div>
    );
  }

  if (isLoading) return <PageLoadingState message="Loading operations data…" />;

  // Derived values
  const criticalSensors   = sensors.filter(s => s.status === 'CRITICAL');
  const warningSensors    = sensors.filter(s => s.status === 'WARNING');
  const activeSensors     = sensors.filter(s => s.status === 'ACTIVE');
  const openIncidents     = incidents.filter(i => !['CLOSED', 'VERIFIED'].includes(i.status));
  const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'CLOSED');
  const openViolations    = violations.filter(v => v.status !== 'CLOSED');
  const unreadAlerts      = alerts.length;
  const highRisk          = predictiveSummary && ['CRITICAL', 'HIGH'].includes(predictiveSummary.predicted_severity ?? '');

  // Attention items (what needs action now)
  const attentionItems: Array<{
    level: 'critical' | 'warning' | 'info';
    title: string;
    context?: string;
    description?: string;
    age?: string;
    action: string;
    tab: string;
  }> = [];

  // Critical sensor alerts
  criticalSensors.slice(0, 2).forEach(s => {
    attentionItems.push({
      level: 'critical',
      title: `${sensorTypeLabel(s.sensor_code)} reading is critical`,
      context: `${s.zone_name || 'Main Zone'} · ${selectedMine.name}`,
      description: `Reading: ${s.last_value !== undefined ? `${s.last_value} ${s.unit}` : 'N/A'} — threshold ${s.critical_threshold} ${s.unit}`,
      action: 'Review sensor',
      tab: 'sensors',
    });
  });

  // Critical open incidents
  criticalIncidents.slice(0, 2).forEach(inc => {
    attentionItems.push({
      level: 'critical',
      title: inc.title,
      context: `${inc.zone_name || 'Working Zone'} · ${selectedMine.name}`,
      age: relativeTime(inc.created_at),
      action: 'View incident',
      tab: 'incidents',
    });
  });

  // High risk prediction
  if (highRisk && predictiveSummary) {
    attentionItems.push({
      level: 'warning',
      title: 'Risk assessment indicates elevated hazard level',
      context: selectedMine.name,
      description: (predictiveSummary.top_signals?.[0] as any)?.signal_name ?? predictiveSummary.data_quality_notes ?? 'Multiple risk factors detected. Review risk intelligence for details.',
      action: 'View risk analysis',
      tab: 'predictive-risk',
    });
  }

  // Warning sensors
  warningSensors.slice(0, 1).forEach(s => {
    attentionItems.push({
      level: 'warning',
      title: `${sensorTypeLabel(s.sensor_code)} reading requires attention`,
      context: `${s.zone_name || 'Main Zone'} · ${selectedMine.name}`,
      description: `Reading: ${s.last_value !== undefined ? `${s.last_value} ${s.unit}` : 'N/A'} — approaching threshold`,
      action: 'View monitoring',
      tab: 'sensors',
    });
  });

  // Open violations
  if (openViolations.length > 0) {
    attentionItems.push({
      level: 'warning',
      title: `${openViolations.length} compliance ${openViolations.length === 1 ? 'issue requires' : 'issues require'} attention`,
      context: selectedMine.name,
      action: 'View compliance',
      tab: 'violations',
    });
  }

  // Unread alerts
  if (unreadAlerts > 0) {
    attentionItems.push({
      level: 'info',
      title: `${unreadAlerts} unread ${unreadAlerts === 1 ? 'alert' : 'alerts'}`,
      context: selectedMine.name,
      action: 'View alerts',
      tab: 'alerts',
    });
  }

  // Risk severity → display variant
  const riskVariant = risk?.severity === 'CRITICAL' ? 'critical'
    : risk?.severity === 'HIGH'     ? 'critical'
    : risk?.severity === 'MEDIUM'   ? 'warning'
    : 'success';

  // Readable risk explanation
  const riskExplanation = (() => {
    const score = risk?.score ?? 0;
    if (score >= 75) return 'Mine conditions are critical. Immediate intervention required.';
    if (score >= 50) return 'Elevated risk detected. Review active alerts and inspections.';
    if (score >= 25) return 'Conditions are within manageable levels. Continue monitoring.';
    return 'Mine conditions are stable. No immediate action required.';
  })();

  return (
    <div className="space-y-6 page-enter">
      {/* Page header */}
      <PageHeader
        title={selectedMine.name}
        subtitle={`${selectedMine.mine_type} · ${selectedMine.district}, ${selectedMine.state}`}
        badge={<StatusBadge status={selectedMine.status} size="sm" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTab('digital-twin')}
              className="btn btn-secondary btn-sm"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3D Mine View</span>
            </button>
            <button
              onClick={fetchData}
              className="btn btn-ghost btn-sm"
              title="Refresh data"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      {lastUpdated && (
        <p className="text-xs text-[var(--text-muted)] -mt-4">
          Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {/* ─── ATTENTION REQUIRED ─── */}
      {attentionItems.length > 0 && (
        <section aria-label="Attention required">
          <SectionHeader title="Attention Required" />
          <div className="space-y-2">
            {attentionItems.slice(0, 5).map((item, idx) => (
              <AttentionCard
                key={idx}
                level={item.level}
                title={item.title}
                context={item.context}
                description={item.description}
                age={item.age}
                action={item.action}
                onAction={() => setCurrentTab(item.tab)}
              />
            ))}
          </div>
        </section>
      )}

      {attentionItems.length === 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
          }}
        >
          <CheckCircle2 className="w-4 h-4 text-[var(--color-success-text)]" aria-hidden="true" />
          <p className="text-sm text-[var(--color-success-text)]">
            No items require immediate attention. Mine operations are stable.
          </p>
        </div>
      )}

      {/* ─── KEY METRICS ─── */}
      <section aria-label="Key operational metrics">
        <SectionHeader title="Mine Health" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Safety Risk"
            value={`${risk?.score ?? 0}`}
            description={riskExplanation}
            icon={ShieldAlert}
            variant={riskVariant}
            action="View risk analysis"
            onClick={() => setCurrentTab('risk-audit')}
          />
          <StatCard
            title="Sensors"
            value={`${activeSensors.length} / ${sensors.length}`}
            description={
              criticalSensors.length > 0
                ? `${criticalSensors.length} critical`
                : warningSensors.length > 0
                ? `${warningSensors.length} need attention`
                : 'All readings normal'
            }
            icon={Activity}
            variant={criticalSensors.length > 0 ? 'critical' : warningSensors.length > 0 ? 'warning' : 'success'}
            action="View monitoring"
            onClick={() => setCurrentTab('sensors')}
          />
          <StatCard
            title="Open Incidents"
            value={openIncidents.length}
            description={
              openIncidents.length === 0
                ? 'No open incidents'
                : `${criticalIncidents.length} critical`
            }
            icon={AlertTriangle}
            variant={criticalIncidents.length > 0 ? 'critical' : openIncidents.length > 0 ? 'warning' : 'default'}
            action="View incidents"
            onClick={() => setCurrentTab('incidents')}
          />
          <StatCard
            title="Compliance"
            value={openViolations.length === 0 ? '✓' : openViolations.length}
            description={
              openViolations.length === 0
                ? 'No open compliance issues'
                : `${openViolations.length} issue${openViolations.length > 1 ? 's' : ''} open`
            }
            icon={FileText}
            variant={openViolations.length > 0 ? 'warning' : 'success'}
            action="View compliance"
            onClick={() => setCurrentTab('violations')}
          />
          <StatCard
            title="Risk Forecast"
            value={predictiveSummary?.predicted_risk_score !== undefined
              ? `${predictiveSummary.predicted_risk_score}`
              : '—'
            }
            description={predictiveSummary?.predicted_severity ?? 'No forecast available'}
            icon={BrainCircuit}
            variant={highRisk ? 'warning' : 'info'}
            action="View risk intelligence"
            onClick={() => setCurrentTab('predictive-risk')}
          />
          <StatCard
            title="Unread Alerts"
            value={unreadAlerts}
            description={unreadAlerts === 0 ? 'All alerts reviewed' : 'Awaiting review'}
            icon={Bell}
            variant={unreadAlerts > 0 ? 'warning' : 'default'}
            action="View alerts"
            onClick={() => setCurrentTab('alerts')}
          />
        </div>
      </section>

      {/* ─── ENVIRONMENTAL READINGS ─── */}
      <section aria-label="Environmental monitoring">
        <SectionHeader
          title="Environmental Readings"
          description="Key air quality and safety parameters"
          action={
            <button
              onClick={() => setCurrentTab('sensors')}
              className="btn btn-ghost btn-sm"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        />

        {sensors.length === 0 ? (
          <div className="surface-card">
            <EmptyState
              icon={Activity}
              title="No sensor data available"
              description="Sensor readings for this mine will appear here once monitoring is active."
              compact
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sensors.slice(0, 8).map((sensor) => {
              const Icon = sensorIcon(sensor.sensor_code);
              const variant: 'critical' | 'warning' | 'success' | 'default' =
                sensor.status === 'CRITICAL' ? 'critical'
                : sensor.status === 'WARNING'  ? 'warning'
                : sensor.status === 'ACTIVE'   ? 'success'
                : 'default';

              return (
                <div
                  key={sensor.id}
                  className="surface-card p-4 hover:border-[var(--border-muted)] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {sensorTypeLabel(sensor.sensor_code)}
                      </span>
                    </div>
                    <StatusBadge status={sensor.status} size="sm" />
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span
                      className="text-2xl font-bold leading-none"
                      style={{
                        color: variant === 'critical' ? 'var(--color-critical-text)'
                          : variant === 'warning'  ? 'var(--color-warning-text)'
                          : variant === 'success'  ? 'var(--color-success-text)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {sensor.last_value !== undefined ? sensor.last_value : '—'}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">{sensor.unit}</span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] mt-1.5">
                    {sensor.zone_name || 'Main Zone'}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--border-base)]">
                    <span className="text-xs text-[var(--text-muted)]">
                      Safe limit: {sensor.warning_threshold} {sensor.unit}
                    </span>
                    <button
                      onClick={() => focusInDigitalTwin({
                        type: 'sensor', id: sensor.id,
                        x: sensor.x, y: sensor.y, z: sensor.z,
                        title: sensorTypeLabel(sensor.sensor_code),
                      })}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer flex items-center gap-1"
                      title="View in 3D mine map"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── RISK ASSESSMENT + RECENT ANOMALIES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Risk Assessment */}
        <section className="surface-card p-5" aria-label="Risk assessment">
          <SectionHeader title="Risk Assessment" />

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
            {risk?.explanation || riskExplanation}
          </p>

          <div className="space-y-2">
            {[
              { label: 'Regulatory compliance', value: risk?.rule_score ?? 0, max: 40 },
              { label: 'Sensor anomaly level', value: risk?.ml_score ?? 0, max: 40 },
              { label: 'Monitoring continuity', value: risk?.silence_risk_score ?? 0, max: 20 },
            ].map(({ label, value, max }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--text-muted)]">{label}</span>
                  <span className="text-[var(--text-secondary)] font-medium">{value} / {max}</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-muted)' }}
                  role="progressbar"
                  aria-valuenow={value}
                  aria-valuemax={max}
                  aria-label={label}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((value / max) * 100, 100)}%`,
                      backgroundColor: value > max * 0.7 ? 'var(--color-critical)'
                        : value > max * 0.4 ? 'var(--color-warning)'
                        : 'var(--color-success)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCurrentTab('predictive-risk')}
            className="btn btn-ghost btn-sm w-full mt-4 justify-center"
          >
            Full risk analysis <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* Recent anomalies */}
        <section className="surface-card p-5" aria-label="Recent issues">
          <SectionHeader
            title="Recent Issues"
            action={
              <button
                onClick={() => setCurrentTab('alerts')}
                className="btn btn-ghost btn-sm"
              >
                All alerts <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          />

          {anomalies.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No active issues"
              description="No anomalies or unusual readings have been detected recently."
              compact
            />
          ) : (
            <div className="space-y-2">
              {anomalies.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 rounded-md"
                  style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-base)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={a.severity} size="sm" />
                      <span className="text-xs text-[var(--text-muted)]">
                        {relativeTime(a.detected_at)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                      {a.description || 'Unusual reading detected'}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('alerts')}
                    className="btn btn-ghost btn-sm flex-shrink-0 p-1.5"
                    title="View details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
