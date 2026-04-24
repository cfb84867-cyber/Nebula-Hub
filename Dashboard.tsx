'use client';
import { useState } from 'react';
import { Gamepad2, AppWindow, Search, Bot, Zap, Clock, Star, ChevronRight } from 'lucide-react';
import { useTabStore } from '@/store/tabStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import SearchBar from './SearchBar';

const QUICK_APPS = [
  { id: 'notes',      name: 'Notes',      icon: '📝', color: '#f59e0b' },
  { id: 'calculator', name: 'Calculator', icon: '🧮', color: '#3b82f6' },
  { id: 'todo',       name: 'To-Do',      icon: '✅', color: '#10b981' },
];

const TIPS = [
  'Press Ctrl+T to open a new tab',
  'Press Ctrl+K to focus the search bar',
  'Double-click a tab to rename it',
  'Drag tabs to reorder them',
  'Press Ctrl+W to close the current tab',
  'Press Ctrl+\\ to collapse the sidebar',
  'Press Ctrl+Shift+A to toggle the AI panel',
];

export default function Dashboard() {
  const { openTab } = useTabStore();
  const { toggleAiPanel } = useUIStore();
  const { user } = useAuthStore();
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* Hero */}
        <div className="text-center space-y-3 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-glow-md mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">
            {user ? `${greeting()}, ${user.username}!` : 'Welcome to Nebula Hub'}
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            {user ? 'What would you like to do today?' : 'Your browser-based productivity and entertainment platform.'}
          </p>
        </div>

        {/* Search */}
        <div className="animate-slide-up" style={{ animationDelay: '80ms' }}>
          <SearchBar />
        </div>

        {/* Quick actions */}
        <div className="animate-slide-up" style={{ animationDelay: '120ms' }}>
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button id="quick-search" className="glass glass-hover p-4 rounded-xl flex flex-col items-center gap-2 text-center" onClick={() => openTab({ title: 'Search', type: 'search', data: { query: '', provider: 'ddg' } })}>
              <Search size={22} className="text-violet-400" />
              <span className="text-xs font-medium">Search Web</span>
            </button>
            <button id="quick-games" className="glass glass-hover p-4 rounded-xl flex flex-col items-center gap-2 text-center" onClick={() => openTab({ title: 'Game Hub', type: 'game', icon: '🎮' })}>
              <Gamepad2 size={22} className="text-blue-400" />
              <span className="text-xs font-medium">Game Hub</span>
            </button>
            <button id="quick-apps" className="glass glass-hover p-4 rounded-xl flex flex-col items-center gap-2 text-center" onClick={() => openTab({ title: 'Apps', type: 'app', data: { appId: '' } })}>
              <AppWindow size={22} className="text-green-400" />
              <span className="text-xs font-medium">Apps</span>
            </button>
            <button id="quick-ai" className="glass glass-hover p-4 rounded-xl flex flex-col items-center gap-2 text-center" onClick={toggleAiPanel}>
              <Bot size={22} className="text-pink-400" />
              <span className="text-xs font-medium">AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Built-in apps */}
        <div className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Built-in Apps</h2>
            <button className="text-xs text-[var(--accent-light)] hover:underline flex items-center gap-0.5" onClick={() => openTab({ title: 'Apps', type: 'app' })}>
              All apps <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_APPS.map((app) => (
              <button key={app.id} id={`home-app-${app.id}`} className="glass glass-hover p-4 rounded-xl flex items-center gap-3 text-left"
                onClick={() => openTab({ title: app.name, type: 'app', icon: app.icon, data: { appId: app.id } })}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${app.color}22`, border: `1px solid ${app.color}44` }}>
                  {app.icon}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="glass p-4 rounded-xl flex items-center gap-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <span className="text-lg">💡</span>
          <p className="text-xs text-[var(--text-secondary)]"><span className="font-semibold text-[var(--accent-light)]">Tip:</span> {tip}</p>
        </div>

      </div>
    </div>
  );
}
