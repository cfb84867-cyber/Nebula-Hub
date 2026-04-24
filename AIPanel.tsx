'use client';
import { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Loader2, Zap, ChevronDown } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useTabStore } from '@/store/tabStore';
import { aiApi } from '@/lib/api';

interface Message { role: 'user' | 'assistant'; content: string; }

interface AIAction { action: string; params: Record<string, string>; }

export default function AIPanel() {
  const { aiPanelOpen, setAiPanelOpen } = useUIStore();
  const { user, token } = useAuthStore();
  const { openTab, getActiveTab } = useTabStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hey ${user?.username || 'there'}! 👋 I'm Nova, your Nebula Hub assistant. I can open tabs, search the web, launch games, and more. What can I do for you?` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const executeAction = (action: AIAction) => {
    switch (action.action) {
      case 'OPEN_TAB':   openTab({ title: 'New Tab', type: 'home' }); break;
      case 'CLOSE_TAB':  window.dispatchEvent(new CustomEvent('nebula:close-tab')); break;
      case 'SEARCH':     openTab({ title: action.params.query, type: 'search', data: { query: action.params.query, provider: 'ddg' } }); break;
      case 'LAUNCH_GAME':openTab({ title: action.params.gameName || 'Game', type: 'game', icon: '🎮' }); break;
      case 'OPEN_APP':   openTab({ title: action.params.appName || 'App', type: 'app', data: { appId: action.params.appName?.toLowerCase() } }); break;
      case 'NAVIGATE':   window.dispatchEvent(new CustomEvent('nebula:navigate', { detail: action.params.destination })); break;
      case 'TOGGLE_THEME': window.dispatchEvent(new CustomEvent('nebula:toggle-theme')); break;
    }
  };

  const send = async () => {
    if (!input.trim() || loading || !token) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const activeTab = getActiveTab();
      const context = { activeTabType: activeTab?.type, activeTabTitle: activeTab?.title };
      const history = messages.slice(-8);
      const data = await aiApi.chat(userMsg, context, history, token);

      if (data.command) executeAction(data.command);
      setMessages((m) => [...m, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`ai-panel ${aiPanelOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Nova</p>
            <p className="text-[10px] text-[var(--text-muted)]">AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-sm px-2" onClick={() => setMessages([{ role: 'assistant', content: `Hey ${user?.username}! How can I help?` }])} title="Clear chat">
            <ChevronDown size={14} />
          </button>
          <button id="close-ai-panel" className="btn btn-ghost btn-sm px-2" onClick={() => setAiPanelOpen(false)}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <Zap size={10} className="text-white" />
              </div>
            )}
            <div className={`ai-message ${msg.role}`} style={{ whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap size={10} className="text-white" />
            </div>
            <div className="ai-message assistant flex items-center gap-2">
              <Loader2 size={13} className="animate-spin" />
              <span className="text-[var(--text-muted)]">Nova is thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
        {['Open new tab', 'Search for...', 'Launch a game', 'Open notes'].map((s) => (
          <button key={s} className="btn btn-ghost text-[11px] px-2 py-1 h-auto" onClick={() => { setInput(s); }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border-color)]">
        {!token ? (
          <p className="text-xs text-center text-[var(--text-muted)] py-2">Login to use Nova AI</p>
        ) : (
          <div className="flex gap-2">
            <input
              id="ai-chat-input"
              className="input text-sm flex-1"
              placeholder="Ask Nova anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            />
            <button id="ai-send-btn" className="btn btn-primary px-3" onClick={send} disabled={loading || !input.trim()}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
