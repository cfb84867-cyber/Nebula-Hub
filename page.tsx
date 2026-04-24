'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Zap, Loader2, ArrowRight, Key } from 'lucide-react';

export default function AuthPage() {
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated } = useAuthStore() as any;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) return;
    setLoading(true);
    setError('');

    try {
      const { authApi } = await import('@/store/authStore');
      const store = useAuthStore.getState();

      const data = await authApi.login({ key: accessKey.trim() } as any);
      
      if (data.error) throw new Error(data.error);
      
      store.setAuth(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Invalid access key');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-primary)] p-4">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass p-10 rounded-2xl w-full max-w-md relative z-10 shadow-card animate-slide-up">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-glow-md mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">Nebula Hub</h1>
          <p className="text-[var(--text-muted)] text-sm px-4">
            Enter your access key to enter the hub.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-2 ml-1">Access Key</label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                required
                className="input bg-[rgba(10,6,20,0.6)] pl-10 py-3 text-sm font-mono"
                placeholder="NEBULA-XXXX-..."
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !accessKey.trim()}
            className="btn btn-primary w-full py-4 font-bold text-sm flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enter Hub'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
            Identity & Authorization Gated
          </p>
        </div>
      </div>
    </div>
  );
}
