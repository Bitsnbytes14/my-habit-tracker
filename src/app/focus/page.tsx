'use client';

import React from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';

export default function FocusPage() {
  const { data } = useLifeOS();
  const today = getTodayString();

  // Next Task
  const todayTasks = data.tasks.filter(t => t.date === today && !t.done);
  todayTasks.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
  const nextTask = todayTasks.length > 0 ? todayTasks[0] : null;

  // Next Prayer
  const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
  const prayers = data.prayers[today] || {};
  const nextPrayer = prayerOrder.find(p => prayers[p] === 'pending' || !prayers[p]);

  // Gym
  const gymDone = data.gym[today] === true;

  // Protein
  const proteinGoal = data.settings?.proteinGoal || 150;
  const todayMeals = data.meals.filter(m => m.date === today);
  const totalProtein = todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const remainingProtein = Math.max(0, proteinGoal - totalProtein);

  return (
    <div className="p-4 pb-24 min-h-screen flex flex-col items-center justify-center relative bg-zinc-950">
      {/* Header */}
      <header className="absolute top-4 left-4">
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Focus Mode</p>
      </header>

      {/* Centered Content */}
      <div className="w-full max-w-xs space-y-8">
        {/* Next Task Card */}
        <div className="text-center">
          <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest mb-3">Next Task</p>
          {nextTask ? (
            <div>
              <p className="text-blue-400 font-bold text-lg mb-2 tracking-wider">{nextTask.time}</p>
              <h2 className="text-3xl font-black text-white leading-tight tracking-tight">{nextTask.title}</h2>
            </div>
          ) : (
            <p className="text-xl font-bold text-green-500">All tasks done!</p>
          )}
        </div>

        {/* Next Prayer Card */}
        <div className="text-center">
          <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest mb-3">Next Prayer</p>
          {nextPrayer ? (
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">{nextPrayer}</h2>
          ) : (
            <p className="text-xl font-bold text-green-500">All prayers done!</p>
          )}
        </div>

        {/* Vital Stats - Clean Grid */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <div className={`rounded-xl p-4 border text-center ${gymDone ? 'bg-green-900/30 border-green-500/50' : 'bg-zinc-900 border-zinc-800'}`}>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Gym</p>
            <p className={`text-xl font-black ${gymDone ? 'text-green-400' : 'text-zinc-400'}`}>
              {gymDone ? '✓ Done' : 'Pending'}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Protein</p>
            <p className={`text-xl font-black tracking-tight ${remainingProtein <= 0 ? 'text-green-400' : 'text-yellow-400'}`}>
              {remainingProtein > 0 ? `${Math.round(remainingProtein)}g` : 'Goal ✓'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
