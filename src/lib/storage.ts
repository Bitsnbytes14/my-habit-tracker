import { LifeOSData, defaultSettings } from './types';

const STORAGE_KEY = 'lifeOS';

export const getDefaultData = (): LifeOSData => ({
  tasks: [],
  gym: {},
  meals: [],
  todos: [],
  prayers: {},
  journal: {},
  weightLogs: [],
  coding: {},
  settings: defaultSettings,
  attendance: {},
  college: {},
  steps: {},
  weeklyReports: [],
});

export const getLifeOSData = (): LifeOSData => {
  if (typeof window === 'undefined') return getDefaultData();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();

    const parsed = JSON.parse(raw);
    
    // Quick migration / fallback checking for new types
    let meals = parsed.meals || [];
    if (!Array.isArray(meals)) {
      meals = [];
    }

    let gym = parsed.gym || {};
    if (parsed.workouts && !parsed.gym) {
      gym = {}; // Wipe old workouts
    }

    // Migrate tasks to todos if any exist
    let todos = parsed.todos || [];
    let tasks = parsed.tasks || [];
    let migratedAny = false;
    if (Array.isArray(tasks) && tasks.length > 0) {
      const migrated = tasks.map((t: any) => ({
        id: t.id || Date.now().toString() + Math.random().toString(),
        text: t.title || '',
        done: !!t.done,
        archived: false,
      }));
      const existingIds = new Set(todos.map((todo: any) => todo.id));
      const newMigrated = migrated.filter((mt: any) => !existingIds.has(mt.id));
      if (newMigrated.length > 0) {
        todos = [...todos, ...newMigrated];
      }
      tasks = []; // clear the tasks array so it is not processed again
      migratedAny = true;
    }
    
    // Merge with defaults to ensure all keys exist
    const merged = {
      ...getDefaultData(),
      ...parsed,
      gym,
      meals,
      todos,
      tasks,
      coding: parsed.coding || {},
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      attendance: parsed.attendance || {},
      college: parsed.college || {},
      steps: parsed.steps || {},
      weeklyReports: parsed.weeklyReports || [],
    };

    if (migratedAny) {
      saveLifeOSData(merged);
    }

    return merged;
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
