'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString, getOffsetDateString } from '@/lib/storage';
import { Task, TaskType } from '@/lib/types';

const timeSlots = Array.from({ length: 19 }, (_, i) => i + 5); // 5 to 23 (5am - 11pm)

const colorMap: Record<TaskType, string> = {
  task: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gym: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  meal: 'bg-green-500/20 text-green-400 border-green-500/30',
  prayer: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  custom: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

export default function CalendarPage() {
  const { data, updateData } = useLifeOS();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedEvent, setSelectedEvent] = useState<Task | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TaskType>('task');
  const [newTime, setNewTime] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Generate week
  const todayDate = new Date();
  const currentDay = todayDate.getDay();
  // Move to Sunday of current week
  todayDate.setDate(todayDate.getDate() - currentDay);
  
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
    };
  });

  const todaysTasks = data.tasks.filter((t) => t.date === selectedDate);

  const handleAddEvent = () => {
    if (!newTitle.trim()) {
      alert('Task Title is required!');
      return;
    }
    if (!newTime) {
      alert('Event Time is required!');
      return;
    }
    const newTask: Task = {
      id: `cal-${Date.now()}`,
      title: newTitle,
      date: selectedDate,
      time: newTime,
      type: newType,
      done: false,
      notes: newNotes,
    };
    updateData((prev) => ({
      tasks: [...prev.tasks, newTask]
    }));
    setIsAddFormOpen(false);
    setNewTitle('');
    setNewNotes('');
  };

  const handleDeleteEvent = (id: string) => {
    updateData((prev) => ({
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
    setSelectedEvent(null);
  };

  const handleToggleDone = (task: Task) => {
    updateData((prev) => ({
      tasks: prev.tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t)
    }));
    // update local state so details panel shows correctly if open
    if (selectedEvent && selectedEvent.id === task.id) {
      setSelectedEvent({ ...selectedEvent, done: !selectedEvent.done });
    }
  };

  return (
    <div className="pb-24 flex flex-col h-screen">
      {/* Week Strip */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10 flex gap-2 overflow-x-auto no-scrollbar">
        {weekDates.map((d) => {
          const isSelected = d.dateStr === selectedDate;
          return (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDate(d.dateStr)}
              className={`flex-1 min-w-[3rem] flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
                isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-950 text-zinc-500 hover:bg-zinc-800'
              }`}
            >
              <span className="text-[10px] uppercase font-bold mb-1">{d.dayName}</span>
              <span className="text-lg font-semibold">{d.dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Hourly Slots */}
      <div className="flex-1 overflow-y-auto relative p-4">
        {timeSlots.map((hour) => {
          const formattedHour = `${String(hour).padStart(2, '0')}:00`;
          
          // strictly naive hour mapping (matching "HH:")
          const eventsInHour = todaysTasks.filter(t => t.time.startsWith(String(hour).padStart(2, '0')));

          return (
            <div key={hour} className="flex min-h-[4rem] group border-b border-zinc-800/50">
              <div className="w-12 pt-2 text-xs text-zinc-500 font-medium shrink-0">
                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
              </div>
              <div className="flex-1 relative pb-2 pt-1">
                {eventsInHour.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`mt-1 p-2 rounded-lg border text-sm font-medium cursor-pointer ${colorMap[evt.type] || colorMap.custom} ${evt.done ? 'opacity-50 line-through' : ''}`}
                  >
                    {evt.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* + Add Button */}
      <div className="fixed bottom-20 right-4 z-20">
        <button
          onClick={() => setIsAddFormOpen(true)}
          className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-full px-5 py-3 shadow-xl font-bold flex items-center gap-2 border border-zinc-700"
        >
          <span>+ Add</span>
        </button>
      </div>

      {/* Details / Edit Panel */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="relative bg-zinc-900 rounded-t-2xl p-6 shadow-xl animate-in slide-in-from-bottom border-t border-zinc-800">
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6" />
            <h2 className={`text-xl font-bold mb-1 ${colorMap[selectedEvent.type].split(' ')[1]}`}>{selectedEvent.title}</h2>
            <p className="text-zinc-400 text-sm mb-6 flex gap-3">
              <span className="uppercase">{selectedEvent.type}</span>
              <span>•</span>
              <span>{selectedEvent.time}</span>
            </p>

            {selectedEvent.notes && (
              <p className="bg-zinc-950 p-4 rounded-xl text-zinc-300 text-sm mb-6 border border-zinc-800">
                {selectedEvent.notes}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleToggleDone(selectedEvent)}
                className={`flex-1 py-4 flex items-center justify-center font-bold rounded-xl transition-colors ${
                  selectedEvent.done ? 'bg-zinc-800 text-white' : 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                }`}
              >
                {selectedEvent.done ? 'Mark Pending' : '✓ Mark Done'}
              </button>
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="flex-none px-6 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {isAddFormOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
           <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddFormOpen(false)} />
           <div className="relative bg-zinc-900 rounded-t-2xl p-6 shadow-xl animate-in slide-in-from-bottom border-t border-zinc-800 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">New Calendar Event</h2>
                <button onClick={() => setIsAddFormOpen(false)} className="text-zinc-500 font-bold">✕</button>
             </div>

             <div className="space-y-4 mb-6">
               <input
                  type="text"
                  placeholder="Event Title"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
               />
               
               <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
                 {(['task', 'gym', 'meal', 'prayer', 'custom'] as TaskType[]).map((t) => (
                   <button
                     key={t}
                     onClick={() => setNewType(t)}
                     className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                        newType === t ? colorMap[t] + ' bg-opacity-30' : 'text-zinc-500 hover:text-zinc-300'
                     }`}
                   >
                     {t}
                   </button>
                 ))}
               </div>

               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-xs font-semibold text-zinc-500 uppercase mb-2 ml-1">Time</label>
                   <input
                      type="time"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 dark:[color-scheme:dark]"
                   />
                 </div>
               </div>

               <textarea
                 placeholder="Notes (optional)"
                 value={newNotes}
                 onChange={e => setNewNotes(e.target.value)}
                 className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
               />
             </div>

             <button
               onClick={handleAddEvent}
               className="w-full bg-white text-black font-semibold rounded-xl py-4 hover:bg-zinc-200 transition-colors focus:outline-none"
             >
               Save to Calendar
             </button>
           </div>
        </div>
      )}
    </div>
  );
}
