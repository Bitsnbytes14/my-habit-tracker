'use client';

import React from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';
import { calculateDailyScore, calculateRecoveryScore, getRecoveryStatus } from '@/lib/scoring';
import {
  getGymStreak,
  getPrayerStreak,
  getProteinStreak,
  getDisciplineStreak,
  getSleepStreak,
  getCollegeStreak,
  getStepsStreak,
  getSkincareStreak,
  getEssentialsStreak,
} from '@/lib/streaks';
import { DailyEssentialsRecord } from '@/lib/types';
import { CoinFlipWidget } from '@/components/CoinFlipWidget';

export default function Dashboard() {
  const { data, updateData, showFeedback } = useLifeOS();
  const today = getTodayString();
  const [essentialsExpanded, setEssentialsExpanded] = React.useState(false);

  // Score Calculations
  const score = calculateDailyScore(data, today);
  const recoveryScore = calculateRecoveryScore(data, today);
  const recoveryStatus = getRecoveryStatus(recoveryScore);

  // Namaz
  const prayers = data.prayers[today] || {};
  const prayersDone = Object.values(prayers).filter((v) => v === 'done').length;

  // Todos
  const activeTodos = data.todos ? data.todos.filter((t) => !t.archived) : [];
  const tasksDone = activeTodos.filter((t) => t.done).length;

  // Protein / Calories
  const mealsToday = data.meals.filter((m) => m.date === today);
  const proteinGoal = data.settings?.proteinGoal || 120;
  const totalProtein = mealsToday.reduce((sum, m) => sum + (m.protein || 0), 0);
  const totalCalories = mealsToday.reduce((sum, m) => sum + (m.calories || 0), 0);

  // States
  const gymDone = data.gym[today] === true;
  const collegeDone = data.college?.[today] === true;
  const stepsDone = data.steps?.[today] === true;
  const disciplineStatus = data.discipline?.[today] || 'reset';
  const sleepLog = data.sleep?.[today];

  const latestWeight = data.weightLogs.length > 0 ? data.weightLogs[data.weightLogs.length - 1].weight : null;

  // Streaks
  const gymStreak = getGymStreak(data);
  const prayerStreak = getPrayerStreak(data);
  const collegeStreak = getCollegeStreak(data);
  const stepsStreak = getStepsStreak(data);
  const disciplineStreak = getDisciplineStreak(data);
  const sleepStreak = getSleepStreak(data);
  const proteinStreak = getProteinStreak(data);

  // Skincare states
  const skincareToday = data.skincare?.[today] || { morning: false, night: false };
  const morningDone = skincareToday.morning;
  const nightDone = skincareToday.night;
  const skincareStreak = getSkincareStreak(data);

  // Daily Essentials states
  const essentialsToday = data.dailyEssentials?.[today] || {
    multivitamin: false,
    fishOil: false,
    ashwagandha: false,
    moringa: false,
    readingEnglish: false,
    speakingEnglish: false,
  };
  const completedEssentialsCount = Object.values(essentialsToday).filter(Boolean).length;
  const essentialsStreak = getEssentialsStreak(data);

  // Toggle Handlers
  const toggleGym = () => {
    const wasDone = data.gym[today] === true;
    updateData((prev) => ({
      gym: { ...prev.gym, [today]: !prev.gym[today] },
    }));
    showFeedback(wasDone ? 'Gym marked undone' : 'Gym marked done ✓', 'success');
  };

  const toggleCollege = () => {
    const wasDone = data.college?.[today] === true;
    updateData((prev) => ({
      college: { ...prev.college, [today]: !prev.college?.[today] },
    }));
    showFeedback(wasDone ? 'College marked as missed' : 'College marked as attended ✓', 'success');
  };

  const toggleSteps = () => {
    const wasDone = data.steps?.[today] === true;
    updateData((prev) => ({
      steps: { ...prev.steps, [today]: !prev.steps?.[today] },
    }));
    showFeedback(wasDone ? 'Steps marked incomplete' : '10K Steps completed ✓', 'success');
  };

  const toggleDiscipline = () => {
    const nextStatus = disciplineStatus === 'strong' ? 'reset' : 'strong';
    updateData((prev) => ({
      discipline: {
        ...(prev.discipline || {}),
        [today]: nextStatus,
      },
    }));
    showFeedback(nextStatus === 'strong' ? 'Strong Day logged! 💪' : 'Reset Day logged 🔄', 'success');
  };

  const toggleMorning = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasDone = morningDone;
    updateData((prev) => ({
      skincare: {
        ...(prev.skincare || {}),
        [today]: {
          ...(prev.skincare?.[today] || { morning: false, night: false }),
          morning: !wasDone,
        },
      },
    }));
    showFeedback(wasDone ? 'Morning skincare marked pending' : 'Morning skincare completed ✓', 'success');
  };

  const toggleNight = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasDone = nightDone;
    updateData((prev) => ({
      skincare: {
        ...(prev.skincare || {}),
        [today]: {
          ...(prev.skincare?.[today] || { morning: false, night: false }),
          night: !wasDone,
        },
      },
    }));
    showFeedback(wasDone ? 'Night skincare marked pending' : 'Night skincare completed ✓', 'success');
  };

  const toggleEssentialItem = (itemKey: keyof DailyEssentialsRecord) => {
    const currentVal = !!essentialsToday[itemKey];
    updateData((prev) => ({
      dailyEssentials: {
        ...(prev.dailyEssentials || {}),
        [today]: {
          ...(prev.dailyEssentials?.[today] || {
            multivitamin: false,
            fishOil: false,
            ashwagandha: false,
            moringa: false,
            readingEnglish: false,
            speakingEnglish: false,
          }),
          [itemKey]: !currentVal,
        },
      },
    }));
    const displayNames: Record<keyof DailyEssentialsRecord, string> = {
      multivitamin: 'Multivitamin 💊',
      fishOil: 'Fish Oil 🐟',
      ashwagandha: 'Ashwagandha 🌿',
      moringa: 'Moringa 🍃',
      readingEnglish: 'Read English 📚',
      speakingEnglish: 'Speak English 📚',
    };
    showFeedback(!currentVal ? `${displayNames[itemKey]} marked completed` : `${displayNames[itemKey]} marked pending`, 'success');
  };

  // Sleep time helper
  const getSleepTimeDisplay = (isoStr?: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const h = d.getHours();
    const m = d.getMinutes();
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  };

  const getSleepQualityEmoji = (duration: number) => {
    if (duration < 6) return '🔴';
    if (duration <= 7.5) return '🟡';
    if (duration <= 9) return '🟢';
    return '🔵';
  };

  return (
    <div className="p-4 pb-24">
      {/* HEADER */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">
            {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {new Date().getDate()} {new Date().toLocaleDateString('en-US', { month: 'short' })}
          </h1>
        </div>
        {latestWeight !== null && (
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl px-3 py-2">
            <p className="text-[10px] text-zinc-500 uppercase font-bold text-center">Weight</p>
            <p className="text-base font-bold text-white text-center">
              {latestWeight}
              <span className="text-xs font-normal text-zinc-500">kg</span>
            </p>
          </div>
        )}
      </header>

      {/* TOP SECTION: Scores */}
      <section className="mb-6 grid grid-cols-2 gap-3">
        {/* Daily Score */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-650 p-5 shadow-lg shadow-blue-500/10 flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mt-6 -mr-6" />
          <div>
            <p className="text-white/80 text-[10px] uppercase font-bold tracking-wider mb-1">Daily Score</p>
            <div className="flex items-baseline gap-0.5">
              <h2 className="text-4xl font-black text-white tracking-tighter">{score}</h2>
              <span className="text-white/60 font-bold text-sm">/100</span>
            </div>
          </div>
          <p className="text-white/70 text-[9px] font-semibold leading-relaxed">
            Overall daily consistency score across all habits.
          </p>
        </div>

        {/* Recovery Score */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center h-40 relative overflow-hidden">
          <div className="relative flex items-center justify-center w-20 h-20">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle
                className="text-zinc-850"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r="32"
                cx="40"
                cy="40"
              />
              <circle
                className={`${
                  recoveryScore >= 90 ? 'text-indigo-400' :
                  recoveryScore >= 70 ? 'text-emerald-400' :
                  recoveryScore >= 50 ? 'text-amber-400' : 'text-red-400'
                } transition-all duration-500 ease-out`}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${(1 - recoveryScore / 100) * 2 * Math.PI * 32}`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="32"
                cx="40"
                cy="40"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-black text-white">{recoveryScore}</span>
              <span className="text-[8px] text-zinc-500 uppercase font-bold">/ 100</span>
            </div>
          </div>
          <p className="text-zinc-300 text-xs font-bold mt-2 uppercase tracking-wide leading-none">{recoveryStatus}</p>
          <span className="text-[8px] text-zinc-500 text-center mt-1 leading-none font-semibold block">
            Calculated from Sleep, Gym, Steps & Protein
          </span>
        </div>
      </section>

      {/* TODAY'S HABITS: 8 UNIFORM CARDS */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Today&apos;s Status</h3>
        <div className="grid grid-cols-2 gap-3">
          
          {/* Gym Card */}
          <div
            onClick={toggleGym}
            className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between h-32 ${
              gymDone 
                ? 'bg-zinc-900 border-2 border-emerald-500/80 shadow-md shadow-emerald-500/5' 
                : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/70'
            }`}
          >
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Gym</span>
              <p className={`text-base font-black tracking-tight mt-1 ${gymDone ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {gymDone ? 'Done ✓' : 'Pending'}
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase">🔥 Streak: {gymStreak}d</p>
          </div>

          {/* College Card */}
          <div
            onClick={toggleCollege}
            className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between h-32 ${
              collegeDone 
                ? 'bg-zinc-900 border-2 border-emerald-500/80 shadow-md shadow-emerald-500/5' 
                : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/70'
            }`}
          >
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">College</span>
              <p className={`text-base font-black tracking-tight mt-1 ${collegeDone ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {collegeDone ? 'Attended ✓' : 'Pending'}
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase">🔥 Streak: {collegeStreak}d</p>
          </div>

          {/* 10K Steps Card */}
          <div
            onClick={toggleSteps}
            className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between h-32 ${
              stepsDone 
                ? 'bg-zinc-900 border-2 border-emerald-500/80 shadow-md shadow-emerald-500/5' 
                : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/70'
            }`}
          >
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">10K Steps</span>
              <p className={`text-base font-black tracking-tight mt-1 ${stepsDone ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {stepsDone ? 'Completed ✓' : 'Pending'}
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase">🔥 Streak: {stepsStreak}d</p>
          </div>

          {/* Skincare Card */}
          <div
            className={`relative overflow-hidden rounded-xl p-4 transition-all flex flex-col justify-between h-32 ${
              (morningDone && nightDone)
                ? 'bg-zinc-900 border-2 border-emerald-500/80 shadow-md shadow-emerald-500/5'
                : 'bg-zinc-900 border border-zinc-800'
            }`}
          >
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Skincare</span>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={toggleMorning}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-bold transition-all active:scale-[0.97] border ${
                    morningDone
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-950/60'
                  }`}
                >
                  <span>🌞</span>
                  <span>{morningDone ? '✅' : '⏳'}</span>
                </button>
                <button
                  onClick={toggleNight}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-bold transition-all active:scale-[0.97] border ${
                    nightDone
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:bg-zinc-950/60'
                  }`}
                >
                  <span>🌙</span>
                  <span>{nightDone ? '✅' : '⏳'}</span>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase">🔥 Streak: {skincareStreak}d</p>
          </div>

          {/* Sleep Card */}
          <Link
            href="/sleep"
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-800/70 transition-all flex flex-col justify-between h-32 active:scale-[0.98]"
          >
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Sleep</span>
              <p className="text-base font-black text-white mt-1 truncate">
                {sleepLog ? `${sleepLog.duration?.toFixed(1)} hrs` : 'No log'}
                {sleepLog && sleepLog.duration !== undefined && (
                  <span className="text-xs ml-1.5">{getSleepQualityEmoji(sleepLog.duration)}</span>
                )}
              </p>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium truncate">
              {sleepLog 
                ? `${getSleepTimeDisplay(sleepLog.bedTime)} - ${getSleepTimeDisplay(sleepLog.wakeTime)} (🔥 ${sleepStreak}d)` 
                : 'Tap to track sleep'}
            </p>
          </Link>

          {/* Discipline Card */}
          <div
            onClick={toggleDiscipline}
            className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98] flex flex-col justify-between h-32 ${
              disciplineStatus === 'strong' 
                ? 'bg-zinc-900 border-2 border-emerald-500/80 shadow-md shadow-emerald-500/5' 
                : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/70'
            }`}
          >
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Discipline</span>
              <p className={`text-base font-black tracking-tight mt-1 ${disciplineStatus === 'strong' ? 'text-emerald-400' : 'text-zinc-350'}`}>
                {disciplineStatus === 'strong' ? '✅ Strong Day' : '🔄 Reset Day'}
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase">🔥 Streak: {disciplineStreak}d</p>
          </div>

          {/* Diet Card */}
          <Link
            href="/diet"
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-800/70 transition-all flex flex-col justify-between h-32 active:scale-[0.98]"
          >
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Diet</span>
              <p className="text-base font-black text-white mt-1">
                🥩 {Math.round(totalProtein)}g
              </p>
            </div>
            <p className="text-[9px] text-zinc-500 font-semibold uppercase">
              Target: {proteinGoal}g • {totalCalories} kcal (🔥 {proteinStreak}d)
            </p>
          </Link>

          {/* Namaz Card */}
          <Link
            href="/namaz"
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-800/70 transition-all flex flex-col justify-between h-32 active:scale-[0.98]"
          >
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Namaz</span>
              <p className="text-base font-black text-white mt-1">
                🕋 {prayersDone} / 5
              </p>
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase">🔥 Streak: {prayerStreak}d</p>
          </Link>

          {/* Todo Card */}
          <Link
            href="/todos"
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-800/70 transition-all flex flex-col justify-between h-32 active:scale-[0.98]"
          >
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Todo</span>
              <p className="text-base font-black text-white mt-1">
                📋 {tasksDone} / {activeTodos.length}
              </p>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-1 border border-zinc-800/50">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${activeTodos.length ? (tasksDone / activeTodos.length) * 100 : 0}%` }}
              />
            </div>
          </Link>

          {/* Daily Essentials Card */}
          <div
            className={`col-span-2 relative overflow-hidden rounded-xl p-4 transition-all duration-300 ${
              completedEssentialsCount === 6
                ? 'bg-zinc-900 border-2 border-emerald-500/80 shadow-md shadow-emerald-500/5'
                : 'bg-zinc-900 border border-zinc-800'
            }`}
          >
            <div className="flex justify-between items-center w-full mb-2">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Habits Checklist</span>
                <h4 className="text-base font-black text-white mt-0.5">Daily Essentials</h4>
              </div>
              <div className="flex items-center gap-3 select-none">
                <span className="text-xs font-bold text-zinc-400">
                  {completedEssentialsCount} / 6 Completed
                </span>
                <button
                  onClick={() => setEssentialsExpanded(!essentialsExpanded)}
                  className="px-3 py-1 bg-zinc-950 hover:bg-zinc-805 border border-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all flex items-center gap-1 select-none"
                >
                  {essentialsExpanded ? 'Hide Checklist ▴' : 'Show Checklist ▾'}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-850 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(completedEssentialsCount / 6) * 100}%` }}
              />
            </div>

            {/* Expanded Checklist */}
            {essentialsExpanded && (
              <div className="mt-4 grid grid-cols-2 gap-4 pt-3 border-t border-zinc-800 transition-all duration-300 ease-in-out">
                {/* Supplements Column */}
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">💊 Supplements</span>
                  <div className="space-y-2">
                    {[
                      { key: 'multivitamin', label: 'Multivitamin', emoji: '💊' },
                      { key: 'fishOil', label: 'Fish Oil', emoji: '🐟' },
                      { key: 'ashwagandha', label: 'Ashwagandha', emoji: '🌿' },
                      { key: 'moringa', label: 'Moringa', emoji: '🍃' }
                    ].map((item) => {
                      const done = !!essentialsToday[item.key as keyof DailyEssentialsRecord];
                      return (
                        <div
                          key={item.key}
                          onClick={() => toggleEssentialItem(item.key as keyof DailyEssentialsRecord)}
                          className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer select-none transition-all active:scale-[0.98] ${
                            done
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                              : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:bg-zinc-950/60'
                          }`}
                        >
                          <span className="text-xs font-semibold">{item.emoji} {item.label}</span>
                          <span className="text-xs font-black">{done ? '✅' : '⏳'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Personal Development Column */}
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">📚 Personal Development</span>
                  <div className="space-y-2">
                    {[
                      { key: 'readingEnglish', label: 'Read English', emoji: '📖' },
                      { key: 'speakingEnglish', label: 'Speak English', emoji: '🗣️' }
                    ].map((item) => {
                      const done = !!essentialsToday[item.key as keyof DailyEssentialsRecord];
                      return (
                        <div
                          key={item.key}
                          onClick={() => toggleEssentialItem(item.key as keyof DailyEssentialsRecord)}
                          className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer select-none transition-all active:scale-[0.98] ${
                            done
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                              : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:bg-zinc-950/60'
                          }`}
                        >
                          <span className="text-xs font-semibold">{item.emoji} {item.label}</span>
                          <span className="text-xs font-black">{done ? '✅' : '⏳'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-2 text-right pt-2">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">🔥 Streak: {essentialsStreak}d</p>
                </div>
              </div>
            )}
            
            {!essentialsExpanded && (
              <div className="flex justify-between items-center mt-2.5">
                <p className="text-[10px] text-zinc-500 font-semibold uppercase">🔥 Streak: {essentialsStreak}d</p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Utilities Section */}
      <section className="mt-8 flex justify-center">
        <CoinFlipWidget />
      </section>
    </div>
  );
}
