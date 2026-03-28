import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { User, AuthState, LoginPayload, RegisterPayload } from '../types';

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('vi_notes_token');
    const userStr = localStorage.getItem('vi_notes_user');
    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        setState({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('vi_notes_token', data.token);
    localStorage.setItem('vi_notes_user', JSON.stringify(data.user));
    setState({
      user: data.user,
      token: data.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('vi_notes_token', data.token);
    localStorage.setItem('vi_notes_user', JSON.stringify(data.user));
    setState({
      user: data.user,
      token: data.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vi_notes_token');
    localStorage.removeItem('vi_notes_user');
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
