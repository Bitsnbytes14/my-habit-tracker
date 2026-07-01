'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { Todo } from '@/lib/types';

export default function TodosPage() {
  const { data, updateData, showFeedback } = useLifeOS();
  const todos = data.todos || [];

  // Filter active and archived tasks
  const activeTodos = todos.filter(t => !t.archived);
  const archivedTodos = todos.filter(t => t.archived);

  const completedCount = activeTodos.filter(t => t.done).length;
  const progress = activeTodos.length > 0 ? (completedCount / activeTodos.length) * 100 : 0;

  const [text, setText] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const handleAddTodo = () => {
    if (!text.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: text.trim(),
      done: false,
      archived: false,
    };

    updateData(prev => ({
      todos: [...(prev.todos || []), newTodo]
    }));
    setText('');
    showFeedback('Task added ✓', 'success');
  };

  const handleToggle = (id: string) => {
    updateData(prev => ({
      todos: prev.todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
    }));
  };

  const handleArchive = (id: string) => {
    updateData(prev => ({
      todos: prev.todos.map(t => t.id === id ? { ...t, archived: true } : t)
    }));
    showFeedback('Task archived 📥', 'info');
  };

  const handleUnarchive = (id: string) => {
    updateData(prev => ({
      todos: prev.todos.map(t => t.id === id ? { ...t, archived: false } : t)
    }));
    showFeedback('Task restored 📤', 'info');
  };

  const handleDelete = (id: string) => {
    const isArchived = todos.find(t => t.id === id)?.archived;
    updateData(prev => ({
      todos: prev.todos.filter(t => t.id !== id)
    }));
    showFeedback('Task deleted permanently ✕', 'info');
  };

  const handleArchiveCompleted = () => {
    const completedActive = activeTodos.filter(t => t.done);
    if (completedActive.length === 0) {
      showFeedback('No completed tasks to archive', 'info');
      return;
    }

    updateData(prev => ({
      todos: prev.todos.map(t => t.done && !t.archived ? { ...t, archived: true } : t)
    }));
    showFeedback(`Archived ${completedActive.length} tasks 📥`, 'success');
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Tasks</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">To-Do List</h1>
        </div>
        {activeTodos.length > 0 && completedCount > 0 && (
          <button
            onClick={handleArchiveCompleted}
            className="text-xs bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Archive Completed
          </button>
        )}
      </header>

      {/* Progress Card */}
      <section className="mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-end mb-4 relative">
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Completed</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{completedCount}</span>
                <span className="text-zinc-600">/ {activeTodos.length}</span>
              </div>
            </div>
            {activeTodos.length > 0 && (
              <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">
                {Math.round(progress)}%
              </span>
            )}
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800/50">
            <div
              className="h-full rounded-full transition-all duration-500 bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* Add Todo Form */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">New Task</h3>
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex gap-2">
          <input
            type="text"
            placeholder="e.g. Buy groceries"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
             onClick={handleAddTodo}
             className="px-5 bg-blue-600 text-white hover:bg-blue-500 font-bold rounded-lg transition-colors active:scale-95"
           >
             Add
           </button>
        </div>
      </section>

      {/* Todos List */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Active Tasks</h3>
        {activeTodos.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500 text-sm">
            No active tasks. Add a new task above!
          </div>
        ) : (
          <div className="space-y-2">
            {activeTodos.map((t) => (
              <div key={t.id} className={`flex justify-between items-center bg-zinc-900 border p-4 rounded-xl group relative overflow-hidden transition-colors ${t.done ? 'border-green-500/30 bg-green-950/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                {t.done && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}

                <div className="flex items-center gap-3 flex-1 mr-2 min-w-0">
                  <button
                    onClick={() => handleToggle(t.id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${t.done ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-600 hover:border-green-400'}`}
                  >
                    {t.done && <span className="text-xs font-black">✓</span>}
                  </button>
                  <span className={`font-medium transition-all break-words min-w-0 ${t.done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                    {t.text}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {t.done && (
                    <button
                      onClick={() => handleArchive(t.id)}
                      className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-blue-400 bg-zinc-950 rounded-full transition-colors"
                      title="Archive Task"
                    >
                      📥
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-red-500 bg-zinc-950 rounded-full transition-colors"
                    title="Delete Task"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Archived Section */}
      <section className="border-t border-zinc-900 pt-6">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex justify-between items-center w-full px-2 py-1 text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors"
        >
          <span>Archived Tasks ({archivedTodos.length})</span>
          <span className="text-sm font-semibold transform transition-transform duration-200">
            {showArchived ? '▼' : '►'}
          </span>
        </button>

        {showArchived && (
          <div className="mt-3 space-y-2 animate-in fade-in duration-200">
            {archivedTodos.length === 0 ? (
              <div className="bg-zinc-900/20 border border-zinc-900/50 rounded-xl p-4 text-center text-zinc-600 text-xs">
                No archived tasks.
              </div>
            ) : (
              archivedTodos.map((t) => (
                <div key={t.id} className="flex justify-between items-center bg-zinc-900/60 border border-zinc-900 p-3 rounded-xl">
                  <span className="text-zinc-500 text-sm line-through truncate flex-1 mr-3">
                    {t.text}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleUnarchive(t.id)}
                      className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-green-400 bg-zinc-950 rounded-full transition-colors"
                      title="Restore to Active"
                    >
                      📤
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-red-500 bg-zinc-950 rounded-full transition-colors"
                      title="Delete Permanently"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
