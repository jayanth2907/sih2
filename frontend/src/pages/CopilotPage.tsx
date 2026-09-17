import React, { useState, useEffect, useRef } from 'react';
import { useMineContext } from '../context/MineContext';
import { useLanguage } from '../context/LanguageContext';
import { copilotService } from '../services';
import { CopilotQueryResponse, CopilotQuickPrompt } from '../types';
import { 
  BrainCircuit, 
  Send, 
  Sparkles, 
  Layers3, 
  ShieldAlert, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  HelpCircle,
  Activity,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  Shield
} from 'lucide-react';
import clsx from 'clsx';

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text?: string;
  response?: CopilotQueryResponse;
  timestamp: string;
}

export const CopilotPage: React.FC = () => {
  const { selectedMine, setCurrentTab, setFocusedTarget } = useMineContext();
  const { language, t } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<CopilotQuickPrompt[]>([]);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'risk' | 'compliance'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load quick prompts on mount
  useEffect(() => {
    copilotService.getQuickPrompts()
      .then((data) => setQuickPrompts(data))
      .catch((err) => console.error('Failed to load quick prompts:', err));
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial welcome message
  useEffect(() => {
    if (selectedMine && messages.length === 0) {
      const welcomeText = language === 'hi' 
        ? `नमस्ते। मैं त्रिनेत्र AI गवर्नेंस कोपायलट हूँ। ${selectedMine.name} के अधिकृत डेटाबेस के संबंध में कोई भी सुरक्षा, अनुपालन अथवा जोखिम पूर्वानुमान संबंधी प्रश्न पूछें।`
        : language === 'te'
        ? `నమస్కారం. నేను త్రినేత్ర AI గవర్నెన్స్ కోపైలట్. ${selectedMine.name} కొరకు భద్రత, నియంత్రణ నిబంధనలు లేదా ప్రమాద అంచనాలపై ప్రశ్నలను అడగండి.`
        : `Welcome to TRINETRA AI Governance Copilot. I can assist you with evidence-grounded queries regarding real-time sensors, 30-minute predictive risk, DGMS violations, and statutory approvals for ${selectedMine.name}.`;

      setMessages([
        {
          id: 'welcome',
          sender: 'copilot',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [selectedMine?.id, language]);

  const handleSendQuery = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || !selectedMine || isLoading) return;

    const userMsgId = `user_${Date.now()}`;
    const newMessages: Message[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res: CopilotQueryResponse = await copilotService.query({
        mine_id: selectedMine.id,
        query: q,
        language: language
      });

      setMessages([
        ...newMessages,
        {
          id: `copilot_${Date.now()}`,
          sender: 'copilot',
          response: res,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: `err_${Date.now()}`,
          sender: 'copilot',
          text: err.response?.data?.detail || 'Copilot service is temporarily unavailable. Please verify mine authorization and connectivity.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: any) => {
    if (action.action_type === 'FOCUS_3D_ZONE') {
      const payload = action.payload || {};
      setFocusedTarget({
        x: payload.x ?? 0,
        y: payload.y ?? 200,
        z: payload.z ?? -180,
        distance: payload.distance ?? 65,
        title: payload.title || 'Predicted Risk Hotspot',
        type: 'zone',
        id: payload.zone_code
      });
      setCurrentTab('digital-twin');
    } else if (action.action_type === 'NAVIGATE_TAB') {
      const targetTab = action.payload?.tab || 'dashboard';
      setCurrentTab(targetTab);
    }
  };

  const getPromptText = (p: CopilotQuickPrompt) => {
    if (language === 'hi') return p.prompt_hi;
    if (language === 'te') return p.prompt_te;
    return p.prompt_en;
  };

  if (!selectedMine) return null;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <BrainCircuit className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide uppercase">
                {t('aiCopilot')}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400">
                Grounding Engine v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Evidence-grounded mining governance intelligence for <span className="text-amber-400 font-semibold">{selectedMine.name}</span> ({selectedMine.code})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>RBAC & Mine Isolation Active</span>
          </div>
          <button
            onClick={() => setMessages([])}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
            title={t('clearChat')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Prompts Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {t('quickActions')}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {quickPrompts.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSendQuery(getPromptText(p))}
              disabled={isLoading}
              className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/90 hover:border-amber-500/40 text-xs text-slate-300 transition-all flex items-start gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="truncate">
                <span className="text-[10px] font-mono text-amber-400/80 block uppercase tracking-wider">{p.category}</span>
                <span className="font-medium text-slate-200 line-clamp-1">{getPromptText(p)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="h-[520px] rounded-2xl bg-slate-950 border border-slate-800 p-4 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              'flex flex-col',
              msg.sender === 'user' ? 'items-end' : 'items-start'
            )}
          >
            {/* Sender Label & Timestamp */}
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {msg.sender === 'user' ? 'Mine Officer' : 'TRINETRA AI'}
              </span>
              <span className="text-[9px] font-mono text-slate-400">{msg.timestamp}</span>
            </div>

            {/* Message Bubble / Card */}
            {msg.sender === 'user' ? (
              <div className="max-w-xl p-3.5 rounded-2xl rounded-tr-none bg-amber-500/10 border border-amber-500/30 text-slate-100 text-sm font-medium shadow-md">
                {msg.text}
              </div>
            ) : (
              <div className="max-w-3xl w-full p-4 rounded-2xl rounded-tl-none bg-slate-900/90 border border-slate-800 text-slate-200 text-sm space-y-3.5 shadow-xl">
                {/* Fallback Simple Text (Welcome or Error) */}
                {msg.text && (
                  <p className="text-slate-200 leading-relaxed">{msg.text}</p>
                )}

                {/* Structured Evidence-Grounded Response */}
                {msg.response && (
                  <div className="space-y-4">
                    {/* Executive Summary */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-medium text-slate-100 leading-relaxed">
                      {msg.response.summary}
                    </div>

                    {/* Dual Risk Status Banner if present */}
                    {msg.response.predictive_signal && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t('currentRisk')}</span>
                          <span className="text-base font-bold text-amber-400 mt-0.5 block">
                            {msg.response.predictive_signal.current_risk_score.toFixed(1)} / 100
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t('predictedRisk')}</span>
                          <span className="text-base font-bold text-rose-400 mt-0.5 block">
                            {msg.response.predictive_signal.predicted_risk_score.toFixed(1)} / 100
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t('horizon')}</span>
                          <span className="text-xs font-bold text-cyan-400 mt-1 block">
                            {msg.response.predictive_signal.horizon}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{t('probability')}</span>
                          <span className="text-xs font-bold text-emerald-400 mt-1 block">
                            {(msg.response.predictive_signal.probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Grounding Evidence Bullets */}
                    {msg.response.evidence.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {t('evidenceSignals')} ({msg.response.evidence.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.response.evidence.map((ev, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-400">{ev.title}</span>
                                <span className={clsx(
                                  'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold',
                                  ev.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                                  ev.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-cyan-500/20 text-cyan-400'
                                )}>
                                  {ev.status_or_value}
                                </span>
                              </div>
                              <p className="text-slate-400 text-[11px] leading-snug">{ev.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Action Box */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                          {t('recommendedAction')}
                        </span>
                        <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                          {msg.response.recommended_next_step}
                        </p>
                      </div>
                    </div>

                    {/* Action Deep-Link Buttons */}
                    {msg.response.actions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {msg.response.actions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(act)}
                            className={clsx(
                              'px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md',
                              act.action_type === 'FOCUS_3D_ZONE'
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                            )}
                          >
                            {act.action_type === 'FOCUS_3D_ZONE' ? (
                              <Layers3 className="w-3.5 h-3.5" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Provenance & Provider Transparency Footer */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 gap-2">
                      <span className="text-slate-400">
                        {msg.response.data_provenance}
                      </span>
                      <span className="text-amber-400/80">
                        Engine: {msg.response.provider_used} • Coverage: {msg.response.data_coverage}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
            <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>Analyzing authorized telemetry, anomalies & statutory records...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery();
        }}
        className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-amber-500/50 shadow-xl transition-all"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={t('askCopilotPlaceholder')}
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
        >
          <span>{t('sendQuery')}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
