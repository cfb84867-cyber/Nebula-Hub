import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  aiPanelOpen: boolean;
  theme: 'dark' | 'light';
  accentColor: string;
  notificationCount: number;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setAiPanelOpen: (v: boolean) => void;
  toggleAiPanel: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setAccentColor: (c: string) => void;
  setNotificationCount: (n: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      aiPanelOpen: false,
      theme: 'dark',
      accentColor: '#8b5cf6',
      notificationCount: 0,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setAiPanelOpen: (v) => set({ aiPanelOpen: v }),
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        document.documentElement.classList.toggle('light', next === 'light');
        set({ theme: next });
      },
      setAccentColor: (accentColor) => set({ accentColor }),
      setNotificationCount: (notificationCount) => set({ notificationCount }),
    }),
    {
      name: 'nebula-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, theme: s.theme, accentColor: s.accentColor }),
    }
  )
);
