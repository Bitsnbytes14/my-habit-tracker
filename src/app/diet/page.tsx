'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';
import { Meal } from '@/lib/types';

export default function DietPage() {
  const { data, updateData } = useLifeOS();
  const today = getTodayString();
  const meals = data.meals.filter(m => m.date === today);
  const proteinGoal = data.settings?.proteinGoal || 150;

  const totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const remainingProtein = Math.max(0, proteinGoal - totalProtein);

  const [type, setType] = useState<Meal['type']>('Breakfast');
  const [name, setName] = useState('');
  const [protein, setProtein] = useState('');
  const [calories, setCalories] = useState('');

  const handleAddMeal = () => {
    if (!name) return;

    const newMeal: Meal = {
      id: Date.now().toString(),
      date: today,
      type,
      name,
      protein: parseFloat(protein) || 0,
      calories: calories ? parseFloat(calories) : undefined,
    };

    updateData((prev) => ({
      meals: [...prev.meals, newMeal]
    }));

    setName('');
    setProtein('');
    setCalories('');
  };

  const handleDeleteMeal = (id: string) => {
    updateData((prev) => ({
      meals: prev.meals.filter(m => m.id !== id)
    }));
  };

  const mealTypes: Meal['type'][] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

  return (
    <div className="p-6 pb-24">
      <header className="mb-8 mt-4 relative">
        <h1 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Diet Tracking</h1>
        <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">Macros & Meals</h2>
        
        {/* Protein Tracker Ring / Bar */}
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <p className="text-sm text-zinc-400 font-semibold uppercase tracking-widest mb-1">Total</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{Math.round(totalProtein)}g</span>
                <span className="text-zinc-500 font-medium">/ {proteinGoal}g</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400 font-semibold uppercase tracking-widest mb-1">Remaining</p>
              <span className="text-2xl font-bold text-orange-400">{Math.round(remainingProtein)}g</span>
            </div>
          </div>
          
          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800 relative z-10">
            <div 
              className={`h-full transition-all duration-700 ${totalProtein >= proteinGoal ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min((totalProtein / proteinGoal) * 100, 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* Add Meal Form */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Log a Meal</h3>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-4">
          <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
             {mealTypes.map((t) => (
               <button
                 key={t}
                 onClick={() => setType(t)}
                 className={`flex-1 min-w-[70px] px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    type === t ? 'bg-green-600/20 text-green-400' : 'text-zinc-500 hover:text-zinc-300'
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
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-white focus:outline-none focus:border-green-500 transition-colors"
          />

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">g</span>
              <input
                type="number"
                placeholder="Protein"
                value={protein}
                onChange={e => setProtein(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 pr-8 text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="flex-1 relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">kcal</span>
              <input
                type="number"
                placeholder="Calories"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 pr-12 text-white focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <button
             onClick={handleAddMeal}
             className="w-full bg-white text-black hover:bg-zinc-200 font-bold tracking-wide uppercase rounded-xl py-4 transition-colors"
           >
             Save Meal
           </button>
        </div>
      </section>

      {/* Meals Log */}
      <section>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Today&apos;s Log</h3>
        {meals.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500 text-sm">
            No meals logged today yet.
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((m) => (
              <div key={m.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-800 p-4 rounded-xl group relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500/50"></div>
                <div className="pl-2">
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">{m.type}</p>
                  <h4 className="font-bold text-white mb-1">{m.name}</h4>
                  <p className="text-sm font-medium text-zinc-400">
                    <span className="text-green-400 font-bold">{m.protein}g</span> protein
                    {m.calories ? ` • ${m.calories} kcal` : ''}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteMeal(m.id)}
                  className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-red-500 bg-zinc-900 rounded-full transition-colors"
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
