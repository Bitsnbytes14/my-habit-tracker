'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from './LifeOSProvider';
import { getTodayString } from '@/lib/storage';

export const QuickAddModal = () => {
  const { updateData, quickAddType, openQuickAdd, closeQuickAdd } = useLifeOS();
  const [title, setTitle] = useState('');
  
  const isOpen = quickAddType !== null;
  const currentType = quickAddType || 'task';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() && currentType !== 'workout') return;
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
            time: '12:00', // Default, can be edited in calendar
            done: false,
            type: 'task',
          },
        ];
      } else if (currentType === 'meal') {
        const mealsToday = draft.meals[today] || [];
        draft.meals = {
          ...draft.meals,
          [today]: [
            ...mealsToday,
            { id, type: 'Snack', name: title, protein: 0 },
          ],
        };
      } else if (currentType === 'workout') {
        const wTitle = title.trim() || 'Gym';
        draft.workouts = {
          ...draft.workouts,
          [today]: draft.workouts[today] || { type: 'Push', exercises: [] },
        };
        // Add a task for the workout directly in calendar for full schedule visibility
        draft.tasks = [
          ...draft.tasks,
          {
            id: `wo-${id}`,
            title: wTitle,
            date: today,
            time: '17:00', // Default gym time
            done: false,
            type: 'gym',
          },
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
          {(['task', 'meal', 'workout'] as const).map((t) => (
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

        {currentType !== 'workout' && (
           <input
            type="text"
            placeholder={currentType === 'task' ? "E.g., Read 10 pages" : "E.g., Banana"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 mb-6 focus:outline-none focus:border-indigo-500 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        )}
        
        {currentType === 'workout' && (
           <input
            type="text"
            placeholder="Workout Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 mb-6 focus:outline-none focus:border-indigo-500 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        )}

        <button
          onClick={handleSave}
          className="w-full bg-white text-black font-semibold rounded-xl py-4 hover:bg-zinc-200 transition-colors focus:outline-none"
        >
          Add {currentType.charAt(0).toUpperCase() + currentType.slice(1)}
        </button>
      </div>
    </div>
  );
};
