import { LifeOSData } from './types';
import { getTodayString } from './storage';

export const calculateDailyScore = (data: LifeOSData, dateStr: string = getTodayString()): number => {
  let score = 0;

  // 1. Prayers (each done = 5pts, max 25)
  const prayers = data.prayers[dateStr];
  let prayersScore = 0;
  if (prayers) {
    const doneCount = Object.values(prayers).filter(val => val === 'done').length;
    prayersScore = Math.min(doneCount * 5, 25);
    score += prayersScore;
  }

  // 2. Gym (8pts)
  const gymDone = data.gym[dateStr] === true;
  let gymScore = 0;
  if (gymDone) {
    gymScore = 8;
    score += gymScore;
  }

  // 3. Protein goal (10pts)
  const todayMeals = data.meals.filter((m) => m.date === dateStr);
  const proteinGoal = data.settings?.proteinGoal || 120;
  const totalProtein = todayMeals.reduce((acc, meal) => acc + (meal.protein || 0), 0);
  const proteinScore = Math.min((totalProtein / proteinGoal) * 10, 10);
  score += proteinScore;

  // 4. Tasks ratio (10pts)
  const activeTodos = data.todos ? data.todos.filter(t => !t.archived) : [];
  let tasksScore = 0;
  if (activeTodos.length > 0) {
    const doneTasks = activeTodos.filter(t => t.done).length;
    tasksScore = (doneTasks / activeTodos.length) * 10;
    score += tasksScore;
  } else {
    tasksScore = 0;
  }

  // 5. 10K Steps (8pts)
  const stepsDone = data.steps?.[dateStr] === true;
  if (stepsDone) {
    score += 8;
  }

  // 6. Coding/Work (15pts)
  const codingDone = data.coding?.[dateStr] === true;
  let codingScore = 0;
  if (codingDone) {
    codingScore = 15;
    score += codingScore;
  }

  // 7. College (8pts)
  const collegeDone = data.college?.[dateStr] === true;
  if (collegeDone) {
    score += 8;
  }

  // 8. Skincare (Morning = 5pts, Night = 5pts)
  const skincare = data.skincare?.[dateStr];
  if (skincare) {
    if (skincare.morning) score += 5;
    if (skincare.night) score += 5;
  }

  // 9. Daily Essentials (each item completed = 1pt, max 6)
  const essentials = data.dailyEssentials?.[dateStr];
  if (essentials) {
    let completedCount = 0;
    if (essentials.multivitamin) completedCount++;
    if (essentials.fishOil) completedCount++;
    if (essentials.ashwagandha) completedCount++;
    if (essentials.moringa) completedCount++;
    if (essentials.readingEnglish) completedCount++;
    if (essentials.speakingEnglish) completedCount++;
    score += completedCount;
  }

  return Math.round(score);
};

export const calculateRecoveryScore = (data: LifeOSData, dateStr: string = getTodayString()): number => {
  // 1. Sleep (25 pts)
  const sleepDuration = data.sleep?.[dateStr]?.duration || 0;
  let sleepScore = 0;
  if (sleepDuration >= 7.5) {
    sleepScore = 25;
  } else if (sleepDuration >= 6) {
    sleepScore = 15 + ((sleepDuration - 6) / 1.5) * 10;
  } else if (sleepDuration > 0) {
    sleepScore = (sleepDuration / 6) * 15;
  }

  // 2. Gym (25 pts)
  const gymScore = data.gym[dateStr] === true ? 25 : 0;

  // 3. 10K Steps (25 pts)
  const stepsScore = data.steps?.[dateStr] === true ? 25 : 0;

  // 4. Protein Goal (25 pts)
  const todayMeals = data.meals.filter((m) => m.date === dateStr);
  const proteinGoal = data.settings?.proteinGoal || 120;
  const totalProtein = todayMeals.reduce((acc, meal) => acc + (meal.protein || 0), 0);
  const proteinScore = Math.min((totalProtein / proteinGoal) * 25, 25);

  return Math.round(sleepScore + gymScore + stepsScore + proteinScore);
};

export const getRecoveryStatus = (score: number): 'Excellent' | 'Good' | 'Average' | 'Needs Improvement' => {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
};
