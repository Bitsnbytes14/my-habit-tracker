'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';
import { getSleepStreak, getLongestStreak } from '@/lib/streaks';

export default function SleepPage() {
  const { data, updateData, showFeedback } = useLifeOS();
  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);

  // Manual inputs state
  const [manualBed, setManualBed] = useState('');
  const [manualWake, setManualWake] = useState('');

  const sleepLog = data.sleep?.[selectedDate];
  const isSleeping = !!data.activeSleepStart;

  // Format date helper for display
  const displayDateStr = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Convert ISO string to YYYY-MM-DDTHH:mm for local datetime input
  const toInputFormat = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Reset manual input fields when selected date or sleepLog changes
  useEffect(() => {
    if (sleepLog) {
      setManualBed(toInputFormat(sleepLog.bedTime));
      setManualWake(toInputFormat(sleepLog.wakeTime));
    } else {
      setManualBed('');
      setManualWake('');
    }
  }, [selectedDate, sleepLog]);

  // Track Going to Sleep
  const handleGoingToSleep = () => {
    const now = new Date().toISOString();
    updateData({ activeSleepStart: now });
    showFeedback('Sleep session started. Sleep tight! 🌙', 'info');
  };

  // Track Woke Up
  const handleWokeUp = () => {
    if (!data.activeSleepStart) {
      alert("No active sleep session found. Please enter sleep times manually below.");
      return;
    }
    const bed = data.activeSleepStart;
    const wake = new Date().toISOString();
    const duration = (new Date(wake).getTime() - new Date(bed).getTime()) / (1000 * 60 * 60);

    updateData(prev => {
      const newSleep = { ...(prev.sleep || {}) };
      newSleep[today] = { bedTime: bed, wakeTime: wake, duration };
      return {
        sleep: newSleep,
        activeSleepStart: null
      };
    });
    showFeedback('Good morning! Sleep log saved ✓', 'success');
  };

  // Save manual sleep override
  const handleSaveManual = () => {
    if (!manualBed || !manualWake) {
      alert("Please specify both Bed Time and Wake Time.");
      return;
    }
    const bedDate = new Date(manualBed);
    const wakeDate = new Date(manualWake);
    const diffMs = wakeDate.getTime() - bedDate.getTime();
    if (diffMs <= 0) {
      alert("Wake Time must be after Bed Time.");
      return;
    }
    const duration = diffMs / (1000 * 60 * 60);

    updateData(prev => {
      const newSleep = { ...(prev.sleep || {}) };
      newSleep[selectedDate] = {
        bedTime: bedDate.toISOString(),
        wakeTime: wakeDate.toISOString(),
        duration
      };
      return { sleep: newSleep };
    });
    showFeedback('Sleep log updated ✓', 'success');
  };

  const handleClearLog = () => {
    if (confirm("Delete sleep log for this day?")) {
      updateData(prev => {
        const newSleep = { ...(prev.sleep || {}) };
        delete newSleep[selectedDate];
        return { sleep: newSleep };
      });
      showFeedback('Sleep log deleted', 'info');
    }
  };

  // Format time helpers
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getQuality = (duration: number) => {
    if (duration < 6) return { label: 'Poor', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', emoji: '🔴' };
    if (duration <= 7.5) return { label: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', emoji: '🟡' };
    if (duration <= 9) return { label: 'Good', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', emoji: '🟢' };
    return { label: 'Excellent', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', emoji: '🔵' };
  };

  // --- STATS CALCULATIONS ---
  const sleepGoal = data.settings?.sleepGoal || 8;
  const allSleeps = Object.values(data.sleep || {});
  
  // Weekly Averages
  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(startOfWeek.setDate(diff));
  monday.setHours(0,0,0,0);
  
  const weeklySleeps = Object.entries(data.sleep || {}).filter(([date]) => new Date(date) >= monday);
  const weeklyAvg = weeklySleeps.length > 0
    ? weeklySleeps.reduce((acc, [, val]) => acc + (val.duration || 0), 0) / 7
    : 0;

  // Monthly Averages
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  const monthlySleeps = Object.entries(data.sleep || {}).filter(([date]) => new Date(date) >= startOfMonth);
  const monthlyAvg = monthlySleeps.length > 0
    ? monthlySleeps.reduce((acc, [, val]) => acc + (val.duration || 0), 0) / monthlySleeps.length
    : 0;

  // Goal completion %
  const completedSleeps = allSleeps.filter(s => (s.duration || 0) >= sleepGoal).length;
  const totalSleepLogs = allSleeps.length;
  const completionPct = totalSleepLogs > 0 ? (completedSleeps / totalSleepLogs) * 100 : 0;

  // Bedtime Circular Average
  const getBedtimeMinutes = (isoString: string) => {
    const d = new Date(isoString);
    const h = d.getHours();
    const m = d.getMinutes();
    const total = h * 60 + m;
    return h < 12 ? total + 1440 : total; // add 24 hours if past midnight
  };

  const formatAvgTime = (avgMins: number) => {
    const mins = Math.round(avgMins) % 1440;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
  };

  const sleepsWithBedTime = allSleeps.filter(s => s.bedTime);
  const avgBedtimeMins = sleepsWithBedTime.length > 0
    ? sleepsWithBedTime.reduce((sum, s) => sum + getBedtimeMinutes(s.bedTime!), 0) / sleepsWithBedTime.length
    : null;
  const avgBedtimeStr = avgBedtimeMins !== null ? formatAvgTime(avgBedtimeMins) : 'N/A';

  const sleepsWithWakeTime = allSleeps.filter(s => s.wakeTime);
  const avgWakeTimeMins = sleepsWithWakeTime.length > 0
    ? sleepsWithWakeTime.reduce((sum, s) => {
        const d = new Date(s.wakeTime!);
        return sum + (d.getHours() * 60 + d.getMinutes());
      }, 0) / sleepsWithWakeTime.length
    : null;
  const avgWakeTimeStr = avgWakeTimeMins !== null ? formatAvgTime(avgWakeTimeMins) : 'N/A';

  // Streaks
  const currentStreak = getSleepStreak(data);
  const longestStreak = getLongestStreak(data, (dateStr) => {
    const s = data.sleep?.[dateStr];
    return s !== undefined && (s.duration || 0) >= sleepGoal;
  });

  return (
    <div className="p-4 pb-24 min-h-screen text-white bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Sleep Tracker</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Rest & Recovery</h1>
        </div>
      </header>

      {/* Daily Tracker Section */}
      <section className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Quick Log Sleep</h3>
        
        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={handleGoingToSleep}
            disabled={isSleeping}
            className={`py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 border ${
              isSleeping 
                ? 'bg-zinc-950 border-zinc-800 text-zinc-600' 
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 active:scale-95'
            }`}
          >
            <span>🌙</span> Going to Sleep
          </button>
          <button
            onClick={handleWokeUp}
            disabled={!isSleeping}
            className={`py-3.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 border ${
              !isSleeping 
                ? 'bg-zinc-950 border-zinc-800 text-zinc-600' 
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-600/10 active:scale-95'
            }`}
          >
            <span>☀️</span> Woke Up
          </button>
        </div>

        {/* Current State Indicator */}
        {isSleeping && (
          <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 text-center">
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider animate-pulse">Tracking active sleep session...</p>
            <p className="text-sm font-semibold text-white mt-1">Slept at {formatTime(data.activeSleepStart!)}</p>
          </div>
        )}
      </section>

      {/* Date-specific sleep logs */}
      <section className="mb-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Logs by Date</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-zinc-950 border border-zinc-850 rounded-lg text-xs font-semibold p-2 text-zinc-300 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {sleepLog ? (
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <p className="text-xs text-zinc-500 font-semibold">{displayDateStr(selectedDate)}</p>
                <h4 className="text-3xl font-black text-white tracking-tight mt-1">
                  {sleepLog.duration?.toFixed(1)} <span className="text-sm font-normal text-zinc-500">hours</span>
                </h4>
              </div>
              {sleepLog.duration !== undefined && (
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${getQuality(sleepLog.duration).bg} ${getQuality(sleepLog.duration).color} ${getQuality(sleepLog.duration).border}`}>
                  <span>{getQuality(sleepLog.duration).emoji}</span> {getQuality(sleepLog.duration).label}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Bed Time</span>
                <p className="text-base font-extrabold text-white mt-0.5">{formatTime(sleepLog.bedTime)}</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Wake Time</span>
                <p className="text-base font-extrabold text-white mt-0.5">{formatTime(sleepLog.wakeTime)}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic mb-5">No sleep record logged for {displayDateStr(selectedDate)}.</p>
        )}

        {/* Manual Input Fields */}
        <div className="pt-4 border-t border-zinc-800">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-3">Manual Entry / Override</span>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-1 ml-1">Bed Time</label>
              <input
                type="datetime-local"
                value={manualBed}
                onChange={(e) => setManualBed(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-1 ml-1">Wake Time</label>
              <input
                type="datetime-local"
                value={manualWake}
                onChange={(e) => setManualWake(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveManual}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
            >
              Save Sleep Log
            </button>
            {sleepLog && (
              <button
                onClick={handleClearLog}
                className="px-4 py-3 bg-zinc-950 hover:bg-red-950 border border-zinc-850 hover:border-red-900 text-zinc-500 hover:text-red-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Sleep Statistics Section */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Sleep Statistics</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Sleep (Week)</span>
              <p className="text-xl font-black text-white mt-0.5">{weeklyAvg.toFixed(1)}h</p>
            </div>
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Sleep (Month)</span>
              <p className="text-xl font-black text-white mt-0.5">{monthlyAvg.toFixed(1)}h</p>
            </div>
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Sleep Streak</span>
              <p className="text-sm font-black text-white mt-1">🔥 {currentStreak}d (Best {longestStreak}d)</p>
            </div>
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Goal Completion %</span>
              <p className="text-xl font-black text-indigo-400 mt-0.5">{completionPct.toFixed(0)}%</p>
            </div>
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Bedtime</span>
              <p className="text-sm font-black text-white mt-1">{avgBedtimeStr}</p>
            </div>
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Wake Time</span>
              <p className="text-sm font-black text-white mt-1">{avgWakeTimeStr}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
