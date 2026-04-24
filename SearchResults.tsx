'use client';
import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, AlertCircle, Globe } from 'lucide-react';
import { searchApi } from '@/lib/api';
import SearchBar from './SearchBar';

interface SearchResult {
  title: string;
  url: string | null;
  snippet: string;
  thumbnail?: string | null;
  source: string;
  type?: string;
}

interface Props {
  query: string;
  provider?: string;
}

function ResultSkeleton() {
  return (
    <div className="glass p-4 rounded-xl space-y-2">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/3 rounded" />
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-5/6 rounded" />
    </div>
  );
}

export default function SearchResults({ query, provider = 'ddg' }: Props) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [currentQuery, setCurrentQuery] = useState(query);
  const [currentProvider, setCurrentProvider] = useState(provider);

  const doSearch = async (q: string, prov: string) => {
    if (!q) return;
    setLoading(true);
    setError('');
    setFallbackUrl('');
    try {
      const data = await searchApi.search(q, prov);
      setResults(data.results || []);
      if (data.fallbackUrl) setFallbackUrl(data.fallbackUrl);
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { doSearch(currentQuery, currentProvider); }, [currentQuery, currentProvider]);

  const handleSearch = (q: string, prov: string) => {
    setCurrentQuery(q);
    setCurrentProvider(prov);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search bar */}
      <div className="p-4 border-b border-[var(--border-color)] bg-[rgba(10,6,20,0.5)]">
        <SearchBar initialQuery={currentQuery} onSearch={handleSearch} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Query info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Results for <span className="text-[var(--text-primary)] font-medium">"{currentQuery}"</span>
            <span className="ml-2 badge badge-user text-[10px]">{currentProvider === 'ddg' ? 'DuckDuckGo' : 'Google'}</span>
          </p>
          <button className="btn btn-ghost btn-sm" onClick={() => doSearch(currentQuery, currentProvider)} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Loading skeletons */}
        {loading && Array.from({ length: 5 }).map((_, i) => <ResultSkeleton key={i} />)}

        {/* Error */}
        {error && (
          <div className="glass p-4 rounded-xl border border-red-500/20 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-400 font-medium">Search error</p>
              <p className="text-xs text-[var(--text-muted)]">{error}</p>
            </div>
          </div>
        )}

        {/* No results + fallback */}
        {!loading && !error && results.length === 0 && (
          <div className="glass p-6 rounded-xl text-center">
            <Globe size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-[var(--text-secondary)] mb-3">No instant results found for "{currentQuery}"</p>
            {fallbackUrl && (
              <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                <ExternalLink size={13} /> Open in DuckDuckGo
              </a>
            )}
          </div>
        )}

        {/* Results */}
        {!loading && results.map((r, i) => (
          <div key={i} className={`glass glass-hover p-4 rounded-xl animate-fade-in ${r.type === 'answer' ? 'border-violet-500/30 bg-violet-500/5' : ''}`} style={{ animationDelay: `${i * 40}ms` }}>
            {r.type === 'answer' && (
              <span className="badge badge-admin text-[10px] mb-2">Quick Answer</span>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="text-[var(--accent-light)] font-medium text-sm hover:underline line-clamp-2 flex items-center gap-1.5">
                    {r.title}
                    <ExternalLink size={11} className="flex-shrink-0 opacity-60" />
                  </a>
                ) : (
                  <p className="text-[var(--text-primary)] font-medium text-sm">{r.title}</p>
                )}
                {r.url && (
                  <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{r.url}</p>
                )}
                {r.snippet && (
                  <p className="text-[var(--text-secondary)] text-xs mt-1.5 line-clamp-3">{r.snippet}</p>
                )}
              </div>
              {r.thumbnail && (
                <img src={r.thumbnail} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0 opacity-80" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
