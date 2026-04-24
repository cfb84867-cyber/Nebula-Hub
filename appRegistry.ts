import { NotebookPen, Calculator, CheckSquare } from 'lucide-react';

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'productivity' | 'utility' | 'creative';
  color: string;
}

export const APP_REGISTRY: AppDefinition[] = [
  {
    id: 'notes',
    name: 'Notes',
    description: 'Rich text notes with local persistence',
    icon: '📝',
    category: 'productivity',
    color: '#f59e0b',
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Standard and scientific calculator',
    icon: '🧮',
    category: 'utility',
    color: '#3b82f6',
  },
  {
    id: 'todo',
    name: 'To-Do List',
    description: 'Task manager with priorities and due dates',
    icon: '✅',
    category: 'productivity',
    color: '#10b981',
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Customize themes, preferences, and admin access',
    icon: '⚙️',
    category: 'utility',
    color: '#6b7280',
  },
];

export const getApp = (id: string) => APP_REGISTRY.find((a) => a.id === id);
