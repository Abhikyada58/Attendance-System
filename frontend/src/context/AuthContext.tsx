'use client';

/**
 * Authentication State Context
 * 
 * WHY THIS EXISTS:
 * The frontend needs to know if a user is logged in (to show/hide dashboards) and
 * needs their profile data. This Context wraps the entire app, allowing any component
 * to call `useAuth()` and instantly get the current user, or login/logout functions.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // On mount, check if there's a token and fetch the profile
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('attendx_token');
      if (token) {
        try {
          // Fetch fresh profile from /me endpoint
          const data = await api('/auth/me');
          setUser(data.user);
        } catch (error) {
          console.error('Invalid token or session expired', error);
          localStorage.removeItem('attendx_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('attendx_token', token);
    setUser(userData);
    router.push('/dashboard'); // Assuming dashboard will be created in future modules
  };

  const logout = () => {
    localStorage.removeItem('attendx_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
