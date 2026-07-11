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

  // 2. Gym (15pts)
  const gymDone = data.gym[dateStr] === true;
  let gymScore = 0;
  if (gymDone) {
    gymScore = 15;
    score += gymScore;
  }

  // 3. Protein goal (15pts)
  const todayMeals = data.meals.filter((m) => m.date === dateStr);
  const proteinGoal = data.settings?.proteinGoal || 120;
  const totalProtein = todayMeals.reduce((acc, meal) => acc + (meal.protein || 0), 0);
  const proteinScore = Math.min((totalProtein / proteinGoal) * 15, 15);
  score += proteinScore;

  // 4. Tasks ratio (15pts)
  const activeTodos = data.todos ? data.todos.filter(t => !t.archived) : [];
  let tasksScore = 0;
  if (activeTodos.length > 0) {
    const doneTasks = activeTodos.filter(t => t.done).length;
    tasksScore = (doneTasks / activeTodos.length) * 15;
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

  // 6. Coding/Work (15pts)
  const codingDone = data.coding?.[dateStr] === true;
  let codingScore = 0;
  if (codingDone) {
    codingScore = 15;
    score += codingScore;
  }

  // 7. College (10pts)
  const collegeDone = data.college?.[dateStr] === true;
  if (collegeDone) {
    score += 10;
  }

  return Math.round(score);
};
