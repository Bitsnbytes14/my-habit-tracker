import { LifeOSData, WeeklyReport } from './types';
import { calculateDailyScore, calculateRecoveryScore } from './scoring';
import { attendanceConfig } from './attendance';

// Helper to convert Date to YYYY-MM-DD
export const formatDateString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Helper to get the Monday of a given date (Monday at 00:00:00)
export const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // If Sunday, subtract 6 days, otherwise subtract day - 1 days
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Helper to get Sunday of the week (Monday + 6 days)
export const getSunday = (monday: Date): Date => {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
};

export const getGradeForScore = (score: number): string => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
};

// Generate stats for a given week date range
export const calculateWeeklyStats = (
  data: LifeOSData,
  mondayStr: string,
  sundayStr: string,
  weekNumber: number
): WeeklyReport => {
  const start = new Date(mondayStr);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(formatDateString(d));
  }

  // 1. Gym
  const gymAttended = dates.filter(d => data.gym[d] === true).length;
  const gymTotal = 7;
  const gymPct = (gymAttended / gymTotal) * 100;

  // 2. College
  const collegeAttended = dates.filter(d => data.college?.[d] === true).length;
  const collegeTotal = 7;
  const collegePct = (collegeAttended / collegeTotal) * 100;

  // 3. Steps
  const stepsAttended = dates.filter(d => data.steps?.[d] === true).length;
  const stepsTotal = 7;
  const stepsPct = (stepsAttended / stepsTotal) * 100;

  // 4. Namaz
  let prayersAttended = 0;
  dates.forEach(d => {
    const p = data.prayers[d];
    if (p) {
      prayersAttended += Object.values(p).filter(v => v === 'done').length;
    }
  });
  const prayersTotal = 35; // 5 prayers * 7 days
  const prayerPct = (prayersAttended / prayersTotal) * 100;

  // 5. Protein Goal Achievement
  let proteinAttended = 0;
  const proteinGoal = data.settings?.proteinGoal || 120;
  dates.forEach(d => {
    const dayMeals = data.meals.filter(m => m.date === d);
    const dayProtein = dayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
    if (dayProtein >= proteinGoal && dayMeals.length > 0) {
      proteinAttended++;
    }
  });
  const proteinTotal = 7;
  const proteinPct = (proteinAttended / proteinTotal) * 100;

  // 6. Todo Completion
  const activeTodos = data.todos ? data.todos.filter(t => !t.archived) : [];
  const todosAttended = activeTodos.filter(t => t.done).length;
  const todosTotal = activeTodos.length;
  const todoPct = todosTotal > 0 ? (todosAttended / todosTotal) * 100 : 0;

  // 7. Academic Class Attendance
  const attendance = data.attendance || {};
  const classesTotal = attendanceConfig.reduce((sum, subject) => sum + subject.classes.length, 0);
  const classesAttended = attendanceConfig.reduce((sum, subject) => {
    return sum + subject.classes.filter((c) => attendance[c.id]).length;
  }, 0);
  const classAttendancePct = classesTotal > 0 ? (classesAttended / classesTotal) * 100 : 0;

  // 8. Discipline (NEW)
  const disciplineAttended = dates.filter(d => data.discipline?.[d] === 'strong').length;
  const disciplineTotal = 7;
  const disciplinePct = (disciplineAttended / disciplineTotal) * 100;

  // 9. Sleep (NEW)
  const sleepGoal = data.settings?.sleepGoal || 8;
  const sleepAttended = dates.filter(d => (data.sleep?.[d]?.duration || 0) >= sleepGoal).length;
  const sleepTotal = 7;
  const sleepPct = (sleepAttended / sleepTotal) * 100;

  const sleepDurations = dates.map(d => data.sleep?.[d]?.duration || 0);
  const avgSleepDuration = sleepDurations.reduce((acc, curr) => acc + curr, 0) / 7;

  // 10. Daily Score Avg
  const weeklyScores = dates.map(d => calculateDailyScore(data, d));
  const avgScore = Math.round(weeklyScores.reduce((acc, curr) => acc + curr, 0) / 7);
  const grade = getGradeForScore(avgScore);

  // 11. Recovery Score Avg (NEW)
  const recoveryScores = dates.map(d => calculateRecoveryScore(data, d));
  const avgRecoveryScore = Math.round(recoveryScores.reduce((acc, curr) => acc + curr, 0) / 7);

  // 12. Skincare Morning & Night
  const skincareMorningAttended = dates.filter(d => data.skincare?.[d]?.morning === true).length;
  const skincareMorningTotal = 7;
  const skincareMorningPct = (skincareMorningAttended / skincareMorningTotal) * 100;

  const skincareNightAttended = dates.filter(d => data.skincare?.[d]?.night === true).length;
  const skincareNightTotal = 7;
  const skincareNightPct = (skincareNightAttended / skincareNightTotal) * 100;

  return {
    weekNumber,
    startDate: mondayStr,
    endDate: sundayStr,
    avgScore,
    avgRecoveryScore,
    gymPct,
    collegePct,
    stepsPct,
    prayerPct,
    proteinPct,
    todoPct,
    classAttendancePct,
    disciplinePct,
    sleepPct,
    avgSleepDuration,
    grade,
    gymAttended,
    gymTotal,
    collegeAttended,
    collegeTotal,
    stepsAttended,
    stepsTotal,
    prayersAttended,
    prayersTotal,
    proteinAttended,
    proteinTotal,
    todosAttended,
    todosTotal,
    classesAttended,
    classesTotal,
    disciplineAttended,
    disciplineTotal,
    sleepAttended,
    sleepTotal,
    skincareMorningPct,
    skincareMorningAttended,
    skincareMorningTotal,
    skincareNightPct,
    skincareNightAttended,
    skincareNightTotal
  };
};

