'use client';

import React from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';
import { calculateDailyScore } from '@/lib/scoring';
import { getGymStreak, getPrayerStreak, getProteinStreak } from '@/lib/streaks';

export default function Dashboard() {
  const { data, updateData, openQuickAdd, showFeedback } = useLifeOS();
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

  const gymDone = data.gym[today] === true;

  const latestWeight = data.weightLogs.length > 0 ? data.weightLogs[data.weightLogs.length - 1].weight : null;

  const gymStreak = getGymStreak(data);
  const prayerStreak = getPrayerStreak(data);
  const proteinStreak = getProteinStreak(data);

  const toggleGym = () => {
    const wasDone = data.gym[today] === true;
    updateData(prev => ({
      gym: { ...prev.gym, [today]: !prev.gym[today] }
    }));
    showFeedback(wasDone ? 'Gym marked undone' : 'Gym marked done ✓', 'success');
  };

  return (
    <div className="p-4 pb-24">
      {/* HEADER */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'short' })}</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">{new Date().getDate()} {new Date().toLocaleDateString('en-US', { month: 'short' })}</h1>
        </div>
        {latestWeight !== null && (
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl px-3 py-2">
            <p className="text-[10px] text-zinc-500 uppercase font-bold text-center">Weight</p>
            <p className="text-base font-bold text-white text-center">{latestWeight}<span className="text-xs font-normal text-zinc-500">kg</span></p>
          </div>
        )}
      </header>

      {/* TOP SECTION: Daily Score + Key Metrics */}
      <section className="mb-6 space-y-4">
        {/* Daily Score */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-5 shadow-lg shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mt-6 -mr-6" />
          <p className="text-white/80 text-sm font-medium tracking-wide mb-1">Daily Score</p>
          <div className="flex items-baseline gap-1">
            <h2 className="text-5xl font-black text-white tracking-tighter">{score}</h2>
            <span className="text-white/60 font-semibold text-lg">/ 100</span>
          </div>
        </div>

        {/* Protein & Prayer Progress Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Protein Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-2xl -mr-4 -mt-4" />
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">Protein</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-xl font-black text-white">{Math.round(totalProtein)}g</span>
              <span className="text-zinc-600 text-sm">/ {proteinGoal}g</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${totalProtein >= proteinGoal ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min((totalProtein / proteinGoal) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Prayer Card */}
          <Link href="/namaz" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden block hover:bg-zinc-800/50 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl -mr-4 -mt-4" />
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-2">Prayers</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-xl font-black text-white">{prayersDone}</span>
              <span className="text-zinc-600 text-sm">/ 5</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800/50">
              <div
                className="h-full rounded-full transition-all duration-500 bg-blue-500"
                style={{ width: `${(prayersDone / 5) * 100}%` }}
              />
            </div>
          </Link>
        </div>
      </section>

      {/* MIDDLE SECTION: CARD GRID */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Today&apos;s Status</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Gym Card */}
          <div
            onClick={toggleGym}
            className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98] ${gymDone ? 'bg-green-900/30 border-2 border-green-500' : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/70'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Gym</span>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${gymDone ? 'bg-green-500 border-green-500' : 'border-zinc-600'}`}>
                {gymDone && <span className="text-zinc-900 text-xs font-black">✓</span>}
              </div>
            </div>
            <p className={`text-xl font-black tracking-tight ${gymDone ? 'text-green-400' : 'text-white'}`}>
              {gymDone ? 'Done' : 'Pending'}
            </p>
          </div>

          {/* Diet Card */}
          <Link href="/diet" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden block hover:bg-zinc-800/50 transition-colors">
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Protein</span>
            <p className="text-xl font-black text-white tracking-tight">
              {Math.round(totalProtein)}<span className="text-sm font-normal text-zinc-600">/ {proteinGoal}g</span>
            </p>
          </Link>

          {/* Tasks Card */}
          <Link href="/calendar" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden block hover:bg-zinc-800/50 transition-colors">
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Tasks</span>
            <p className="text-xl font-black text-white tracking-tight">
              {tasksDone}<span className="text-sm font-normal text-zinc-600">/ {tasksToday.length}</span>
            </p>
            <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800/50 mt-2">
              <div
                className="h-full rounded-full transition-all duration-500 bg-indigo-500"
                style={{ width: `${tasksToday.length ? (tasksDone / tasksToday.length) * 100 : 0}%` }}
              />
            </div>
          </Link>

          {/* Namaz Card */}
          <Link href="/namaz" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 relative overflow-hidden block hover:bg-zinc-800/50 transition-colors">
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Namaz</span>
            <p className="text-xl font-black text-white tracking-tight">
              {prayersDone}<span className="text-sm font-normal text-zinc-600">/ 5</span>
            </p>
            <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800/50 mt-2">
              <div
                className="h-full rounded-full transition-all duration-500 bg-purple-500"
                style={{ width: `${(prayersDone / 5) * 100}%` }}
              />
            </div>
          </Link>
        </div>
      </section>

      {/* BOTTOM SECTION: Streaks & Quick Actions */}
      <section className="space-y-4">
        {/* Streaks */}
        <div>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Current Streaks</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-3 flex flex-col items-center shadow-sm">
              <span className="text-lg mb-1">🔥</span>
              <span className="text-base font-bold text-white">{gymStreak}</span>
              <span className="text-[10px] text-zinc-500 uppercase">Gym</span>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-3 flex flex-col items-center shadow-sm">
              <span className="text-lg mb-1">🕋</span>
              <span className="text-base font-bold text-white">{prayerStreak}</span>
              <span className="text-[10px] text-zinc-500 uppercase">Prayers</span>
            </div>
            <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-3 flex flex-col items-center shadow-sm">
              <span className="text-lg mb-1">🥩</span>
              <span className="text-base font-bold text-white">{proteinStreak}</span>
              <span className="text-[10px] text-zinc-500 uppercase">Protein</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => openQuickAdd('task')}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-xl py-3 text-sm font-semibold transition-colors active:scale-[0.98]"
            >
              + Task
            </button>
            <button
              onClick={() => openQuickAdd('meal')}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-xl py-3 text-sm font-semibold transition-colors active:scale-[0.98]"
            >
              + Meal
            </button>
            <Link
              href="/progress"
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-xl py-3 text-sm font-semibold transition-colors text-center block"
            >
              + Weight
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
