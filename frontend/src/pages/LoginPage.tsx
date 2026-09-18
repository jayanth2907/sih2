import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, LogIn } from 'lucide-react';

const QUICK_LOGINS = [
  { role: 'System Administrator', email: 'admin@trinetra.gov.in', desc: 'Full governance access' },
  { role: 'Mine Manager', email: 'manager.mine1@trinetra.gov.in', desc: 'Bharat Deep Shaft 4' },
  { role: 'Safety Officer', email: 'safety.mine1@trinetra.gov.in', desc: 'Mine BDS-04' },
  { role: 'Mine Manager (2)', email: 'manager.mine2@trinetra.gov.in', desc: 'Singrauli OpenCast' },
  { role: 'Field Inspector', email: 'inspector.dgms@trinetra.gov.in', desc: 'Statutory inspections' },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail]       = useState('admin@trinetra.gov.in');
  const [password, setPassword] = useState('Trinetra@2026');
  const [error, setError]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-80 xl:w-96 p-10 flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-base)',
        }}
      >
        {/* Logo */}
        <div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-8"
            style={{ background: 'linear-gradient(135deg, #B45309, #D97706)' }}
            aria-hidden="true"
          >
            <span className="font-bold text-[#0A0F0D] text-lg leading-none">त्रि</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-2">
            TRINETRA
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            AI-Based Smart Governance & Compliance Monitoring Platform for Indian Coal Mines
          </p>
        </div>

        {/* Feature highlights */}
        <div className="space-y-4">
          {[
            ['Real-time safety monitoring', 'Environmental sensor readings, alerts, and incident management across all zones.'],
            ['Statutory compliance', 'DGMS compliance tracking, corrective actions, and approval workflows.'],
            ['Risk intelligence', 'Predictive risk analysis powered by AI models trained on mine safety data.'],
          ].map(([title, desc]) => (
            <div key={title}>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{title}</p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs text-[var(--text-muted)]">
            Ministry of Coal, Government of India<br />
            Authorised use only
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #B45309, #D97706)' }}
              aria-hidden="true"
            >
              <span className="font-bold text-[#0A0F0D] text-lg">त्रि</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">TRINETRA</h1>
          </div>

          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
            Sign in
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            Use your authorised government credentials to access the platform.
          </p>

          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg mb-5 text-sm"
              style={{
                backgroundColor: 'var(--color-critical-bg)',
                border: '1px solid var(--color-critical-border)',
                color: 'var(--color-critical-text)',
              }}
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="form-label">Official email</label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@trinetra.gov.in"
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full justify-center"
              style={{ padding: '0.625rem 1rem' }}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0A0F0D', borderTopColor: 'transparent' }} aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  Sign in
                </>
              )}
            </button>
          </form>

          {/* Quick login */}
          <div className="mt-8">
            <p
              className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3"
              style={{ borderTop: '1px solid var(--border-base)', paddingTop: '1.5rem' }}
            >
              Demo accounts
            </p>
            <div className="space-y-1.5">
              {QUICK_LOGINS.map(({ role, email: e, desc }) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setEmail(e); setPassword('Trinetra@2026'); }}
                  className="w-full text-left px-3 py-2 rounded-md transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-base)' }}
                >
                  <span className="block text-sm font-medium text-[var(--text-primary)]">{role}</span>
                  <span className="block text-xs text-[var(--text-muted)]">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
