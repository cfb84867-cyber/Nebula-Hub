'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminApi, gamesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Gamepad2, Key, Activity, ShieldAlert, CheckCircle, Trash2, Edit } from 'lucide-react';

export default function AdminPanel() {
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Key Form
  const [keyLabel, setKeyLabel] = useState('');
  const [keyOneTime, setKeyOneTime] = useState(false);
  const [newPlainKey, setNewPlainKey] = useState<string | null>(null);

  // New Game Form
  const [gameTitle, setGameTitle] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [gameThumb, setGameThumb] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [gameCat, setGameCat] = useState('other');

  useEffect(() => {
    if (!token || user?.role !== 'admin') return;
    loadData(activeTab);
  }, [activeTab, token, user]);

  const loadData = async (tab: string) => {
    setLoading(true);
    setNewPlainKey(null);
    try {
      if (tab === 'stats') {
        const d = await adminApi.getStats(token!);
        setStats(d);
      } else if (tab === 'users') {
        const d = await adminApi.getUsers('limit=50', token!);
        setUsers(d.users);
      } else if (tab === 'keys') {
        const d = await adminApi.getKeys(token!);
        setKeys(d.keys);
      } else if (tab === 'logs') {
        const d = await adminApi.getLogs('limit=100', token!);
        setLogs(d.logs);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to load ${tab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (id: string, isBanned: boolean) => {
    try {
      await adminApi.banUser(id, !isBanned, !isBanned ? 'Admin action' : '', token!);
      toast.success(isBanned ? 'User unbanned' : 'User banned');
      loadData('users');
    } catch { toast.error('Action failed'); }
  };

  const handleRole = async (id: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await adminApi.updateRole(id, newRole, token!);
      toast.success(`Role updated to ${newRole}`);
      loadData('users');
    } catch { toast.error('Action failed'); }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyLabel) return;
    try {
      const res = await adminApi.createKey({ label: keyLabel, isOneTime: keyOneTime }, token!);
      setNewPlainKey(res.plainKey);
      setKeyLabel('');
      toast.success('Admin key created');
      loadData('keys');
    } catch { toast.error('Failed to create key'); }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await adminApi.revokeKey(id, token!);
      toast.success('Key revoked');
      loadData('keys');
    } catch { toast.error('Failed to revoke key'); }
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle || !gameUrl) return;
    try {
      await gamesApi.add({
        title: gameTitle, url: gameUrl, thumbnailUrl: gameThumb, description: gameDesc, category: gameCat
      }, token!);
      toast.success('Game added successfully');
      setGameTitle(''); setGameUrl(''); setGameThumb(''); setGameDesc('');
    } catch { toast.error('Failed to add game'); }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div className="glass p-8 rounded-2xl max-w-md w-full">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">You must be an administrator to view this panel.</p>
          <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-left">
            <p className="text-xs text-red-400 font-mono">Current role: {user?.role || 'guest'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[rgba(10,6,20,0.5)]">
        <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
          <ShieldAlert size={20} className="text-violet-500" /> Admin Control Panel
        </h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-[var(--border-color)] bg-[rgba(10,6,20,0.3)] p-3 space-y-1">
          {[
            { id: 'stats', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'keys',  label: 'Access Keys', icon: Key },
            { id: 'games', label: 'Add Game', icon: Gamepad2 },
            { id: 'logs',  label: 'Audit Logs', icon: ShieldAlert },
          ].map((t) => (
            <button
              key={t.id}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === t.id ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
              onClick={() => setActiveTab(t.id)}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading && activeTab !== 'games' && <div className="text-[var(--text-muted)] text-sm animate-pulse">Loading {activeTab}...</div>}

          {!loading && activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="admin-stat-card"><p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">Total Users</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div>
                <div className="admin-stat-card"><p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">Admins</p><p className="text-2xl font-bold text-violet-400">{stats.adminUsers}</p></div>
                <div className="admin-stat-card"><p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">Active Games</p><p className="text-2xl font-bold text-blue-400">{stats.activeGames}</p></div>
                <div className="admin-stat-card"><p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wide">Total Logs</p><p className="text-2xl font-bold">{stats.totalLogs}</p></div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'users' && (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-[var(--border-color)]">
                  <tr><th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/30">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="p-3 font-medium">{u.username}</td>
                      <td className="p-3 text-[var(--text-muted)]">{u.email}</td>
                      <td className="p-3"><span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>{u.role}</span></td>
                      <td className="p-3"><span className={`badge ${u.isBanned ? 'badge-banned' : 'badge-active'}`}>{u.isBanned ? 'Banned' : 'Active'}</span></td>
                      <td className="p-3 space-x-2">
                        <button className="text-xs text-blue-400 hover:underline" onClick={() => handleRole(u.id, u.role)}>Toggle Role</button>
                        <button className={`text-xs hover:underline ${u.isBanned ? 'text-green-400' : 'text-red-400'}`} onClick={() => handleBan(u.id, u.isBanned)}>{u.isBanned ? 'Unban' : 'Ban'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && activeTab === 'keys' && (
            <div className="space-y-6">
              <form className="glass p-4 rounded-xl flex gap-3 items-end" onSubmit={handleCreateKey}>
                <div className="flex-1"><label className="text-xs text-[var(--text-muted)] block mb-1">Key Label</label><input required className="input text-sm" value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} placeholder="e.g. For new dev team" /></div>
                <div><label className="text-xs text-[var(--text-muted)] block mb-1">Type</label><select className="input text-sm" value={keyOneTime ? 'true' : 'false'} onChange={(e) => setKeyOneTime(e.target.value === 'true')}><option value="false">Reusable</option><option value="true">One-Time Use</option></select></div>
                <button type="submit" className="btn btn-primary">Generate Key</button>
              </form>

              {newPlainKey && (
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
                  <p className="text-sm font-semibold text-green-400 mb-1 flex items-center gap-2"><CheckCircle size={16} /> Key Generated Successfully!</p>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">Copy this key now. It will never be shown again.</p>
                  <code className="block bg-black/40 p-3 rounded text-green-300 font-mono text-sm selection:bg-green-500/30">{newPlainKey}</code>
                </div>
              )}

              <div className="glass rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 border-b border-[var(--border-color)]">
                    <tr><th className="p-3">Label</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Created</th><th className="p-3">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]/30">
                    {keys.map(k => (
                      <tr key={k._id} className="hover:bg-white/5">
                        <td className="p-3 font-medium">{k.label}</td>
                        <td className="p-3"><span className="badge badge-user">{k.isOneTime ? 'One-time' : 'Reusable'}</span></td>
                        <td className="p-3"><span className={`badge ${k.isRevoked ? 'badge-banned' : 'badge-active'}`}>{k.isRevoked ? 'Revoked' : 'Active'}</span></td>
                        <td className="p-3 text-[var(--text-muted)]">{new Date(k.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">{!k.isRevoked && <button className="text-xs text-red-400 hover:underline" onClick={() => handleRevokeKey(k._id)}>Revoke</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'games' && (
            <form className="glass p-6 rounded-xl max-w-xl mx-auto space-y-4" onSubmit={handleAddGame}>
              <h2 className="text-lg font-bold mb-4">Add New Game</h2>
              <div><label className="text-xs text-[var(--text-muted)] block mb-1">Title</label><input required className="input" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)} /></div>
              <div><label className="text-xs text-[var(--text-muted)] block mb-1">Iframe URL</label><input required type="url" className="input" value={gameUrl} onChange={(e) => setGameUrl(e.target.value)} placeholder="https://..." /></div>
              <div><label className="text-xs text-[var(--text-muted)] block mb-1">Thumbnail URL</label><input type="url" className="input" value={gameThumb} onChange={(e) => setGameThumb(e.target.value)} /></div>
              <div><label className="text-xs text-[var(--text-muted)] block mb-1">Description</label><textarea className="input resize-none h-20" value={gameDesc} onChange={(e) => setGameDesc(e.target.value)} /></div>
              <div><label className="text-xs text-[var(--text-muted)] block mb-1">Category</label>
                <select className="input" value={gameCat} onChange={(e) => setGameCat(e.target.value)}>
                  {['action', 'puzzle', 'strategy', 'arcade', 'rpg', 'sports', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full">Add Game to Hub</button>
            </form>
          )}

          {!loading && activeTab === 'logs' && (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px] md:text-xs">
                <thead className="bg-white/5 border-b border-[var(--border-color)]">
                  <tr><th className="p-2">Time</th><th className="p-2">Action</th><th className="p-2">User</th><th className="p-2">IP</th></tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/30">
                  {logs.map(l => (
                    <tr key={l._id} className="hover:bg-white/5">
                      <td className="p-2 text-[var(--text-muted)]">{new Date(l.createdAt).toLocaleString()}</td>
                      <td className="p-2 font-mono"><span className={l.severity === 'critical' ? 'text-red-400' : l.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'}>{l.action}</span></td>
                      <td className="p-2">{l.userId?.username || l.username}</td>
                      <td className="p-2 text-[var(--text-muted)]">{l.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
