import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { alertService } from '../services';
import type { Alert } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { AnomalySpatialModal } from '../components/AnomalySpatialModal';
import { EmptyState, PageLoadingState } from '../components/ui/EmptyState';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import { Bell, MapPin, Clock, Eye, CheckCircle2, ChevronDown, AlertTriangle } from 'lucide-react';

const FILTER_OPTIONS = [
  { value: 'ALL',          label: 'All' },
  { value: 'UNREAD',       label: 'New' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'RESOLVED',     label: 'Resolved' },
];

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export const AlertsPage: React.FC = () => {
  const { selectedMine, focusInDigitalTwin } = useMineContext();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inspectAnomalyId, setInspectAnomalyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAlerts = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const data = await alertService.getAlerts(
        selectedMine.id,
        statusFilter === 'ALL' ? undefined : statusFilter,
      );
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, [selectedMine?.id, statusFilter]);

  const handleUpdateStatus = async (alertId: number, newStatus: string) => {
    try {
      await alertService.updateAlertStatus(alertId, newStatus);
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to update alert status:', err);
    }
  };

  if (!selectedMine) return null;

  const newCount = alerts.filter(a => a.status === 'UNREAD').length;

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Safety Alerts"
        subtitle="Active notifications for this mine. Acknowledge alerts and coordinate field response."
        badge={newCount > 0 ? (
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'var(--color-critical-bg)', color: 'var(--color-critical-text)', border: '1px solid var(--color-critical-border)' }}
          >
            {newCount}
          </span>
        ) : undefined}
        actions={
          <button onClick={fetchAlerts} className="btn btn-secondary btn-sm">
            Refresh
          </button>
        }
      />

      {/* Filter bar */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg w-fit"
        style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-base)' }}
        role="group"
        aria-label="Filter alerts by status"
      >
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            aria-pressed={statusFilter === opt.value}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: statusFilter === opt.value ? 'var(--brand-primary)' : 'transparent',
              color: statusFilter === opt.value ? '#0A0F0D' : 'var(--text-muted)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <PageLoadingState message="Loading alerts…" />
      ) : alerts.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={CheckCircle2}
            title="No alerts"
            description={
              statusFilter === 'ALL'
                ? 'There are currently no alerts for this mine.'
                : `No ${FILTER_OPTIONS.find(o => o.value === statusFilter)?.label.toLowerCase()} alerts.`
            }
          />
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Alert list">
          {alerts.map((a) => (
            <article
              key={a.id}
              className="surface-card p-4 hover:border-[var(--border-muted)] transition-colors"
              style={a.status === 'UNREAD' ? { borderLeftWidth: 3, borderLeftColor: 'var(--color-critical)' } : {}}
              role="listitem"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <StatusBadge status={a.severity} size="sm" />
                    <StatusBadge status={a.status} size="sm" />
                    {a.status === 'UNREAD' && (
                      <span
                        className="text-xs font-semibold"
                        style={{ color: 'var(--color-critical-text)' }}
                      >
                        New
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{a.title}</h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.anomaly_id && (
                    <button
                      onClick={() => setInspectAnomalyId(a.anomaly_id || null)}
                      className="btn btn-secondary btn-sm"
                      title="View affected area"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Affected area</span>
                    </button>
                  )}
                  {a.sensor_id && (
                    <button
                      onClick={() => focusInDigitalTwin({
                        type: 'sensor', id: a.sensor_id,
                        x: 145.0, y: 470.0, z: -318.0,
                        title: a.title,
                      })}
                      className="btn btn-secondary btn-sm"
                      title="View location in mine map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mine map</span>
                    </button>
                  )}
                  {a.status === 'UNREAD' && (
                    <button
                      onClick={() => handleUpdateStatus(a.id, 'ACKNOWLEDGED')}
                      className="btn btn-primary btn-sm"
                    >
                      Acknowledge
                    </button>
                  )}
                  {a.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus(a.id, 'RESOLVED')}
                      className="btn btn-secondary btn-sm"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>

              {/* Message */}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-2">
                {a.message}
              </p>

              {/* Footer */}
              <div
                className="flex items-center justify-between mt-3 pt-2.5 text-xs text-[var(--text-muted)] flex-wrap gap-2"
                style={{ borderTop: '1px solid var(--border-base)' }}
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  {a.location_context || 'Location not specified'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {relativeTime(a.created_at)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Spatial proximity modal */}
      <AnomalySpatialModal
        anomalyId={inspectAnomalyId}
        onClose={() => setInspectAnomalyId(null)}
      />
    </div>
  );
};
