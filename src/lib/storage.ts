import { LifeOSData, defaultSettings } from './types';

const STORAGE_KEY = 'lifeOS';

export const getDefaultData = (): LifeOSData => ({
  tasks: [],
  workouts: {},
  meals: {},
  prayers: {},
  journal: {},
  weightLogs: [],
  settings: defaultSettings,
});

export const getLifeOSData = (): LifeOSData => {
  if (typeof window === 'undefined') return getDefaultData();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();

    const parsed = JSON.parse(raw);
    
    // Merge with defaults to ensure all keys exist
    return {
      ...getDefaultData(),
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
    };
  } catch (err) {
    console.error('Failed to parse LifeOS localStorage data', err);
    return getDefaultData();
  }
};

export const saveLifeOSData = (data: LifeOSData): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save LifeOS data', err);
  }
};

// Utilities for date manipulation
export const getTodayString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getOffsetDateString = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
