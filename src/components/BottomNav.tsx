'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLifeOS } from './LifeOSProvider';

export const BottomNav = () => {
  const pathname = usePathname();
  const { openQuickAdd } = useLifeOS();

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
      <nav className="fixed bottom-0 w-full max-w-md bg-zinc-900 border-t border-zinc-800 pb-safe z-40 bg-opacity-95 backdrop-blur-md">
        <div className="flex justify-around items-center h-16 relative px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-[10px] uppercase font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button (FAB) for Tasks */}
      <button
        onClick={() => openQuickAdd('task')}
        className="fixed bottom-20 right-4 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 z-40"
        aria-label="Quick Add Task"
      >
        <span className="text-3xl leading-none -mt-1">+</span>
      </button>
    </>
  );
};
