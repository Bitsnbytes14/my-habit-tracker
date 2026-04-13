'use client';

import React from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';
import { calculateDailyScore } from '@/lib/scoring';
import { getGymStreak, getPrayerStreak, getProteinStreak } from '@/lib/streaks';

export default function Dashboard() {
  const { data, updateData, openQuickAdd } = useLifeOS();
  const today = getTodayString();

  // Score Calculation
  const score = calculateDailyScore(data, today);

  // Stats formatting
  const prayers = data.prayers[today] || {};
  const prayersDone = Object.values(prayers).filter(v => v === 'done').length;

  const tasksToday = data.tasks.filter(t => t.date === today);
  const tasksDone = tasksToday.filter(t => t.done).length;

  const mealsToday = data.meals.filter(m => m.date === today);
  const proteinGoal = data.settings?.proteinGoal || 150;
  const totalProtein = mealsToday.reduce((sum, m) => sum + (m.protein || 0), 0);
  const remainingProtein = Math.max(0, proteinGoal - totalProtein);

  const gymDone = data.gym[today] === true;
  const codingDone = data.coding?.[today] === true;
  
  const latestWeight = data.weightLogs.length > 0 ? data.weightLogs[data.weightLogs.length - 1].weight : null;

  const todos = data.todos || [];
  const todosDone = todos.filter(t => t.done).length;

  const journalToday = data.journal[today] || '';
  const hasJournalToday = journalToday.trim().length > 0;

  const displayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const gymStreak = getGymStreak(data);
  const prayerStreak = getPrayerStreak(data);
  const proteinStreak = getProteinStreak(data);

  const toggleGym = () => {
    updateData(prev => ({
      gym: { ...prev.gym, [today]: !prev.gym[today] }
    }));
  };

  const toggleCoding = () => {
    updateData(prev => ({
      coding: { ...(prev.coding || {}), [today]: !(prev.coding?.[today]) }
    }));
  };

  return (
    <div className="p-6 pb-24">
      <header className="mb-8 mt-4 flex justify-between items-end">
        <div>
          <h1 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Today</h1>
          <h2 className="text-3xl font-bold text-white tracking-tight">{displayDate}</h2>
        </div>
        {latestWeight !== null && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2">
            <p className="text-xs text-zinc-500 uppercase font-bold text-center">Weight</p>
            <p className="text-lg font-bold text-white text-center">{latestWeight}<span className="text-sm font-normal text-zinc-500">kg</span></p>
          </div>
        )}
      </header>

      {/* Score Card */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-lg shadow-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mt-10 -mr-10"></div>
          <p className="text-white/80 font-medium tracking-wide mb-2">Life Score</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-6xl font-black text-white tracking-tighter">{score}</h3>
            <span className="text-white/60 font-semibold text-xl">/ 100</span>
          </div>
        </div>
      </section>

      {/* Streaks Widget */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Streaks</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col items-center shadow-sm">
             <span className="text-xl mb-1">🔥</span>
             <span className="text-sm font-bold text-white">{gymStreak} Gym</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col items-center shadow-sm">
             <span className="text-xl mb-1">🕋</span>
             <span className="text-sm font-bold text-white">{prayerStreak} Prayers</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col items-center shadow-sm">
             <span className="text-xl mb-1">🥩</span>
             <span className="text-sm font-bold text-white">{proteinStreak} Protein</span>
          </div>
        </div>
      </section>

      {/* Protein Progress */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Protein Progress</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{Math.round(totalProtein)}g</span>
                <span className="text-zinc-500 font-medium text-sm">/ {proteinGoal}g</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-orange-400">{Math.round(remainingProtein)}g left</span>
            </div>
          </div>
          
          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 relative z-10">
            <div 
              className={`h-full transition-all duration-700 ${totalProtein >= proteinGoal ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min((totalProtein / proteinGoal) * 100, 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Non-Negotiables Section */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Non-Negotiables</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/50">
          {/* Gym Toggle */}
          <div onClick={toggleGym} className="flex justify-between items-center p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <span className="font-semibold text-white">Gym Completed</span>
            <div className={`w-6 h-6 rounded-md border-2 flex flex-shrink-0 items-center justify-center transition-colors ${gymDone ? 'bg-green-500 border-green-500' : 'border-zinc-600'}`}>
               {gymDone && <span className="text-zinc-900 text-xs font-black">✓</span>}
            </div>
          </div>
          {/* Coding Toggle */}
          <div onClick={toggleCoding} className="flex justify-between items-center p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <span className="font-semibold text-white">Coding / Work</span>
            <div className={`w-6 h-6 rounded-md border-2 flex flex-shrink-0 items-center justify-center transition-colors ${codingDone ? 'bg-green-500 border-green-500' : 'border-zinc-600'}`}>
               {codingDone && <span className="text-zinc-900 text-xs font-black">✓</span>}
            </div>
          </div>
          {/* Prayers Indicator */}
           <Link href="/namaz" className="flex justify-between items-center p-4 hover:bg-zinc-800/50 transition-colors group">
             <span className="font-semibold text-white">All 5 Prayers</span>
             <div className="flex items-center gap-2">
               {prayersDone === 5 ? (
                 <span className="text-green-500 font-bold">Done</span>
               ) : (
                 <span className="text-sm font-semibold text-zinc-400">{prayersDone}/5</span>
               )}
               <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-sm">→</span>
             </div>
           </Link>
        </div>
      </section>

      {/* Tasks & Trackers Grid */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-zinc-400 text-xs font-semibold uppercase mb-2">Tasks</h4>
          <p className="text-2xl font-bold text-white mb-2">{tasksDone} <span className="text-sm font-normal text-zinc-500">/ {tasksToday.length}</span></p>
          <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
             <div className="h-full bg-indigo-500 transition-all" style={{ width: `${tasksToday.length ? (tasksDone / tasksToday.length) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-zinc-400 text-xs font-semibold uppercase mb-2">To-Dos</h4>
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-2xl font-bold text-white">{todosDone} <span className="text-sm font-normal text-zinc-500">/ {todos.length}</span></p>
          </div>
          <Link href="/todos" className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 w-fit">View List →</Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between col-span-2">
          <h4 className="text-zinc-400 text-xs font-semibold uppercase mb-2">Journal</h4>
          <div className="flex justify-between items-baseline">
            <p className={`text-lg font-bold tracking-tight ${hasJournalToday ? 'text-green-400' : 'text-zinc-500'}`}>
              {hasJournalToday ? 'Journal done' : 'Not written yet'}
            </p>
            <Link href="/journal" className="text-xs text-indigo-400 font-semibold hover:text-indigo-300">Open Journal →</Link>
          </div>
        </div>
      </section>

      {/* Quick Add Actions */}
      <section>
        <h3 className="text-zinc-300 font-semibold mb-4">Quick Actions</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => openQuickAdd('task')}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl py-3 text-sm font-medium text-white shadow-sm border border-zinc-700/50"
          >
            + Task
          </button>
        </div>
      </section>
    </div>
  );
}
