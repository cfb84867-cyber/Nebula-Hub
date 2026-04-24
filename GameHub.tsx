'use client';
import { useState, useEffect } from 'react';
import { Gamepad2, Star, Filter, Search, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useTabStore } from '@/store/tabStore';
import { useAuthStore } from '@/store/authStore';
import { gamesApi } from '@/lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'action', 'puzzle', 'strategy', 'arcade', 'rpg', 'sports', 'other'];

interface Game { _id: string; title: string; description: string; url: string; thumbnailUrl?: string; category: string; tags: string[]; isFeatured: boolean; isFavorited?: boolean; playCount: number; }

function GameCard({ game, onFavorite, onPlay, onDelete, isAdmin }: { game: Game; onFavorite: (id: string) => void; onPlay: (game: Game) => void; onDelete?: (id: string) => void; isAdmin: boolean }) {
  return (
    <div className="game-card group" onClick={() => onPlay(game)}>
      {/* Thumbnail */}
      <div className="h-28 bg-gradient-to-br from-violet-900/40 to-blue-900/40 flex items-center justify-center relative overflow-hidden">
        {game.thumbnailUrl ? (
          <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
        ) : (
          <Gamepad2 size={40} className="text-violet-400/50" />
        )}
        {game.isFeatured && (
          <span className="absolute top-2 left-2 badge badge-admin text-[9px]">⭐ Featured</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,6,20,0.8)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
          <span className="btn btn-primary btn-sm text-xs">Play Now</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate">{game.title}</h3>
          <div className="flex gap-1 flex-shrink-0">
            <button
              className={`p-1 rounded hover:bg-white/10 transition-colors ${game.isFavorited ? 'text-yellow-400' : 'text-[var(--text-muted)]'}`}
              onClick={(e) => { e.stopPropagation(); onFavorite(game._id); }}
              title={game.isFavorited ? 'Unfavorite' : 'Favorite'}
            >
              <Star size={13} fill={game.isFavorited ? 'currentColor' : 'none'} />
            </button>
            {isAdmin && onDelete && (
              <button
                className="p-1 rounded hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(game._id); }}
                title="Remove game"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">{game.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="badge badge-user text-[9px] capitalize">{game.category}</span>
          <span className="text-[10px] text-[var(--text-muted)]">{game.playCount} plays</span>
        </div>
      </div>
    </div>
  );
}

export default function GameHub() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const { openTab } = useTabStore();
  const { user, token } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      const data = await gamesApi.list(params.toString(), token || undefined);
      setGames(data.games || []);
    } catch { toast.error('Failed to load games'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [category]);

  const handleFavorite = async (id: string) => {
    if (!token) { toast.error('Login to favorite games'); return; }
    try {
      const data = await gamesApi.favorite(id, token);
      setGames((gs) => gs.map((g) => g._id === id ? { ...g, isFavorited: data.favorited } : g));
    } catch { toast.error('Failed to update favorite'); }
  };

  const handlePlay = (game: Game) => {
    gamesApi.play(game._id).catch(() => {});
    openTab({ title: game.title, type: 'game', icon: '🎮', data: { url: game.url, title: game.title } });
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Remove this game?')) return;
    try {
      await gamesApi.remove(id, token);
      setGames((gs) => gs.filter((g) => g._id !== id));
      toast.success('Game removed');
    } catch { toast.error('Failed to remove game'); }
  };

  const featured = games.filter((g) => g.isFeatured);
  const favorites = games.filter((g) => g.isFavorited);
  const all = games;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[var(--border-color)] bg-[rgba(10,6,20,0.4)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
              <Gamepad2 size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg gradient-text">Game Hub</h1>
              <p className="text-xs text-[var(--text-muted)]">{games.length} games available</p>
            </div>
          </div>
          {isAdmin && (
            <button id="add-game-btn" className="btn btn-primary btn-sm" onClick={() => openTab({ title: 'Add Game', type: 'app', data: { appId: 'add-game' } })}>
              <Plus size={14} /> Add Game
            </button>
          )}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input className="input pl-9 text-sm" placeholder="Search games..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c} className={`btn btn-sm capitalize ${category === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Games grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-[var(--border-color)]">
                <div className="skeleton h-28 w-full" />
                <div className="p-3 space-y-2">
                  <div className="skeleton h-3 w-3/4 rounded" />
                  <div className="skeleton h-2.5 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {favorites.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <Star size={14} className="text-yellow-400" /> Favorites
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {favorites.map((g) => <GameCard key={g._id} game={g} onFavorite={handleFavorite} onPlay={handlePlay} onDelete={handleDelete} isAdmin={isAdmin} />)}
                </div>
              </section>
            )}
            {featured.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  ⭐ Featured
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {featured.map((g) => <GameCard key={g._id} game={g} onFavorite={handleFavorite} onPlay={handlePlay} onDelete={handleDelete} isAdmin={isAdmin} />)}
                </div>
              </section>
            )}
            <section>
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">All Games</h2>
              {all.length === 0 ? (
                <div className="glass p-8 rounded-xl text-center text-[var(--text-muted)]">
                  <Gamepad2 size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No games found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {all.map((g) => <GameCard key={g._id} game={g} onFavorite={handleFavorite} onPlay={handlePlay} onDelete={handleDelete} isAdmin={isAdmin} />)}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
