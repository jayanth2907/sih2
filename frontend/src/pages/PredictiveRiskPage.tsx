import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { predictiveRiskService } from '../services';
import { PredictiveRiskSummary, MLModelInfo } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, PageLoadingState } from '../components/ui/EmptyState';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import {
  BrainCircuit, RefreshCw, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Info, TrendingUp
} from 'lucide-react';

export const PredictiveRiskPage: React.FC = () => {
  const { selectedMine } = useMineContext();
  const [summary, setSummary] = useState<PredictiveRiskSummary | null>(null);
  const [models, setModels] = useState<MLModelInfo[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInferring, setIsInferring] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);

  const fetchData = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const [sumData, modelsData, histData] = await Promise.all([
        predictiveRiskService.getLatestPredictiveRisk(selectedMine.id),
        predictiveRiskService.getRegisteredModels(),
        predictiveRiskService.getPredictionsHistory(selectedMine.id, 20),
      ]);
      setSummary(sumData);
      setModels(modelsData);
      setHistory(histData);
    } catch (err) {
      console.error('Failed to load risk intelligence data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedMine?.id]);

  const handleRunAnalysis = async () => {
    if (!selectedMine) return;
    setIsInferring(true);
    try {
      const updated = await predictiveRiskService.evaluatePredictiveRisk(selectedMine.id);
      setSummary(updated);
      const histData = await predictiveRiskService.getPredictionsHistory(selectedMine.id, 20);
      setHistory(histData);
    } catch (err: any) {
      console.error('Risk analysis failed:', err);
    } finally {
      setIsInferring(false);
    }
  };

  if (!selectedMine) return null;

  const severityVariant = summary?.predicted_severity === 'CRITICAL' ? 'critical'
    : summary?.predicted_severity === 'HIGH' ? 'critical'
    : summary?.predicted_severity === 'MEDIUM' ? 'warning'
    : 'success';

  const severityColor = severityVariant === 'critical' ? 'var(--color-critical-text)'
    : severityVariant === 'warning' ? 'var(--color-warning-text)'
    : 'var(--color-success-text)';

  const activeModel = models.find(m => m.status === 'ACTIVE') || models[0];
  let parsedMetrics: any = null;
  if (activeModel?.metrics_json) {
    try {
      parsedMetrics = typeof activeModel.metrics_json === 'string'
        ? JSON.parse(activeModel.metrics_json)
        : activeModel.metrics_json;
    } catch { parsedMetrics = null; }
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Risk Intelligence"
        subtitle="Predictive risk analysis based on current sensor data, compliance status, and historical patterns."
        actions={
          <button
            onClick={handleRunAnalysis}
            disabled={isInferring}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isInferring ? 'animate-spin' : ''}`} />
            {isInferring ? 'Analysing…' : 'Run new analysis'}
          </button>
        }
      />

      {isLoading ? (
        <PageLoadingState message="Loading risk intelligence…" />
      ) : !summary ? (
        <div className="surface-card">
          <EmptyState
            icon={BrainCircuit}
            title="No risk analysis available"
            description="Run an analysis to generate a risk assessment for this mine based on current conditions."
            action={
              <button onClick={handleRunAnalysis} className="btn btn-primary btn-sm">
                Run analysis
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Main risk card */}
          <section className="surface-card p-5" aria-label="Risk assessment result">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <SectionHeader title="Risk Forecast" />
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold" style={{ color: severityColor }}>
                    {summary.predicted_risk_score ?? '—'}
                  </span>
                  <span className="text-xl text-[var(--text-muted)]">/ 100</span>
                  <StatusBadge status={summary.predicted_severity || 'LOW'} size="sm" />
                </div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {summary.evaluated_at && (
                  <span>
                    Last analysed:{' '}
                    {new Date(summary.evaluated_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Plain-English explanation */}
            {summary.data_quality_notes && (
              <div
                className="p-4 rounded-lg mb-4"
                style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border-base)' }}
              >
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {summary.data_quality_notes}
                </p>
              </div>
            )}

            {/* Risk factors from top_signals */}
            {summary.top_signals && summary.top_signals.length > 0 && (
              <div>
                <SectionHeader title="Key Risk Factors & Contributing Signals" description="Signals identified as driving the current risk assessment" />
                <div className="space-y-2.5 mt-3">
                  {summary.top_signals.map((signal: any, i) => {
                    const isIncreasing = signal.direction === 'INCREASING_RISK' || (signal.contribution_points && signal.contribution_points > 0);
                    const label = signal.label || signal.feature || `Contributing Factor ${i + 1}`;
                    const explanation = signal.explanation || (signal.current_value !== undefined ? `Current reading is ${signal.current_value} ${signal.unit || ''}` : null);

                    return (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: isIncreasing ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-base)',
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="p-1.5 rounded-md mt-0.5"
                            style={{
                              backgroundColor: isIncreasing ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: isIncreasing ? 'var(--color-critical)' : 'var(--color-success)',
                            }}
                          >
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                              {signal.symbol && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-muted)] font-mono">
                                  {signal.symbol}
                                </span>
                              )}
                            </div>
                            {explanation && (
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                                {explanation}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:self-center pl-9 sm:pl-0">
                          {signal.current_value !== undefined && (
                            <div className="text-right">
                              <span className="text-xs text-[var(--text-muted)] block">Observed</span>
                              <span className="text-sm font-semibold text-[var(--text-primary)]">
                                {signal.current_value} <span className="text-xs font-normal text-[var(--text-muted)]">{signal.unit || ''}</span>
                              </span>
                            </div>
                          )}
                          {signal.contribution_points !== undefined && (
                            <span
                              className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                              style={{
                                backgroundColor: isIncreasing ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                color: isIncreasing ? 'var(--color-critical)' : 'var(--color-success)',
                              }}
                            >
                              {signal.contribution_points > 0 ? `+${signal.contribution_points}` : signal.contribution_points} pts risk
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </section>

          {/* Risk history */}
          {history.length > 0 && (
            <section className="surface-card p-5" aria-label="Risk trend">
              <SectionHeader
                title="Risk Trend"
                description={`Last ${history.length} assessments`}
              />
              <div className="flex items-end gap-1.5 h-24">
                {history.slice(0, 20).map((h: any, i) => {
                  const score = h.predicted_risk_score ?? 0;
                  const heightPct = `${Math.min(score, 100)}%`;
                  const color = score >= 75 ? 'var(--color-critical)'
                    : score >= 50 ? 'var(--color-warning)'
                    : 'var(--color-success)';
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm transition-all"
                      style={{ height: heightPct, backgroundColor: color, opacity: 0.8 }}
                      title={`Score: ${score} — ${new Date(h.evaluated_at).toLocaleString()}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                <span>Older</span>
                <span>Latest</span>
              </div>
            </section>
          )}

          {/* Technical model details — collapsible */}
          {activeModel && (
            <section className="surface-card overflow-hidden" aria-label="Model technical details">
              <button
                onClick={() => setShowModelDetails(!showModelDetails)}
                className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer"
                aria-expanded={showModelDetails}
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Technical model details
                  </span>
                </div>
                {showModelDetails
                  ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                  : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                }
              </button>

              {showModelDetails && (
                <div
                  className="p-4 space-y-3"
                  style={{ borderTop: '1px solid var(--border-base)' }}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      ['Model name', activeModel.model_name],
                      ['Version', activeModel.version],
                      ['Status', activeModel.status],
                      ['Algorithm', activeModel.algorithm],
                      ['Trained', activeModel.trained_at ? new Date(activeModel.trained_at).toLocaleDateString() : 'N/A'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-xs text-[var(--text-muted)]">{label}</p>
                        <p className="text-xs font-medium text-[var(--text-secondary)] tech-value mt-0.5">{val ?? '—'}</p>
                      </div>
                    ))}
                  </div>

                  {parsedMetrics && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-2">Analysis confidence</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(parsedMetrics).slice(0, 4).map(([k, v]) => (
                          <div key={k} className="p-2 rounded" style={{ backgroundColor: 'var(--bg-muted)' }}>
                            <p className="text-xs text-[var(--text-muted)] capitalize">{k.replace(/_/g, ' ')}</p>
                            <p className="text-sm font-semibold text-[var(--text-secondary)] tech-value">
                              {typeof v === 'number' ? v.toFixed(3) : String(v)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
