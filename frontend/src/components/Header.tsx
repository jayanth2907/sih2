import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useMineContext } from '../context/MineContext';
import { useLanguage } from '../context/LanguageContext';
import { MineSelector } from './MineSelector';
import { Shield, Bell, LogOut, Radio, BrainCircuit, Activity, CheckCircle2 } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { setCurrentTab } = useMineContext();
  const { language, setLanguage } = useLanguage();

  return (
    <header className="h-16 bg-[#0D100F]/95 border-b border-[#1B211E] backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Left: Active Mine Switcher & Operational Status */}
      <div className="flex items-center gap-4">
        <MineSelector />
        
        {/* System Health Pill (Clickable) */}
        <button
          onClick={() => setCurrentTab('integrations-health')}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-[#121614] border border-[#1B211E] hover:border-emerald-500/40 text-[11px] text-slate-300 font-mono transition-colors cursor-pointer"
          title="Inspect Government Integrations & System Health"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/60 animate-pulse" />
          <span className="font-semibold text-emerald-400">SYSTEM: OPERATIONAL</span>
        </button>

        {/* Telemetry Ingestion Mode */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-[#121614] border border-[#1B211E] text-[11px] text-slate-400 font-mono">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>TELEMETRY: <span className="text-amber-300 font-medium">SIMULATED / SCENARIO READY</span></span>
        </div>
      </div>

      {/* Right: Language Switcher, Copilot Trigger, User Profile & Actions */}
      <div className="flex items-center gap-3">
        {/* Multilingual Selector */}
        <div className="flex items-center bg-[#121614] rounded-md p-0.5 border border-[#1B211E] text-[11px] font-mono">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded transition-all cursor-pointer ${
              language === 'en' ? 'bg-amber-500 text-[#080A09] font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="English"
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-2 py-1 rounded transition-all cursor-pointer ${
              language === 'hi' ? 'bg-amber-500 text-[#080A09] font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="हिन्दी (Hindi)"
          >
            हिन्दी
          </button>
          <button
            onClick={() => setLanguage('te')}
            className={`px-2 py-1 rounded transition-all cursor-pointer ${
              language === 'te' ? 'bg-amber-500 text-[#080A09] font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="తెలుగు (Telugu)"
          >
            తెలుగు
          </button>
        </div>

        {/* AI Copilot Quick Trigger */}
        <button
          onClick={() => setCurrentTab('copilot')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
          title="Open AI Governance Copilot"
        >
          <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">AI COPILOT</span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#1B211E]">
          <div className="w-8 h-8 rounded bg-[#171B18] border border-[#232A26] flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
            {user?.full_name ? user.full_name.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.full_name || 'Authorized User'}</p>
            <p className="text-[9.5px] text-amber-400 font-mono uppercase">
              {user?.roles?.[0]?.replace(/_/g, ' ') || 'SYSTEM OPERATOR'}
            </p>
          </div>
        </div>

        {/* Logout Action */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 rounded bg-[#121614] hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-[#1B211E] hover:border-rose-900/60 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
