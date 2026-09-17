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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
          <span>INITIALIZING TRINETRA GOVERNANCE CORE...</span>
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

