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
  const progress = Math.min((totalProtein / proteinGoal) * 100, 100);

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
    <div className="p-4 pb-24">
      {/* Header */}
      <header className="mb-6">
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Diet</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Protein Tracking</h1>
      </header>

      {/* Protein Summary Card */}
      <section className="mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex justify-between items-end mb-4 relative">
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Consumed</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{Math.round(totalProtein)}</span>
                <span className="text-zinc-600 font-medium">/ {proteinGoal}g</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Remaining</p>
              <span className={`text-2xl font-black tracking-tight ${remainingProtein <= 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                {Math.round(remainingProtein)}g
              </span>
            </div>
          </div>

          <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${totalProtein >= proteinGoal ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

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
             className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
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
              className="w-full bg-blue-600 text-white hover:bg-blue-500 font-bold tracking-wide uppercase rounded-xl py-4 transition-colors shadow-lg shadow-blue-600/20"
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
          <div className="space-y-2">
            {meals.map((m) => (
              <div key={m.id} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl group relative overflow-hidden">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{m.type}</span>
                    <h4 className="font-bold text-white">{m.name}</h4>
                  </div>
                  <p className="text-sm text-zinc-400">
                    <span className="font-bold text-green-400">{m.protein}g</span> protein
                    {m.calories ? ` • <span className="text-zinc-500">${m.calories} kcal</span>` : ''}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteMeal(m.id)}
                  className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-red-500 bg-zinc-950 rounded-full transition-colors"
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
