'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from './LifeOSProvider';
import { getTodayString } from '@/lib/storage';

export const QuickAddModal = () => {
  const { updateData, quickAddType, openQuickAdd, closeQuickAdd } = useLifeOS();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  
  const isOpen = quickAddType !== null;
  const currentType = quickAddType || 'task';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTime('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert("Title is required!");
      return;
    }
    
    if (currentType === 'task' && !time) {
      alert("Time is required for tasks!");
      return;
    }

    const today = getTodayString();
    const id = Date.now().toString();

    updateData((prev) => {
      const draft = { ...prev };

      if (currentType === 'task') {
        draft.tasks = [
          ...draft.tasks,
          {
            id,
            title,
            date: today,
            time: time,
            done: false,
            type: 'task',
          },
        ];
      } else if (currentType === 'meal') {
        draft.meals = [
          ...draft.meals,
          { id, date: today, type: 'Snack', name: title, protein: 0 },
        ];
      }
      return draft;
    });

    closeQuickAdd();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={closeQuickAdd}
      />
      
      {/* Bottom Sheet */}
      <div className="relative bg-zinc-900 rounded-t-2xl p-6 w-full shadow-xl animate-in slide-in-from-bottom border-t border-zinc-800">
        <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
        <h2 className="text-xl font-bold text-white mb-6">Quick Add</h2>

        <div className="flex gap-2 mb-6">
          {(['task', 'meal'] as const).map((t) => (
            <button
              key={t}
              onClick={() => openQuickAdd(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                currentType === t 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder={currentType === 'task' ? "Task Title" : "Meal Name (e.g. Banana)"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 mb-4 focus:outline-none focus:border-indigo-500 transition-colors"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />

        {currentType === 'task' && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 ml-1">Time (Required)</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 dark:[color-scheme:dark]"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full bg-white text-black font-semibold rounded-xl py-4 hover:bg-zinc-200 transition-colors focus:outline-none mt-2"
        >
          Add {currentType.charAt(0).toUpperCase() + currentType.slice(1)}
        </button>
      </div>
    </div>
  );
};
