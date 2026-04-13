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
    <div className="p-6 pb-24 min-h-screen flex flex-col items-center justify-center relative bg-zinc-950">
      <header className="absolute top-10 left-6 text-left w-full absolute pt-4 pl-4 pointer-events-none">
        <h1 className="text-zinc-500 text-xs font-bold uppercase tracking-widest pl-2">Focus Mode</h1>
      </header>
      
      <div className="w-full max-w-sm space-y-12">
        
        {/* Task */}
        <div className="text-center">
          <h2 className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-4 border-b border-zinc-800/50 pb-2">Next Task</h2>
          {nextTask ? (
            <div>
               <p className="text-indigo-400 font-bold mb-2 tracking-widest">{nextTask.time}</p>
               <h3 className="text-4xl font-black text-white leading-tight">{nextTask.title}</h3>
            </div>
          ) : (
            <p className="text-2xl font-bold text-zinc-600">All tasks completed ✨</p>
          )}
        </div>

        {/* Prayer */}
        <div className="text-center">
          <h2 className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-4 border-b border-zinc-800/50 pb-2">Next Prayer</h2>
          {nextPrayer ? (
            <h3 className="text-4xl font-black text-white leading-tight">{nextPrayer}</h3>
          ) : (
            <p className="text-xl font-bold text-zinc-600">All prayers done 🕋</p>
          )}
        </div>

        {/* Non-negotiables simple block */}
        <div className="text-center pt-8">
          <h2 className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-4 border-b border-zinc-800/50 pb-2">Vital Needs</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 shadow-inner">
               <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Gym</p>
               <p className={`text-2xl font-black tracking-tight ${gymDone ? 'text-green-500' : 'text-zinc-400'}`}>
                 {gymDone ? 'Done' : 'Pending'}
               </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 shadow-inner">
               <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Protein</p>
               <p className="text-2xl font-black text-orange-400 tracking-tight">
                 {Math.round(remainingProtein)}g left
               </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
