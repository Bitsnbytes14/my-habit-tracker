'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLifeOS } from './LifeOSProvider';

export const BottomNav = () => {
  const pathname = usePathname();
  const { openQuickAdd } = useLifeOS();
  const [showFabMenu, setShowFabMenu] = useState(false);

  const navItems = [
    { name: 'Home', href: '/', icon: '⌂' },
    { name: 'Calendar', href: '/calendar', icon: '📅' },
    { name: 'Focus', href: '/focus', icon: '🎯' },
    { name: 'Diet', href: '/diet', icon: '🥩' },
    { name: 'Namaz', href: '/namaz', icon: '🕋' },
    { name: 'Stats', href: '/progress', icon: '📈' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 w-full max-w-md bg-zinc-900/95 backdrop-blur border-t border-zinc-800 pb-safe z-40">
        <div className="flex justify-around items-center h-16 relative px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-[10px] uppercase font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button (FAB) with Menu */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
        {/* Menu Items (shown when FAB is active) */}
        {showFabMenu && (
          <>
            <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-4">
              <button
                onClick={() => { openQuickAdd('task'); setShowFabMenu(false); }}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-3 shadow-lg shadow-blue-600/30 text-sm font-semibold transition-all active:scale-95 flex items-center gap-2"
              >
                <span>+</span> Task
              </button>
              <button
                onClick={() => { openQuickAdd('meal'); setShowFabMenu(false); }}
                className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-4 py-3 shadow-lg shadow-green-600/30 text-sm font-semibold transition-all active:scale-95 flex items-center gap-2"
              >
                <span>+</span> Meal
              </button>
              <button
                onClick={() => { openQuickAdd('weight'); setShowFabMenu(false); }}
                className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-4 py-3 shadow-lg shadow-orange-600/30 text-sm font-semibold transition-all active:scale-95 flex items-center gap-2"
              >
                <span>+</span> Weight
              </button>
            </div>
          </>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 z-40 ${
            showFabMenu
              ? 'bg-zinc-700 text-white rotate-45'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
          }`}
          aria-label="Quick Add"
        >
          <span className="text-3xl leading-none">+</span>
        </button>
      </div>
    </>
  );
};
