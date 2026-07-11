'use client';

import React, { useEffect, useState } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';

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
      { time: '10:50–11:45', subject: 'Compiler Construction', room: 'USJ-404' },
      { time: '11:45–12:40', subject: 'Lunch' },
      { time: '2:30–3:25', subject: 'Data Science Theory', room: 'DSD-404' },
      { time: '3:25–4:20', subject: 'Cybersecurity', room: 'PAB-402' },
    ],
  },
  {
    dayName: 'Tuesday',
    items: [
      { time: '9:00–9:55', subject: 'DevOps Lab (L2)', room: 'ADS-C07' },
      { time: '9:55–10:50', subject: 'DevOps Lab (L2)', room: 'ADS-C07' },
      { time: '10:50–11:45', subject: 'HCI Theory', room: 'SUG-402' },
      { time: '11:45–12:40', subject: 'Lunch' },
      { time: '12:40–1:35', subject: 'Data Science Lab (L3)', room: 'DPD-C04' },
      { time: '1:35–2:30', subject: 'Data Science Lab (L3)', room: 'DPD-C04' },
      { time: '2:30–3:25', subject: 'Data Science Theory', room: 'DSD-404' },
      { time: '3:25–4:20', subject: 'DevOps Theory', room: 'ARD-402' },
    ],
  },
  {
    dayName: 'Wednesday',
    items: [
      { time: '9:00–9:55', subject: 'HCI Theory', room: 'SUG-404' },
      { time: '9:55–10:50', subject: 'Data Science Theory', room: 'DSD-404' },
      { time: '10:50–11:45', subject: 'Compiler Construction', room: 'USJ-403' },
      { time: '11:45–12:40', subject: 'Lunch' },
      { time: '12:40–1:35', subject: 'DevOps Lab (L2)', room: 'ADS-C09' },
      { time: '1:35–2:30', subject: 'DevOps Lab (L2)', room: 'ADS-C09' },
    ],
  },
  {
    dayName: 'Thursday',
    items: [
      { time: '9:00–9:55', subject: 'HCI Theory', room: 'SUG-401' },
      { time: '9:55–10:50', subject: 'Compiler Construction', room: 'USJ-404' },
      { time: '10:50–11:45', subject: 'DevOps Theory', room: 'ARD-402' },
      { time: '11:45–12:40', subject: 'Lunch' },
      { time: '12:40–1:35', subject: 'Flexi', room: 'SKM-C09 / NIZ-C10' },
      { time: '1:35–2:30', subject: 'Compiler Construction Lab', room: 'VTI-C07' },
      { time: '2:30–3:25', subject: 'Compiler Construction Lab', room: 'VTI-C07' },
      { time: '3:25–4:20', subject: 'Faculty Meeting / No Class' },
    ],
  },
  {
    dayName: 'Friday',
    items: [
      { time: '9:55–10:50', subject: 'Cybersecurity', room: 'PAB-403' },
      { time: '11:45–12:40', subject: 'Lunch' },
      { time: '2:30–3:25', subject: 'Flexi', room: 'SKM-C09 / NIZ-C10' },
      { time: '3:25–4:20', subject: 'Flexi', room: 'SKM-C09 / NIZ-C10' },
    ],
  },
];

interface AttendanceClass {
  id: string;
  day: string;
  time: string;
  type: string;
  room?: string;
}

interface SubjectConfig {
  name: string;
  classes: AttendanceClass[];
}

