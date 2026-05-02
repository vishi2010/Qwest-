import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { UserOut } from '@/lib/types';
import { fetchMe, login as apiLogin } from '@/lib/api';

type AuthState = {
  token: string | null;
  user: UserOut | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const TOKEN_KEY = 'kwest_token';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          try {
            const me = await fetchMe(stored);
            setUser(me);
          } catch {
            await AsyncStorage.removeItem(TOKEN_KEY);
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const me = await fetchMe(token);
    setUser(me);
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiLogin(username, password);
    await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    const me = await fetchMe(data.access_token);
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ token, user, loading, login, logout, refreshUser }),
    [token, user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

