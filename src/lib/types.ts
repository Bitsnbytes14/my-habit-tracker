export type TaskType = 'task' | 'gym' | 'meal' | 'prayer' | 'custom';

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  done: boolean;
  type: TaskType;
  notes?: string;
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
  name: string;
  protein: number;
  calories?: number;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export type PrayerState = 'pending' | 'done' | 'missed';

export interface Prayers {
  Fajr: PrayerState;
  Dhuhr: PrayerState;
  Asr: PrayerState;
  Maghrib: PrayerState;
  Isha: PrayerState;
}

export interface WeightLog {
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface Settings {
  proteinGoal: number;
}

export interface LifeOSData {
  tasks: Task[];
  gym: Record<string, boolean>; // Key: YYYY-MM-DD
  meals: Meal[];
  todos: Todo[];
  prayers: Record<string, Prayers>; // Key: YYYY-MM-DD
  journal: Record<string, string>; // Key: YYYY-MM-DD
  weightLogs: WeightLog[];
  settings: Settings;
}

export const defaultSettings: Settings = {
  proteinGoal: 150,
};

export const defaultPrayers: Prayers = {
  Fajr: 'pending',
  Dhuhr: 'pending',
  Asr: 'pending',
  Maghrib: 'pending',
  Isha: 'pending',
};