const attendanceConfig: SubjectConfig[] = [
  {
    name: 'Compiler Construction',
    classes: [
      { id: 'cc_mon_theory', day: 'Monday', time: '10:50–11:45', type: 'Theory', room: 'USJ-404' },
      { id: 'cc_wed_theory', day: 'Wednesday', time: '10:50–11:45', type: 'Theory', room: 'USJ-403' },
      { id: 'cc_thu_theory', day: 'Thursday', time: '9:55–10:50', type: 'Theory', room: 'USJ-404' },
      { id: 'cc_thu_lab', day: 'Thursday', time: '1:35–2:30', type: 'Lab', room: 'VTI-C07' },
    ],
  },
  {
    name: 'DevOps Theory',
    classes: [
      { id: 'devops_theory_tue', day: 'Tuesday', time: '3:25–4:20', type: 'Theory', room: 'ARD-402' },
      { id: 'devops_theory_thu', day: 'Thursday', time: '10:50–11:45', type: 'Theory', room: 'ARD-402' },
    ],
  },
  {
    name: 'DevOps Lab',
    classes: [
      { id: 'devops_lab_tue', day: 'Tuesday', time: '9:00–10:50', type: 'Lab', room: 'ADS-C07' },
      { id: 'devops_lab_wed', day: 'Wednesday', time: '12:40–2:30', type: 'Lab', room: 'ADS-C09' },
    ],
  },
  {
    name: 'Data Science Theory',
    classes: [
      { id: 'ds_theory_mon', day: 'Monday', time: '2:30–3:25', type: 'Theory', room: 'DSD-404' },
      { id: 'ds_theory_tue', day: 'Tuesday', time: '2:30–3:25', type: 'Theory', room: 'DSD-404' },
      { id: 'ds_theory_wed', day: 'Wednesday', time: '9:55–10:50', type: 'Theory', room: 'DSD-404' },
    ],
  },
  {
    name: 'Data Science Lab',
    classes: [
      { id: 'ds_lab_tue', day: 'Tuesday', time: '12:40–2:30', type: 'Lab', room: 'DPD-C04' },
    ],
  },
  {
    name: 'HCI',
    classes: [
      { id: 'hci_tue_theory', day: 'Tuesday', time: '10:50–11:45', type: 'Theory', room: 'SUG-402' },
      { id: 'hci_wed_theory', day: 'Wednesday', time: '9:00–9:55', type: 'Theory', room: 'SUG-404' },
      { id: 'hci_thu_theory', day: 'Thursday', time: '9:00–9:55', type: 'Theory', room: 'SUG-401' },
    ],
  },
  {
    name: 'Cybersecurity',
    classes: [
      { id: 'cyber_mon_theory', day: 'Monday', time: '3:25–4:20', type: 'Theory', room: 'PAB-402' },
      { id: 'cyber_fri_theory', day: 'Friday', time: '9:55–10:50', type: 'Theory', room: 'PAB-403' },
    ],
  },
  {
    name: 'Flexi',
    classes: [
      { id: 'flexi_thu', day: 'Thursday', time: '12:40–1:35', type: 'Flexi', room: 'SKM-C09 / NIZ-C10' },
      { id: 'flexi_fri_230', day: 'Friday', time: '2:30–3:25', type: 'Flexi', room: 'SKM-C09 / NIZ-C10' },
      { id: 'flexi_fri_325', day: 'Friday', time: '3:25–4:20', type: 'Flexi', room: 'SKM-C09 / NIZ-C10' },
    ],
  },
];

