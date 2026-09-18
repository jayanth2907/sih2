import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useMineContext } from '../context/MineContext';
import { useLanguage } from '../context/LanguageContext';
import { MineSelector } from './MineSelector';
import { LogOut, Globe } from 'lucide-react';

/** Converts role enum to a human-readable display string */
function formatRole(role: string): string {
  const map: Record<string, string> = {
    SYSTEM_ADMIN:      'System Administrator',
    MINE_MANAGER:      'Mine Manager',
    MINE_SAFETY_OFFICER: 'Safety Officer',
    FIELD_INSPECTOR:   'Field Inspector',
    CONTRACTOR_MANAGER: 'Contractor Manager',
    REGULATOR:         'Regulator',
  };
  return map[role] ?? role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const displayRole = user?.roles?.[0] ? formatRole(user.roles[0]) : 'Authorised User';
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-5 gap-4"
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-base)',
        backdropFilter: 'blur(12px)',
      }}
      role="banner"
    >
      {/* Left — Mine selector */}
      <div className="flex items-center gap-3 min-w-0">
        <MineSelector />
      </div>

      {/* Right — Language, user info, logout */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Language selector */}
        <div
          className="hidden sm:flex items-center rounded overflow-hidden border"
          style={{ borderColor: 'var(--border-base)', backgroundColor: 'var(--bg-raised)' }}
          role="group"
          aria-label="Language selection"
        >
          {(['en', 'hi', 'te'] as const).map((lang) => {
            const LABELS: Record<string, string> = { en: 'EN', hi: 'हि', te: 'తె' };
            const TITLES: Record<string, string> = { en: 'English', hi: 'हिन्दी', te: 'తెలుగు' };
            const isActive = language === lang;
            return (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                title={TITLES[lang]}
                aria-pressed={isActive}
                className="px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: isActive ? 'var(--brand-primary)' : 'transparent',
                  color: isActive ? '#0A0F0D' : 'var(--text-muted)',
                }}
              >
                {LABELS[lang]}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6" style={{ backgroundColor: 'var(--border-base)' }} />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--brand-primary)',
              border: '1.5px solid var(--border-muted)',
            }}
            aria-hidden="true"
          >
            {initials}
          </div>
          {/* Name + role */}
          <div className="hidden md:block text-left leading-tight">
            <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">
              {user?.full_name || 'Authorised User'}
            </p>
            <p className="text-xs text-[var(--text-muted)] leading-tight mt-0.5">
              {displayRole}
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className="btn btn-ghost btn-sm p-2"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
