import { LifeOSData, WeeklyReport } from './types';
import { calculateDailyScore } from './scoring';
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

  // 8. Daily Score Avg
  const weeklyScores = dates.map(d => calculateDailyScore(data, d));
  const avgScore = Math.round(weeklyScores.reduce((acc, curr) => acc + curr, 0) / 7);
  const grade = getGradeForScore(avgScore);

  return {
    weekNumber,
    startDate: mondayStr,
    endDate: sundayStr,
    avgScore,
    gymPct,
    collegePct,
    stepsPct,
    prayerPct,
    proteinPct,
    todoPct,
    classAttendancePct,
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
    classesTotal
  };
};

// Automatically scan and archive past weeks that have finished
export const checkAndArchiveCompletedWeeks = (data: LifeOSData, updateData: Function): void => {
  const today = new Date();
  const currentMonday = getMonday(today);

  // Find the earliest tracked date in history
  const trackedDates = [
    ...Object.keys(data.gym),
    ...Object.keys(data.prayers),
    ...Object.keys(data.journal),
    ...Object.keys(data.coding || {}),
    ...Object.keys(data.college || {}),
    ...Object.keys(data.steps || {}),
    ...data.meals.map(m => m.date),
    ...data.weightLogs.map(w => w.date)
  ].sort();

  if (trackedDates.length === 0) return;

  const earliestDate = new Date(trackedDates[0]);
  const startMonday = getMonday(earliestDate);

  let loopMonday = new Date(startMonday);
  let hasUpdated = false;
  const newReports = [...(data.weeklyReports || [])];

  while (loopMonday < currentMonday) {
    const mondayStr = formatDateString(loopMonday);
    const sundayDate = getSunday(loopMonday);
    const sundayStr = formatDateString(sundayDate);

    // If this week is not yet archived
    const isArchived = newReports.some(r => r.startDate === mondayStr);
    if (!isArchived) {
      const nextWeekNumber = newReports.length + 1;
      const report = calculateWeeklyStats(data, mondayStr, sundayStr, nextWeekNumber);
      newReports.push(report);
      hasUpdated = true;
    }

    // Move to next week Monday
    loopMonday.setDate(loopMonday.getDate() + 7);
  }

  if (hasUpdated) {
    updateData(() => ({
      weeklyReports: newReports
    }));
  }
};

// Generate summary based on current and previous week's performance
export const generateWeeklySummary = (current: WeeklyReport, previous: WeeklyReport | null): string => {
  if (!previous) {
    return 'Complete one full week to unlock comparison insights.';
  }

  const scoreDiff = current.avgScore - previous.avgScore;
  let summary = '';

  if (scoreDiff > 0) {
    summary += 'This week you were more consistent than last week.';
  } else if (scoreDiff < 0) {
    summary += 'This week you were slightly less consistent than last week.';
  } else {
    summary += 'This week your consistency was steady compared to last week.';
  }

  const habits = [
    { name: 'Gym', current: current.gymPct, previous: previous.gymPct },
    { name: 'college attendance', current: current.collegePct, previous: previous.collegePct },
    { name: '10K steps goal', current: current.stepsPct, previous: previous.stepsPct },
    { name: 'prayers completion', current: current.prayerPct, previous: previous.prayerPct },
    { name: 'protein goal achievement', current: current.proteinPct, previous: previous.proteinPct },
    { name: 'todo completion', current: current.todoPct, previous: previous.todoPct },
    { name: 'class attendance', current: current.classAttendancePct, previous: previous.classAttendancePct }
  ];

  const improved: string[] = [];
  const dropped: string[] = [];

  habits.forEach(h => {
    const diff = h.current - h.previous;
    if (diff > 2) {
      improved.push(h.name);
    } else if (diff < -2) {
      dropped.push(h.name);
    }
  });

  if (improved.length > 0 && dropped.length > 0) {
    summary += ` ${improved.slice(0, 3).join(', ')} improved, while ${dropped.slice(0, 3).join(', ')} dropped slightly.`;
  } else if (improved.length > 0) {
    summary += ` ${improved.slice(0, 3).join(', ')} improved.`;
  } else if (dropped.length > 0) {
    summary += ` ${dropped.slice(0, 3).join(', ')} dropped slightly.`;
  }

  // Add focus recommendation
  let focusHabit = habits[0];
  let mostNegativeDiff = 0;
  
  habits.forEach(h => {
    const diff = h.current - h.previous;
    if (diff < mostNegativeDiff) {
      mostNegativeDiff = diff;
      focusHabit = h;
    }
  });

  // If nothing dropped, suggest the lowest completion habit
  if (mostNegativeDiff === 0) {
    let lowestVal = 101;
    habits.forEach(h => {
      if (h.current < lowestVal) {
        lowestVal = h.current;
        focusHabit = h;
      }
    });
  }

  summary += ` Keep focusing on ${focusHabit.name} next week.`;
  return summary;
};
