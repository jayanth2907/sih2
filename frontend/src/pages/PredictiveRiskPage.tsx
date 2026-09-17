import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { predictiveRiskService } from '../services';
import { PredictiveRiskSummary, MLModelInfo } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert,
  Eye,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Info
} from 'lucide-react';

export const PredictiveRiskPage: React.FC = () => {
  const { selectedMine, focusInDigitalTwin } = useMineContext();
  const [summary, setSummary] = useState<PredictiveRiskSummary | null>(null);
  const [models, setModels] = useState<MLModelInfo[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInferring, setIsInferring] = useState(false);
  const [activeTab, setActiveTab] = useState<'FORECAST' | 'MODEL_CARD' | 'HISTORY'>('FORECAST');

  const fetchData = async () => {
    if (!selectedMine) return;
    setIsLoading(true);
    try {
      const [sumData, modelsData, histData] = await Promise.all([
        predictiveRiskService.getLatestPredictiveRisk(selectedMine.id),
        predictiveRiskService.getRegisteredModels(),
        predictiveRiskService.getPredictionsHistory(selectedMine.id, 20)
      ]);
      setSummary(sumData);
      setModels(modelsData);
      setHistory(histData);
    } catch (err) {
      console.error('Failed to load predictive risk data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMine?.id]);

  const handleRunInference = async () => {
    if (!selectedMine) return;
    setIsInferring(true);
    try {
      const updated = await predictiveRiskService.evaluatePredictiveRisk(selectedMine.id);
      setSummary(updated);
      const histData = await predictiveRiskService.getPredictionsHistory(selectedMine.id, 20);
      setHistory(histData);
    } catch (err: any) {
      console.error('Inference execution failed:', err);
      alert(err.response?.data?.detail || 'Inference execution failed.');
    } finally {
      setIsInferring(false);
    }
  };

  if (!selectedMine) return null;

  const activeModel = models.find((m) => m.status === 'ACTIVE') || models[0];
  let parsedMetrics: any = null;
  if (activeModel && activeModel.metrics_json) {
    try {
      parsedMetrics = typeof activeModel.metrics_json === 'string' ? JSON.parse(activeModel.metrics_json) : activeModel.metrics_json;
    } catch (e) {
      parsedMetrics = null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-amber-400" />
              Forward-Looking AI/ML Risk Intelligence
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 text-blue-400 border border-blue-800">
              TRAINING DATA: SIMULATED / DEMO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical Gradient Boosting forecasting of operational and atmospheric risk escalation over a 30-minute horizon.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleRunInference}
            disabled={isInferring}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isInferring ? 'animate-spin' : ''}`} />
            <span>{isInferring ? 'EVALUATING MODEL...' : 'RUN FORWARD INFERENCE'}</span>
          </button>
        </div>
      </div>

      {/* Main Comparative Cards */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
          {/* CURRENT RISK vs PREDICTED RISK Dual Card */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Dual Horizon Analysis</span>
                <h3 className="text-sm font-bold text-white mt-0.5">Current Operational State vs. 30-Min Forward Projection</h3>
              </div>
              <span className="px-2 py-1 rounded bg-slate-800 text-amber-400 text-[10px] font-bold">
                Horizon: +{summary.horizon_minutes} Min
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Current Risk Snapshot */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">1. CURRENT RISK STATE (NOW)</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-white">{summary.current_risk_score}</span>
                  <StatusBadge status={summary.current_severity} size="sm" />
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Real-time deterministic composite score evaluated across active sensors and safety rules.
                </p>
              </div>

              {/* Predicted Risk Projection */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 text-[10px] uppercase font-bold block">2. PREDICTED RISK (NEXT 30 MIN)</span>
                  <span className="text-[10px] text-slate-400">Prob: {intPercent(summary.probability)}%</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-amber-400">{summary.predicted_risk_score}</span>
                  <StatusBadge status={summary.predicted_severity} size="sm" />
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${
                    summary.risk_delta > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {summary.risk_delta > 0 ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{summary.risk_delta}
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3.5 h-3.5" />
                        {summary.risk_delta}
                      </>
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">
                  {summary.probability >= 0.60
                    ? 'Elevated probability of operational risk escalation detected. Precautionary review advised.'
                    : 'Atmospheric and operational signals projected to remain within standard safety bounds.'}
                </p>
              </div>
            </div>

            {/* Quick 3D Focus Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Model: {summary.model_name} ({summary.model_version})</span>
              </div>
              <button
                onClick={() =>
                  focusInDigitalTwin({
                    type: 'anomaly',
                    x: 120,
                    y: 40,
                    z: -180,
                    title: `Predicted Risk Hotspot (+${summary.horizon_minutes}m Forecast: ${summary.predicted_risk_score}/100)`
                  })
                }
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold cursor-pointer transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>FOCUS PREDICTED HOTSPOT IN 3D</span>
              </button>
            </div>
          </div>

          {/* Telemetry Health & Data Quality */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4 text-xs font-mono">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              Feature Provenance & Quality
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Telemetry Quality Score</span>
                <p className="text-xl font-bold text-emerald-400">{intPercent(summary.data_quality_score)}%</p>
                <p className="text-[10px] text-slate-400">{summary.data_quality_notes}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Training Provenance</span>
                <p className="text-xs font-bold text-blue-400">{summary.dataset_provenance}</p>
                <p className="text-[10px] text-slate-500">
                  Model trained with synthetic temporal series across 250 mining operational hours.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Last Evaluation</span>
                <p className="text-slate-300 text-xs">{new Date(summary.evaluated_at).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 font-mono text-xs">
        <button
          onClick={() => setActiveTab('FORECAST')}
          className={`px-4 py-2 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'FORECAST'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Signal Attributions (WHY?)
        </button>
        <button
          onClick={() => setActiveTab('MODEL_CARD')}
          className={`px-4 py-2 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'MODEL_CARD'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Model Card & Validation Benchmarks
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Inference Audit History ({history.length})
        </button>
      </div>

      {/* TAB 1: Signal Attributions */}
      {activeTab === 'FORECAST' && summary && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Primary Driving Signals & Operational Attributions
            </h3>
            <span className="text-slate-500 text-[10px]">STANDARDIZED DEVIATION ANALYSIS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.top_signals.map((sig, idx) => (
              <div key={idx} className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs ${
                      sig.direction === 'INCREASING_RISK'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {sig.symbol}
                    </span>
                    <span className="font-bold text-white text-xs">{sig.label}</span>
                  </div>
                  <span className="text-amber-400 font-bold text-xs">+{sig.contribution_points} pts</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-900">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Observed Value</span>
                    <span className="text-white font-bold">{sig.current_value} {sig.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Reference Standard</span>
                    <span className="text-slate-400">{sig.normal_reference} {sig.unit} (Limit: {sig.threshold_reference})</span>
                  </div>
                </div>

                <p className="text-slate-400 text-[11px] font-sans pt-1">
                  {sig.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Model Card & Validation Benchmarks */}
      {activeTab === 'MODEL_CARD' && (
        <div className="space-y-6 font-mono text-xs">
          {/* Validation Metrics Grid */}
          {parsedMetrics && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Model Validation Performance (Chronological Test Holdout)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">ROC-AUC</span>
                  <p className="text-xl font-bold text-amber-400">{parsedMetrics.roc_auc}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">PR-AUC</span>
                  <p className="text-xl font-bold text-white">{parsedMetrics.pr_auc}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">Precision</span>
                  <p className="text-xl font-bold text-emerald-400">{parsedMetrics.precision}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">Recall</span>
                  <p className="text-xl font-bold text-cyan-400">{parsedMetrics.recall}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">F1 Score</span>
                  <p className="text-xl font-bold text-indigo-400">{parsedMetrics.f1}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">Brier Score</span>
                  <p className="text-xl font-bold text-slate-300">{parsedMetrics.brier_score}</p>
                </div>
              </div>

              {/* Baseline Comparison Notice */}
              {parsedMetrics.baseline_comparison && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white">Baseline Comparison: {parsedMetrics.baseline_comparison.baseline_model}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Baseline Rule ROC-AUC: {parsedMetrics.baseline_comparison.baseline_roc_auc} • ML Lift: +{parsedMetrics.baseline_comparison.ml_auc_lift} AUC
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                    LIFT VERIFIED
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Model Card Specification */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4 font-sans text-xs">
            <h3 className="font-mono font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              Model Card: TRINETRA Risk Escalation v1.0
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
              <div className="space-y-2">
                <p><span className="font-bold text-white">Intended Use:</span> Early warning operational forecast to assist mine safety managers in proactively inspecting face ventilation and sensor anomalies.</p>
                <p><span className="font-bold text-white">Prediction Target:</span> Binary escalation of risk within a forward 30-minute window ($t, t+30m$).</p>
                <p><span className="font-bold text-white">Algorithm:</span> Histogram-based Gradient Boosting with balanced class weights and regularized leaf splits.</p>
              </div>
              <div className="space-y-2">
                <p><span className="font-bold text-white">Validation Strategy:</span> Strict chronological window splitting (70% Train, 15% Val, 15% Test) with zero future-to-past data leakage.</p>
                <p><span className="font-bold text-white">Known Boundaries:</span> Model output represents probabilistic risk escalation likelihood, not deterministic accident certainty.</p>
                <p><span className="font-bold text-white">Credibility Notice:</span> Dataset is explicitly identified as simulated demo mining telemetry.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Prediction History Log */}
      {activeTab === 'HISTORY' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md space-y-3 p-4 font-mono text-xs">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Historical Inference Log & Audit Snapshots
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Current Risk</th>
                  <th className="py-2.5 px-3">Predicted Risk (+30m)</th>
                  <th className="py-2.5 px-3">Escalation Probability</th>
                  <th className="py-2.5 px-3">Model Version</th>
                  <th className="py-2.5 px-3">Dataset Provenance</th>
                  <th className="py-2.5 px-3 text-right">Alert Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No historical predictions recorded for this mine yet.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-white">
                        {new Date(h.prediction_timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-300">{h.current_risk_score}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-400">
                        {h.predicted_risk_score} ({h.predicted_severity})
                      </td>
                      <td className="py-2.5 px-3">{intPercent(h.probability)}%</td>
                      <td className="py-2.5 px-3 text-slate-400">{h.model_version}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                          {h.dataset_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {h.is_alert_generated ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            ALERT DISPATCHED
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">None</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

function intPercent(val: number): number {
  return Math.round((val || 0) * 100);
}
