'use client';

import React from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';
import { PrayerState } from '@/lib/types';

const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export default function NamazPage() {
  const { data, updateData } = useLifeOS();
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
  };

  const getStateStyles = (state: PrayerState) => {
    if (state === 'done') return 'bg-purple-600/20 border-purple-500/50 text-purple-400';
    if (state === 'missed') return 'bg-red-900/20 border-red-800/50 text-red-500 line-through opacity-70';
    return 'bg-zinc-950 border-zinc-800 text-zinc-300';
  };

  const getStateIcon = (state: PrayerState) => {
    if (state === 'done') return '✓';
    if (state === 'missed') return '✕';
    return '○';
  };

  return (
    <div className="p-6 pb-24">
      <header className="mb-10 mt-4 text-center">
        <h1 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Today&apos;s Prayers</h1>
        <div className="inline-flex items-end gap-2">
          <span className="text-5xl font-black text-white">{doneCount}</span>
          <span className="text-xl font-bold text-zinc-500 mb-1">/ 5</span>
        </div>
        <div className="w-full bg-zinc-900 h-2 rounded-full mt-4 overflow-hidden border border-zinc-800 flex">
          <div 
            className="h-full bg-purple-500 transition-all duration-500"
            style={{ width: `${(doneCount / 5) * 100}%` }}
          />
        </div>
      </header>

      <div className="space-y-4">
        {prayerOrder.map((prayer) => {
          const state = todayPrayers[prayer];
          return (
            <button
              key={prayer}
              onClick={() => handleToggle(prayer)}
              className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between group active:scale-[0.98] ${getStateStyles(state)}`}
            >
              <div>
                <span className="block text-2xl font-bold tracking-tight mb-1">{prayer}</span>
                <span className="text-xs uppercase tracking-widest font-semibold opacity-70">{state}</span>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black transition-colors ${state === 'done' ? 'bg-purple-500 text-white' : state === 'missed' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-600'}`}>
                {getStateIcon(state)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
