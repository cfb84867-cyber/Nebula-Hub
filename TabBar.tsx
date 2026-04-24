'use client';
import { useState, useRef, useCallback } from 'react';
import { X, Plus, Home, Search, Gamepad2, AppWindow, Globe } from 'lucide-react';
import { useTabStore, Tab } from '@/store/tabStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TAB_ICONS: Record<string, React.ReactNode> = {
  home:    <Home size={13} />,
  search:  <Search size={13} />,
  game:    <Gamepad2 size={13} />,
  app:     <AppWindow size={13} />,
  browser: <Globe size={13} />,
};

function SortableTab({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const { closeTab, switchTab, renameTab } = useTabStore();
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(tab.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const handleDoubleClick = () => {
    setEditing(true);
    setEditVal(tab.title);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitRename = () => {
    setEditing(false);
    const val = editVal.trim();
    if (val && val !== tab.title) renameTab(tab.id, val);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`tab-item ${isActive ? 'active' : ''}`}
      onClick={() => switchTab(tab.id)}
      onDoubleClick={handleDoubleClick}
    >
      <span className="text-[11px] opacity-70 flex-shrink-0">
        {tab.icon || TAB_ICONS[tab.type] || <Globe size={13} />}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          className="bg-transparent outline-none text-[0.8125rem] w-full min-w-0"
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false); }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate-label flex-1 text-[0.8125rem]">{tab.title}</span>
      )}
      {tab.id !== 'home' && (
        <button
          className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 flex-shrink-0 transition-opacity ml-1"
          style={{ opacity: isActive ? 0.6 : undefined }}
          onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
          title="Close tab"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

export default function TabBar() {
  const { tabs, activeTabId, openTab, reorderTabs } = useTabStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = tabs.findIndex((t) => t.id === active.id);
      const to   = tabs.findIndex((t) => t.id === over.id);
      reorderTabs(from, to);
    }
  };

  return (
    <div className="tab-bar">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tabs.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
          {tabs.map((tab) => (
            <div key={tab.id} className="group">
              <SortableTab tab={tab} isActive={tab.id === activeTabId} />
            </div>
          ))}
        </SortableContext>
      </DndContext>

      <button
        className="btn btn-ghost btn-sm ml-1 px-2 flex-shrink-0"
        onClick={() => openTab({ title: 'New Tab', type: 'home' })}
        title="New Tab (Ctrl+T)"
        id="new-tab-btn"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
