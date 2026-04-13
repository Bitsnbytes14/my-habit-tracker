'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/components/LifeOSProvider';
import { getTodayString } from '@/lib/storage';

export default function JournalPage() {
  const { data, updateData } = useLifeOS();
  const today = getTodayString();
  const todayEntry = data.journal[today] || '';

  const [entry, setEntry] = useState(todayEntry);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sync state if provider data loads/changes
  useEffect(() => {
    setEntry(data.journal[today] || '');
  }, [data.journal, today]);

  const handleSave = (value: string) => {
    updateData((prev) => ({
      journal: { ...prev.journal, [today]: value }
    }));
  };

  // Get last 5 entries excluding today
  const pastEntries = Object.entries(data.journal)
    .filter(([date, text]) => date !== today && text.trim().length > 0)
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .slice(0, 5);

  const displayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="p-6 pb-24 h-screen flex flex-col">
      <header className="mb-6 mt-4">
        <h1 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Journal</h1>
        <h2 className="text-3xl font-bold text-white tracking-tight">{displayDate}</h2>
      </header>

      {/* Editor Main */}
      <section className="flex-1 min-h-[300px] mb-6 relative group">
        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          onBlur={() => handleSave(entry)}
          placeholder="What's on your mind today?"
          className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 resize-none transition-all"
        />
        <div className="absolute bottom-4 right-4 text-xs font-semibold text-zinc-500 bg-zinc-950/80 px-2 py-1 rounded backdrop-blur">
          Auto-saves on blur
        </div>
      </section>

      {/* Past Entries */}
      {pastEntries.length > 0 && (
        <section className="pb-4 shrink-0">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 ml-1">Last 5 Entries</h3>
          <div className="space-y-2">
            {pastEntries.map(([date, text]) => {
              const pxDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const isExpanded = expandedId === date;

              return (
                <div key={date} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all">
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : date)}
                    className="w-full flex justify-between items-center p-4 text-left"
                  >
                    <span className="font-semibold text-zinc-300">{pxDate}</span>
                    <span className="text-zinc-600 font-bold">{isExpanded ? '−' : '+'}</span>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-800/50 text-sm text-zinc-400 whitespace-pre-wrap">
                      {text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
