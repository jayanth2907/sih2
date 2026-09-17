import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleType } from '../types';
import { authService } from '../services';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: RoleType | RoleType[]) => boolean;
  isSystemAdmin: boolean;
  isMineManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authService.getStoredUser());
  const [token, setToken] = useState<string | null>(authService.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authService.getToken();
      if (storedToken) {
        try {
          const profile = await authService.getCurrentUser();
          setUser(profile);
          setToken(storedToken);
        } catch {
          authService.logout();
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const authData = await authService.login(email, pass);
    setUser(authData.user);
    setToken(authData.access_token);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const hasRole = (roleOrRoles: RoleType | RoleType[]): boolean => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('SYSTEM_ADMIN')) return true;
    const required = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    return required.some((r) => user.roles.includes(r));
  };

  const isSystemAdmin = !!user?.roles?.includes('SYSTEM_ADMIN');
  const isMineManager = !!user?.roles?.includes('MINE_MANAGER');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasRole,
        isSystemAdmin,
        isMineManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
