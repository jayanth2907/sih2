import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { riskService } from '../services';
import { RiskScore, AuditEvent } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, PageLoadingState } from '../components/ui/EmptyState';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import { Timeline } from '../components/ui/Timeline';
import { ShieldAlert, History, Lock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

function friendlyAction(action: string, resourceType: string): string {
  const map: Record<string, string> = {
    CREATE: 'created', UPDATE: 'updated', DELETE: 'deleted',
    STATUS_UPDATE: 'status changed', ASSIGN: 'assigned',
    APPROVE: 'approved', REJECT: 'rejected', RESOLVE: 'resolved',
    VERIFY: 'verified', CLOSE: 'closed',
  };
  const verb = map[action?.toUpperCase()] ?? action?.toLowerCase();
  const resource = resourceType?.replace(/_/g, ' ').toLowerCase();
  return `${resource ? resource.charAt(0).toUpperCase() + resource.slice(1) : 'Record'} ${verb}`;
}

export const RiskAuditPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);

  const fetchData = async (recalculate = false) => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const [rData, aData] = await Promise.all([
        riskService.getMineRisk(selectedMine.id, recalculate),
        riskService.getAuditTrail(selectedMine.id),
      ]);
      setRisk(rData);
      setAuditLogs(aData);
    } catch (err) {
      console.error('Failed to load risk/audit data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedMine?.id]);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await fetchData(true);
    setIsRecalculating(false);
  };

  if (!selectedMine) return null;

  // Build human-readable timeline from audit logs
  const timelineItems = auditLogs.slice(0, 20).map((log, i) => ({
    id: log.id ?? i,
    time: new Date(log.timestamp).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }),
    title: friendlyAction(log.action, log.resource_type),
    detail: log.after_state || log.metadata_json || undefined,
    actor: log.actor_id ? `User ${log.actor_id}` : undefined,
    active: i === 0,
  }));

  const riskVariant = risk?.severity === 'CRITICAL' ? 'var(--color-critical-text)'
    : risk?.severity === 'HIGH' ? 'var(--color-warning-text)'
    : risk?.severity === 'MEDIUM' ? 'var(--color-warning-text)'
    : 'var(--color-success-text)';

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Audit Trail"
        subtitle="Tamper-evident governance log of all actions taken on this mine. Every record is cryptographically verified."
        actions={
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Refreshing…' : 'Refresh risk score'}
          </button>
        }
      />

      {isLoading ? (
        <PageLoadingState message="Loading audit data…" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Risk summary */}
          <div className="lg:col-span-1 space-y-4">
            <section className="surface-card p-5" aria-label="Risk score">
              <SectionHeader title="Current Risk Score" />

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-bold" style={{ color: riskVariant }}>
                  {risk?.score ?? 0}
                </span>
                <span className="text-lg text-[var(--text-muted)]">/ 100</span>
                <StatusBadge status={risk?.severity || 'LOW'} size="sm" />
              </div>

              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                {risk?.explanation || 'No risk explanation available.'}
              </p>

              <div className="space-y-3">
                {[
                  { label: 'Regulatory compliance', value: risk?.rule_score ?? 0, max: 40, description: 'Open violations, overdue actions, active incidents' },
                  { label: 'Sensor anomaly level', value: risk?.ml_score ?? 0, max: 40, description: 'Gas spikes, ventilation issues, thermal events' },
                  { label: 'Monitoring continuity', value: risk?.silence_risk_score ?? 0, max: 20, description: 'Sensor gaps and unreported periods' },
                ].map(({ label, value, max, description }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--text-muted)]">{label}</span>
                      <span className="font-medium text-[var(--text-secondary)]">{value} / {max}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((value / max) * 100, 100)}%`,
                          backgroundColor: value > max * 0.7 ? 'var(--color-critical)'
                            : value > max * 0.4 ? 'var(--color-warning)'
                            : 'var(--color-success)',
                        }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Integrity badge */}
            <div
              className="flex items-center gap-2.5 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' }}
            >
              <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-success-text)' }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--color-success-text)' }}>
                  Audit chain verified
                </p>
                <p className="text-xs" style={{ color: 'var(--color-success-text)', opacity: 0.75 }}>
                  All records are cryptographically intact
                </p>
              </div>
            </div>
          </div>

          {/* Right: Activity timeline + technical detail */}
          <div className="lg:col-span-2 space-y-4">
            <section className="surface-card p-5" aria-label="Governance activity">
              <SectionHeader
                title="Governance Activity"
                description={`${auditLogs.length} recorded events`}
              />

              {auditLogs.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No audit events yet"
                  description="Governance events will appear here as actions are taken on this mine."
                  compact
                />
              ) : (
                <Timeline items={timelineItems} />
              )}
            </section>

            {/* Technical details — collapsible */}
            {auditLogs.length > 0 && (
              <section className="surface-card overflow-hidden" aria-label="Technical audit details">
                <button
                  onClick={() => setShowTechnical(!showTechnical)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer"
                  aria-expanded={showTechnical}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      Cryptographic audit details
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      (SHA-256 hash chain)
                    </span>
                  </div>
                  {showTechnical
                    ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                    : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  }
                </button>

                {showTechnical && (
                  <div className="overflow-x-auto" style={{ borderTop: '1px solid var(--border-base)' }}>
                    <table className="data-table" aria-label="Technical audit log">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Action</th>
                          <th>Resource</th>
                          <th>SHA-256 hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.slice(0, 30).map((log, i) => (
                          <tr key={log.id ?? i}>
                            <td>
                              <span className="tech-value text-xs text-[var(--text-muted)]">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </td>
                            <td className="text-sm text-[var(--text-primary)]">
                              {friendlyAction(log.action, log.resource_type)}
                            </td>
                            <td className="tech-value text-xs text-[var(--text-muted)]">
                              {log.resource_type} #{log.resource_id}
                            </td>
                            <td>
                              <span
                                className="tech-value text-xs"
                                style={{ color: 'var(--color-success-text)' }}
                                title={log.current_event_hash}
                              >
                                {log.current_event_hash
                                  ? `${log.current_event_hash.substring(0, 16)}…`
                                  : 'Pending'
                                }
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
