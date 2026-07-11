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
  archived?: boolean;
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
  coding: Record<string, boolean>; // Key: YYYY-MM-DD
  settings: Settings;
  attendance?: Record<string, boolean>; // Key: classId
  college?: Record<string, boolean>; // Key: YYYY-MM-DD
  steps?: Record<string, boolean>; // Key: YYYY-MM-DD
  weeklyReports?: WeeklyReport[];
}

export interface WeeklyReport {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Sunday)
  avgScore: number;
  gymPct: number;
  collegePct: number;
  stepsPct: number;
  prayerPct: number;
  proteinPct: number;
  todoPct: number;
  classAttendancePct: number;
  grade: string;
  gymAttended: number;
  gymTotal: number;
  collegeAttended: number;
  collegeTotal: number;
  stepsAttended: number;
  stepsTotal: number;
  prayersAttended: number;
  prayersTotal: number;
  proteinAttended: number;
  proteinTotal: number;
  todosAttended: number;
  todosTotal: number;
  classesAttended: number;
  classesTotal: number;
}

export const defaultSettings: Settings = {
  proteinGoal: 120,
};

export const defaultPrayers: Prayers = {
  Fajr: 'pending',
  Dhuhr: 'pending',
  Asr: 'pending',
  Maghrib: 'pending',
  Isha: 'pending',
};
