import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { incidentService } from '../services';
import { Violation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, PageLoadingState } from '../components/ui/EmptyState';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import { CheckCircle2, FileText, Scale, ChevronDown, ChevronUp, IndianRupee } from 'lucide-react';

export const ViolationsPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedMine) return;
    setIsLoading(true);
    incidentService
      .getViolations(selectedMine.id)
      .then(setViolations)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedMine?.id]);

  if (!selectedMine) return null;

  const openCount = violations.filter(v => v.status !== 'CLOSED').length;

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Compliance Issues"
        subtitle="Statutory compliance requirements and corrective actions under Coal Mines Regulations."
        badge={
          openCount > 0 ? (
            <span className="badge status-warning">
              <span className="badge-dot" />
              {openCount} open
            </span>
          ) : undefined
        }
      />

      {isLoading ? (
        <PageLoadingState message="Loading compliance data…" />
      ) : violations.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={CheckCircle2}
            title="No compliance issues"
            description="This mine currently has no open compliance issues or statutory violations on record."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {violations.map((v) => {
            const isExpanded = expandedId === v.id;
            return (
              <article key={v.id} className="surface-card overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : v.id)}
                  className="w-full text-left p-4 md:p-5 flex items-start justify-between gap-3 hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer"
                  aria-expanded={isExpanded}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className="tech-value text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--color-critical-bg)',
                          color: 'var(--color-critical-text)',
                          border: '1px solid var(--color-critical-border)',
                        }}
                      >
                        {v.violation_code}
                      </span>
                      <StatusBadge status={v.severity} size="sm" />
                      <StatusBadge status={v.status} size="sm" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{v.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{v.statute}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                      : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    }
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div
                    className="px-4 pb-5 md:px-5 space-y-4"
                    style={{ borderTop: '1px solid var(--border-base)' }}
                  >
                    {/* Regulatory reference */}
                    <div
                      className="flex items-start gap-2.5 p-3 rounded-md mt-4"
                      style={{ backgroundColor: 'var(--bg-muted)' }}
                    >
                      <Scale className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                          Regulatory reference
                        </p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {v.regulatory_clause}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {v.description}
                    </p>

                    {/* Corrective actions */}
                    {v.corrective_actions && v.corrective_actions.length > 0 && (
                      <div>
                        <SectionHeader title="Required Actions" />
                        <div className="space-y-2">
                          {v.corrective_actions.map((ca) => (
                            <div
                              key={ca.id}
                              className="flex items-center justify-between p-3 rounded-md"
                              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-base)' }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[var(--text-primary)]">{ca.action_text}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                  Due by {new Date(ca.target_completion_date).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <StatusBadge status={ca.status} size="sm" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {v.corrective_actions?.length === 0 && (
                      <p className="text-sm text-[var(--text-muted)]">
                        No corrective actions have been assigned yet.
                      </p>
                    )}

                    {/* Footer metadata */}
                    <div
                      className="flex items-center justify-between pt-3 text-xs text-[var(--text-muted)] flex-wrap gap-2"
                      style={{ borderTop: '1px solid var(--border-base)' }}
                    >
                      <span>
                        Inspector: <span className="text-[var(--text-secondary)] font-medium">{v.inspector_name || 'DGMS Officer'}</span>
                      </span>
                      {v.financial_penalty_amount > 0 && (
                        <span className="flex items-center gap-1" style={{ color: 'var(--color-critical-text)' }}>
                          <IndianRupee className="w-3 h-3" aria-hidden="true" />
                          Penalty: ₹{v.financial_penalty_amount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
