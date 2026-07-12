import { LifeOSData } from './types';
import { getOffsetDateString } from './storage';

export const calculateStreak = (checkDay: (dateStr: string) => boolean) => {
  let streak = 0;
  let d = 0;
  let currentIsToday = true;

  while (true) {
    const dateStr = getOffsetDateString(-d);
    const isDone = checkDay(dateStr);
    
    if (isDone) {
      streak++;
    } else {
      if (!currentIsToday) {
        break;
      }
    }
    currentIsToday = false;
    d++;
    if (d > 365) break; // sanity limit
  }
  return streak;
};

export const getGymStreak = (data: LifeOSData) => {
  return calculateStreak((dateStr) => data.gym[dateStr] === true);
};

export const getPrayerStreak = (data: LifeOSData) => {
  return calculateStreak((dateStr) => {
    const p = data.prayers[dateStr];
    return p ? Object.values(p).every(v => v === 'done') : false;
  });
};

export const getProteinStreak = (data: LifeOSData) => {
  const proteinGoal = data.settings?.proteinGoal || 120;
  return calculateStreak((dateStr) => {
    const dayMeals = data.meals.filter(m => m.date === dateStr);
    // If no meals were logged that day, they definitely didn't hit it
    if (dayMeals.length === 0) return false;
    const total = dayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
    return total >= proteinGoal;
  });
};

export const getJournalStreak = (data: LifeOSData) => {
  return calculateStreak((dateStr) => {
    const j = data.journal[dateStr];
    return !!(j && j.trim().length > 0);
  });
};

export const getCollegeStreak = (data: LifeOSData) => {
  return calculateStreak((dateStr) => data.college?.[dateStr] === true);
};

export const getStepsStreak = (data: LifeOSData) => {
  return calculateStreak((dateStr) => data.steps?.[dateStr] === true);
};

export const getDisciplineStreak = (data: LifeOSData) => {
  return calculateStreak((dateStr) => data.discipline?.[dateStr] === 'strong');
};

export const getSleepStreak = (data: LifeOSData) => {
  const goal = data.settings?.sleepGoal || 8;
  return calculateStreak((dateStr) => (data.sleep?.[dateStr]?.duration || 0) >= goal);
};

export const getSkincareStreak = (data: LifeOSData) => {
  return calculateStreak((dateStr) => data.skincare?.[dateStr]?.morning === true && data.skincare?.[dateStr]?.night === true);
};

export const getEssentialsStreak = (data: LifeOSData) => {
  return calculateStreak((dateStr) => {
    const e = data.dailyEssentials?.[dateStr];
    return !!(e && e.multivitamin && e.fishOil && e.ashwagandha && e.moringa && e.readingEnglish && e.speakingEnglish);
  });
};


export const getLongestStreak = (data: LifeOSData, checkDay: (dateStr: string) => boolean): number => {
  const trackedDates = [
    ...Object.keys(data.gym || {}),
    ...Object.keys(data.prayers || {}),
    ...Object.keys(data.journal || {}),
    ...Object.keys(data.coding || {}),
    ...Object.keys(data.college || {}),
    ...Object.keys(data.steps || {}),
    ...Object.keys(data.sleep || {}),
    ...Object.keys(data.discipline || {}),
    ...Object.keys(data.skincare || {}),
    ...Object.keys(data.dailyEssentials || {}),
    ...(data.meals || []).map(m => m.date),
    ...(data.weightLogs || []).map(w => w.date)
  ].sort();

  if (trackedDates.length === 0) return 0;
  
  const earliestDateStr = trackedDates[0];
  const start = new Date(earliestDateStr);
  const end = new Date();
  
  let maxStreak = 0;
  let currentStreak = 0;
  
  const loop = new Date(start);
  while (loop <= end) {
    const yyyy = loop.getFullYear();
    const mm = String(loop.getMonth() + 1).padStart(2, '0');
    const dd = String(loop.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    if (checkDay(dateStr)) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
    loop.setDate(loop.getDate() + 1);
  }
  
  return maxStreak;
};