// Automatically scan and archive past weeks that have finished
export const checkAndArchiveCompletedWeeks = (
  data: LifeOSData,
  updateData: (updates: Partial<LifeOSData> | ((prev: LifeOSData) => Partial<LifeOSData>)) => void
): void => {
  const today = new Date();
  const currentMonday = getMonday(today);

  // Find the earliest tracked date in history
  const trackedDates = [
    ...Object.keys(data.gym || {}),
    ...Object.keys(data.prayers || {}),
    ...Object.keys(data.journal || {}),
    ...Object.keys(data.coding || {}),
    ...Object.keys(data.college || {}),
    ...Object.keys(data.steps || {}),
    ...Object.keys(data.discipline || {}),
    ...Object.keys(data.sleep || {}),
    ...Object.keys(data.skincare || {}),
    ...(data.meals || []).map(m => m.date),
    ...(data.weightLogs || []).map(w => w.date)
  ].sort();

  if (trackedDates.length === 0) return;

  const earliestDate = new Date(trackedDates[0]);
  const startMonday = getMonday(earliestDate);

  const loopMonday = new Date(startMonday);
  const newReports: WeeklyReport[] = [];

  while (loopMonday < currentMonday) {
    const mondayStr = formatDateString(loopMonday);
    const sundayDate = getSunday(loopMonday);
    const sundayStr = formatDateString(sundayDate);

    const nextWeekNumber = newReports.length + 1;
    const report = calculateWeeklyStats(data, mondayStr, sundayStr, nextWeekNumber);
    newReports.push(report);

    // Move to next week Monday
    loopMonday.setDate(loopMonday.getDate() + 7);
  }

  const oldReportsStr = JSON.stringify(data.weeklyReports || []);
  const newReportsStr = JSON.stringify(newReports);
  if (oldReportsStr !== newReportsStr) {
    updateData({
      weeklyReports: newReports
    });
  }
};

