import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@trinetra.gov.in');
  const [password, setPassword] = useState('Trinetra@2026');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogins = [
    { role: 'System Admin', email: 'admin@trinetra.gov.in', desc: 'Cross-mine governance' },
    { role: 'Mine 1 Manager (BDS-04)', email: 'manager.mine1@trinetra.gov.in', desc: 'Bharat Deep Shaft 4' },
    { role: 'Mine 1 Safety Officer', email: 'safety.mine1@trinetra.gov.in', desc: 'Safety Compliance BDS-04' },
    { role: 'Mine 2 Manager (SOB-02)', email: 'manager.mine2@trinetra.gov.in', desc: 'Singrauli OpenCast' },
    { role: 'Field Inspector (DGMS)', email: 'inspector.dgms@trinetra.gov.in', desc: 'Statutory Inspections' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 shadow-xl shadow-amber-500/20 mb-4">
          <span className="font-mono font-black text-slate-950 text-2xl">त्रिन</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white uppercase">TRINETRA</h2>
        <p className="mt-2 text-xs text-amber-400 font-mono tracking-wider uppercase">
          AI-Based Smart Governance & Compliance Monitoring System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-900/90 py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10 backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  placeholder="name@trinetra.gov.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Quick Role Switch (Demo Credentials)
            </p>
            <div className="space-y-1.5">
              {quickLogins.map((q) => (
                <button
                  key={q.email}
                  type="button"
                  onClick={() => {
                    setEmail(q.email);
                    setPassword('Trinetra@2026');
                  }}
                  className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center justify-between group"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                      {q.role}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">{q.desc}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    Use
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
