'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString, getOffsetDateString } from '@/lib/storage';
import { calculateDailyScore, calculateRecoveryScore } from '@/lib/scoring';
import {
  getGymStreak,
  getPrayerStreak,
  getCollegeStreak,
  getProteinStreak,
  getStepsStreak,
  getDisciplineStreak,
  getSleepStreak,
  getSkincareStreak,
  getEssentialsStreak,
  getLongestStreak
} from '@/lib/streaks';
import { DailyEssentialsRecord } from '@/lib/types';
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
  const sleepGoal = data.settings?.sleepGoal || 8;

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
    ...Object.keys(data.gym || {}),
    ...Object.keys(data.prayers || {}),
    ...Object.keys(data.journal || {}),
    ...Object.keys(data.coding || {}),
    ...Object.keys(data.college || {}),
    ...Object.keys(data.steps || {}),
    ...Object.keys(data.discipline || {}),
    ...Object.keys(data.sleep || {}),
    ...Object.keys(data.skincare || {}),
    ...Object.keys(data.dailyEssentials || {}),
    ...(data.meals || []).map(m => m.date),
    ...(data.weightLogs || []).map(w => w.date)
  ]);
  const daysTracked = trackedDates.size;

  // Streaks
  const prayerStreak = getPrayerStreak(data);
  const gymStreak = getGymStreak(data);
  const collegeStreak = getCollegeStreak(data);
  const stepsStreak = getStepsStreak(data);
  const proteinStreak = getProteinStreak(data);
  const disciplineStreak = getDisciplineStreak(data);
  const sleepStreak = getSleepStreak(data);
  const skincareStreak = getSkincareStreak(data);
  const essentialsStreak = getEssentialsStreak(data);
  const bestStreak = Math.max(gymStreak, collegeStreak, prayerStreak, proteinStreak, stepsStreak, disciplineStreak, sleepStreak, skincareStreak, essentialsStreak);

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

  // Rating and Comparison calculations
  let overallRatingSummary = '';
  const comparisons: { text: string; isPositive: boolean }[] = [];
  let biggestImprovement = '';
  let focusHabit = '';
  let weeklySummaryText = 'Complete one full week to unlock comparison insights.';

  if (previousWeekReport) {
    // Overall Weekly Rating at top
    const scoreDiff = currentWeekReport.avgScore - previousWeekReport.avgScore;
    if (scoreDiff > 0) {
      overallRatingSummary = `You improved by ${scoreDiff}% compared to last week`;
    } else if (scoreDiff < 0) {
      overallRatingSummary = `Overall consistency dropped by ${Math.abs(scoreDiff)}% compared to last week`;
    } else {
      overallRatingSummary = `Overall consistency remained steady compared to last week`;
    }

    // Dynamic Comparison Details
    // Format helpers
    const addComp = (label: string, currVal: number, prevVal: number, total: number, unit: string) => {
      const diff = currVal - prevVal;
      const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
      comparisons.push({
        text: `${label}: ${prevVal}/${total} → ${currVal}/${total} (${diffStr} ${unit})`,
        isPositive: diff >= 0
      });
    };

    // 1. Average Daily Score
    const diffScore = currentWeekReport.avgScore - previousWeekReport.avgScore;
    comparisons.push({
      text: `Daily Score: ${previousWeekReport.avgScore} → ${currentWeekReport.avgScore} (${diffScore >= 0 ? '+' : ''}${diffScore})`,
      isPositive: diffScore >= 0
    });

    // 2. Average Recovery Score
    const diffRecovery = currentWeekReport.avgRecoveryScore - previousWeekReport.avgRecoveryScore;
    comparisons.push({
      text: `Recovery Score: ${previousWeekReport.avgRecoveryScore} → ${currentWeekReport.avgRecoveryScore} (${diffRecovery >= 0 ? '+' : ''}${diffRecovery})`,
      isPositive: diffRecovery >= 0
    });

    // 3. Gym
    addComp('Gym', currentWeekReport.gymAttended, previousWeekReport.gymAttended, 7, 'days');

    // 4. College
    addComp('College', currentWeekReport.collegeAttended, previousWeekReport.collegeAttended, 7, 'days');

    // 5. Steps
    addComp('10K Steps', currentWeekReport.stepsAttended, previousWeekReport.stepsAttended, 7, 'days');

    // 6. Prayers
    addComp('Prayers', currentWeekReport.prayersAttended, previousWeekReport.prayersAttended, 35, 'prayers');

    // 7. Protein
    addComp('Protein Goal', currentWeekReport.proteinAttended, previousWeekReport.proteinAttended, 7, 'days');

    // 8. Sleep Goal
    addComp('Sleep Goal', currentWeekReport.sleepAttended, previousWeekReport.sleepAttended, 7, 'days');

    // 9. Discipline
    addComp('Discipline', currentWeekReport.disciplineAttended, previousWeekReport.disciplineAttended, 7, 'days');

    // Skincare
    if (currentWeekReport.skincareMorningPct !== undefined && previousWeekReport?.skincareMorningPct !== undefined) {
      addComp('Skincare Morning', currentWeekReport.skincareMorningAttended!, previousWeekReport.skincareMorningAttended!, 7, 'days');
      addComp('Skincare Night', currentWeekReport.skincareNightAttended!, previousWeekReport.skincareNightAttended!, 7, 'days');
    }

    // Daily Essentials
    if (currentWeekReport.essentialsPct !== undefined && previousWeekReport?.essentialsPct !== undefined) {
      addComp('Daily Essentials', currentWeekReport.essentialsAttended!, previousWeekReport.essentialsAttended!, 42, 'items');
    }

    // 10. Todos
    const todoDiff = currentWeekReport.todosAttended - previousWeekReport.todosAttended;
    comparisons.push({
      text: `Todo: ${previousWeekReport.todosAttended}/${previousWeekReport.todosTotal} → ${currentWeekReport.todosAttended}/${currentWeekReport.todosTotal} (${todoDiff >= 0 ? '+' : ''}${todoDiff} tasks)`,
      isPositive: todoDiff >= 0
    });

    // 11. Class Attendance
    const classDiff = currentWeekReport.classesAttended - previousWeekReport.classesAttended;
    comparisons.push({
      text: `Class Attendance: ${previousWeekReport.classesAttended}/${previousWeekReport.classesTotal} → ${currentWeekReport.classesAttended}/${currentWeekReport.classesTotal} (${classDiff >= 0 ? '+' : ''}${classDiff} classes)`,
      isPositive: classDiff >= 0
    });

    // Biggest Improvement and Focus Areas
    const habitsToCompare = [
      { name: 'Gym', current: currentWeekReport.gymPct, previous: previousWeekReport.gymPct },
      { name: 'College', current: currentWeekReport.collegePct, previous: previousWeekReport.collegePct },
      { name: '10K Steps', current: currentWeekReport.stepsPct, previous: previousWeekReport.stepsPct },
      { name: 'Prayers', current: currentWeekReport.prayerPct, previous: previousWeekReport.prayerPct },
      { name: 'Protein', current: currentWeekReport.proteinPct, previous: previousWeekReport.proteinPct },
      { name: 'Todos', current: currentWeekReport.todoPct, previous: previousWeekReport.todoPct },
      { name: 'Class Attendance', current: currentWeekReport.classAttendancePct, previous: previousWeekReport.classAttendancePct },
      { name: 'Discipline', current: currentWeekReport.disciplinePct, previous: previousWeekReport.disciplinePct },
      { name: 'Sleep', current: currentWeekReport.sleepPct, previous: previousWeekReport.sleepPct },
      { name: 'Skincare Morning', current: currentWeekReport.skincareMorningPct ?? 0, previous: previousWeekReport?.skincareMorningPct ?? 0 },
      { name: 'Skincare Night', current: currentWeekReport.skincareNightPct ?? 0, previous: previousWeekReport?.skincareNightPct ?? 0 },
      { name: 'Daily Essentials', current: currentWeekReport.essentialsPct ?? 0, previous: previousWeekReport?.essentialsPct ?? 0 }
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

  // --- Sleep analytics calculation ---
  const allSleeps = Object.values(data.sleep || {});
  const weeklySleeps = Object.entries(data.sleep || {}).filter(([date]) => new Date(date) >= currentMondayDate);
  const sleepWeeklyAvg = weeklySleeps.length > 0
    ? weeklySleeps.reduce((acc, [, val]) => acc + (val.duration || 0), 0) / 7
    : 0;

  const thisMonthMonday = new Date();
  thisMonthMonday.setDate(1);
  thisMonthMonday.setHours(0,0,0,0);
  const monthlySleeps = Object.entries(data.sleep || {}).filter(([date]) => new Date(date) >= thisMonthMonday);
  const sleepMonthlyAvg = monthlySleeps.length > 0
    ? monthlySleeps.reduce((acc, [, val]) => acc + (val.duration || 0), 0) / monthlySleeps.length
    : 0;

  const completedSleeps = allSleeps.filter(s => (s.duration || 0) >= sleepGoal).length;
  const sleepCompletionPct = allSleeps.length > 0 ? (completedSleeps / allSleeps.length) * 100 : 0;

  const getBedtimeMinutes = (isoString: string) => {
    const d = new Date(isoString);
    const h = d.getHours();
    const m = d.getMinutes();
    const total = h * 60 + m;
    return h < 12 ? total + 1440 : total;
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

  const sleepLongestStreak = getLongestStreak(data, (dateStr) => {
    const s = data.sleep?.[dateStr];
    return s !== undefined && (s.duration || 0) >= sleepGoal;
  });

  // --- Discipline analytics calculation ---
  const disciplineLogs = Object.values(data.discipline || {});
  const strongDaysCount = disciplineLogs.filter(v => v === 'strong').length;
  const disciplineSuccessPct = disciplineLogs.length > 0 ? (strongDaysCount / disciplineLogs.length) * 100 : 0;
  const disciplineLongestStreak = getLongestStreak(data, dateStr => data.discipline?.[dateStr] === 'strong');

  const strongDaysThisWeek = Object.entries(data.discipline || {})
    .filter(([date, status]) => new Date(date) >= currentMondayDate && status === 'strong').length;

  const strongDaysThisMonth = Object.entries(data.discipline || {})
    .filter(([date, status]) => new Date(date) >= thisMonthMonday && status === 'strong').length;

  const discDiff = previousWeekReport
    ? currentWeekReport.disciplineAttended - previousWeekReport.disciplineAttended
    : 0;
  const disciplineInsight = previousWeekReport
    ? discDiff > 0
      ? `🔥 Discipline improved by ${discDiff} days.`
      : discDiff < 0
        ? `⚠️ Discipline declined by ${Math.abs(discDiff)} days.`
        : 'Discipline level remained steady.'
    : 'No comparison insights available yet.';

  // --- Skincare analytics calculation ---
  const skincareLogs = Object.values(data.skincare || {});
  const morningCompletedCount = skincareLogs.filter(s => s.morning).length;
  const morningCompletionPct = skincareLogs.length > 0 ? (morningCompletedCount / skincareLogs.length) * 100 : 0;

  const nightCompletedCount = skincareLogs.filter(s => s.night).length;
  const nightCompletionPct = skincareLogs.length > 0 ? (nightCompletedCount / skincareLogs.length) * 100 : 0;

  const overallSkincarePct = skincareLogs.length > 0
    ? ((morningCompletedCount + nightCompletedCount) / (skincareLogs.length * 2)) * 100
    : 0;

  const skincareLongestStreak = getLongestStreak(data, dateStr => data.skincare?.[dateStr]?.morning === true && data.skincare?.[dateStr]?.night === true);

  // Weekly Skincare Completion
  const skincareStart = new Date(currentMondayStr);
  const weeklyDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(skincareStart);
    d.setDate(skincareStart.getDate() + i);
    weeklyDates.push(formatDateString(d));
  }
  const weeklyMorningCompleted = weeklyDates.filter(d => data.skincare?.[d]?.morning === true).length;
  const weeklyNightCompleted = weeklyDates.filter(d => data.skincare?.[d]?.night === true).length;

  // Monthly Skincare Completion
  const monthlyDates: string[] = [];
  const todayDateObj = new Date();
  const daysPassedInMonth = todayDateObj.getDate();
  for (let i = 1; i <= daysPassedInMonth; i++) {
    const d = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), i);
    monthlyDates.push(formatDateString(d));
  }
  const monthlyMorningCompleted = monthlyDates.filter(d => data.skincare?.[d]?.morning === true).length;
  const monthlyNightCompleted = monthlyDates.filter(d => data.skincare?.[d]?.night === true).length;

  // Weekly Insights
  const last7Days = Array.from({ length: 7 }, (_, i) => getOffsetDateString(-i));
  const prev7Days = Array.from({ length: 7 }, (_, i) => getOffsetDateString(-i - 7));

  const morningCompletedLast7 = last7Days.filter(d => data.skincare?.[d]?.morning === true).length;
  const morningCompletedPrev7 = prev7Days.filter(d => data.skincare?.[d]?.morning === true).length;

  const nightCompletedLast7 = last7Days.filter(d => data.skincare?.[d]?.night === true).length;
  const nightCompletedPrev7 = prev7Days.filter(d => data.skincare?.[d]?.night === true).length;

  const morningDiff = morningCompletedLast7 - morningCompletedPrev7;
  let skincareMorningInsight = `🌞 Morning skincare completed on ${morningCompletedLast7} of the last 7 days.`;
  if (morningDiff > 0) {
    skincareMorningInsight = `🌞 Morning skincare completed on ${morningCompletedLast7} of the last 7 days (improved from ${morningCompletedPrev7}/7, +${morningDiff} days).`;
  } else if (morningDiff < 0) {
    skincareMorningInsight = `🌞 Morning skincare completed on ${morningCompletedLast7} of the last 7 days (declined from ${morningCompletedPrev7}/7, ${morningDiff} days).`;
  } else {
    skincareMorningInsight = `🌞 Morning skincare completed on ${morningCompletedLast7} of the last 7 days (steady compared to previous week).`;
  }

  const nightDiff = nightCompletedLast7 - nightCompletedPrev7;
  let skincareNightInsight = `🌙 Night skincare completed on ${nightCompletedLast7} of the last 7 days.`;
  if (nightDiff > 0) {
    skincareNightInsight = `🌙 Night skincare improved from ${nightCompletedPrev7}/7 to ${nightCompletedLast7}/7 (improved by ${nightDiff} days).`;
  } else if (nightDiff < 0) {
    skincareNightInsight = `🌙 Night skincare declined from ${nightCompletedPrev7}/7 to ${nightCompletedLast7}/7 (dropped by ${Math.abs(nightDiff)} days).`;
  } else {
    skincareNightInsight = `🌙 Night skincare steady at ${nightCompletedLast7}/7 compared to previous week.`;
  }

  // --- Daily Essentials analytics calculation ---
  const essentialsLogs = Object.values(data.dailyEssentials || {});
  const totalDaysEssentials = essentialsLogs.length;

  const countEssentialItem = (key: keyof DailyEssentialsRecord) => {
    return essentialsLogs.filter(e => e[key] === true).length;
  };

  const getEssentialItemPct = (key: keyof DailyEssentialsRecord) => {
    const count = countEssentialItem(key);
    return totalDaysEssentials > 0 ? (count / totalDaysEssentials) * 100 : 0;
  };

  // Overall Essentials Completion %
  let totalSubItemsCompleted = 0;
  essentialsLogs.forEach(e => {
    if (e.multivitamin) totalSubItemsCompleted++;
    if (e.fishOil) totalSubItemsCompleted++;
    if (e.ashwagandha) totalSubItemsCompleted++;
    if (e.moringa) totalSubItemsCompleted++;
    if (e.readingEnglish) totalSubItemsCompleted++;
    if (e.speakingEnglish) totalSubItemsCompleted++;
  });
  const overallEssentialsPct = totalDaysEssentials > 0
    ? (totalSubItemsCompleted / (totalDaysEssentials * 6)) * 100
    : 0;

  const essentialsLongestStreak = getLongestStreak(data, dateStr => {
    const e = data.dailyEssentials?.[dateStr];
    return !!(e && e.multivitamin && e.fishOil && e.ashwagandha && e.moringa && e.readingEnglish && e.speakingEnglish);
  });

  // Weekly Essentials Completion
  const weeklyEssentialsDates = weeklyDates;
  let weeklySubItemsCompleted = 0;
  const countWeeklyEssentialItem = (key: keyof DailyEssentialsRecord) => {
    return weeklyEssentialsDates.filter(d => data.dailyEssentials?.[d]?.[key] === true).length;
  };
  weeklyEssentialsDates.forEach(d => {
    const e = data.dailyEssentials?.[d];
    if (e) {
      if (e.multivitamin) weeklySubItemsCompleted++;
      if (e.fishOil) weeklySubItemsCompleted++;
      if (e.ashwagandha) weeklySubItemsCompleted++;
      if (e.moringa) weeklySubItemsCompleted++;
      if (e.readingEnglish) weeklySubItemsCompleted++;
      if (e.speakingEnglish) weeklySubItemsCompleted++;
    }
  });
  const weeklyEssentialsPct = (weeklySubItemsCompleted / 42) * 100;

  // Monthly Essentials Completion
  const monthlyEssentialsDates = monthlyDates;
  let monthlySubItemsCompleted = 0;
  const countMonthlyEssentialItem = (key: keyof DailyEssentialsRecord) => {
    return monthlyEssentialsDates.filter(d => data.dailyEssentials?.[d]?.[key] === true).length;
  };
  monthlyEssentialsDates.forEach(d => {
    const e = data.dailyEssentials?.[d];
    if (e) {
      if (e.multivitamin) monthlySubItemsCompleted++;
      if (e.fishOil) monthlySubItemsCompleted++;
      if (e.ashwagandha) monthlySubItemsCompleted++;
      if (e.moringa) monthlySubItemsCompleted++;
      if (e.readingEnglish) monthlySubItemsCompleted++;
      if (e.speakingEnglish) monthlySubItemsCompleted++;
    }
  });
  const monthlyEssentialsPct = monthlyEssentialsDates.length > 0
    ? (monthlySubItemsCompleted / (monthlyEssentialsDates.length * 6)) * 100
    : 0;

  // Weekly Insights
  const last7DaysDates = last7Days;
  const prev7DaysDates = prev7Days;

  const getCompletedCountLast7 = (key: keyof DailyEssentialsRecord) => {
    return last7DaysDates.filter(d => data.dailyEssentials?.[d]?.[key] === true).length;
  };
  const getCompletedCountPrev7 = (key: keyof DailyEssentialsRecord) => {
    return prev7DaysDates.filter(d => data.dailyEssentials?.[d]?.[key] === true).length;
  };

  const keysList: (keyof DailyEssentialsRecord)[] = ['multivitamin', 'fishOil', 'ashwagandha', 'moringa', 'readingEnglish', 'speakingEnglish'];
  const essentialDisplayNames: Record<keyof DailyEssentialsRecord, string> = {
    multivitamin: 'Multivitamin 💊',
    fishOil: 'Fish Oil 🐟',
    ashwagandha: 'Ashwagandha 🌿',
    moringa: 'Moringa 🍃',
    readingEnglish: 'Read English 📖',
    speakingEnglish: 'Speak English 🗣️',
  };

  // Weakest item in the last 7 days
  let weakestItemKey = keysList[0];
  let minCompletedCount = 8;
  keysList.forEach(k => {
    const count = getCompletedCountLast7(k);
    if (count < minCompletedCount) {
      minCompletedCount = count;
      weakestItemKey = k;
    }
  });
  const missedDaysCount = 7 - minCompletedCount;
  const weakestInsightText = missedDaysCount > 0
    ? `${essentialDisplayNames[weakestItemKey]} was missed on ${missedDaysCount} days this week.`
    : `All Daily Essentials were completed perfectly this week! 🎉`;

  // Most improved item compared to previous week
  let mostImprovedItemKey = keysList[0];
  let maxImprovement = -100;
  keysList.forEach(k => {
    const last7Count = getCompletedCountLast7(k);
    const prev7Count = getCompletedCountPrev7(k);
    const diff = last7Count - prev7Count;
    if (diff > maxImprovement) {
      maxImprovement = diff;
      mostImprovedItemKey = k;
    }
  });

  const mostImprovedInsightText = maxImprovement > 0
    ? `${essentialDisplayNames[mostImprovedItemKey]} improved from ${getCompletedCountPrev7(mostImprovedItemKey)}/7 to ${getCompletedCountLast7(mostImprovedItemKey)}/7.`
    : `Supplements & habits consistency remained steady compared to last week.`;

  // --- Recovery Score calculations ---
  const last30Days = Array.from({ length: 30 }, (_, i) => getOffsetDateString(-i));
  
  let recovery30Sum = 0;
  last30Days.forEach(d => {
    recovery30Sum += calculateRecoveryScore(data, d);
  });
  const avgRecoveryLast30 = Math.round(recovery30Sum / 30);

  let bestRecoveryDay = { date: 'N/A', score: 0 };
  trackedDates.forEach(date => {
    const s = calculateRecoveryScore(data, date);
    if (s > bestRecoveryDay.score) {
      bestRecoveryDay = { date, score: s };
    }
  });
  const bestRecoveryDayStr = bestRecoveryDay.score > 0
    ? `${bestRecoveryDay.score}/100 on ${new Date(bestRecoveryDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'N/A';

  const recoveryTrend = previousWeekReport
    ? `${currentWeekReport.avgRecoveryScore - previousWeekReport.avgRecoveryScore >= 0 ? '⬆' : '⬇'} ${currentWeekReport.avgRecoveryScore}% (last week ${previousWeekReport.avgRecoveryScore}%, diff: ${currentWeekReport.avgRecoveryScore - previousWeekReport.avgRecoveryScore >= 0 ? '+' : ''}${currentWeekReport.avgRecoveryScore - previousWeekReport.avgRecoveryScore})`
    : 'N/A';

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

      {/* OVERALL WEEKLY RATING SUMMARY */}
      {overallRatingSummary && (
        <section className="mb-6 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/20 rounded-2xl p-4 shadow-md text-center">
          <p className="text-sm font-black text-indigo-200">
            {overallRatingSummary}
          </p>
        </section>
      )}

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
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Average Recovery</p>
            <p className="text-lg font-black text-zinc-300 mt-1">{currentWeekReport.avgRecoveryScore}</p>
          </div>
        </div>

        {/* Prioritized Progress Indicators */}
        <div className="space-y-4 relative">
          {/* Gym */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🏋️ Gym Completion</span>
              <span className="text-zinc-400">{currentWeekReport.gymAttended}/{currentWeekReport.gymTotal} • <span className="text-blue-400">{currentWeekReport.gymPct.toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.gymPct}%` }} />
            </div>
          </div>

          {/* College */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🎓 College Attendance</span>
              <span className="text-zinc-400">{currentWeekReport.collegeAttended}/{currentWeekReport.collegeTotal} • <span className="text-blue-400">{currentWeekReport.collegePct.toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.collegePct}%` }} />
            </div>
          </div>

          {/* 10K Steps */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">👣 10K Steps Tracker</span>
              <span className="text-zinc-400">{currentWeekReport.stepsAttended}/{currentWeekReport.stepsTotal} • <span className="text-blue-400">{currentWeekReport.stepsPct.toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.stepsPct}%` }} />
            </div>
          </div>

          {/* Prayers */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🕌 Prayer Completion</span>
              <span className="text-zinc-400">{currentWeekReport.prayersAttended}/{currentWeekReport.prayersTotal} • <span className="text-blue-400">{currentWeekReport.prayerPct.toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.prayerPct}%` }} />
            </div>
          </div>

          {/* Protein */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🍗 Protein Goal Achieved</span>
              <span className="text-zinc-400">{currentWeekReport.proteinAttended}/{currentWeekReport.proteinTotal} • <span className="text-blue-400">{currentWeekReport.proteinPct.toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.proteinPct}%` }} />
            </div>
          </div>

          {/* Sleep */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🌙 Sleep Goal Achieved</span>
              <span className="text-zinc-400">{currentWeekReport.sleepAttended}/{currentWeekReport.sleepTotal} • <span className="text-blue-400">{currentWeekReport.sleepPct.toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.sleepPct}%` }} />
            </div>
          </div>

          {/* Discipline */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">✅ Discipline Tracker</span>
              <span className="text-zinc-400">{currentWeekReport.disciplineAttended}/{currentWeekReport.disciplineTotal} • <span className="text-blue-400">{currentWeekReport.disciplinePct.toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.disciplinePct}%` }} />
            </div>
          </div>

          {/* Skincare Morning */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🌞 Skincare Morning</span>
              <span className="text-zinc-400">{currentWeekReport.skincareMorningAttended || 0}/{currentWeekReport.skincareMorningTotal || 7} • <span className="text-blue-400">{(currentWeekReport.skincareMorningPct || 0).toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.skincareMorningPct || 0}%` }} />
            </div>
          </div>

          {/* Skincare Night */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">🌙 Skincare Night</span>
              <span className="text-zinc-400">{currentWeekReport.skincareNightAttended || 0}/{currentWeekReport.skincareNightTotal || 7} • <span className="text-blue-400">{(currentWeekReport.skincareNightPct || 0).toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.skincareNightPct || 0}%` }} />
            </div>
          </div>

          {/* Daily Essentials */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">💊 Daily Essentials</span>
              <span className="text-zinc-400">{currentWeekReport.essentialsAttended || 0}/{currentWeekReport.essentialsTotal || 42} • <span className="text-blue-400">{(currentWeekReport.essentialsPct || 0).toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.essentialsPct || 0}%` }} />
            </div>
          </div>

          {/* Class Attendance */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-zinc-300">📅 Academic Attendance</span>
              <span className="text-zinc-400">{currentWeekReport.classesAttended}/{currentWeekReport.classesTotal} • <span className="text-blue-400">{currentWeekReport.classAttendancePct.toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
              <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${currentWeekReport.classAttendancePct}%` }} />
            </div>
          </div>
        </div>

        {/* Todo completion info below */}
        <div className="mt-6 pt-6 border-t border-zinc-800 relative">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Todo Completion</p>
          <p className="text-xs font-bold text-white mt-1">
            {currentWeekReport.todosAttended}/{currentWeekReport.todosTotal} completed • <span className="text-blue-400">{currentWeekReport.todoPct.toFixed(0)}%</span>
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
                <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">🏆 Biggest Improvement</span>
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
              <ul className="space-y-2.5">
                {comparisons.map((c, idx) => (
                  <li key={idx} className="text-xs font-medium flex items-center justify-between">
                    <span className={c.isPositive ? 'text-green-400' : 'text-red-400'}>
                      {c.text}
                    </span>
                  </li>
                ))}
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

      {/* THREE NEW ANALYTICS CARDS (Recovery, Sleep, Discipline) */}
      <section className="mb-6 space-y-4">
        {/* Recovery Analytics */}
        <div>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Recovery Score Analytics</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Weekly Average</span>
                <p className="text-xl font-black text-white mt-0.5">{currentWeekReport.avgRecoveryScore}/100</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Monthly Average</span>
                <p className="text-xl font-black text-white mt-0.5">{avgRecoveryLast30}/100</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Best Recovery Day</span>
                <p className="text-xs font-bold text-white mt-1 leading-snug">{bestRecoveryDayStr}</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Recovery Trend</span>
                <p className="text-xs font-bold text-indigo-400 mt-1 leading-snug">{recoveryTrend}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sleep Analytics */}
        <div>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Sleep Analytics</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Weekly Average</span>
                <p className="text-xl font-black text-white mt-0.5">{sleepWeeklyAvg.toFixed(1)} hrs</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Monthly Average</span>
                <p className="text-xl font-black text-white mt-0.5">{sleepMonthlyAvg.toFixed(1)} hrs</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Sleep Streak</span>
                <p className="text-base font-black text-white mt-0.5">🔥 {sleepStreak}d (Best {sleepLongestStreak}d)</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Completion Pct</span>
                <p className="text-xl font-black text-indigo-400 mt-0.5">{sleepCompletionPct.toFixed(0)}%</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Bedtime</span>
                <p className="text-xs font-bold text-zinc-300 mt-1">{avgBedtimeStr}</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg Wake Time</span>
                <p className="text-xs font-bold text-zinc-300 mt-1">{avgWakeTimeStr}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Discipline Analytics */}
        <div>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Discipline Analytics</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Current Streak</span>
                <p className="text-xl font-black text-white mt-0.5">🔥 {disciplineStreak} days</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Longest Streak</span>
                <p className="text-xl font-black text-white mt-0.5">🏆 {disciplineLongestStreak} days</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Success %</span>
                <p className="text-xl font-black text-indigo-400 mt-0.5">{disciplineSuccessPct.toFixed(0)}%</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Strong Days</span>
                <p className="text-xs font-bold text-zinc-300 mt-1">
                  Wk: {strongDaysThisWeek}d • Mo: {strongDaysThisMonth}d
                </p>
              </div>
              <div className="col-span-2 bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/20 text-center">
                <p className="text-xs font-extrabold text-indigo-300">{disciplineInsight}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skincare Analytics */}
        <div>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Skincare Analytics</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Morning Completion</span>
                <p className="text-sm font-black text-white mt-0.5">
                  {morningCompletedCount}/{skincareLogs.length} • <span className="text-emerald-400 text-xs font-bold">{morningCompletionPct.toFixed(1)}%</span>
                </p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Night Completion</span>
                <p className="text-sm font-black text-white mt-0.5">
                  {nightCompletedCount}/{skincareLogs.length} • <span className="text-emerald-400 text-xs font-bold">{nightCompletionPct.toFixed(1)}%</span>
                </p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Overall Completion</span>
                <p className="text-sm font-black text-indigo-400 mt-0.5">
                  {morningCompletedCount + nightCompletedCount}/{skincareLogs.length * 2} • <span className="text-xs font-bold">{overallSkincarePct.toFixed(1)}%</span>
                </p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Skincare Streak</span>
                <p className="text-base font-black text-white mt-0.5">🔥 {skincareStreak}d (Best {skincareLongestStreak}d)</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Weekly Completion</span>
                <p className="text-xs font-bold text-zinc-300 mt-1">
                  🌞 {weeklyMorningCompleted}/7d ({((weeklyMorningCompleted/7)*100).toFixed(0)}%) <br /> 🌙 {weeklyNightCompleted}/7d ({((weeklyNightCompleted/7)*100).toFixed(0)}%)
                </p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Monthly Completion</span>
                <p className="text-xs font-bold text-zinc-300 mt-1">
                  🌞 {monthlyMorningCompleted}/{daysPassedInMonth}d ({((monthlyMorningCompleted/daysPassedInMonth)*100).toFixed(0)}%) <br /> 🌙 {monthlyNightCompleted}/{daysPassedInMonth}d ({((monthlyNightCompleted/daysPassedInMonth)*100).toFixed(0)}%)
                </p>
              </div>
              <div className="col-span-2 bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/20 space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Weekly Insights</span>
                <p className="text-xs font-extrabold text-indigo-300">{skincareMorningInsight}</p>
                <p className="text-xs font-extrabold text-indigo-300">{skincareNightInsight}</p>
                <p className="text-xs font-extrabold text-indigo-300">✨ Current skincare streak: {skincareStreak} days.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Essentials Analytics */}
        <div>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Daily Essentials Analytics</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Overall Completion</span>
                <p className="text-sm font-black text-indigo-400 mt-0.5">
                  {totalSubItemsCompleted}/{totalDaysEssentials * 6} • <span className="text-xs font-bold">{overallEssentialsPct.toFixed(1)}%</span>
                </p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Essentials Streak</span>
                <p className="text-base font-black text-white mt-0.5">🔥 {essentialsStreak}d (Best {essentialsLongestStreak}d)</p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Weekly Completion</span>
                <p className="text-xs font-bold text-zinc-300 mt-1">
                  {weeklySubItemsCompleted}/42 items <br /> {weeklyEssentialsPct.toFixed(1)}%
                </p>
              </div>
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Monthly Completion</span>
                <p className="text-xs font-bold text-zinc-300 mt-1">
                  {monthlySubItemsCompleted}/{monthlyEssentialsDates.length * 6} items <br /> {monthlyEssentialsPct.toFixed(1)}%
                </p>
              </div>

              {/* Item Individual Percentages */}
              <div className="col-span-2 bg-zinc-950/50 p-4 rounded-xl border border-zinc-850 space-y-3.5">
                <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Individual Checklist Performance</span>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    { key: 'multivitamin', label: 'Multivitamin 💊' },
                    { key: 'fishOil', label: 'Fish Oil 🐟' },
                    { key: 'ashwagandha', label: 'Ashwagandha 🌿' },
                    { key: 'moringa', label: 'Moringa 🍃' },
                    { key: 'readingEnglish', label: 'Read English 📖' },
                    { key: 'speakingEnglish', label: 'Speak English 🗣️' }
                  ].map(item => {
                    const count = countEssentialItem(item.key as keyof DailyEssentialsRecord);
                    const pct = getEssentialItemPct(item.key as keyof DailyEssentialsRecord);
                    return (
                      <div key={item.key} className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-400">{item.label}</span>
                        <span className="text-sm font-black text-white mt-0.5">
                          {count}/{totalDaysEssentials} • <span className="text-blue-400 text-xs font-bold">{pct.toFixed(1)}%</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Insights */}
              <div className="col-span-2 bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/20 space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Weekly Insights</span>
                <p className="text-xs font-extrabold text-indigo-300">💡 {weakestInsightText}</p>
                <p className="text-xs font-extrabold text-indigo-300">📈 {mostImprovedInsightText}</p>
                <p className="text-xs font-extrabold text-indigo-300">✨ Current essentials streak: {essentialsStreak} days.</p>
              </div>
            </div>
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
                  {sub.attended}/{sub.total} • <span className={sub.percentage >= 75 ? "text-emerald-400" : "text-amber-500"}>{sub.percentage.toFixed(0)}%</span>
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
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Best Habit Streak</p>
              <p className="text-lg font-black text-white mt-0.5">{bestStreak} days</p>
            </div>
            <div className="bg-zinc-950/45 p-3 rounded-xl border border-zinc-850 col-span-2 text-center">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Days Using Life OS</p>
              <p className="text-sm font-black text-white mt-0.5">{daysTracked} days</p>
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
              <div className="flex-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Average Daily Score</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-white">{selectedWeeklyReport.avgScore}</span>
                  <span className="text-zinc-500 text-xs">/100</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Avg Recovery</span>
                <span className="text-xl font-black text-zinc-300">{selectedWeeklyReport.avgRecoveryScore}</span>
              </div>
            </div>

            {/* Habits stats list */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">Gym Completion</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.gymAttended}/{selectedWeeklyReport.gymTotal} • <span className="text-blue-400">{selectedWeeklyReport.gymPct.toFixed(0)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-emerald-500" style={{ width: `${selectedWeeklyReport.gymPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">College Attendance</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.collegeAttended}/{selectedWeeklyReport.collegeTotal} • <span className="text-blue-400">{selectedWeeklyReport.collegePct.toFixed(0)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-blue-500" style={{ width: `${selectedWeeklyReport.collegePct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">10K Steps Goal</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.stepsAttended}/{selectedWeeklyReport.stepsTotal} • <span className="text-blue-400">{selectedWeeklyReport.stepsPct.toFixed(0)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-green-500" style={{ width: `${selectedWeeklyReport.stepsPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">Prayer Completion</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.prayersAttended}/{selectedWeeklyReport.prayersTotal} • <span className="text-blue-400">{selectedWeeklyReport.prayerPct.toFixed(0)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-purple-500" style={{ width: `${selectedWeeklyReport.prayerPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">Protein Goal Achieved</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.proteinAttended}/{selectedWeeklyReport.proteinTotal} • <span className="text-blue-400">{selectedWeeklyReport.proteinPct.toFixed(0)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-indigo-500" style={{ width: `${selectedWeeklyReport.proteinPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">Sleep Goal Achieved</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.sleepAttended}/{selectedWeeklyReport.sleepTotal} • <span className="text-blue-400">{selectedWeeklyReport.sleepPct.toFixed(0)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-teal-500" style={{ width: `${selectedWeeklyReport.sleepPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">Discipline Days</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.disciplineAttended}/{selectedWeeklyReport.disciplineTotal} • <span className="text-blue-400">{selectedWeeklyReport.disciplinePct.toFixed(0)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-yellow-500" style={{ width: `${selectedWeeklyReport.disciplinePct}%` }} />
                </div>
              </div>

              {selectedWeeklyReport.skincareMorningPct !== undefined && (
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span className="text-zinc-400">🌞 Skincare Morning</span>
                    <span className="text-zinc-300">{selectedWeeklyReport.skincareMorningAttended}/{selectedWeeklyReport.skincareMorningTotal} • <span className="text-blue-400">{selectedWeeklyReport.skincareMorningPct.toFixed(0)}%</span></span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                    <div className="h-full bg-emerald-500" style={{ width: `${selectedWeeklyReport.skincareMorningPct}%` }} />
                  </div>
                </div>
              )}

              {selectedWeeklyReport.skincareNightPct !== undefined && (
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span className="text-zinc-400">🌙 Skincare Night</span>
                    <span className="text-zinc-300">{selectedWeeklyReport.skincareNightAttended}/{selectedWeeklyReport.skincareNightTotal} • <span className="text-blue-400">{selectedWeeklyReport.skincareNightPct.toFixed(0)}%</span></span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                    <div className="h-full bg-indigo-500" style={{ width: `${selectedWeeklyReport.skincareNightPct}%` }} />
                  </div>
                </div>
              )}

              {selectedWeeklyReport.essentialsPct !== undefined && (
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span className="text-zinc-400">💊 Daily Essentials</span>
                    <span className="text-zinc-300">{selectedWeeklyReport.essentialsAttended}/{selectedWeeklyReport.essentialsTotal} • <span className="text-blue-400">{selectedWeeklyReport.essentialsPct.toFixed(0)}%</span></span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                    <div className="h-full bg-teal-500" style={{ width: `${selectedWeeklyReport.essentialsPct}%` }} />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-1">
                  <span className="text-zinc-400">Academic Class Attendance</span>
                  <span className="text-zinc-300">{selectedWeeklyReport.classesAttended}/{selectedWeeklyReport.classesTotal} • <span className="text-blue-400">{selectedWeeklyReport.classAttendancePct.toFixed(0)}%</span></span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                  <div className="h-full bg-cyan-500" style={{ width: `${selectedWeeklyReport.classAttendancePct}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-zinc-850">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Todo Completion</span>
              <p className="text-xs font-bold text-white">
                {selectedWeeklyReport.todosAttended}/{selectedWeeklyReport.todosTotal} completed • <span className="text-blue-400">{selectedWeeklyReport.todoPct.toFixed(0)}%</span>
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
