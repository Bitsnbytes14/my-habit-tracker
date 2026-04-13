import { LifeOSData } from './types';
import { getTodayString } from './storage';

export const calculateDailyScore = (data: LifeOSData, dateStr: string = getTodayString()): number => {
  let score = 0;

  // 1. Prayers (each done = 6pts, max 30)
  const prayers = data.prayers[dateStr];
  let prayersScore = 0;
  if (prayers) {
    const doneCount = Object.values(prayers).filter(val => val === 'done').length;
    prayersScore = Math.min(doneCount * 6, 30);
    score += prayersScore;
  }

  // 2. Gym (20pts)
  const gymDone = data.gym[dateStr] === true;
  let gymScore = 0;
  if (gymDone) {
    gymScore = 20;
    score += gymScore;
  }

  // 3. Protein goal (20pts)
  const todayMeals = data.meals.filter((m) => m.date === dateStr);
  const proteinGoal = data.settings?.proteinGoal || 150;
  const totalProtein = todayMeals.reduce((acc, meal) => acc + (meal.protein || 0), 0);
  const proteinScore = Math.min((totalProtein / proteinGoal) * 20, 20);
  score += proteinScore;

  // 4. Tasks ratio (20pts)
  const todayTasks = data.tasks.filter(t => t.date === dateStr);
  let tasksScore = 0;
  if (todayTasks.length > 0) {
    const doneTasks = todayTasks.filter(t => t.done).length;
    tasksScore = (doneTasks / todayTasks.length) * 20;
    score += tasksScore;
  } else {
    tasksScore = 0;
  }

  // 5. Journal (10pts)
  const journalEntry = data.journal[dateStr];
  let journalScore = 0;
  if (journalEntry && journalEntry.trim().length > 0) {
    journalScore = 10;
    score += journalScore;
  }

  return Math.round(score);
};