export default function TimetablePage() {
  const [currentDayName, setCurrentDayName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'attendance'>('schedule');
  const { data, updateData, showFeedback } = useLifeOS();
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    'Compiler Construction': true,
  });

  useEffect(() => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = new Date().getDay();
    setCurrentDayName(weekdays[dayIndex]);
  }, []);

  const attendance = data.attendance || {};

  const handleToggleClass = (classId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const isChecked = !attendance[classId];
    updateData((prev) => {
      const prevAttendance = prev.attendance || {};
      return {
        attendance: {
          ...prevAttendance,
          [classId]: isChecked,
        },
      };
    });
    showFeedback(
      isChecked ? 'Class marked as attended ✓' : 'Class marked as missed',
      'success'
    );
  };

  const toggleSubjectExpand = (name: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const getSubjectProgress = (subject: SubjectConfig) => {
    const total = subject.classes.length;
    const attended = subject.classes.filter((c) => attendance[c.id]).length;
    const percentage = total > 0 ? (attended / total) * 100 : 0;
    return { attended, total, percentage };
  };

  const totalClasses = attendanceConfig.reduce((sum, subject) => sum + subject.classes.length, 0);
  const totalAttended = attendanceConfig.reduce((sum, subject) => {
    return sum + subject.classes.filter((c) => attendance[c.id]).length;
  }, 0);
  const overallPercentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

  return (
    <div className="p-4 pb-24 min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-1">Schedule & Attendance</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">College Space</h1>
        </div>
        {currentDayName && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-blue-400 font-semibold shadow-sm">
            {currentDayName === 'Sunday' || currentDayName === 'Saturday' ? 'Weekend Rest Day ☀️' : `Today: ${currentDayName}`}
          </div>
        )}
      </header>

      {/* Tab Switcher */}
      <div className="flex bg-zinc-900 border border-zinc-850 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-2.5 text-xs uppercase tracking-wider font-bold rounded-lg transition-all ${
            activeTab === 'schedule'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          📅 Timetable
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2.5 text-xs uppercase tracking-wider font-bold rounded-lg transition-all flex justify-center items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          🎓 Tracker ({totalAttended}/{totalClasses})
        </button>
      </div>

      {/* Timetable List Tab */}
      {activeTab === 'schedule' && (
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
                    const isFree = item.subject.toLowerCase() === 'free period';
                    return (
                      <div
                        key={idx}
                        className={`py-4 flex gap-4 items-start ${
                          isLunch || isFree ? 'opacity-65' : ''
                        }`}
                      >
                        {/* Time Column */}
                        <div className={`w-24 shrink-0 text-xs font-bold leading-none pt-0.5 ${
                          isLunch || isFree ? 'text-zinc-500' : isToday ? 'text-blue-400' : 'text-zinc-400'
                        }`}>
                          {item.time}
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 min-w-0">
                          <span className={`block text-sm font-bold tracking-tight ${
                            isLunch || isFree ? 'text-zinc-500 italic' : 'text-white'
                          }`}>
                            {item.subject}
                            {isLunch && ' 🍴'}
                            {isFree && ' ⚡'}
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
      )}

      {/* Attendance Tracker Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {attendanceConfig.map((subject) => {
            const { attended, total, percentage } = getSubjectProgress(subject);
            const isExpanded = !!expandedSubjects[subject.name];
            
            return (
              <div
                key={subject.name}
                className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Subject Header */}
                <div
                  onClick={() => toggleSubjectExpand(subject.name)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-850/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-sm font-bold text-white truncate">{subject.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="w-16 bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800/50">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 font-semibold">
                        {attended} / {total} classes ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-[10px] text-zinc-500 font-bold transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Subject Classes List */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-zinc-850/50 bg-zinc-900/40 divide-y divide-zinc-850/30">
                    {subject.classes.map((cls) => {
                      const isChecked = !!attendance[cls.id];
                      return (
                        <div
                          key={cls.id}
                          onClick={(e) => handleToggleClass(cls.id, e)}
                          className="py-3 flex items-center justify-between cursor-pointer group active:opacity-75 transition-opacity"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox */}
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                isChecked
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-zinc-700 group-hover:border-zinc-500'
                              }`}
                            >
                              {isChecked && (
                                <span className="text-zinc-950 text-xs font-black select-none">✓</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-xs font-bold ${isChecked ? 'text-zinc-400 line-through' : 'text-white'}`}>
                                {cls.day} – {cls.time}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                                {cls.type} Class{cls.room && ` • ${cls.room}`}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition-colors ${
                                isChecked
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                  : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                              }`}
                            >
                              {isChecked ? 'Attended' : 'Missed'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Overall Attendance Summary */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 mt-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6" />
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Attendance Summary</h3>
            
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Total Classes Attended</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white">{totalAttended}</span>
                  <span className="text-zinc-600 text-sm font-semibold">/ {totalClasses} classes</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Overall Attendance</p>
                <span className="text-3xl font-black text-blue-400">{overallPercentage.toFixed(1)}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-850 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallPercentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                <span className={overallPercentage >= 75 ? 'text-emerald-400' : 'text-amber-500'}>
                  {overallPercentage >= 75 ? '✓ Meeting 75% Criteria' : '⚠ Below 75% Attendance'}
                </span>
                <span className="text-zinc-500">75% Target</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
