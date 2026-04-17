'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useLifeOS } from './LifeOSProvider';
import { getTodayString } from '@/lib/storage';

export const QuickAddModal = () => {
  const { updateData, quickAddType, openQuickAdd, closeQuickAdd, showFeedback } = useLifeOS();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [weight, setWeight] = useState('');

  const isOpen = quickAddType !== null;
  const currentType = quickAddType || 'task';

  // Reset form when modal opens
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTime('');
      setWeight('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() && currentType !== 'weight') {
      alert("Title is required!");
      return;
    }

    if (currentType === 'task' && !time) {
      alert("Time is required for tasks!");
      return;
    }

    if (currentType === 'weight' && !weight) {
      alert("Weight value is required!");
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
      } else if (currentType === 'weight') {
        const val = parseFloat(weight);
        if (val > 0) {
          const filtered = draft.weightLogs.filter(w => w.date !== today);
          draft.weightLogs = [...filtered, { date: today, weight: val }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
      }
      return draft;
    });

    // Show feedback
    if (currentType === 'task') {
      showFeedback('Task added ✓', 'success');
    } else if (currentType === 'meal') {
      showFeedback('Meal added ✓', 'success');
    } else if (currentType === 'weight') {
      showFeedback('Weight logged ✓', 'success');
    }

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
          {(['task', 'meal', 'weight'] as const).map((t) => (
            <button
              key={t}
              onClick={() => openQuickAdd(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                currentType === t 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {currentType === 'weight' ? (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 ml-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 70.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder={currentType === 'task' ? "Task Title" : "Meal Name (e.g. Chicken)"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 mb-4 focus:outline-none focus:border-blue-500 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />

            {currentType === 'task' && (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 ml-1">Time (Required)</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 dark:[color-scheme:dark]"
                />
              </div>
            )}
          </>
        )}

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white font-semibold rounded-xl py-4 hover:bg-blue-500 transition-colors focus:outline-none mt-2 shadow-lg shadow-blue-600/20"
        >
          {currentType === 'weight' ? 'Log Weight' : `Add ${currentType.charAt(0).toUpperCase() + currentType.slice(1)}`}
        </button>
      </div>
    </div>
  );
};
