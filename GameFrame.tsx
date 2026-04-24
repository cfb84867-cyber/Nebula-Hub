'use client';
import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, RefreshCw, ExternalLink, X } from 'lucide-react';

interface Props { url: string; title: string; }

export default function GameFrame({ url, title }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = () => { setLoading(true); if (iframeRef.current) { iframeRef.current.src = url; } };
  const toggleFullscreen = () => setFullscreen((v) => !v);

  return (
    <div className={`flex flex-col h-full ${fullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(10,6,20,0.9)] border-b border-[var(--border-color)] flex-shrink-0">
        <span className="text-sm font-medium text-[var(--text-secondary)] flex-1 truncate">🎮 {title}</span>
        <button className="btn btn-ghost btn-sm px-2" onClick={reload} title="Reload">
          <RefreshCw size={13} />
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm px-2" title="Open externally">
          <ExternalLink size={13} />
        </a>
        <button className="btn btn-ghost btn-sm px-2" onClick={toggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
        {fullscreen && (
          <button className="btn btn-ghost btn-sm px-2" onClick={() => setFullscreen(false)}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* iframe */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)] z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[var(--text-muted)]">Loading {title}...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          title={title}
          className="game-frame"
          onLoad={() => setLoading(false)}
          allow="fullscreen; autoplay"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
        />
      </div>
    </div>
  );
}
