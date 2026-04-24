import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar: string | null;
  preferences: {
    theme: 'dark' | 'light' | 'system';
    accentColor: string;
    searchProvider: 'ddg' | 'google';
    aiEnabled: boolean;
  };
  favoriteGames: string[];
  lastLogin: string | null;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (prefs: Partial<User['preferences']>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },
      updatePreferences: (prefs) => {
        const current = get().user;
        if (current) set({ user: { ...current, preferences: { ...current.preferences, ...prefs } } });
      },
    }),
    {
      name: 'nebula-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const authApi = {
  register: async (data: { username: string; email: string; password: string }) => {
    const res = await fetch(`${API}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  login: async (data: { identifier: string; password: string }) => {
    const res = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  },
  me: async (token: string) => {
    const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },
  logout: async (token: string) => {
    await fetch(`${API}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  },
  updatePreferences: async (token: string, prefs: object) => {
    const res = await fetch(`${API}/api/auth/preferences`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(prefs) });
    return res.json();
  },
  claimAdminKey: async (token: string, key: string) => {
    const res = await fetch(`${API}/api/admin/claim-key`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ key }) });
    return res.json();
  },
};
