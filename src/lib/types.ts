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

export interface SleepRecord {
  bedTime?: string;   // ISO string or YYYY-MM-DDTHH:mm
  wakeTime?: string;  // ISO string or YYYY-MM-DDTHH:mm
  duration?: number;  // in hours
}

export interface Settings {
  proteinGoal: number;
  sleepGoal?: number;
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
  sleep?: Record<string, SleepRecord>; // Key: YYYY-MM-DD
  discipline?: Record<string, 'strong' | 'reset'>; // Key: YYYY-MM-DD
  activeSleepStart?: string | null;
}

export interface WeeklyReport {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD (Monday)
  endDate: string; // YYYY-MM-DD (Sunday)
  avgScore: number;
  avgRecoveryScore: number;
  gymPct: number;
  collegePct: number;
  stepsPct: number;
  prayerPct: number;
  proteinPct: number;
  todoPct: number;
  classAttendancePct: number;
  disciplinePct: number;
  sleepPct: number;
  avgSleepDuration: number;
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
  disciplineAttended: number;
  disciplineTotal: number;
  sleepAttended: number;
  sleepTotal: number;
}

export const defaultSettings: Settings = {
  proteinGoal: 120,
  sleepGoal: 8,
};

export const defaultPrayers: Prayers = {
  Fajr: 'pending',
  Dhuhr: 'pending',
  Asr: 'pending',
  Maghrib: 'pending',
  Isha: 'pending',
};
