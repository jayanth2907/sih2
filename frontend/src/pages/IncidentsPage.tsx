import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { incidentService } from '../services';
import { Incident, IncidentStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, PageLoadingState } from '../components/ui/EmptyState';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import {
  AlertTriangle, Clock, MapPin, CheckCircle2,
  X, ChevronRight, Eye
} from 'lucide-react';

const STATUS_TRANSITIONS: Record<IncidentStatus, { value: IncidentStatus; label: string }[]> = {
  OPEN:       [{ value: 'TRIAGED', label: 'Start review' }, { value: 'ASSIGNED', label: 'Assign to inspector' }, { value: 'CLOSED', label: 'Close' }],
  TRIAGED:    [{ value: 'ASSIGNED', label: 'Assign to inspector' }, { value: 'IN_PROGRESS', label: 'Begin work' }, { value: 'CLOSED', label: 'Close' }],
  ASSIGNED:   [{ value: 'IN_PROGRESS', label: 'Begin work' }, { value: 'CLOSED', label: 'Close' }],
  IN_PROGRESS:[{ value: 'RESOLVED', label: 'Mark resolved' }, { value: 'ESCALATED', label: 'Escalate' }],
  ESCALATED:  [{ value: 'RESOLVED', label: 'Mark resolved' }, { value: 'IN_PROGRESS', label: 'Return to progress' }],
  RESOLVED:   [{ value: 'VERIFIED', label: 'Verify & close' }, { value: 'IN_PROGRESS', label: 'Re-open' }],
  VERIFIED:   [{ value: 'CLOSED', label: 'Close incident' }, { value: 'IN_PROGRESS', label: 'Re-open' }],
  CLOSED:     [],
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const IncidentsPage: React.FC = () => {
  const { selectedMine, focusInDigitalTwin } = useMineContext();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [targetStatus, setTargetStatus] = useState<IncidentStatus | ''>('');
  const [comment, setComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncidents = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const data = await incidentService.getIncidents(selectedMine.id);
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, [selectedMine?.id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !targetStatus) return;
    setIsUpdating(true);
    try {
      await incidentService.updateIncidentStatus(
        selectedIncident.id,
        targetStatus as IncidentStatus,
        comment,
      );
      setSelectedIncident(null);
      setTargetStatus('');
      setComment('');
      await fetchIncidents();
    } catch (err) {
      console.error('Failed to update incident:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const openCount     = incidents.filter(i => !['CLOSED'].includes(i.status)).length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'CLOSED').length;

  if (!selectedMine) return null;

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Safety Incidents"
        subtitle="Track, assign, and resolve safety incidents. Each incident follows a structured review process."
        badge={
          criticalCount > 0 ? (
            <span className="badge status-critical">
              <span className="badge-dot" />
              {criticalCount} critical
            </span>
          ) : openCount > 0 ? (
            <span className="badge status-warning">
              <span className="badge-dot" />
              {openCount} open
            </span>
          ) : undefined
        }
        actions={
          <button onClick={fetchIncidents} className="btn btn-secondary btn-sm">
            Refresh
          </button>
        }
      />

      {isLoading ? (
        <PageLoadingState message="Loading incidents…" />
      ) : incidents.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={CheckCircle2}
            title="No incidents recorded"
            description="There are no safety incidents recorded for this mine. Incidents will appear here when reported by sensors, field inspectors, or staff."
          />
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="data-table" aria-label="Safety incidents">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Incident</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => {
                const transitions = STATUS_TRANSITIONS[inc.status] ?? [];
                return (
                  <tr key={inc.id}>
                    <td>
                      <span
                        className="tech-value text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {inc.incident_code}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-[var(--text-primary)]">{inc.title}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{inc.category}</p>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                        <MapPin className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" aria-hidden="true" />
                        {inc.zone_name || 'Working zone'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={inc.severity} size="sm" />
                    </td>
                    <td>
                      <StatusBadge status={inc.status} size="sm" />
                    </td>
                    <td>
                      <span className="text-sm text-[var(--text-muted)]">
                        {relativeTime(inc.created_at)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => focusInDigitalTwin({
                            type: 'incident', id: inc.id,
                            x: inc.x, y: inc.y, z: inc.z,
                            title: inc.title,
                          })}
                          className="btn btn-ghost btn-sm p-1.5"
                          title="View in mine map"
                          aria-label="View in mine map"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {transitions.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedIncident(inc);
                              setTargetStatus(transitions[0].value);
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            Update status
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {transitions.length === 0 && (
                          <span className="text-xs text-[var(--text-muted)]">Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Status update modal */}
      {selectedIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="incident-modal-title"
        >
          <div
            className="w-full max-w-md rounded-xl shadow-2xl"
            style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-muted)' }}
          >
            {/* Modal header */}
            <div
              className="flex items-start justify-between p-5"
              style={{ borderBottom: '1px solid var(--border-base)' }}
            >
              <div>
                <p
                  className="text-xs tech-value mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {selectedIncident.incident_code}
                </p>
                <h2
                  id="incident-modal-title"
                  className="text-base font-semibold text-[var(--text-primary)]"
                >
                  Update Incident Status
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  {selectedIncident.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="btn btn-ghost btn-sm p-1.5 ml-3 flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-5 space-y-4">
              {/* Current status */}
              <div className="flex items-center gap-2 p-3 rounded-md" style={{ backgroundColor: 'var(--bg-muted)' }}>
                <span className="text-sm text-[var(--text-muted)]">Current status:</span>
                <StatusBadge status={selectedIncident.status} size="sm" />
              </div>

              {/* New status select */}
              <div>
                <label htmlFor="new-status" className="form-label">
                  Change status to
                </label>
                <select
                  id="new-status"
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as IncidentStatus)}
                  className="form-select"
                >
                  {STATUS_TRANSITIONS[selectedIncident.status].map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="incident-comment" className="form-label">
                  Notes <span className="text-[var(--text-muted)] font-normal">(required — added to audit trail)</span>
                </label>
                <textarea
                  id="incident-comment"
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe the action taken or the reason for this status change…"
                  className="form-textarea"
                />
                <p className="form-hint">This comment is recorded in the permanent audit trail.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !comment.trim()}
                  className="btn btn-primary"
                >
                  {isUpdating ? 'Saving…' : 'Confirm update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
