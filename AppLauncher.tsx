'use client';
import { APP_REGISTRY, AppDefinition } from '@/lib/appRegistry';
import { useTabStore } from '@/store/tabStore';
import { Calculator, FileText, CheckSquare, AppWindow } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  notes:      <FileText size={28} />,
  calculator: <Calculator size={28} />,
  todo:       <CheckSquare size={28} />,
};

export default function AppLauncher() {
  const { openTab } = useTabStore();

  const launch = (app: AppDefinition) => {
    openTab({ title: app.name, type: 'app', icon: app.icon, data: { appId: app.id } });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden p-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
          <AppWindow size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg gradient-text">Apps</h1>
          <p className="text-xs text-[var(--text-muted)]">{APP_REGISTRY.length} built-in apps</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {APP_REGISTRY.map((app) => (
          <button
            key={app.id}
            id={`app-launch-${app.id}`}
            className="game-card p-5 flex flex-col items-center gap-3 text-center group"
            onClick={() => launch(app)}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${app.color}cc, ${app.color}66)`, boxShadow: `0 4px 16px ${app.color}44` }}
            >
              {ICON_MAP[app.id] || <span className="text-2xl">{app.icon}</span>}
            </div>
            <div>
              <p className="font-semibold text-sm text-[var(--text-primary)]">{app.name}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{app.description}</p>
            </div>
            <span className="badge badge-user text-[9px] capitalize">{app.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
