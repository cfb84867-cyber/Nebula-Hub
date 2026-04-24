'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Square, ChevronDown, Calendar } from 'lucide-react';

type Priority = 'low' | 'medium' | 'high';
interface Todo { id: string; text: string; done: boolean; priority: Priority; createdAt: string; }

const STORAGE_KEY = 'nebula-todos';
const PRIO_COLOR: Record<Priority, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
const PRIO_LABEL: Record<Priority, string> = { low: 'Low', medium: 'Med', high: 'High' };

const load = (): Todo[] => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
const persist = (todos: Todo[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  useEffect(() => { setTodos(load()); }, []);

  const update = (updated: Todo[]) => { setTodos(updated); persist(updated); };

  const add = () => {
    if (!input.trim()) return;
    update([{ id: `todo_${Date.now()}`, text: input.trim(), done: false, priority, createdAt: new Date().toISOString() }, ...todos]);
    setInput('');
  };

  const toggle = (id: string) => update(todos.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const remove  = (id: string) => update(todos.filter((t) => t.id !== id));
  const clearDone = () => update(todos.filter((t) => !t.done));

  const filtered = todos.filter((t) => filter === 'all' ? true : filter === 'active' ? !t.done : t.done);
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="h-full flex flex-col max-w-lg mx-auto p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CheckSquare size={18} className="text-[var(--accent-light)]" />
          <h2 className="font-bold text-lg gradient-text">To-Do List</h2>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{doneCount}/{todos.length} done</span>
      </div>

      {/* Add */}
      <div className="glass p-3 rounded-xl mb-4 flex gap-2">
        <input
          className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          placeholder="Add a task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <select className="bg-transparent text-xs text-[var(--text-muted)] outline-none cursor-pointer" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="btn btn-primary btn-sm px-3" onClick={add}><Plus size={14} /></button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-3">
        {(['all', 'active', 'done'] as const).map((f) => (
          <button key={f} className={`btn btn-sm capitalize ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        {doneCount > 0 && (
          <button className="btn btn-ghost btn-sm ml-auto text-red-400 hover:text-red-300" onClick={clearDone}>
            <Trash2 size={12} /> Clear done
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filtered.length === 0 && (
          <div className="glass rounded-xl p-6 text-center text-[var(--text-muted)] text-sm">
            {filter === 'done' ? '✅ No completed tasks yet' : '📋 No tasks — add one above!'}
          </div>
        )}
        {filtered.map((todo) => (
          <div key={todo.id} className={`glass glass-hover flex items-center gap-3 p-3 rounded-xl transition-all ${todo.done ? 'opacity-50' : ''}`}>
            <button onClick={() => toggle(todo.id)} className="flex-shrink-0 transition-colors">
              {todo.done
                ? <CheckSquare size={17} className="text-[var(--accent-light)]" />
                : <Square size={17} className="text-[var(--text-muted)]" />}
            </button>
            <span className={`flex-1 text-sm ${todo.done ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{todo.text}</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${PRIO_COLOR[todo.priority]}22`, color: PRIO_COLOR[todo.priority] }}>
              {PRIO_LABEL[todo.priority]}
            </span>
            <button onClick={() => remove(todo.id)} className="text-[var(--text-muted)] hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
