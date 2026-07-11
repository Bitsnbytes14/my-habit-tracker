'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString, getOffsetDateString } from '@/lib/storage';
import { calculateDailyScore } from '@/lib/scoring';
import { getGymStreak, getPrayerStreak, getJournalStreak, getCollegeStreak, getProteinStreak } from '@/lib/streaks';
import { attendanceConfig } from '@/lib/attendance';

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

  // Weight baseline & changes
  const baselineWeight = data.weightLogs.length > 0 ? data.weightLogs[0].weight : null;
  const latestWeight = data.weightLogs.length > 0 ? data.weightLogs[data.weightLogs.length - 1].weight : null;
  
  let weightChangeText = 'N/A';
  let weightChangeDirection = '';
  if (data.weightLogs.length >= 2 && baselineWeight !== null && latestWeight !== null) {
    const diff = latestWeight - baselineWeight;
    const absDiff = Math.abs(diff).toFixed(1);
    if (diff > 0) {
      weightChangeText = `Increased by ${absDiff} kg`;
      weightChangeDirection = 'increased';
    } else if (diff < 0) {
      weightChangeText = `Decreased by ${absDiff} kg`;
      weightChangeDirection = 'decreased';
    } else {
      weightChangeText = 'Unchanged (0.0 kg)';
      weightChangeDirection = 'unchanged';
    }
  }

  // Weight Chart (Last 7)
  const last7Weights = [...data.weightLogs].reverse().slice(0, 7).reverse();
  const maxWeight = Math.max(...last7Weights.map(w => w.weight), 1);
  const minWeight = Math.min(...last7Weights.map(w => w.weight), maxWeight);
  const weightRange = maxWeight - minWeight === 0 ? 10 : maxWeight - minWeight;

  // Tracked Dates History
  const trackedDates = new Set([
    ...Object.keys(data.gym),
    ...Object.keys(data.prayers),
    ...Object.keys(data.journal),
    ...Object.keys(data.coding || {}),
    ...Object.keys(data.college || {}),
    ...data.meals.map(m => m.date),
    ...data.weightLogs.map(w => w.date)
  ]);
  const daysTracked = trackedDates.size;

  // Last 7 Days Metrics
  const last7Days = Array.from({ length: 7 }, (_, i) => getOffsetDateString(-i)).reverse();
  
  // Weekly Score
  const weeklyScores = last7Days.map(date => calculateDailyScore(data, date));
  const avgScore = Math.round(weeklyScores.reduce((acc, curr) => acc + curr, 0) / 7);

  // Gym Completion
  const gymDaysThisWeek = last7Days.filter(d => data.gym[d] === true).length;
  const gymPct = (gymDaysThisWeek / 7) * 100;

  // College Completion
  const collegeDaysThisWeek = last7Days.filter(d => data.college?.[d] === true).length;
  const collegePct = (collegeDaysThisWeek / 7) * 100;

  // Namaz
  let prayersDoneThisWeek = 0;
  last7Days.forEach(d => {
    const p = data.prayers[d];
    if (p) {
      prayersDoneThisWeek += Object.values(p).filter(v => v === 'done').length;
    }
  });
  const prayerPct = (prayersDoneThisWeek / 35) * 100;

  // Protein Goal Achievement
  let proteinGoalMetDays = 0;
  let totalProteinThisWeek = 0;
  let totalCaloriesThisWeek = 0;
  const proteinGoal = data.settings?.proteinGoal || 120;
  last7Days.forEach(d => {
    const dayMeals = data.meals.filter(m => m.date === d);
    const dayProtein = dayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
    const dayCalories = dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
    totalProteinThisWeek += dayProtein;
    totalCaloriesThisWeek += dayCalories;
    if (dayProtein >= proteinGoal) {
      proteinGoalMetDays++;
    }
  });
  const proteinGoalPct = (proteinGoalMetDays / 7) * 100;
  const avgProtein = Math.round(totalProteinThisWeek / 7);
  const avgCalories = Math.round(totalCaloriesThisWeek / 7);

  // Timetable Attendance Overall
  const attendance = data.attendance || {};
  const totalClasses = attendanceConfig.reduce((sum, subject) => sum + subject.classes.length, 0);
  const totalAttended = attendanceConfig.reduce((sum, subject) => {
    return sum + subject.classes.filter((c) => attendance[c.id]).length;
  }, 0);
  const overallAttendancePct = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

  // Secondary Weekly Stats
  const journalDaysThisWeek = last7Days.filter(d => {
    const j = data.journal[d];
    return !!(j && j.trim().length > 0);
  }).length;
  const journalPct = (journalDaysThisWeek / 7) * 100;

  const activeTodos = data.todos ? data.todos.filter(t => !t.archived) : [];
  const doneActiveTodos = activeTodos.filter(t => t.done).length;
  const todoPct = activeTodos.length > 0 ? (doneActiveTodos / activeTodos.length) * 100 : 0;

  // Subject Attendance stats, sorted by lowest % first
  const subjectGroups = [
    { label: 'Compiler Construction', matcher: (name: string) => name === 'Compiler Construction' },
    { label: 'Data Science', matcher: (name: string) => name.startsWith('Data Science') },
    { label: 'HCI', matcher: (name: string) => name === 'HCI' },
    { label: 'Cybersecurity', matcher: (name: string) => name === 'Cybersecurity' },
    { label: 'DevOps', matcher: (name: string) => name.startsWith('DevOps') },
    { label: 'Flexi', matcher: (name: string) => name === 'Flexi' }
  ];

  const subjectStats = subjectGroups.map(group => {
    const matchingSubjects = attendanceConfig.filter(s => group.matcher(s.name));
    let total = 0;
    let attended = 0;
    matchingSubjects.forEach(subject => {
      total += subject.classes.length;
      attended += subject.classes.filter(c => attendance[c.id]).length;
    });
    const percentage = total > 0 ? (attended / total) * 100 : 0;
    return { name: group.label, attended, total, percentage };
  }).sort((a, b) => a.percentage - b.percentage);

  // Streaks
  const prayerStreak = getPrayerStreak(data);
  const gymStreak = getGymStreak(data);
  const collegeStreak = getCollegeStreak(data);
  const journalStreak = getJournalStreak(data);
  const proteinStreak = getProteinStreak(data);
  const bestStreak = Math.max(gymStreak, collegeStreak, prayerStreak, proteinStreak, journalStreak);

  // Highest score calculation
  let highestScore = 0;
  trackedDates.forEach(date => {
    const s = calculateDailyScore(data, date);
    if (s > highestScore) highestScore = s;
  });

  // Rolling 30 Days Metrics (Monthly Overview)
  const last30Days = Array.from({ length: 30 }, (_, i) => getOffsetDateString(-i));
  const activeDaysLast30 = last30Days.filter(d => trackedDates.has(d)).length;
  const gymDaysLast30 = last30Days.filter(d => data.gym[d] === true).length;
  const collegeDaysLast30 = last30Days.filter(d => data.college?.[d] === true).length;
  
  let proteinGoalMetLast30 = 0;
  let last30ScoresSum = 0;
  let journalEntriesLast30 = 0;

  last30Days.forEach(d => {
    const dayMeals = data.meals.filter(m => m.date === d);
    const dayProtein = dayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
    if (dayProtein >= proteinGoal && dayMeals.length > 0) {
      proteinGoalMetLast30++;
    }
    last30ScoresSum += calculateDailyScore(data, d);
    
    const j = data.journal[d];
    if (j && j.trim().length > 0) {
      journalEntriesLast30++;
    }
  });
  const avgScoreLast30 = Math.round(last30ScoresSum / 30);

  // Global Totals (Progress Cards)
  const totalGymDays = Object.values(data.gym).filter(Boolean).length;
  const totalCollegeDays = Object.values(data.college || {}).filter(Boolean).length;
  
  let totalPrayersDone = 0;
  Object.values(data.prayers).forEach(p => {
    totalPrayersDone += Object.values(p).filter(v => v === 'done').length;
  });

  const proteinByDate: Record<string, number> = {};
  data.meals.forEach(m => {
    proteinByDate[m.date] = (proteinByDate[m.date] || 0) + (m.protein || 0);
  });
  const totalProteinDaysAchieved = Object.values(proteinByDate).filter(p => p >= proteinGoal).length;
  const totalJournalEntries = Object.values(data.journal).filter(j => j && j.trim().length > 0).length;
  const totalTodosCompleted = data.todos.filter(t => t.done).length;

  // Weekly Insights
  let insights: string[] = [];
  const hasEnoughData = trackedDates.size >= 7;

  if (hasEnoughData) {
    // Gym
    insights.push(`You completed Gym on ${gymDaysThisWeek} days this week.`);
    
    // College
    insights.push(`You attended college ${collegeDaysThisWeek}/7 days this week.`);
    
    // Protein
    insights.push(`Protein goal achieved on ${proteinGoalMetDays} of the last 7 days.`);

    // Daily Score comparison
    const prev7Days = Array.from({ length: 7 }, (_, i) => getOffsetDateString(-i - 7)).reverse();
    const prevWeeklyScores = prev7Days.map(date => calculateDailyScore(data, date));
    const prevAvgScore = Math.round(prevWeeklyScores.reduce((acc, curr) => acc + curr, 0) / 7);
    const scoreDiff = avgScore - prevAvgScore;
    if (scoreDiff > 0) {
      insights.push(`Average Daily Score increased by ${scoreDiff} points compared to the previous week.`);
    } else if (scoreDiff < 0) {
      insights.push(`Average Daily Score decreased by ${Math.abs(scoreDiff)} points compared to the previous week.`);
    } else {
      insights.push(`Average Daily Score remained steady compared to the previous week.`);
    }

    // Prayer consistency comparison
    let prevPrayersDone = 0;
    prev7Days.forEach(d => {
      const p = data.prayers[d];
      if (p) {
        prevPrayersDone += Object.values(p).filter(v => v === 'done').length;
      }
    });
    const prevPrayerPct = (prevPrayersDone / 35) * 100;
    const prayerDiff = prayerPct - prevPrayerPct;
    if (prayerDiff > 0) {
      insights.push(`Prayer consistency improved by ${prayerDiff.toFixed(1)}% compared to last week.`);
    }

    // Journal streak
    if (journalStreak > 0) {
      insights.push(`You are on a solid ${journalStreak}-day journal writing streak.`);
    }
  }

  return (
    <div className="p-4 pb-24 min-h-screen text-white bg-zinc-950">
      {/* Header */}
      <header className="mb-6">
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Analytics</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Progress Hub</h1>
      </header>

      {/* Weekly Summary (Score, Gym, College, Namaz, Protein, Attendance first) */}
      <section className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Weekly Summary</h3>
        
        {/* Highlight Metric: Average Score */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-800">
          <div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Average Daily Score</p>
            <span className="text-4xl font-black text-blue-400 tracking-tighter">{avgScore}</span>
            <span className="text-zinc-500 text-sm font-semibold"> / 100</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">All-Time High</p>
            <p className="text-xl font-black text-white">{highestScore}</p>
          </div>
        </div>

        {/* Prioritized Progress Indicators (with underlying values) */}
        <div className="space-y-4">
          {/* Gym */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🏋️ Gym Completion</span>
              <span className="text-zinc-400">{gymDaysThisWeek}/7 • <span className="text-blue-400">{gymPct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${gymPct}%` }} />
            </div>
          </div>

          {/* College */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🎓 College Attendance</span>
              <span className="text-zinc-400">{collegeDaysThisWeek}/7 • <span className="text-blue-400">{collegePct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${collegePct}%` }} />
            </div>
          </div>

          {/* Prayers */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🕌 Prayer Completion</span>
              <span className="text-zinc-400">{prayersDoneThisWeek}/35 • <span className="text-blue-400">{prayerPct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${prayerPct}%` }} />
            </div>
          </div>

          {/* Protein */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🍗 Protein Goal Achieved</span>
              <span className="text-zinc-400">{proteinGoalMetDays}/7 • <span className="text-blue-400">{proteinGoalPct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${proteinGoalPct}%` }} />
            </div>
          </div>

          {/* Timetable Attendance */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">📅 Academic Attendance</span>
              <span className="text-zinc-400">{totalAttended}/{totalClasses} • <span className="text-blue-400">{overallAttendancePct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${overallAttendancePct}%` }} />
            </div>
          </div>
        </div>

        {/* Secondary Metrics below */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-850">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Calories</p>
            <p className="text-lg font-black text-white mt-0.5">{avgCalories} kcal/d</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Protein</p>
            <p className="text-lg font-black text-white mt-0.5">{avgProtein} g/d</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Journal Completion</p>
            <p className="text-xs font-bold text-white mt-0.5">{journalDaysThisWeek}/7 • <span className="text-blue-400">{journalPct.toFixed(1)}%</span></p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Todo Completion</p>
            <p className="text-xs font-bold text-white mt-0.5">{doneActiveTodos}/{activeTodos.length || 0} • <span className="text-blue-400">{todoPct.toFixed(1)}%</span></p>
          </div>
        </div>
      </section>

      {/* Weekly Insights */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Weekly Insights</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          {hasEnoughData ? (
            <ul className="space-y-3">
              {insights.map((insight, idx) => (
                <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2.5">
                  <span className="text-blue-400 shrink-0 select-none">✨</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 italic text-center py-2">
              Keep using Life OS to unlock weekly insights
            </p>
          )}
        </div>
      </section>

      {/* Subject Attendance Summary (sorted by lowest % first) */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Subject Attendance Summary</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          {subjectStats.map((sub) => (
            <div key={sub.name}>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-zinc-300">{sub.name}</span>
                <span className="text-zinc-400">
                  {sub.attended}/{sub.total} • <span className={sub.percentage >= 75 ? "text-emerald-400" : "text-amber-500"}>{sub.percentage.toFixed(1)}%</span>
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${sub.percentage >= 75 ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${sub.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Personal Progress (My Progress) */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">My Progress</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950/45 p-3 rounded-xl border border-zinc-850">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Current Weight</p>
              <p className="text-lg font-black text-white mt-0.5">
                {latestWeight !== null ? `${latestWeight} kg` : 'No log'}
              </p>
            </div>
            <div className="bg-zinc-950/45 p-3 rounded-xl border border-zinc-850">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Weight Change</p>
              <p className={`text-xs font-bold mt-1 leading-snug ${weightChangeDirection === 'decreased' ? 'text-green-400' : weightChangeDirection === 'increased' ? 'text-amber-500' : 'text-zinc-400'}`}>
                {weightChangeText}
                {weightChangeDirection && (
                  <span className="text-[9px] block text-zinc-500 font-semibold uppercase mt-0.5">
                    {weightChangeDirection} since baseline ({baselineWeight} kg)
                  </span>
                )}
              </p>
            </div>
            
            {/* Streaks row */}
            <div className="col-span-2 grid grid-cols-3 gap-2 py-2 border-y border-zinc-800/50 my-1">
              <div className="text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Gym Streak</span>
                <p className="text-base font-black text-white mt-0.5">🏋️ {gymStreak}d</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">College Streak</span>
                <p className="text-base font-black text-white mt-0.5">🎓 {collegeStreak}d</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Prayer Streak</span>
                <p className="text-base font-black text-white mt-0.5">🕋 {prayerStreak}d</p>
              </div>
            </div>

            <div className="bg-zinc-950/45 p-3 rounded-xl border border-zinc-850">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Highest Daily Score</p>
              <p className="text-lg font-black text-blue-400 mt-0.5">{highestScore}</p>
            </div>
            <div className="bg-zinc-950/45 p-3 rounded-xl border border-zinc-850">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Current Daily Score</p>
              <p className="text-lg font-black text-white mt-0.5">{calculateDailyScore(data, today)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Cards */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Overall Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">🔥 Best Streak</span>
            <p className="text-xl font-black text-white mt-1">{bestStreak} days</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">📅 Days Tracked</span>
            <p className="text-xl font-black text-white mt-1">{daysTracked} days</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">🏋️ Gym Days</span>
            <p className="text-xl font-black text-white mt-1">{totalGymDays} days</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">🎓 College Days</span>
            <p className="text-xl font-black text-white mt-1">{totalCollegeDays} days</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">🕌 Prayers Done</span>
            <p className="text-xl font-black text-white mt-1">{totalPrayersDone}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">🍗 Protein Met</span>
            <p className="text-xl font-black text-white mt-1">{totalProteinDaysAchieved} days</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">📝 Journal Entries</span>
            <p className="text-xl font-black text-white mt-1">{totalJournalEntries}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">✅ Todos Completed</span>
            <p className="text-xl font-black text-white mt-1">{totalTodosCompleted}</p>
          </div>
        </div>
      </section>

      {/* Monthly Overview (Rolling 30 Days) */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Monthly Overview (Past 30 Days)</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Days Active</p>
              <p className="text-base font-black text-white mt-0.5">{activeDaysLast30}/30 • <span className="text-blue-400">{((activeDaysLast30 / 30) * 100).toFixed(1)}%</span></p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Avg Score</p>
              <p className="text-base font-black text-blue-400 mt-0.5">{avgScoreLast30}/100</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Gym Completed</p>
              <p className="text-sm font-bold text-white mt-0.5">{gymDaysLast30}/30 • <span className="text-blue-400">{((gymDaysLast30 / 30) * 100).toFixed(1)}%</span></p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">College Attended</p>
              <p className="text-sm font-bold text-white mt-0.5">{collegeDaysLast30}/30 • <span className="text-blue-400">{((collegeDaysLast30 / 30) * 100).toFixed(1)}%</span></p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Protein Goals Met</p>
              <p className="text-sm font-bold text-white mt-0.5">{proteinGoalMetLast30}/30 • <span className="text-blue-400">{((proteinGoalMetLast30 / 30) * 100).toFixed(1)}%</span></p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Journal Entries</p>
              <p className="text-sm font-bold text-white mt-0.5">{journalEntriesLast30}/30 • <span className="text-blue-400">{((journalEntriesLast30 / 30) * 100).toFixed(1)}%</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Weight History */}
      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Weight History</h3>

        {/* Input */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-4 flex gap-3">
          <input
            type="number"
            step="0.1"
            placeholder="Weight (kg)"
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleSaveWeight}
            className="px-5 bg-blue-600 text-white hover:bg-blue-500 font-bold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
          >
            Log
          </button>
        </div>

        {/* Weight Chart */}
        {last7Weights.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl h-36 flex items-end gap-2 justify-between">
            {last7Weights.map((w) => {
              const pxDate = new Date(w.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
              let heightPerc = 20;
              if (weightRange > 0) {
                heightPerc = 20 + ((w.weight - (minWeight - 5)) / (weightRange + 5)) * 80;
              }

              return (
                <div key={w.date} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                  <span className="absolute -top-5 text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {w.weight} kg
                  </span>
                  <div
                    className="w-full max-w-[14px] bg-blue-500/80 rounded-t-sm transition-all duration-300"
                    style={{ height: `${Math.min(heightPerc, 100)}%` }}
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 font-medium">{pxDate}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  );
}
