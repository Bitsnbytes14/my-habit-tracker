'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString, getOffsetDateString } from '@/lib/storage';
import { calculateDailyScore } from '@/lib/scoring';
import { getGymStreak, getPrayerStreak, getJournalStreak } from '@/lib/streaks';

export default function ProgressPage() {
  const { data, updateData } = useLifeOS();
  const today = getTodayString();
  
  // Weight Log State
  const [weightInput, setWeightInput] = useState('');

  const handleSaveWeight = () => {
    const val = parseFloat(weightInput);
    if (!val || val <= 0) return;

    updateData((prev) => {
      const filtered = prev.weightLogs.filter(w => w.date !== today);
      return {
        weightLogs: [...filtered, { date: today, weight: val }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      };
    });
    setWeightInput('');
  };

  // --- Calculations ---

  // Weight Chart (Last 7)
  const last7Weights = [...data.weightLogs].reverse().slice(0, 7).reverse();
  const maxWeight = Math.max(...last7Weights.map(w => w.weight), 1);
  const minWeight = Math.min(...last7Weights.map(w => w.weight), maxWeight);
  const weightRange = maxWeight - minWeight === 0 ? 10 : maxWeight - minWeight;

  // Weekly Score (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) => getOffsetDateString(-i)).reverse();
  const weeklyScores = last7Days.map(date => ({
    date,
    dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    score: calculateDailyScore(data, date)
  }));
  const avgScore = Math.round(weeklyScores.reduce((acc, curr) => acc + curr.score, 0) / 7);

  // New Weekly Review Stats
  const gymDaysThisWeek = last7Days.filter(d => data.gym[d] === true).length;
  
  let totalPrayersTracked = 0;
  let prayersDoneThisWeek = 0;
  last7Days.forEach(d => {
    const p = data.prayers[d];
    if (p) {
      totalPrayersTracked += 5;
      prayersDoneThisWeek += Object.values(p).filter(v => v === 'done').length;
    }
  });
  const prayerCompletionPct = totalPrayersTracked > 0 
    ? Math.round((prayersDoneThisWeek / totalPrayersTracked) * 100) 
    : 0;

  let totalProteinThisWeek = 0;
  last7Days.forEach(d => {
    const dayMeals = data.meals.filter(m => m.date === d);
    totalProteinThisWeek += dayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
  });
  const avgProteinThisWeek = Math.round(totalProteinThisWeek / 7);

  // Streak Counters
  const prayerStreak = getPrayerStreak(data);
  const gymStreak = getGymStreak(data);
  const journalStreak = getJournalStreak(data);

  return (
    <div className="p-6 pb-24 min-h-screen">
      <header className="mb-8 mt-4 relative">
        <h1 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Analytics</h1>
        <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">Progress Hub</h2>
      </header>

      {/* Weekly Score Summary */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Weekly Score</h3>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl overflow-hidden shadow-inner relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex items-end gap-2 mb-6 relative z-10">
            <span className="text-5xl font-black text-indigo-400 tracking-tighter">{avgScore}</span>
            <span className="text-zinc-500 font-medium mb-1">Avg Score</span>
          </div>
          <div className="flex justify-between items-end h-24 gap-1 relative z-10">
            {weeklyScores.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex justify-center h-full items-end group relative">
                    <span className="absolute -top-6 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.score}
                    </span>
                   <div 
                     className="w-full max-w-[20px] bg-indigo-500 rounded-t-sm transition-all duration-700 shadow-sm"
                     style={{ height: `${Math.max((day.score / 100) * 100, 5)}%` }}
                   />
                </div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold">{day.dayName}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Review / Stats Review */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">7-Day Review</h3>
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Gym Days</span>
              <p className="text-3xl font-black text-white mt-1">{gymDaysThisWeek} <span className="text-sm font-medium text-zinc-500">/ 7</span></p>
           </div>
           <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Avg Protein</span>
              <p className="text-3xl font-black text-white mt-1">{avgProteinThisWeek} <span className="text-sm font-medium text-zinc-500">g/d</span></p>
           </div>
           <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-between col-span-2">
              <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Prayer Completion</span>
              <div className="flex items-center justify-between mt-2">
                 <p className="text-3xl font-black text-white">{prayerCompletionPct}%</p>
                 <div className="w-1/2 bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${prayerCompletionPct}%` }} />
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Streak Counters */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Global Streaks</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 w-full h-1 bg-purple-500"></div>
            <span className="text-3xl mb-1 mt-2">🕋</span>
            <span className="text-2xl font-black text-white">{prayerStreak}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Days</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-orange-500"></div>
            <span className="text-3xl mb-1 mt-2">💪</span>
            <span className="text-2xl font-black text-white">{gymStreak}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Days</span>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-blue-500"></div>
            <span className="text-3xl mb-1 mt-2">✍️</span>
            <span className="text-2xl font-black text-white">{journalStreak}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Days</span>
          </div>
        </div>
      </section>

      {/* Weight Log */}
      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Weight Tracking</h3>
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl mb-4 flex gap-3">
           <input
             type="number"
             step="0.1"
             placeholder="Current Weight (kg)"
             value={weightInput}
             onChange={e => setWeightInput(e.target.value)}
             className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
           />
           <button
             onClick={handleSaveWeight}
             className="px-6 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
           >
             Log
           </button>
        </div>

        {last7Weights.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl h-40 flex items-end gap-2 justify-between px-6 pt-10">
             {last7Weights.map((w, i) => {
                const pxDate = new Date(w.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                let heightPerc = 20;
                if (weightRange > 0) {
                  heightPerc = 20 + ((w.weight - (minWeight - 5)) / (weightRange + 5)) * 80;
                }

                return (
                  <div key={w.date} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                    <span className="absolute -top-6 text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {w.weight} kg
                    </span>
                    <div 
                      className="w-full max-w-[16px] bg-zinc-700/50 rounded-t-sm hover:bg-indigo-400 transition-all duration-300"
                      style={{ height: `${Math.min(heightPerc, 100)}%` }}
                    />
                    <span className="text-[10px] text-zinc-500 mt-2 font-medium">{pxDate}</span>
                  </div>
                )
             })}
          </div>
        )}
      </section>
    </div>
  );
}
