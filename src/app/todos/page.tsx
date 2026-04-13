'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { Todo } from '@/lib/types';

export default function TodosPage() {
  const { data, updateData } = useLifeOS();
  const todos = data.todos || [];

  const completedCount = todos.filter(t => t.done).length;
  
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
    <div className="p-6 pb-24">
      <header className="mb-8 mt-4 relative">
        <h1 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">To-Do List</h1>
        <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">Quick Tasks</h2>
        
        {/* Progress Tracker */}
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <p className="text-sm text-zinc-400 font-semibold uppercase tracking-widest mb-1">Completed</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{completedCount}</span>
                <span className="text-zinc-500 font-medium">/ {todos.length}</span>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 relative z-10">
            <div 
              className={`h-full transition-all duration-700 bg-indigo-500`}
              style={{ width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </header>

      {/* Add Todo Form */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">New Task</h3>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex gap-3">
          <input
            type="text"
            placeholder="e.g. Buy groceries"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
            className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
             onClick={handleAddTodo}
             className="px-6 bg-white text-black hover:bg-zinc-200 font-bold tracking-wide uppercase rounded-xl transition-colors"
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
          <div className="space-y-3">
            {todos.map((t) => (
              <div key={t.id} className={`flex justify-between items-center bg-zinc-950 border p-4 rounded-xl group relative overflow-hidden transition-colors ${t.done ? 'border-indigo-500/30 bg-indigo-950/20' : 'border-zinc-800'}`}>
                {t.done && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/50"></div>}
                
                <div className="flex items-center gap-4 flex-1">
                  <button 
                    onClick={() => handleToggle(t.id)} 
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${t.done ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-zinc-600 hover:border-indigo-400'}`}
                  >
                    {t.done && <span className="text-xs font-bold">✓</span>}
                  </button>
                  <span className={`font-medium transition-all ${t.done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                    {t.text}
                  </span>
                </div>
                
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-red-500 bg-zinc-900 rounded-full transition-colors ml-2 flex-shrink-0"
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
