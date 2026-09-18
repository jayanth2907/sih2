import React from 'react';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

/** Human-readable label map — translates DB/system values to plain English */
const LABEL_MAP: Record<string, string> = {
  // Lifecycle / incident statuses
  OPEN:         'Open',
  TRIAGED:      'Under Review',
  ASSIGNED:     'Assigned',
  IN_PROGRESS:  'In Progress',
  ESCALATED:    'Escalated',
  RESOLVED:     'Resolved',
  VERIFIED:     'Verified',
  CLOSED:       'Closed',
  // Alert statuses
  UNREAD:       'New',
  ACKNOWLEDGED: 'Acknowledged',
  // Sensor / device statuses
  ACTIVE:       'Normal',
  WARNING:      'Attention',
  CRITICAL:     'Critical',
  OFFLINE:      'Offline',
  INACTIVE:     'Inactive',
  DISABLED:     'Disabled',
  // Compliance / health
  GOOD:         'Good',
  HEALTHY:      'Healthy',
  OPERATIONAL:  'Operational',
  DEGRADED:     'Degraded',
  FAIL:         'Failed',
  PASS:         'Passed',
  // Severity levels
  HIGH:         'High',
  MEDIUM:       'Medium',
  LOW:          'Low',
  // Task / action statuses
  PENDING:      'Pending',
  REVIEW_REQUIRED: 'Review Required',
  COMPLETED:    'Completed',
  OVERDUE:      'Overdue',
  // Risk / risk zones
  EXTREME:      'Extreme Risk',
  // Special
  SIMULATED:    'Simulated',
  DEMO:         'Demo',
  EXTERNAL:     'External',
  PREDICTIVE:   'Predicted',
  TAMPER_DETECTED: 'Tamper Detected',
  BREACH:       'Breach',
};

/** Semantic colour categories */
function getVariant(normalized: string): 'critical' | 'warning' | 'success' | 'info' | 'neutral' {
  if (['CRITICAL', 'HIGH', 'ESCALATED', 'OFFLINE', 'FAIL', 'TAMPER_DETECTED', 'BREACH', 'EXTREME', 'OVERDUE'].includes(normalized)) {
    return 'critical';
  }
  if (['WARNING', 'MEDIUM', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'REVIEW_REQUIRED', 'DEGRADED'].includes(normalized)) {
    return 'warning';
  }
  if (['ACTIVE', 'GOOD', 'OPERATIONAL', 'CLOSED', 'LOW', 'VERIFIED', 'RESOLVED', 'HEALTHY', 'PASS', 'COMPLETED'].includes(normalized)) {
    return 'success';
  }
  if (['SIMULATED', 'DEMO', 'EXTERNAL', 'PREDICTIVE', 'INFO'].includes(normalized)) {
    return 'info';
  }
  return 'neutral';
}

const VARIANT_CLASSES = {
  critical: 'status-critical',
  warning:  'status-warning',
  success:  'status-success',
  info:     'status-info',
  neutral:  'status-neutral',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = 'md',
  showDot = true,
}) => {
  const normalized = (status || '').toUpperCase();
  const variant = getVariant(normalized);
  const label = LABEL_MAP[normalized] ?? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span
      className={clsx(
        'badge',
        VARIANT_CLASSES[variant],
        size === 'sm' ? 'text-[0.6875rem] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        className
      )}
    >
      {showDot && <span className="badge-dot" />}
      {label}
    </span>
  );
};
