'use client';

import React from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';
import { PrayerState } from '@/lib/types';

const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export default function NamazPage() {
  const { data, updateData, showFeedback } = useLifeOS();
  const today = getTodayString();
  const todayPrayers = data.prayers[today];
  
  if (!todayPrayers) return null; // Wait for provider to seed it

  const doneCount = Object.values(todayPrayers).filter(val => val === 'done').length;

  const handleToggle = (prayer: keyof typeof todayPrayers) => {
    const currentState = todayPrayers[prayer];
    let nextState: PrayerState = 'pending';
    if (currentState === 'pending') nextState = 'done';
    else if (currentState === 'done') nextState = 'missed';
    else if (currentState === 'missed') nextState = 'pending';

    updateData((prev) => ({
      prayers: {
        ...prev.prayers,
        [today]: {
          ...prev.prayers[today],
          [prayer]: nextState
        }
      }
    }));

    // Show feedback
    if (nextState === 'done') {
      showFeedback(`${prayer} marked done ✓`, 'success');
    } else if (nextState === 'missed') {
      showFeedback(`${prayer} marked missed`, 'info');
    }
  };

  const getStateStyles = (state: PrayerState) => {
    if (state === 'done') return 'bg-green-900/30 border-2 border-green-500 text-green-400';
    if (state === 'missed') return 'bg-red-900/20 border-2 border-red-500/50 text-red-500 line-through opacity-70';
    return 'bg-zinc-900 border-2 border-zinc-800 text-zinc-300';
  };

  const getStateIcon = (state: PrayerState) => {
    if (state === 'done') return '✓';
    if (state === 'missed') return '✕';
    return '○';
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <header className="mb-6">
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Prayers</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Daily Namaz</h1>
      </header>

      {/* Progress Summary */}
      <section className="mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl -mr-4 -mt-4" />
          <div className="flex justify-between items-center mb-3 relative">
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Completed</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{doneCount}</span>
                <span className="text-zinc-600">/ 5</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Status</p>
              <span className={`text-lg font-black ${doneCount === 5 ? 'text-green-500' : doneCount >= 3 ? 'text-yellow-500' : 'text-red-500'}`}>
                {doneCount === 5 ? 'All Done ✓' : doneCount >= 3 ? 'On Track' : 'Start Praying'}
              </span>
            </div>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-2.5 border border-zinc-800/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${doneCount === 5 ? 'bg-green-500' : 'bg-purple-500'}`}
              style={{ width: `${(doneCount / 5) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* Prayer Cards */}
      <section className="space-y-3">
        {prayerOrder.map((prayer) => {
          const state = todayPrayers[prayer];
          return (
            <button
              key={prayer}
              onClick={() => handleToggle(prayer)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group active:scale-[0.98] ${getStateStyles(state)}`}
            >
              <div>
                <span className="block text-xl font-bold tracking-tight">{prayer}</span>
                <span className="text-xs uppercase tracking-wider font-semibold capitalize opacity-70">{state}</span>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black transition-colors ${
                state === 'done' ? 'bg-green-500 text-white' :
                state === 'missed' ? 'bg-red-500 text-white' :
                'bg-zinc-800 text-zinc-500'
              }`}>
                {getStateIcon(state)}
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}
