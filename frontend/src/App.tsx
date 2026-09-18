import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MineProvider } from './context/MineContext';
import { LanguageProvider } from './context/LanguageContext';
import { LoginPage } from './pages/LoginPage';
import { AppLayout } from './layouts/AppLayout';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-base)' }}
        role="status"
        aria-label="Starting TRINETRA"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Logo mark */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #B45309, #D97706)' }}
            aria-hidden="true"
          >
            <span className="font-bold text-[#0A0F0D] text-lg leading-none">त्रि</span>
          </div>
          {/* Spinner */}
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}
            aria-hidden="true"
          />
          <p className="text-sm text-[var(--text-muted)]">Starting TRINETRA…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <MineProvider>
      <AppLayout />
    </MineProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
