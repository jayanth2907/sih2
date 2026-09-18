import React, { useState, useEffect } from 'react';
import { 
  Play, RotateCcw, FastForward, CheckCircle2, AlertTriangle, XCircle, 
  Layers, ShieldAlert, Cpu, Activity, Eye, FileText, Lock, 
  Terminal, ArrowRight, RefreshCw, Radio, Check, Sparkles, Navigation
} from 'lucide-react';
import { demoService } from '../services';
import type { 
  DemoScenarioSummary, DemoScenarioDetail, DemoPreflightReport, 
  DemoStepResponse, DemoResetResponse 
} from '../types';

export const DemoControlCenterPage: React.FC = () => {
  const [preflight, setPreflight] = useState<DemoPreflightReport | null>(null);
  const [scenarios, setScenarios] = useState<DemoScenarioSummary[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('GAS_ESCALATION');
  const [scenarioDetail, setScenarioDetail] = useState<DemoScenarioDetail | null>(null);
  const [lastStepResponse, setLastStepResponse] = useState<DemoStepResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [stepLoading, setStepLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPlaybook, setShowPlaybook] = useState<boolean>(false);

  // Load initial preflight and scenarios
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pf, scList] = await Promise.all([
        demoService.getPreflightCheck(),
        demoService.getScenarios()
      ]);
      setPreflight(pf);
      setScenarios(scList);
      if (selectedScenarioId) {
        const detail = await demoService.getScenarioDetail(selectedScenarioId);
        setScenarioDetail(detail);
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Failed to initialize demo engine data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle selecting a scenario
  const handleSelectScenario = async (id: string) => {
    setSelectedScenarioId(id);
    setActionMessage(null);
    setErrorMessage(null);
    try {
      const detail = await demoService.getScenarioDetail(id);
      setScenarioDetail(detail);
      setLastStepResponse(null);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || `Failed to load scenario ${id}`);
    }
  };

  // Execute next step
  const handleExecuteNextStep = async () => {
    if (!selectedScenarioId) return;
    setStepLoading(true);
    setActionMessage(null);
    setErrorMessage(null);
    try {
      const resp = await demoService.executeStep(selectedScenarioId);
      setLastStepResponse(resp);
      setActionMessage(resp.message);
      // Refresh detail
      const detail = await demoService.getScenarioDetail(selectedScenarioId);
      setScenarioDetail(detail);
      // Refresh preflight checks
      const pf = await demoService.getPreflightCheck();
      setPreflight(pf);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Failed to execute next demo event.');
    } finally {
      setStepLoading(false);
    }
  };

  // Run all steps
  const handleRunAllSteps = async () => {
    if (!selectedScenarioId) return;
    setStepLoading(true);
    setActionMessage(null);
    setErrorMessage(null);
    try {
      const steps = await demoService.runAllSteps(selectedScenarioId);
      if (steps.length > 0) {
        const last = steps[steps.length - 1];
        setLastStepResponse(last);
        setActionMessage(`Scenario fast-forwarded: executed ${steps.length} steps in controlled sequence.`);
      }
      const detail = await demoService.getScenarioDetail(selectedScenarioId);
      setScenarioDetail(detail);
      const pf = await demoService.getPreflightCheck();
      setPreflight(pf);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Failed to fast-forward demo scenario.');
    } finally {
      setStepLoading(false);
    }
  };

  // Reset current scenario
  const handleResetScenario = async () => {
    if (!selectedScenarioId) return;
    setStepLoading(true);
    try {
      const res: DemoResetResponse = await demoService.resetScenario(selectedScenarioId);
      setActionMessage(res.message);
      setLastStepResponse(null);
      const detail = await demoService.getScenarioDetail(selectedScenarioId);
      setScenarioDetail(detail);
      const pf = await demoService.getPreflightCheck();
      setPreflight(pf);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Failed to reset scenario.');
    } finally {
      setStepLoading(false);
    }
  };

  // Global demo reset
  const handleGlobalReset = async () => {
    if (!window.confirm('Perform global demonstration reset? This resets all scenario states, circuit breakers, and telemetry triggers.')) return;
    setStepLoading(true);
    try {
      const res: DemoResetResponse = await demoService.resetAllDemoData();
      setActionMessage(res.message);
      setLastStepResponse(null);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || 'Failed to perform global demo reset.');
    } finally {
      setStepLoading(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'PRIMARY_JUDGE_DEMO':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">PRIMARY JUDGE DEMO</span>;
      case 'GOVERNANCE_DEMO':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">GOVERNANCE DEMO</span>;
      case 'ENVIRONMENTAL_DEMO':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">ENVIRONMENTAL</span>;
      case 'INTEGRATION_DEMO':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">SOVEREIGN GIS</span>;
      case 'MOBILE_OFFLINE_DEMO':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">OFFLINE FIRST</span>;
      case 'RESILIENCE_DEMO':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40">FAULT RESILIENCE</span>;
      case 'SECURITY_DEMO':
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">ZERO-TRUST RBAC</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-300">BASELINE</span>;
    }
  };

  const calculateProgressPercent = () => {
    if (!scenarioDetail || scenarioDetail.total_steps === 0) return 0;
    return Math.round((scenarioDetail.current_step_index / scenarioDetail.total_steps) * 100);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">
                    Demo & Simulation
                  </h1>
                  <span className="px-2.5 py-1 rounded text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(217,119,6,0.15)', color: '#FCD34D', border: '1px solid rgba(217,119,6,0.35)' }}>
                    DEMONSTRATION MODE
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Scripted demonstration scenarios for presenting TRINETRA capabilities. Data shown here is not live mine data.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowPlaybook(!showPlaybook)}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              {showPlaybook ? 'Hide Playbook' : 'Judging Playbook'}
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Check Readiness
            </button>
            <button
              onClick={handleGlobalReset}
              disabled={stepLoading}
              className="px-3.5 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-medium flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All Demo Data
            </button>
          </div>
        </div>

        {/* Action / Error Alerts */}
        {actionMessage && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Pre-Flight System Readiness Matrix */}
      {preflight && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Pre-Flight System Verification
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">System State:</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                preflight.overall_status === 'READY' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {preflight.overall_status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {preflight.checks.map((check, idx) => (
              <div 
                key={idx}
                className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                      {check.component}
                    </span>
                    {check.status === 'PASS' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : check.status === 'WARN' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  <div className="text-xs font-medium text-slate-200 line-clamp-1">
                    {check.name}
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 line-clamp-2">
                  {check.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Judging Playbook Quick Reference (Collapsible) */}
      {showPlaybook && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-3 text-amber-400">
            <Sparkles className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              National Judging Flow Playbook (5-Minute & 10-Minute Scripts)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
              <h4 className="font-bold text-amber-300 mb-2">Recommended 5-Minute Technical Demo Flow</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                <li><strong className="text-slate-100">00:00 - Baseline:</strong> Select <em>Normal Operations</em> to show stable telemetry & baseline risk score (~18).</li>
                <li><strong className="text-slate-100">01:00 - Gas Escalation:</strong> Switch to <em>Gas Escalation</em>; click [NEXT EVENT] to inject CH4 spike (1.88%).</li>
                <li><strong className="text-slate-100">02:00 - Predictive Risk:</strong> Show forward 30-min escalation ML probability (&gt;85%) & directional signals.</li>
                <li><strong className="text-slate-100">02:45 - 3D Digital Twin:</strong> Click [Focus in 3D] to show spatial bounding envelope in Seam 2.</li>
                <li><strong className="text-slate-100">03:30 - AI Copilot:</strong> Ask Copilot "Why is this area high risk?" and show grounded citations.</li>
                <li><strong className="text-slate-100">04:30 - Governance & Audit:</strong> Show Safety Officer verification task and SHA-256 hash-chained audit record.</li>
              </ol>
            </div>
            <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800">
              <h4 className="font-bold text-amber-300 mb-2">Extended 10-Minute Deep Dive Demonstrations</h4>
              <ul className="space-y-1.5 text-slate-300">
                <li>• <strong className="text-slate-100">Scenario 3 (Governance):</strong> DGMS Violation logging, statutory 24-hr SLA countdown & Directorate Level 2 escalation.</li>
                <li>• <strong className="text-slate-100">Scenario 5 (Sovereign GIS):</strong> Ministry of Coal CMSMS simulated report ingestion with Haversine lease buffer matching.</li>
                <li>• <strong className="text-slate-100">Scenario 6 (Field Offline):</strong> Disconnected field inspection, offline queue, GPS verification, and idempotent server replay.</li>
                <li>• <strong className="text-slate-100">Scenario 8 (Security):</strong> Cross-mine access rejection (HTTP 403) proving zero client-side bypass.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Scenario Execution Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scenario Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Scenario Catalog ({scenarios.length})
            </span>
          </div>

          <div className="space-y-2">
            {scenarios.map((sc) => {
              const isSelected = sc.scenario_id === selectedScenarioId;
              const isDone = sc.status === 'COMPLETED';
              return (
                <button
                  key={sc.scenario_id}
                  onClick={() => handleSelectScenario(sc.scenario_id)}
                  className={`w-full text-left p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                    isSelected 
                      ? 'bg-slate-800/90 border-amber-500/60 shadow-lg shadow-amber-500/5' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-slate-100">
                      {sc.name}
                    </div>
                    {getCategoryBadge(sc.category)}
                  </div>
                  
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {sc.description}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                    <span className="text-slate-500 font-mono text-[11px]">
                      Mine {sc.target_mine_id} {sc.target_zone_id ? `• ${sc.target_zone_id}` : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        {sc.current_step_index}/{sc.total_steps} Steps
                      </span>
                      {isDone ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      ) : isSelected && sc.current_step_index > 0 ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Scenario Control Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {scenarioDetail ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="text-lg font-bold text-white">
                      {scenarioDetail.name}
                    </h3>
                    {getCategoryBadge(scenarioDetail.category)}
                  </div>
                  <p className="text-xs text-slate-400">
                    {scenarioDetail.description}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleResetScenario}
                    disabled={stepLoading}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                    title="Reset this scenario to step 0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                  <button
                    onClick={handleRunAllSteps}
                    disabled={stepLoading || scenarioDetail.status === 'COMPLETED'}
                    className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    Run All
                  </button>
                  <button
                    onClick={handleExecuteNextStep}
                    disabled={stepLoading || scenarioDetail.status === 'COMPLETED'}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <Play className={`w-4 h-4 fill-current ${stepLoading ? 'animate-spin' : ''}`} />
                    {scenarioDetail.status === 'COMPLETED' ? 'Completed' : 'Next Event'}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Scenario Progression ({scenarioDetail.current_step_index} of {scenarioDetail.total_steps} steps)
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {calculateProgressPercent()}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${calculateProgressPercent()}%` }}
                  ></div>
                </div>
              </div>

              {/* Step-by-Step Interactive Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Deterministic Event Timeline
                </h4>
                <div className="space-y-2.5">
                  {scenarioDetail.steps.map((st, idx) => {
                    const isPassed = idx < scenarioDetail.current_step_index;
                    const isCurrent = idx === scenarioDetail.current_step_index;

                    return (
                      <div
                        key={st.step_id}
                        className={`p-4 rounded-xl border transition ${
                          isPassed
                            ? 'bg-slate-950/60 border-emerald-500/40 text-slate-300'
                            : isCurrent
                            ? 'bg-amber-500/10 border-amber-500/60 text-slate-100 shadow-md shadow-amber-500/5'
                            : 'bg-slate-950/30 border-slate-800/80 text-slate-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                              isPassed 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                                : isCurrent
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-500'
                            }`}>
                              {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : st.step_id}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-200">
                                  {st.title}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                                  {st.system_component}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {st.description}
                              </p>
                              <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                                <span className="text-slate-500">Expected:</span>
                                <span>{st.expected_state}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {isPassed ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                EXECUTED ✓
                              </span>
                            ) : isCurrent ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                READY ▶
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-500">
                                PENDING
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Output & Evidence Payload Viewer */}
              {lastStepResponse && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                        Live Event Output: {lastStepResponse.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Run: {lastStepResponse.run_id}
                    </span>
                  </div>

                  <pre className="p-3 bg-slate-900/90 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800/80 max-h-48">
                    {JSON.stringify(lastStepResponse.state_updates, null, 2)}
                  </pre>
                </div>
              )}

              {/* Key Takeaway & Deep Linking Action Bar */}
              <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-300 space-y-1">
                  <div>
                    <strong className="text-amber-300">Judge Takeaway:</strong> {scenarioDetail.key_takeaway}
                  </div>
                  <div className="text-slate-400">
                    <strong className="text-slate-400">Statutory Boundary:</strong> {scenarioDetail.governance_boundary}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="#/digital-twin"
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    3D Twin
                  </a>
                  <a
                    href="#/governance"
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Governance
                  </a>
                  <a
                    href="#/integrations"
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                    Audit Ledger
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
              Select a scenario from the catalog to load its control timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoControlCenterPage;
