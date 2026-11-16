import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthResponse, TenantDTO, UserDTO } from '@growlocal/shared';
import { apiFetch } from '../api/client';

interface AuthContextValue {
  user: UserDTO | null;
  tenant: TenantDTO | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gl_token'));
  const [user, setUser] = useState<UserDTO | null>(null);
  const [tenant, setTenant] = useState<TenantDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch<{ user: UserDTO; tenant?: TenantDTO }>('/api/auth/me', {}, token)
      .then((res) => {
        setUser(res.user);
        if (res.tenant) setTenant(res.tenant);
      })
      .catch(() => {
        localStorage.removeItem('gl_token');
        setToken(null);
        setUser(null);
        setTenant(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('gl_token', res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.tenant) setTenant(res.tenant);
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    phone?: string
  ) => {
    const res = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, phone }),
    });
    localStorage.setItem('gl_token', res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.tenant) setTenant(res.tenant);
  };

  const logout = () => {
    localStorage.removeItem('gl_token');
    setToken(null);
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
