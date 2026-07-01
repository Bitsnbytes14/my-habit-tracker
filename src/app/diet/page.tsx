'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';
import { Meal } from '@/lib/types';

export default function DietPage() {
  const { data, updateData, showFeedback } = useLifeOS();
  const today = getTodayString();
  const meals = data.meals.filter(m => m.date === today);

  // Constants for nutrition goals
  const proteinGoal = 120; // 120g minimum
  const calorieGoal = 2000; // Stay under 2000 kcal

  // Calculations
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const remainingProtein = Math.max(0, proteinGoal - totalProtein);
  const proteinProgress = Math.min((totalProtein / proteinGoal) * 100, 100);

  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const remainingCalories = Math.max(0, calorieGoal - totalCalories);
  const caloriesProgress = Math.min((totalCalories / calorieGoal) * 100, 100);

  // Form State
  const [type, setType] = useState<Meal['type']>('Breakfast');
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('');
  const [calories, setCalories] = useState('');

  // Daily Status Indicators
  let proteinStatusEmoji = '🔴';
  let proteinStatusText = 'Below Goal (<120g)';
  let proteinStatusColor = 'text-red-400 border-red-500/20 bg-red-500/5';
  if (totalProtein >= proteinGoal) {
    proteinStatusEmoji = '🟢';
    proteinStatusText = 'Goal Achieved (120g+)';
    proteinStatusColor = 'text-green-400 border-green-500/20 bg-green-500/5';
  } else if (totalProtein >= 100) {
    proteinStatusEmoji = '🟡';
    proteinStatusText = 'Almost There (100–119g)';
    proteinStatusColor = 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
  }

  let calorieStatusEmoji = '🟢';
  let calorieStatusText = 'On Track (<2000 kcal)';
  let calorieStatusColor = 'text-green-400 border-green-500/20 bg-green-500/5';
  if (totalCalories > calorieGoal) {
    calorieStatusEmoji = '🔴';
    calorieStatusText = 'Over Limit (>2000 kcal)';
    calorieStatusColor = 'text-red-400 border-red-500/20 bg-red-500/5';
  } else if (totalCalories >= 1800) {
    calorieStatusEmoji = '🟡';
    calorieStatusText = 'Near Limit (1800–2000 kcal)';
    calorieStatusColor = 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
  }

  const handleAddMeal = () => {
    if (!name.trim()) return;

    const newMeal: Meal = {
      id: Date.now().toString(),
      date: today,
      type,
      name: name.trim(),
      protein: parseFloat(protein) || 0,
      calories: calories ? parseFloat(calories) : 0,
    };

    updateData((prev) => ({
      meals: [...(prev.meals || []), newMeal]
    }));

    setName('');
    setProtein('');
    setCalories('');
    showFeedback('Meal logged successfully! 🥩', 'success');
  };

  const handleDeleteMeal = (id: string) => {
    updateData((prev) => ({
      meals: prev.meals.filter(m => m.id !== id)
    }));
    showFeedback('Meal deleted', 'info');
  };

  const mealTypes: Meal['type'][] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <header className="mb-6">
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Diet</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Nutrition Tracker</h1>
      </header>

      {/* 1. Nutrition Summary & Progress Card */}
      <section className="mb-6 space-y-4">
        {/* Protein Summary Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Protein Consumed</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-white">{Math.round(totalProtein)}g</span>
                <span className="text-zinc-500 text-xs font-semibold">/ 120g min</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Remaining</p>
              <span className={`text-xl font-bold tracking-tight ${remainingProtein <= 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                {Math.round(remainingProtein)}g
              </span>
            </div>
          </div>
          
          {/* Protein Progress Bar */}
          <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800/50 mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-green-400`}
              style={{ width: `${proteinProgress}%` }}
            />
          </div>
        </div>

        {/* Calories Summary Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Calories Consumed</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-white">{Math.round(totalCalories)} kcal</span>
                <span className="text-zinc-500 text-xs font-semibold">/ 2000 kcal limit</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Remaining</p>
              <span className={`text-xl font-bold tracking-tight ${totalCalories > calorieGoal ? 'text-red-400' : 'text-cyan-400'}`}>
                {Math.round(remainingCalories)} kcal
              </span>
            </div>
          </div>
          
          {/* Calories Progress Bar */}
          <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800/50 mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalCalories > calorieGoal 
                  ? 'bg-gradient-to-r from-red-500 to-rose-400' 
                  : totalCalories >= 1800 
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-400' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${caloriesProgress}%` }}
            />
          </div>
        </div>
      </section>

      {/* 5. Daily Status */}
      <section className="mb-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Daily Status</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-4 rounded-xl border flex flex-col justify-center transition-all ${proteinStatusColor}`}>
            <span className="text-[10px] uppercase tracking-wider font-bold opacity-60 mb-1">Protein Status</span>
            <span className="text-sm font-extrabold flex items-center gap-1.5">
              {proteinStatusEmoji} {proteinStatusText.split(' ')[0] + ' ' + (proteinStatusText.split(' ')[1] || '')}
            </span>
            <span className="text-[10px] mt-0.5 opacity-50 font-semibold">{proteinStatusText}</span>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-center transition-all ${calorieStatusColor}`}>
            <span className="text-[10px] uppercase tracking-wider font-bold opacity-60 mb-1">Calorie Status</span>
            <span className="text-sm font-extrabold flex items-center gap-1.5">
              {calorieStatusEmoji} {calorieStatusText.split(' ')[0] + ' ' + (calorieStatusText.split(' ')[1] || '')}
            </span>
            <span className="text-[10px] mt-0.5 opacity-50 font-semibold">{calorieStatusText}</span>
          </div>
        </div>
      </section>

      {/* 3. Add Meal Form */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Log a Meal</h3>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-4 shadow-sm">
          <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
             {mealTypes.map((t) => (
               <button
                 key={t}
                 type="button"
                 onClick={() => setType(t)}
                 className={`flex-1 min-w-[70px] px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    type === t ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-zinc-500 hover:text-zinc-300'
                 }`}
               >
                 {t}
               </button>
             ))}
           </div>

           <input
             type="text"
             placeholder="Meal Name (e.g. Chicken Rice)"
             value={name}
             onChange={e => setName(e.target.value)}
             className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-650 focus:outline-none focus:border-blue-500 transition-colors"
           />

           <div className="flex gap-3">
             <div className="flex-1 relative">
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">g</span>
               <input
                 type="number"
                 placeholder="Protein"
                 value={protein}
                 onChange={e => setProtein(e.target.value)}
                 className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 pr-8 text-white focus:outline-none focus:border-blue-500 transition-colors"
               />
             </div>
             <div className="flex-1 relative">
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">kcal</span>
               <input
                 type="number"
                 placeholder="Calories"
                 value={calories}
                 onChange={e => setCalories(e.target.value)}
                 className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 pr-12 text-white focus:outline-none focus:border-blue-500 transition-colors"
               />
             </div>
           </div>

           <button
              onClick={handleAddMeal}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide uppercase rounded-xl py-4 transition-colors shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Save Meal
            </button>
         </div>
       </section>

      {/* 4. Meal History */}
      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Today&apos;s Log</h3>
        {meals.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500 text-sm">
            No meals logged today yet.
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((m) => (
              <div key={m.id} className="flex justify-between items-center bg-zinc-900 border border-zinc-805 p-4 rounded-xl group relative overflow-hidden shadow-sm hover:border-zinc-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-1.5 py-0.5 rounded">
                      {m.type}
                    </span>
                    <h4 className="font-bold text-white truncate">{m.name}</h4>
                  </div>
                  <div className="flex gap-4 text-xs font-semibold text-zinc-400">
                    <span className="flex items-center gap-1">
                      🥩 Protein: <strong className="text-white">{m.protein}g</strong>
                    </span>
                    <span className="flex items-center gap-1 border-l border-zinc-800 pl-4">
                      🔥 Calories: <strong className="text-white">{m.calories || 0} kcal</strong>
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteMeal(m.id)}
                  className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-red-500 bg-zinc-950 rounded-full transition-colors flex-shrink-0 ml-3"
                  title="Delete Meal"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
