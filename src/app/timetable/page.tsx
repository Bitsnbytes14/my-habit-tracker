'use client';

import React, { useEffect, useState } from 'react';

interface TimetableItem {
  time: string;
  subject: string;
  room?: string;
}

interface DaySchedule {
  dayName: string;
  items: TimetableItem[];
}

const scheduleData: DaySchedule[] = [
  {
    dayName: 'Monday',
    items: [
      { time: '8:45–9:40', subject: 'Flexi', room: 'CL09 & CL10' },
      { time: '9:40–10:35', subject: 'Cybersecurity', room: 'Room 404' },
      { time: '10:40–11:35', subject: 'Compiler Construction', room: 'Room 404' },
      { time: '11:35–12:30', subject: 'Lunch' },
      { time: '2:25–3:20', subject: 'HCI', room: 'Room 404' },
    ],
  },
  {
    dayName: 'Tuesday',
    items: [
      { time: '10:40–11:35', subject: 'HCI', room: 'Room 402' },
      { time: '11:35–12:30', subject: 'Lunch' },
      { time: '2:25–3:20', subject: 'DS Theory', room: 'Room 403' },
      { time: '3:25–4:20', subject: 'DevOps Theory', room: 'Room 403' },
    ],
  },
  {
    dayName: 'Wednesday',
    items: [
      { time: '8:45–9:40', subject: 'Compiler Construction', room: 'Room 404' },
      { time: '9:40–10:35', subject: 'DS Theory', room: 'Room 403' },
      { time: '10:40–12:30', subject: 'ELH' },
      { time: '11:35–12:30', subject: 'Lunch' },
      { time: '12:30–2:20', subject: 'DevOps Lab', room: 'CL09' },
    ],
  },
  {
    dayName: 'Thursday',
    items: [
      { time: '8:45–10:35', subject: 'DS Lab', room: 'CL09' },
      { time: '10:40–11:35', subject: 'DevOps Theory', room: 'Room 403' },
      { time: '2:25–3:20', subject: 'HCI', room: 'Room 402' },
    ],
  },
  {
    dayName: 'Friday',
    items: [
      { time: '8:45–9:40', subject: 'Compiler Construction', room: 'Room 404' },
      { time: '9:40–10:35', subject: 'Cybersecurity', room: 'Room 404' },
      { time: '10:40–11:35', subject: 'DS Theory', room: 'Room 403' },
      { time: '11:35–12:30', subject: 'Lunch' },
      { time: '12:30–2:20', subject: 'Compiler Construction Lab', room: 'CL07' },
      { time: '2:25–4:20', subject: 'DevOps Lab', room: 'CL06' },
    ],
  },
  {
    dayName: 'Saturday',
    items: [
      { time: '10:40–12:30', subject: 'Flexi', room: 'CL09 & CL10' },
    ],
  },
];

export default function TimetablePage() {
  const [currentDayName, setCurrentDayName] = useState<string>('');

  useEffect(() => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = new Date().getDay();
    setCurrentDayName(weekdays[dayIndex]);
  }, []);

  return (
    <div className="p-4 pb-24 min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Schedule</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">College Timetable</h1>
        </div>
        {currentDayName && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-blue-400 font-semibold shadow-sm">
            {currentDayName === 'Sunday' ? 'Rest Day ☀️' : `Today: ${currentDayName}`}
          </div>
        )}
      </header>

      {/* Timetable List */}
      <div className="space-y-6">
        {scheduleData.map((day) => {
          const isToday = day.dayName === currentDayName;

          return (
            <section
              key={day.dayName}
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
                isToday
                  ? 'bg-zinc-900 border-2 border-blue-500 shadow-lg shadow-blue-500/5'
                  : 'bg-zinc-900 border border-zinc-850 hover:border-zinc-800'
              }`}
            >
              {isToday && (
                <div className="absolute top-0 right-0 bg-blue-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm z-10">
                  Today
                </div>
              )}

              {/* Day Name Header */}
              <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
                isToday ? 'border-blue-500/20 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900/50'
              }`}>
                <h3 className={`text-sm font-extrabold tracking-wide uppercase ${isToday ? 'text-blue-400' : 'text-zinc-400'}`}>
                  {day.dayName}
                </h3>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {day.items.length} {day.items.length === 1 ? 'Class' : 'Classes'}
                </span>
              </div>

              {/* Day Classes List */}
              <div className="divide-y divide-zinc-800/50 px-5">
                {day.items.map((item, idx) => {
                  const isLunch = item.subject.toLowerCase() === 'lunch';
                  return (
                    <div
                      key={idx}
                      className={`py-4 flex gap-4 items-start ${
                        isLunch ? 'opacity-65' : ''
                      }`}
                    >
                      {/* Time Column */}
                      <div className={`w-28 shrink-0 text-xs font-bold leading-none pt-0.5 ${
                        isLunch ? 'text-zinc-500' : isToday ? 'text-blue-400' : 'text-zinc-400'
                      }`}>
                        {item.time}
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0">
                        <span className={`block text-sm font-bold tracking-tight ${
                          isLunch ? 'text-zinc-500 italic' : 'text-white'
                        }`}>
                          {item.subject}
                          {isLunch && ' 🍴'}
                        </span>
                        {item.room && (
                          <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                            isToday 
                              ? 'bg-blue-500/5 border-blue-500/20 text-blue-400/80' 
                              : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                          }`}>
                            📍 {item.room}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
