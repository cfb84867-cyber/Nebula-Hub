'use client';
import dynamic from 'next/dynamic';
import { useTabStore, Tab } from '@/store/tabStore';
import SearchResults from './SearchResults';
import GameFrame from './GameFrame';
import GameHub from './GameHub';
import AppLauncher from './AppLauncher';

// Lazy load heavy components
const NotesApp      = dynamic(() => import('@/apps/NotesApp'),      { ssr: false });
const CalculatorApp = dynamic(() => import('@/apps/CalculatorApp'), { ssr: false });
const TodoApp       = dynamic(() => import('@/apps/TodoApp'),       { ssr: false });
const AdminPanel    = dynamic(() => import('@/components/AdminPanel'), { ssr: false });
const Dashboard     = dynamic(() => import('@/components/Dashboard'),   { ssr: false });
const SettingsApp   = dynamic(() => import('@/apps/SettingsApp'), { ssr: false });

function AppRouter({ appId }: { appId: string }) {
  switch (appId) {
    case 'notes':       return <NotesApp />;
    case 'calculator':  return <CalculatorApp />;
    case 'todo':        return <TodoApp />;
    case 'admin':       return <AdminPanel />;
    case 'settings':    return <SettingsApp />;
    default:            return <AppLauncher />;
  }
}

function TabRenderer({ tab }: { tab: Tab }) {
  switch (tab.type) {
    case 'home':
      return <Dashboard />;

    case 'search':
      return (
        <SearchResults
          query={(tab.data?.query as string) || ''}
          provider={(tab.data?.provider as string) || 'ddg'}
        />
      );

    case 'game':
      if (tab.data?.url) {
        return <GameFrame url={tab.data.url as string} title={tab.title} />;
      }
      return <GameHub />;

    case 'app':
      return <AppRouter appId={(tab.data?.appId as string) || ''} />;

    default:
      return <Dashboard />;
  }
}

export default function TabContent() {
  const { tabs, activeTabId } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab) return <Dashboard />;

  return (
    <div className="flex-1 overflow-hidden h-full">
      {/* Render all tabs but only show the active one — preserves component state */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className="h-full w-full overflow-hidden"
          style={{ display: tab.id === activeTabId ? 'flex' : 'none', flexDirection: 'column' }}
        >
          <TabRenderer tab={tab} />
        </div>
      ))}
    </div>
  );
}
