'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { Todo } from '@/lib/types';

export default function TodosPage() {
  const { data, updateData } = useLifeOS();
  const todos = data.todos || [];

  const completedCount = todos.filter(t => t.done).length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  const [text, setText] = useState('');

  const handleAddTodo = () => {
    if (!text.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: text.trim(),
      done: false,
    };

    updateData(prev => ({
      todos: [...(prev.todos || []), newTodo]
    }));
    setText('');
    // Could show feedback here if we had showFeedback
  };

  const handleToggle = (id: string) => {
    updateData(prev => ({
      todos: prev.todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
    }));
  };

  const handleDelete = (id: string) => {
    updateData(prev => ({
      todos: prev.todos.filter(t => t.id !== id)
    }));
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <header className="mb-6">
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Tasks</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Quick Tasks</h1>
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
                <span className="text-zinc-600">/ {todos.length}</span>
              </div>
            </div>
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
             className="px-5 bg-blue-600 text-white hover:bg-blue-500 font-bold rounded-lg transition-colors"
           >
             Add
           </button>
        </div>
      </section>

      {/* Todos List */}
      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Your Tasks</h3>
        {todos.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500 text-sm">
            No quick tasks added yet.
          </div>
        ) : (
          <div className="space-y-2">
            {todos.map((t) => (
              <div key={t.id} className={`flex justify-between items-center bg-zinc-900 border p-4 rounded-xl group relative overflow-hidden transition-colors ${t.done ? 'border-green-500/30 bg-green-950/10' : 'border-zinc-800'}`}>
                {t.done && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}

                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => handleToggle(t.id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${t.done ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-600 hover:border-green-400'}`}
                  >
                    {t.done && <span className="text-xs font-black">✓</span>}
                  </button>
                  <span className={`font-medium transition-all ${t.done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                    {t.text}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(t.id)}
                  className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-red-500 bg-zinc-950 rounded-full transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