// Generate summary based on current and previous week's performance
export const generateWeeklySummary = (current: WeeklyReport, previous: WeeklyReport | null): string => {
  if (!previous) {
    return 'Complete one full week to unlock comparison insights.';
  }

  const improved: string[] = [];
  const declined: string[] = [];

  const habits = [
    { name: 'Gym consistency', current: current.gymPct, previous: previous.gymPct },
    { name: 'college attendance', current: current.collegePct, previous: previous.collegePct },
    { name: '10K steps goal', current: current.stepsPct, previous: previous.stepsPct },
    { name: 'prayers completion', current: current.prayerPct, previous: previous.prayerPct },
    { name: 'protein goal achievement', current: current.proteinPct, previous: previous.proteinPct },
    { name: 'todo completion', current: current.todoPct, previous: previous.todoPct },
    { name: 'class attendance', current: current.classAttendancePct, previous: previous.classAttendancePct },
    { name: 'discipline', current: current.disciplinePct, previous: previous.disciplinePct },
    { name: 'sleep consistency', current: current.sleepPct, previous: previous.sleepPct },
    { name: 'Recovery Score', current: current.avgRecoveryScore, previous: previous.avgRecoveryScore },
    ...(current.skincareMorningPct !== undefined && previous.skincareMorningPct !== undefined ? [
      { name: 'morning skincare routine', current: current.skincareMorningPct, previous: previous.skincareMorningPct },
      { name: 'night skincare routine', current: current.skincareNightPct ?? 0, previous: previous.skincareNightPct ?? 0 }
    ] : [])
  ];

  habits.forEach(h => {
    const diff = h.current - h.previous;
    if (diff > 2) {
      improved.push(h.name);
    } else if (diff < -2) {
      declined.push(h.name);
    }
  });

  let summary = '';
  if (improved.length > 0) {
    const listStr = improved.length > 1
      ? `${improved.slice(0, -1).join(', ')} and ${improved[improved.length - 1]}`
      : improved[0];
    summary += `This week you improved your ${listStr}. `;
  } else {
    summary += `This week, your habits remained steady compared to last week. `;
  }

  if (declined.length > 0) {
    const listStr = declined.length > 1
      ? `${declined.slice(0, -1).join(', ')} and ${declined[declined.length - 1]}`
      : declined[0];
    summary += `However, ${listStr} declined slightly. `;
  } else {
    summary += `No major declines were observed across your metrics. `;
  }

  // Determine focus
  let focusHabit = habits[0];
  let mostNegativeDiff = 0;
  habits.forEach(h => {
    const diff = h.current - h.previous;
    if (diff < mostNegativeDiff) {
      mostNegativeDiff = diff;
      focusHabit = h;
    }
  });

  // If nothing dropped, suggest lowest current completion habit
  if (mostNegativeDiff >= -2) {
    let lowestVal = 101;
    habits.forEach(h => {
      if (h.current < lowestVal) {
        lowestVal = h.current;
        focusHabit = h;
      }
    });
  }

  // Map to actionable advice
  const adviceMap: Record<string, string> = {
    'Gym consistency': 'Focus on getting to the gym as planned next week.',
    'college attendance': 'Try to attend all your college classes next week.',
    '10K steps goal': 'Focus on hitting your daily steps goal next week.',
    'prayers completion': 'Prioritize completing your daily prayers on time next week.',
    'protein goal achievement': 'Focus on meeting your daily protein targets next week.',
    'todo completion': 'Focus on completing more planned tasks next week.',
    'class attendance': 'Focus on improving your academic class attendance next week.',
    'discipline': 'Try to stay disciplined and avoid resets next week.',
    'sleep consistency': 'Focus on maintaining a consistent sleep schedule next week.',
    'Recovery Score': 'Prioritize your overall rest and recovery next week.',
    'morning skincare routine': 'Prioritize completing your morning skincare routine next week.',
    'night skincare routine': 'Prioritize completing your night skincare routine next week.'
  };

  const advice = adviceMap[focusHabit.name] || 'Focus on maintaining consistency next week.';
  summary += advice;
  return summary;
};
