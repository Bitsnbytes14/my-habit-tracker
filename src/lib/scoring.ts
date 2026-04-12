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
  const workout = data.workouts[dateStr];
  let gymScore = 0;
  if (workout && workout.exercises && workout.exercises.length > 0) {
    gymScore = 20;
    score += gymScore;
  } else if (workout && workout.type === 'Rest') {
    // If it's a planned rest day explicitly chosen, we can give points or 0.
    // The prompt says "Gym done (20)". We'll stick to 20 if type is Rest and the user chose it as their split for today, 
    // or just require exercises. Let's say if type is selected and it's Rest, they get the 20 pts for sticking to their plan.
    gymScore = 20;
    score += gymScore;
  }

  // 3. Protein goal (20pts)
  const meals = data.meals[dateStr] || [];
  const proteinGoal = data.settings?.proteinGoal || 150;
  const totalProtein = meals.reduce((acc, meal) => acc + (meal.protein || 0), 0);
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
    // If no tasks, maybe they get full points or 0? 
    // Let's say if no tasks were added, we shouldn't punish them, or perhaps it's 0. Let's do 20 if no tasks.
    // Actually, usually you get 0 if no tasks are done. We'll give 0.
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
