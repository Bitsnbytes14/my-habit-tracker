'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString, getOffsetDateString } from '@/lib/storage';
import { calculateDailyScore } from '@/lib/scoring';
import { getGymStreak, getPrayerStreak, getJournalStreak, getCollegeStreak, getProteinStreak, getStepsStreak } from '@/lib/streaks';
import { attendanceConfig } from '@/lib/attendance';
import { 
  checkAndArchiveCompletedWeeks, 
  calculateWeeklyStats, 
  generateWeeklySummary, 
  getMonday, 
  getSunday, 
  formatDateString 
} from '@/lib/review';
import { WeeklyReport } from '@/lib/types';

export default function ProgressPage() {
  const { data, updateData } = useLifeOS();
  const today = getTodayString();
  
  // Weight Log State
  const [weightInput, setWeightInput] = useState('');
  
  // Selected historical week for modal report card view
  const [selectedWeeklyReport, setSelectedWeeklyReport] = useState<WeeklyReport | null>(null);

  // Trigger Weekly Archiving on mount
  useEffect(() => {
    if (data) {
      checkAndArchiveCompletedWeeks(data, updateData);
    }
  }, [data, updateData]);

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
  const proteinGoal = data.settings?.proteinGoal || 120;

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
    ...Object.keys(data.steps || {}),
    ...data.meals.map(m => m.date),
    ...data.weightLogs.map(w => w.date)
  ]);
  const daysTracked = trackedDates.size;

  // Streaks
  const prayerStreak = getPrayerStreak(data);
  const gymStreak = getGymStreak(data);
  const collegeStreak = getCollegeStreak(data);
  const stepsStreak = getStepsStreak(data);
  const proteinStreak = getProteinStreak(data);
  const bestStreak = Math.max(gymStreak, collegeStreak, prayerStreak, proteinStreak, stepsStreak);

  // Highest score calculation
  let highestScore = 0;
  trackedDates.forEach(date => {
    const s = calculateDailyScore(data, date);
    if (s > highestScore) highestScore = s;
  });

  // --- Current Week Stats ---
  const todayDate = new Date();
  const currentMondayDate = getMonday(todayDate);
  const currentMondayStr = formatDateString(currentMondayDate);
  const currentSundayDate = getSunday(currentMondayDate);
  const currentSundayStr = formatDateString(currentSundayDate);
  const currentWeekReport = calculateWeeklyStats(
    data, 
    currentMondayStr, 
    currentSundayStr, 
    (data.weeklyReports?.length || 0) + 1
  );

  // --- Previous Week Stats ---
  const previousWeekReport = data.weeklyReports && data.weeklyReports.length > 0 
    ? data.weeklyReports[data.weeklyReports.length - 1] 
    : null;

  // Comparison Generator
  const comparisons: { text: string; isPositive: boolean }[] = [];
  let biggestImprovement = '';
  let focusHabit = '';
  let weeklySummaryText = 'Complete one full week to unlock comparison insights.';

  if (previousWeekReport) {
    // 1. Daily Score
    const scoreDiff = currentWeekReport.avgScore - previousWeekReport.avgScore;
    if (scoreDiff !== 0) {
      comparisons.push({
        text: `Daily Score ${scoreDiff > 0 ? 'improved' : 'dropped'} by ${Math.abs(scoreDiff)}%`,
        isPositive: scoreDiff > 0
      });
    }

    // 2. Gym
    const gymDiff = currentWeekReport.gymAttended - previousWeekReport.gymAttended;
    if (gymDiff !== 0) {
      comparisons.push({
        text: `Gym consistency ${gymDiff > 0 ? 'increased' : 'decreased'} from ${previousWeekReport.gymAttended}/7 to ${currentWeekReport.gymAttended}/7`,
        isPositive: gymDiff > 0
      });
    }

    // 3. College
    const collegeDiff = currentWeekReport.collegeAttended - previousWeekReport.collegeAttended;
    if (collegeDiff !== 0) {
      comparisons.push({
        text: `College attendance ${collegeDiff > 0 ? 'improved' : 'dropped'} from ${previousWeekReport.collegeAttended}/7 to ${currentWeekReport.collegeAttended}/7`,
        isPositive: collegeDiff > 0
      });
    }

    // 4. 10K Steps
    const stepsDiff = currentWeekReport.stepsAttended - previousWeekReport.stepsAttended;
    if (stepsDiff !== 0) {
      comparisons.push({
        text: `10K Steps goal achieved on ${currentWeekReport.stepsAttended} days instead of ${previousWeekReport.stepsAttended}`,
        isPositive: stepsDiff > 0
      });
    }

    // 5. Prayers
    const prayerDiff = currentWeekReport.prayerPct - previousWeekReport.prayerPct;
    if (prayerDiff !== 0) {
      comparisons.push({
        text: `Prayer completion ${prayerDiff > 0 ? 'increased' : 'dropped'} by ${Math.abs(prayerDiff).toFixed(1)}%`,
        isPositive: prayerDiff > 0
      });
    }

    // 6. Protein
    const proteinDiff = currentWeekReport.proteinAttended - previousWeekReport.proteinAttended;
    if (proteinDiff !== 0) {
      comparisons.push({
        text: `Protein goal achieved on ${currentWeekReport.proteinAttended} days instead of ${previousWeekReport.proteinAttended}`,
        isPositive: proteinDiff > 0
      });
    }

    // 7. Todos
    const todoDiff = currentWeekReport.todoPct - previousWeekReport.todoPct;
    if (todoDiff !== 0) {
      comparisons.push({
        text: `Todo completion ${todoDiff > 0 ? 'improved' : 'dropped'} by ${Math.abs(todoDiff).toFixed(1)}%`,
        isPositive: todoDiff > 0
      });
    }

    // 8. Class Attendance
    const classDiff = currentWeekReport.classAttendancePct - previousWeekReport.classAttendancePct;
    if (classDiff !== 0) {
      comparisons.push({
        text: `Class attendance ${classDiff > 0 ? 'improved' : 'dropped'} from ${previousWeekReport.classAttendancePct.toFixed(0)}% to ${currentWeekReport.classAttendancePct.toFixed(0)}%`,
        isPositive: classDiff > 0
      });
    }

    // Biggest Improvement and Focus Areas
    const habitsToCompare = [
      { name: 'Gym', current: currentWeekReport.gymPct, previous: previousWeekReport.gymPct },
      { name: 'College', current: currentWeekReport.collegePct, previous: previousWeekReport.collegePct },
      { name: '10K Steps', current: currentWeekReport.stepsPct, previous: previousWeekReport.stepsPct },
      { name: 'Prayers', current: currentWeekReport.prayerPct, previous: previousWeekReport.prayerPct },
      { name: 'Protein', current: currentWeekReport.proteinPct, previous: previousWeekReport.proteinPct },
      { name: 'Todos', current: currentWeekReport.todoPct, previous: previousWeekReport.todoPct },
      { name: 'Class Attendance', current: currentWeekReport.classAttendancePct, previous: previousWeekReport.classAttendancePct }
    ];

    let maxDiff = 0;
    habitsToCompare.forEach(h => {
      const diff = h.current - h.previous;
      if (diff > maxDiff) {
        maxDiff = diff;
        biggestImprovement = `${h.name} (+${diff.toFixed(0)}%)`;
      }
    });

    let maxDrop = 0;
    let focusName = '';
    let focusHabitVal = 101;
    let focusHabitDiff = 0;
    habitsToCompare.forEach(h => {
      const diff = h.current - h.previous;
      if (diff < maxDrop) {
        maxDrop = diff;
        focusName = h.name;
        focusHabitVal = h.current;
        focusHabitDiff = diff;
      }
    });

    if (focusName) {
      focusHabit = `${focusName} (${focusHabitDiff.toFixed(0)}%)`;
    } else {
      let lowest = 101;
      habitsToCompare.forEach(h => {
        if (h.current < lowest) {
          lowest = h.current;
          focusName = h.name;
          focusHabitVal = h.current;
        }
      });
      focusHabit = `${focusName} (${focusHabitVal.toFixed(0)}%)`;
    }

    weeklySummaryText = generateWeeklySummary(currentWeekReport, previousWeekReport);
  }

  // --- Rolling 30 Days Metrics (Monthly Overview)
  const last30Days = Array.from({ length: 30 }, (_, i) => getOffsetDateString(-i));
  const activeDaysLast30 = last30Days.filter(d => trackedDates.has(d)).length;
  const gymDaysLast30 = last30Days.filter(d => data.gym[d] === true).length;
  const collegeDaysLast30 = last30Days.filter(d => data.college?.[d] === true).length;
  const stepsDaysLast30 = last30Days.filter(d => data.steps?.[d] === true).length;
  
  let proteinGoalMetLast30 = 0;
  let last30ScoresSum = 0;

  last30Days.forEach(d => {
    const dayMeals = data.meals.filter(m => m.date === d);
    const dayProtein = dayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
    if (dayProtein >= proteinGoal && dayMeals.length > 0) {
      proteinGoalMetLast30++;
    }
    last30ScoresSum += calculateDailyScore(data, d);
  });
  const avgScoreLast30 = Math.round(last30ScoresSum / 30);

  // Global Totals (Progress Cards)
  const totalGymDays = Object.values(data.gym).filter(Boolean).length;
  const totalCollegeDays = Object.values(data.college || {}).filter(Boolean).length;
  const totalStepsDays = Object.values(data.steps || {}).filter(Boolean).length;
  
  let totalPrayersDone = 0;
  Object.values(data.prayers).forEach(p => {
    totalPrayersDone += Object.values(p).filter(v => v === 'done').length;
  });

  const proteinByDate: Record<string, number> = {};
  data.meals.forEach(m => {
    proteinByDate[m.date] = (proteinByDate[m.date] || 0) + (m.protein || 0);
  });
  const totalProteinDaysAchieved = Object.values(proteinByDate).filter(p => p >= proteinGoal).length;
  const totalTodosCompleted = data.todos.filter(t => t.done).length;

  const attendance = data.attendance || {};

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

  // Helper to format date range e.g. "Jul 6 – Jul 12"
  const formatDateRange = (startStr: string, endStr: string): string => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const optStart: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const optEnd: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', optStart)} – ${end.toLocaleDateString('en-US', optEnd)}`;
    }
    return `${start.toLocaleDateString('en-US', optEnd)} – ${end.toLocaleDateString('en-US', optEnd)}`;
  };

  return (
    <div className="p-4 pb-24 min-h-screen text-white bg-zinc-950">
      {/* Header */}
      <header className="mb-6">
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Analytics</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Progress Hub</h1>
      </header>

      {/* Weekly Report Card (Current Week) */}
      <section className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-6 -mt-6" />
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">This Week&apos;s Report</h3>
        
        {/* Weekly Grade & Average */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-800 relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-blue-600/10 border border-blue-500/20 flex flex-col items-center justify-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Grade</span>
              <span className="text-2xl font-black text-blue-400 leading-none mt-1">{currentWeekReport.grade}</span>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Average Daily Score</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-white">{currentWeekReport.avgScore}</span>
                <span className="text-zinc-500 text-xs font-semibold">/100</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Record Score</p>
            <p className="text-lg font-black text-zinc-300 mt-1">{highestScore}</p>
          </div>
        </div>

        {/* Prioritized Progress Indicators (with values) */}
        <div className="space-y-4 relative">
          {/* Gym */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🏋️ Gym Completion</span>
              <span className="text-zinc-400">{currentWeekReport.gymAttended}/{currentWeekReport.gymTotal} • <span className="text-blue-400">{currentWeekReport.gymPct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.gymPct}%` }} />
            </div>
          </div>

          {/* College */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🎓 College Attendance</span>
              <span className="text-zinc-400">{currentWeekReport.collegeAttended}/{currentWeekReport.collegeTotal} • <span className="text-blue-400">{currentWeekReport.collegePct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.collegePct}%` }} />
            </div>
          </div>

          {/* 10K Steps */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">👣 10K Steps Tracker</span>
              <span className="text-zinc-400">{currentWeekReport.stepsAttended}/{currentWeekReport.stepsTotal} • <span className="text-blue-400">{currentWeekReport.stepsPct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.stepsPct}%` }} />
            </div>
          </div>

          {/* Prayers */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🕌 Prayer Completion</span>
              <span className="text-zinc-400">{currentWeekReport.prayersAttended}/{currentWeekReport.prayersTotal} • <span className="text-blue-400">{currentWeekReport.prayerPct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.prayerPct}%` }} />
            </div>
          </div>

          {/* Protein */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🍗 Protein Goal Achieved</span>
              <span className="text-zinc-400">{currentWeekReport.proteinAttended}/{currentWeekReport.proteinTotal} • <span className="text-blue-400">{currentWeekReport.proteinPct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.proteinPct}%` }} />
            </div>
          </div>

          {/* Timetable Attendance */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">📅 Academic Attendance</span>
              <span className="text-zinc-400">{currentWeekReport.classesAttended}/{currentWeekReport.classesTotal} • <span className="text-blue-400">{currentWeekReport.classAttendancePct.toFixed(1)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.classAttendancePct}%` }} />
            </div>
          </div>
        </div>

        {/* Todo completion info below */}
        <div className="mt-6 pt-6 border-t border-zinc-800 relative">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Todo Completion</p>
          <p className="text-xs font-bold text-white mt-1">
            {currentWeekReport.todosAttended}/{currentWeekReport.todosTotal} completed • <span className="text-blue-400">{currentWeekReport.todoPct.toFixed(1)}%</span>
          </p>
        </div>
      </section>

      {/* Weekly Comparison & Summary */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Weekly Review</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          
          {/* Highlight metrics (Improvement and Focus) */}
          {previousWeekReport && (
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-zinc-800">
              <div className="bg-zinc-950/45 border border-zinc-850 rounded-xl p-3">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">🔥 Biggest Improvement</span>
                <p className="text-sm font-black text-green-400 mt-1">{biggestImprovement || 'None'}</p>
              </div>
              <div className="bg-zinc-950/45 border border-zinc-850 rounded-xl p-3">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">⚠️ Focus Next Week</span>
                <p className="text-sm font-black text-amber-500 mt-1">{focusHabit || 'None'}</p>
              </div>
            </div>
          )}

          {/* Comparison list */}
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-2.5">Weekly Changes</span>
            {previousWeekReport ? (
              <ul className="space-y-2">
                {comparisons.map((c, idx) => (
                  <li key={idx} className="text-xs font-medium flex items-center gap-2">
                    <span className={c.isPositive ? 'text-green-500' : 'text-red-500 font-black'}>
                      {c.text}
                    </span>
                  </li>
                ))}
                {comparisons.length === 0 && (
                  <p className="text-xs text-zinc-500 italic">No significant changes from last week.</p>
                )}
              </ul>
            ) : (
              <p className="text-xs text-zinc-500 italic">Complete one full week to unlock comparison insights.</p>
            )}
          </div>

          {/* Summary Box */}
          <div className="pt-4 border-t border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1.5">Weekly Summary</span>
            <p className="text-xs font-semibold leading-relaxed text-zinc-300">
              {weeklySummaryText}
            </p>
          </div>
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
            <div className="col-span-2 grid grid-cols-4 gap-2 py-2 border-y border-zinc-800/50 my-1">
              <div className="text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block truncate">Gym Streak</span>
                <p className="text-sm font-black text-white mt-0.5">🏋️ {gymStreak}d</p>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block truncate">College Streak</span>
                <p className="text-sm font-black text-white mt-0.5">🎓 {collegeStreak}d</p>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block truncate">Steps Streak</span>
                <p className="text-sm font-black text-white mt-0.5">👣 {stepsStreak}d</p>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block truncate">Prayer Streak</span>
                <p className="text-sm font-black text-white mt-0.5">🕋 {prayerStreak}d</p>
              </div>
            </div>

            <div className="bg-zinc-950/45 p-3 rounded-xl border border-zinc-850">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Highest Daily Score</p>
              <p className="text-lg font-black text-blue-400 mt-0.5">{highestScore}</p>
            </div>
            <div className="bg-zinc-950/45 p-3 rounded-xl border border-zinc-850">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Days Using Life OS</p>
              <p className="text-lg font-black text-white mt-0.5">{daysTracked} days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly History Section */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Weekly History</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-zinc-800">
          {(data.weeklyReports || []).length > 0 ? (
            [...(data.weeklyReports || [])].reverse().map((report) => (
              <div 
                key={report.startDate} 
                onClick={() => setSelectedWeeklyReport(report)}
                className="px-5 py-4 flex items-center justify-between hover:bg-zinc-850/50 cursor-pointer transition-colors select-none"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">Week {report.weekNumber}</h4>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                    {formatDateRange(report.startDate, report.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold block">Avg Score</span>
                    <span className="text-sm font-extrabold text-blue-400">{report.avgScore}</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-xs font-black text-blue-400">
                    {report.grade}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="px-5 py-6 text-sm text-zinc-500 italic text-center">
              No completed weeks archived yet.
            </p>
          )}
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
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">👣 Steps Goal Achieved</span>
            <p className="text-xl font-black text-white mt-1">{totalStepsDays} days</p>
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
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Steps Goal Achieved</p>
              <p className="text-sm font-bold text-white mt-0.5">{stepsDaysLast30}/30 • <span className="text-blue-400">{((stepsDaysLast30 / 30) * 100).toFixed(1)}%</span></p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Protein Goals Met</p>
              <p className="text-sm font-bold text-white mt-0.5">{proteinGoalMetLast30}/30 • <span className="text-blue-400">{((proteinGoalMetLast30 / 30) * 100).toFixed(1)}%</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Weight History */}
      <section className="mb-6">
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

      {/* Historical Report Modal Overlay */}
      {selectedWeeklyReport && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl max-w-md w-full p-5 max-h-[85vh] overflow-y-auto relative shadow-2xl">
            <header className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Weekly Archives</span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">Week {selectedWeeklyReport.weekNumber} Report</h3>
                <p className="text-xs text-zinc-400 font-medium mt-1">
                  {formatDateRange(selectedWeeklyReport.startDate, selectedWeeklyReport.endDate)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedWeeklyReport(null)}
                className="text-zinc-500 hover:text-white font-bold text-sm bg-zinc-950 border border-zinc-800 rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </header>

            {/* Grade and Score display */}
            <div className="flex items-center gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 mb-6">
              <div className="w-16 h-16 rounded-xl bg-blue-600/10 border border-blue-500/20 flex flex-col items-center justify-center shrink-0">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Grade</span>
                <span className="text-2xl font-black text-blue-400 leading-none mt-1">{selectedWeeklyReport.grade}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Average Daily Score</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-white">{selectedWeeklyReport.avgScore}</span>
                  <span className="text-zinc-500 text-xs">/100</span>
                </div>
              </div>
            </div>

            {/* Habits stats list (with values) */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">Gym Completion</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.gymAttended}/{selectedWeeklyReport.gymTotal} • <span className="text-blue-400">{selectedWeeklyReport.gymPct.toFixed(1)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-emerald-500" style={{ width: `${selectedWeeklyReport.gymPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">College Attendance</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.collegeAttended}/{selectedWeeklyReport.collegeTotal} • <span className="text-blue-400">{selectedWeeklyReport.collegePct.toFixed(1)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-blue-500" style={{ width: `${selectedWeeklyReport.collegePct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">10K Steps Goal</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.stepsAttended}/{selectedWeeklyReport.stepsTotal} • <span className="text-blue-400">{selectedWeeklyReport.stepsPct.toFixed(1)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-green-500" style={{ width: `${selectedWeeklyReport.stepsPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">Prayer Completion</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.prayersAttended}/{selectedWeeklyReport.prayersTotal} • <span className="text-blue-400">{selectedWeeklyReport.prayerPct.toFixed(1)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-purple-500" style={{ width: `${selectedWeeklyReport.prayerPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">Protein Goal achieved</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.proteinAttended}/{selectedWeeklyReport.proteinTotal} • <span className="text-blue-400">{selectedWeeklyReport.proteinPct.toFixed(1)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-indigo-500" style={{ width: `${selectedWeeklyReport.proteinPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">Academic Class Attendance</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.classesAttended}/{selectedWeeklyReport.classesTotal} • <span className="text-blue-400">{selectedWeeklyReport.classAttendancePct.toFixed(1)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-cyan-500" style={{ width: `${selectedWeeklyReport.classAttendancePct}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-zinc-850">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Todo Completion</span>
              <p className="text-xs font-bold text-white">
                {selectedWeeklyReport.todosAttended}/{selectedWeeklyReport.todosTotal} completed • <span className="text-blue-400">{selectedWeeklyReport.todoPct.toFixed(1)}%</span>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-850">
              <button 
                onClick={() => setSelectedWeeklyReport(null)}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-850 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-zinc-800"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
