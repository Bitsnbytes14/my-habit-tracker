'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';
import { Exercise, Workout } from '@/lib/types';

export default function GymPage() {
  const { data, updateData } = useLifeOS();
  const today = getTodayString();
  const savedWorkout = data.workouts[today];

  const types = ['Push', 'Pull', 'Legs', 'Rest'] as const;

  // Local state for editing today's workout
  const [type, setType] = useState<Workout['type']>(savedWorkout?.type || '');
  const [exercises, setExercises] = useState<Exercise[]>(savedWorkout?.exercises || []);

  // Form for new exercise
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('');
  const [exReps, setExReps] = useState('');
  const [exWeight, setExWeight] = useState('');

  const handleAddExercise = () => {
    if (!exName || !exSets || !exReps) return;
    
    const newEx: Exercise = {
      id: Date.now().toString(),
      name: exName,
      sets: parseInt(exSets, 10),
      reps: parseInt(exReps, 10),
      weight: parseFloat(exWeight) || 0,
    };

    setExercises([...exercises, newEx]);
    // Reset form
    setExName('');
    setExSets('');
    setExReps('');
    setExWeight('');
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const handleSaveWorkout = () => {
    if (!type) return;

    updateData((prev) => ({
      workouts: {
        ...prev.workouts,
        [today]: {
          type,
          exercises,
        }
      }
    }));
  };

  return (
    <div className="p-6 pb-24">
      <header className="mb-8 mt-4">
        <h1 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Today&apos;s Workout</h1>
        <h2 className="text-3xl font-bold text-white tracking-tight">Gym Log</h2>
      </header>

      {/* Split Selection */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Select Split</h3>
        <div className="grid grid-cols-2 gap-3">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors border ${
                type === t 
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {type && type !== 'Rest' && (
        <section className="mb-8">
           <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Add Exercise</h3>
           <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3">
             <input
               type="text"
               placeholder="Exercise Name (e.g. Bench Press)"
               value={exName}
               onChange={e => setExName(e.target.value)}
               className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500"
             />
             <div className="flex gap-2">
               <input
                 type="number"
                 placeholder="Sets"
                 value={exSets}
                 onChange={e => setExSets(e.target.value)}
                 className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500"
               />
               <input
                 type="number"
                 placeholder="Reps"
                 value={exReps}
                 onChange={e => setExReps(e.target.value)}
                 className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500"
               />
               <input
                 type="number"
                 placeholder="kg"
                 value={exWeight}
                 onChange={e => setExWeight(e.target.value)}
                 className="w-1/3 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500"
               />
             </div>
             <button
               onClick={handleAddExercise}
               className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg py-3 transition-colors mt-2"
             >
               + Add to Log
             </button>
           </div>
        </section>
      )}

      {/* Log Display */}
      {exercises.length > 0 && type !== 'Rest' && (
        <section className="mb-6">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Current Log</h3>
          <div className="space-y-2">
            {exercises.map((e) => (
              <div key={e.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                <div>
                  <h4 className="font-bold text-white mb-1">{e.name}</h4>
                  <p className="text-sm text-zinc-400">
                    {e.sets} sets × {e.reps} reps {e.weight > 0 && `@ ${e.weight}kg`}
                  </p>
                </div>
                <button 
                  onClick={() => handleRemoveExercise(e.id)}
                  className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-red-500 bg-zinc-900 rounded-full"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {type === 'Rest' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center mb-6">
          <span className="text-4xl mb-4 block">🧘‍♂️</span>
          <h3 className="text-white font-bold mb-2">Rest Day</h3>
          <p className="text-sm text-zinc-500">Take it easy. Recovery is where the growth happens.</p>
        </div>
      )}

      {type && (
        <button
          onClick={handleSaveWorkout}
          className="w-full bg-white text-black font-bold uppercase tracking-wider rounded-xl py-4 hover:bg-zinc-200 transition-colors shadow-xl"
        >
          Save Workout
        </button>
      )}
    </div>
  );
}
