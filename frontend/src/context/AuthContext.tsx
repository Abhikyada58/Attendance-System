'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('attendx_token');
      // Try to restore user from cached localStorage first (instant)
      const cachedUser = localStorage.getItem('attendx_user');
      if (cachedUser) {
        try { setUser(JSON.parse(cachedUser)); } catch {}
      }

      if (token) {
        try {
          // Verify token in background without blocking UI
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const freshUser = data.data?.user || data.data;
            setUser(freshUser);
            localStorage.setItem('attendx_user', JSON.stringify(freshUser));
          } else {
            localStorage.removeItem('attendx_token');
            localStorage.removeItem('attendx_user');
            setUser(null);
          }
        } catch {
          // Network error — keep cached user so app still works
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback((token: string, userData: User) => {
    localStorage.setItem('attendx_token', token);
    localStorage.setItem('attendx_user', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('attendx_token');
    localStorage.removeItem('attendx_user');
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
