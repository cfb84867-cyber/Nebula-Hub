'use client';
import { useState } from 'react';
import { User, Settings, Shield, Palette, Search, Bot, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useAuthStore, authApi } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import toast from 'react-hot-toast';

export default function SettingsApp() {
  const { user, token, updatePreferences, setAuth } = useAuthStore() as any;
  const { theme, setTheme, accentColor, setAccentColor } = useUIStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [adminKey, setAdminKey] = useState('');
  const [claiming, setClaiming] = useState(false);

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim() || !token) return;
    setClaiming(true);
    try {
      const res = await authApi.claimAdminKey(token, adminKey);
      if (res.error) throw new Error(res.error);
      
      toast.success('Admin privileges granted!');
      setAdminKey('');
      // Update local user role
      setAuth({ ...user, role: 'admin' }, token);
    } catch (err: any) {
      toast.error(err.message || 'Invalid admin key');
    } finally {
      setClaiming(false);
    }
  };

  const handlePrefChange = async (key: string, value: any) => {
    updatePreferences({ [key]: value });
    if (token) {
      try {
        await authApi.updatePreferences(token, { [key]: value });
      } catch { /* Silent fail for sync */ }
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 border-r border-[var(--border-color)] bg-[rgba(10,6,20,0.3)] p-4 space-y-2">
        <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 px-2">Settings</h2>
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'preferences', label: 'Preferences', icon: Settings },
          { id: 'admin', label: 'Admin Access', icon: Shield },
        ].map((s) => (
          <button
            key={s.id}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activeSection === s.id ? 'bg-[var(--accent)] text-white shadow-glow-sm' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
            onClick={() => setActiveSection(s.id)}
          >
            <s.icon size={16} /> {s.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-xl animate-fade-in">
          
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-[var(--border-color)]">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-glow-md">
                  {user?.username?.[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{user?.username}</h3>
                  <p className="text-[var(--text-muted)] text-sm">{user?.email}</p>
                  <div className="mt-2 flex gap-2">
                    <span className={`badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>{user?.role}</span>
                    <span className="text-[10px] text-[var(--text-muted)] flex items-center">Joined {new Date(user?.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-4 rounded-xl">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Status</p>
                  <p className="text-sm font-medium text-green-400">Active</p>
                </div>
                <div className="glass p-4 rounded-xl">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Favorite Games</p>
                  <p className="text-sm font-medium">{user?.favoriteGames?.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-8">
              <section>
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2"><Palette size={16} className="text-violet-400" /> Theme Mode</h4>
                <div className="flex gap-3">
                  {['dark', 'light'].map((t) => (
                    <button
                      key={t}
                      className={`flex-1 glass p-4 rounded-xl border-2 transition-all ${theme === t ? 'border-[var(--accent)] bg-white/5' : 'border-transparent'}`}
                      onClick={() => setTheme(t as any)}
                    >
                      <p className="text-sm font-medium capitalize">{t}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold mb-4">Accent Color</h4>
                <div className="flex gap-3 flex-wrap">
                  {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      className={`w-10 h-10 rounded-full transition-all hover:scale-110 border-2 ${accentColor === c ? 'border-white scale-110 shadow-glow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setAccentColor(c)}
                    />
                  ))}
                </div>
                <p className="mt-4 text-xs text-[var(--text-muted)]">This will change the primary highlights across the app.</p>
              </section>
            </div>
          )}

          {activeSection === 'preferences' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 glass rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><Search size={20} /></div>
                  <div>
                    <p className="text-sm font-medium">Default Search Provider</p>
                    <p className="text-xs text-[var(--text-muted)]">Set your preferred search engine</p>
                  </div>
                </div>
                <select 
                  className="input w-32" 
                  value={user?.preferences?.searchProvider} 
                  onChange={(e) => handlePrefChange('searchProvider', e.target.value)}
                >
                  <option value="ddg">DuckDuckGo</option>
                  <option value="google">Google</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 glass rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400"><Bot size={20} /></div>
                  <div>
                    <p className="text-sm font-medium">Enable AI Assistant</p>
                    <p className="text-xs text-[var(--text-muted)]">Toggle Nova chat functionality</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-[var(--accent)]" 
                  checked={user?.preferences?.aiEnabled} 
                  onChange={(e) => handlePrefChange('aiEnabled', e.target.checked)}
                />
              </div>
            </div>
          )}

          {activeSection === 'admin' && (
            <div className="space-y-6">
              {user?.role === 'admin' ? (
                <div className="glass p-8 rounded-2xl text-center border-green-500/30 bg-green-500/5">
                  <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                  <h3 className="text-lg font-bold text-green-400">Admin Privileges Active</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-2">You have full access to the control panel, logs, and game management.</p>
                </div>
              ) : (
                <form className="glass p-6 rounded-2xl space-y-4" onSubmit={handleClaimAdmin}>
                  <div className="flex items-center gap-3 mb-2">
                    <Shield size={24} className="text-violet-400" />
                    <div>
                      <h3 className="font-bold">Claim Admin Role</h3>
                      <p className="text-xs text-[var(--text-muted)]">Enter a valid Admin Access Key to upgrade your account.</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input 
                      className="input py-3 font-mono text-sm" 
                      placeholder="NEBULA-ADMIN-XXXX..." 
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full py-3"
                    disabled={claiming || !adminKey}
                  >
                    {claiming ? 'Validating...' : 'Authorize Admin Access'}
                  </button>

                  <div className="flex items-start gap-2 text-[10px] text-[var(--text-muted)] mt-4">
                    <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                    <p>Admin keys are single-use or shared master keys. Unauthorized attempts are logged for security.</p>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
