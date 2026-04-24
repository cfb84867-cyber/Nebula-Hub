'use client';
import {
  Home, Search, Gamepad2, AppWindow, Bot, ShieldCheck,
  ChevronLeft, ChevronRight, Zap, Settings
} from 'lucide-react';
import { useTabStore } from '@/store/tabStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

const NAV_ITEMS = [
  { id: 'home',    label: 'Home',      icon: Home,       type: 'home'   as const },
  { id: 'search',  label: 'Search',    icon: Search,     type: 'search' as const },
  { id: 'games',   label: 'Games',     icon: Gamepad2,   type: 'game'   as const },
  { id: 'apps',    label: 'Apps',      icon: AppWindow,  type: 'app'    as const },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, toggleAiPanel } = useUIStore();
  const { openTab, switchTab, tabs, activeTabId } = useTabStore();
  const { user } = useAuthStore();

  const navigate = (type: string, label: string, icon: string) => {
    const existing = tabs.find((t) => t.type === type && t.id === type);
    if (type === 'home') { switchTab('home'); return; }
    const found = tabs.find((t) => t.type === type);
    if (found) { switchTab(found.id); return; }
    openTab({ title: label, type: type as any, icon });
  };

  const isActive = (type: string) => {
    const active = tabs.find((t) => t.id === activeTabId);
    if (type === 'home') return activeTabId === 'home';
    return active?.type === type;
  };

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border-color)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
          <Zap size={16} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-[1rem] gradient-text tracking-tight">Nebula Hub</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon, type }) => (
          <button
            key={id}
            id={`nav-${id}`}
            className={`sidebar-item w-full text-left ${isActive(type) ? 'active' : ''}`}
            onClick={() => navigate(type, label, '')}
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0 sidebar-icon" />
            {!sidebarCollapsed && <span>{label}</span>}
          </button>
        ))}

        <div className="divider mx-4 my-2" />

        {/* AI Assistant */}
        <button
          id="nav-ai"
          className="sidebar-item w-full text-left"
          onClick={toggleAiPanel}
          title={sidebarCollapsed ? 'AI Assistant' : undefined}
        >
          <Bot size={18} className="flex-shrink-0 sidebar-icon" />
          {!sidebarCollapsed && <span>AI Assistant</span>}
        </button>

        {/* Admin — only for admins */}
        {user?.role === 'admin' && (
          <button
            id="nav-admin"
            className={`sidebar-item w-full text-left ${isActive('admin' as any) ? 'active' : ''}`}
            onClick={() => openTab({ title: 'Admin Panel', type: 'app' as any, data: { appId: 'admin' } })}
            title={sidebarCollapsed ? 'Admin Panel' : undefined}
          >
            <ShieldCheck size={18} className="flex-shrink-0 sidebar-icon text-violet-400" />
            {!sidebarCollapsed && <span className="text-violet-400">Admin Panel</span>}
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border-color)] p-2">
        {user && !sidebarCollapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{user.username}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{user.role}</p>
            </div>
            <button 
              className="p-1.5 hover:bg-white/10 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              onClick={() => openTab({ title: 'Settings', type: 'app', icon: '⚙️', data: { appId: 'settings' } })}
              title="Settings"
            >
              <Settings size={14} />
            </button>
          </div>
        )}
        <button
          className="sidebar-item w-full justify-center"
          onClick={toggleSidebar}
          title="Toggle Sidebar (Ctrl+\\)"
        >
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Settings size={18} className="sidebar-icon opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); openTab({ title: 'Settings', type: 'app', icon: '⚙️', data: { appId: 'settings' } }); }} />
              <ChevronRight size={16} />
            </div>
          ) : <ChevronLeft size={16} />}
          {!sidebarCollapsed && <span className="text-xs text-[var(--text-muted)]">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
