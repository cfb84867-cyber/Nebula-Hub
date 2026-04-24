'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Globe, ChevronDown } from 'lucide-react';
import { useTabStore } from '@/store/tabStore';
import { useAuthStore } from '@/store/authStore';
import { searchApi } from '@/lib/api';

const PROVIDERS = [
  { id: 'ddg', label: 'DuckDuckGo', color: '#de5833' },
  { id: 'google', label: 'Google', color: '#4285f4' },
];

export default function SearchBar({ initialQuery = '', onSearch }: { initialQuery?: string; onSearch?: (q: string, provider: string) => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [provider, setProvider] = useState<'ddg' | 'google'>('ddg');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { openTab } = useTabStore();
  const { user } = useAuthStore();

  // Listen for global focus-search event (Ctrl+K)
  useEffect(() => {
    const handler = () => inputRef.current?.focus();
    window.addEventListener('nebula:focus-search', handler);
    return () => window.removeEventListener('nebula:focus-search', handler);
  }, []);

  // Load user search provider preference
  useEffect(() => {
    if (user?.preferences?.searchProvider) setProvider(user.preferences.searchProvider);
  }, [user]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const data = await searchApi.suggestions(q);
      setSuggestions(data.suggestions || []);
    } catch { setSuggestions([]); }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    setFocusIdx(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 220);
    setShowSuggestions(true);
  };

  const doSearch = (q: string) => {
    if (!q.trim()) return;
    setShowSuggestions(false);
    setSuggestions([]);
    if (onSearch) {
      onSearch(q, provider);
    } else {
      openTab({ title: q, type: 'search', data: { query: q, provider } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      doSearch(focusIdx >= 0 ? suggestions[focusIdx] : query);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 glass px-3 py-2 focus-within:border-[var(--accent)] focus-within:shadow-glow-sm transition-all">
        {/* Provider selector */}
        <div className="relative">
          <button
            className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm"
            onClick={() => setShowProviders((v) => !v)}
            id="search-provider-btn"
          >
            <Globe size={15} />
            <ChevronDown size={11} />
          </button>
          {showProviders && (
            <div className="absolute top-full left-0 mt-2 glass rounded-lg overflow-hidden z-50 min-w-[140px] shadow-card animate-slide-up">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${provider === p.id ? 'text-[var(--accent-light)]' : 'text-[var(--text-secondary)]'}`}
                  onClick={() => { setProvider(p.id as 'ddg' | 'google'); setShowProviders(false); }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          id="main-search-input"
          type="text"
          className="flex-1 bg-transparent outline-none text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]"
          placeholder="Search the web... (Ctrl+K)"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 1 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          autoComplete="off"
        />

        {query && (
          <button onClick={() => { setQuery(''); setSuggestions([]); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={14} />
          </button>
        )}

        <button
          id="search-submit-btn"
          className="btn btn-primary btn-sm px-3"
          onClick={() => doSearch(query)}
        >
          <Search size={14} />
        </button>
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 glass rounded-xl overflow-hidden z-50 shadow-card animate-slide-up">
          {suggestions.map((s, i) => (
            <button
              key={s}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${i === focusIdx ? 'bg-[rgba(139,92,246,0.15)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
              onMouseDown={() => { setQuery(s); doSearch(s); }}
            >
              <Search size={13} className="text-[var(--text-muted)] flex-shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
