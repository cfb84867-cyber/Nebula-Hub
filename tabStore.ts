import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TabType = 'home' | 'search' | 'game' | 'app' | 'browser';

export interface Tab {
  id: string;
  title: string;
  type: TabType;
  icon?: string;
  data?: Record<string, unknown>;
  isLoading?: boolean;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Omit<Tab, 'id'>) => string;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  renameTab: (id: string, title: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  closeAllTabs: () => void;
  getActiveTab: () => Tab | null;
}

const genId = () => `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const HOME_TAB: Tab = { id: 'home', title: 'Home', type: 'home', icon: '🏠' };

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [HOME_TAB],
      activeTabId: 'home',

      openTab: (tab) => {
        const id = genId();
        const newTab: Tab = { ...tab, id };
        set((s) => ({ tabs: [...s.tabs, newTab], activeTabId: id }));
        return id;
      },

      closeTab: (id) => {
        if (id === 'home') return; // Home tab cannot be closed
        const { tabs, activeTabId } = get();
        const idx = tabs.findIndex((t) => t.id === id);
        const remaining = tabs.filter((t) => t.id !== id);

        let nextActive = activeTabId;
        if (activeTabId === id) {
          nextActive = remaining[Math.min(idx, remaining.length - 1)]?.id ?? 'home';
        }
        set({ tabs: remaining, activeTabId: nextActive });
      },

      switchTab: (id) => set({ activeTabId: id }),

      renameTab: (id, title) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, title } : t)) })),

      updateTab: (id, updates) =>
        set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

      reorderTabs: (fromIndex, toIndex) => {
        const tabs = [...get().tabs];
        const [moved] = tabs.splice(fromIndex, 1);
        tabs.splice(toIndex, 0, moved);
        set({ tabs });
      },

      closeAllTabs: () => set({ tabs: [HOME_TAB], activeTabId: 'home' }),

      getActiveTab: () => {
        const { tabs, activeTabId } = get();
        return tabs.find((t) => t.id === activeTabId) ?? null;
      },
    }),
    {
      name: 'nebula-tabs',
      partialize: (state) => ({ tabs: state.tabs, activeTabId: state.activeTabId }),
    }
  )
);
