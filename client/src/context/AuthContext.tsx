import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from '../api/backend';
import type { User } from '../types';

interface AuthCtx {
  user:     User | null;
  token:    string | null;
  loading:  boolean;
  login:    (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout:   () => Promise<void>;
  setTokenFromOAuth: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(() => localStorage.getItem('ov_token'));
  const [loading, setLoading] = useState(true);

  // On mount — restore session from stored token
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getMe()
      .then(setUser)
      .catch(() => { localStorage.removeItem('ov_token'); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  const saveToken = (t: string) => {
    localStorage.setItem('ov_token', t);
    setToken(t);
  };

  const login = async (email: string, password: string) => {
    const { token: t, user: u } = await apiLogin({ email, password });
    saveToken(t);
    setUser(u);
  };

  const register = async (username: string, email: string, password: string) => {
    const { token: t, user: u } = await apiRegister({ username, email, password });
    saveToken(t);
    setUser(u);
  };

  const logout = async () => {
    await apiLogout().catch(() => {});
    localStorage.removeItem('ov_token');
    setToken(null);
    setUser(null);
  };

  const setTokenFromOAuth = async (t: string) => {
    saveToken(t);
    const u = await getMe();
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setTokenFromOAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
