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
  const proteinGoal = data.settings?.proteinGoal || 150;
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
