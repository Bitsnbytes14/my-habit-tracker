'use client';

import React from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';
import { calculateDailyScore } from '@/lib/scoring';

export default function Dashboard() {
  const { data, openQuickAdd } = useLifeOS();
  const today = getTodayString();

  // Score Calculation
  const score = calculateDailyScore(data, today);

  // Stats formatting
  const prayers = data.prayers[today] || {};
  const prayersDone = Object.values(prayers).filter(v => v === 'done').length;

  const tasksToday = data.tasks.filter(t => t.date === today);
  const tasksDone = tasksToday.filter(t => t.done).length;

  const mealsToday = data.meals[today] || [];
  const proteinGoal = data.settings?.proteinGoal || 150;
  const totalProtein = mealsToday.reduce((sum, m) => sum + (m.protein || 0), 0);

  const workoutToday = data.workouts[today];
  const gymDone = workoutToday && (workoutToday.type === 'Rest' || (workoutToday.exercises && workoutToday.exercises.length > 0));

  const displayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="p-6 pb-24">
      <header className="mb-8 mt-4">
        <h1 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Today</h1>
        <h2 className="text-3xl font-bold text-white tracking-tight">{displayDate}</h2>
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

      {/* Summary Stats Grid */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-zinc-400 text-xs font-semibold uppercase mb-2">Prayers</h4>
          <p className="text-2xl font-bold text-white">{prayersDone} <span className="text-sm font-normal text-zinc-500">/ 5</span></p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-zinc-400 text-xs font-semibold uppercase mb-2">Tasks</h4>
          <p className="text-2xl font-bold text-white">{tasksDone} <span className="text-sm font-normal text-zinc-500">/ {tasksToday.length}</span></p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-zinc-400 text-xs font-semibold uppercase mb-2">Protein</h4>
          <p className="text-2xl font-bold text-white">{Math.round(totalProtein)}g <span className="text-sm font-normal text-zinc-500">/ {proteinGoal}g</span></p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
          <h4 className="text-zinc-400 text-xs font-semibold uppercase mb-2">Gym</h4>
          <p className={`text-xl tracking-tight font-bold ${gymDone ? 'text-green-400' : 'text-zinc-500'}`}>
            {gymDone ? 'Completed' : 'Pending'}
          </p>
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
          <button 
            onClick={() => openQuickAdd('meal')}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl py-3 text-sm font-medium text-white shadow-sm border border-zinc-700/50"
          >
            + Meal
          </button>
          <button 
            onClick={() => openQuickAdd('workout')}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-xl py-3 text-sm font-medium text-white shadow-sm border border-zinc-700/50"
          >
            + Workout
          </button>
        </div>
      </section>
    </div>
  );
}
