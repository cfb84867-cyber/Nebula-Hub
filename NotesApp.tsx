'use client';
import { useState, useEffect, useCallback } from 'react';
import { Save, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Note { id: string; title: string; content: string; updatedAt: string; }

const STORAGE_KEY = 'nebula-notes';

const loadNotes = (): Note[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const n = loadNotes();
    setNotes(n);
    if (n.length > 0) { setActiveId(n[0].id); setTitle(n[0].title); setContent(n[0].content); }
  }, []);

  const save = useCallback(() => {
    const now = new Date().toISOString();
    setNotes((prev) => {
      let updated: Note[];
      if (activeId && prev.some((n) => n.id === activeId)) {
        updated = prev.map((n) => n.id === activeId ? { ...n, title: title || 'Untitled', content, updatedAt: now } : n);
      } else {
        const newNote: Note = { id: `note_${Date.now()}`, title: title || 'Untitled', content, updatedAt: now };
        updated = [newNote, ...prev];
        setActiveId(newNote.id);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setDirty(false);
    toast.success('Note saved');
  }, [activeId, title, content]);

  // Auto-save on Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  const newNote = () => { setActiveId(null); setTitle(''); setContent(''); setDirty(false); };

  const openNote = (note: Note) => { if (dirty && !confirm('Discard unsaved changes?')) return; setActiveId(note.id); setTitle(note.title); setContent(note.content); setDirty(false); };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (activeId === id) newNote();
    toast.success('Note deleted');
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 border-r border-[var(--border-color)] flex flex-col bg-[rgba(10,6,20,0.4)]">
        <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[var(--accent-light)]" />
            <span className="text-sm font-semibold">Notes</span>
          </div>
          <button className="btn btn-ghost btn-sm px-2" onClick={newNote} title="New note">+</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 && <p className="text-xs text-[var(--text-muted)] p-3">No notes yet</p>}
          {notes.map((note) => (
            <div key={note.id} className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-[var(--border-color)]/30 transition-colors ${activeId === note.id ? 'bg-violet-500/10' : 'hover:bg-white/5'}`} onClick={() => openNote(note)}>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate text-[var(--text-primary)]">{note.title}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{new Date(note.updatedAt).toLocaleDateString()}</p>
              </div>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-color)]">
          <input className="flex-1 bg-transparent outline-none text-base font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" placeholder="Note title..." value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} />
          <button className="btn btn-primary btn-sm" onClick={save}>
            <Save size={13} /> {dirty ? 'Save*' : 'Save'}
          </button>
        </div>
        <textarea
          className="flex-1 bg-transparent outline-none resize-none p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono leading-relaxed"
          placeholder="Start writing your note... (Ctrl+S to save)"
          value={content}
          onChange={(e) => { setContent(e.target.value); setDirty(true); }}
        />
      </div>
    </div>
  );
}
