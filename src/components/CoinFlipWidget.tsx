'use client';

import React, { useState, useEffect } from 'react';

interface CoinStats {
  heads: number;
  tails: number;
  total: number;
  latestResult: 'heads' | 'tails' | null;
  history: ('heads' | 'tails')[];
}

const LOCAL_STORAGE_KEY = 'lifeOS_coin_flip_stats';

export function CoinFlipWidget() {
  const [stats, setStats] = useState<CoinStats>({
    heads: 0,
    tails: 0,
    total: 0,
    latestResult: null,
    history: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- safe: initialization only
        setStats(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load coin flip stats', e);
    }
    setIsLoaded(true);
  }, []);

  const saveStats = (newStats: CoinStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newStats));
    } catch (e) {
      console.error('Failed to save coin flip stats', e);
    }
  };

  const flipCoin = () => {
    if (isAnimating) return;

    // Mobile vibration feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(50);
      } catch {
        // Ignore vibration errors
      }
    }

    setIsAnimating(true);
    
    // Choose a random duration between 300ms and 600ms
    const duration = Math.floor(Math.random() * (600 - 300 + 1)) + 300;

    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      
      const newHistory = [result, ...stats.history].slice(0, 5) as ('heads' | 'tails')[]; // Keep up to 5 flips
      
      const newStats: CoinStats = {
        heads: stats.heads + (result === 'heads' ? 1 : 0),
        tails: stats.tails + (result === 'tails' ? 1 : 0),
        total: stats.total + 1,
        latestResult: result,
        history: newHistory,
      };

      saveStats(newStats);
      setIsAnimating(false);
    }, duration);
  };

  const resetStats = () => {
    const cleared: CoinStats = {
      heads: 0,
      tails: 0,
      total: 0,
      latestResult: null,
      history: [],
    };
    saveStats(cleared);
  };

  if (!isLoaded) {
    return (
      <div className="w-full max-w-xs mx-auto bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-between h-36 animate-pulse">
        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Flip a Coin</span>
        <div className="h-6 bg-zinc-850 rounded w-24"></div>
        <div className="h-8 bg-zinc-850 rounded w-full"></div>
      </div>
    );
  }

  const { latestResult, heads, tails, total, history } = stats;

  return (
    <div className="w-full max-w-xs mx-auto bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-between transition-all hover:bg-zinc-900/80 relative overflow-hidden">
      <div className="w-full text-center">
        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Flip a Coin</span>
        
        {/* Latest Result Display */}
        <div className="flex flex-col items-center justify-center min-h-[52px]">
          {isAnimating ? (
            <div className="flex flex-col items-center justify-center">
              <span className="inline-block animate-coin-flip text-2xl mb-1">🪙</span>
              <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase">Flipping...</span>
            </div>
          ) : latestResult ? (
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <span className="text-2xl mb-0.5">{latestResult === 'heads' ? '🟡' : '⚪'}</span>
              <span className="text-sm font-black text-white capitalize tracking-wide">{latestResult}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="text-2xl mb-0.5 opacity-60">🪙</span>
              <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase">Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* History & Stats section */}
      <div className="w-full mt-3 pt-3 border-t border-zinc-800/40 flex flex-col gap-3">
        {/* History Trail */}
        {history.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 h-4">
            <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mr-1">History:</span>
            {history.map((h, i) => (
              <span 
                key={i} 
                className="text-xs transition-opacity duration-200"
                style={{ opacity: 1 - i * 0.18 }} // Fade older history slightly
                title={h === 'heads' ? 'Heads' : 'Tails'}
              >
                {h === 'heads' ? '🟡' : '⚪'}
              </span>
            ))}
          </div>
        )}

        {/* Minimal Statistics */}
        <div className="grid grid-cols-3 gap-1.5 text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">
          <div className="text-center bg-zinc-950/30 py-1 px-1 rounded border border-zinc-800/30">
            <span className="block text-zinc-500 text-[8px] mb-0.5">Heads</span>
            <span className="text-zinc-200 font-bold text-xs">{heads}</span>
          </div>
          <div className="text-center bg-zinc-950/30 py-1 px-1 rounded border border-zinc-800/30">
            <span className="block text-zinc-500 text-[8px] mb-0.5">Tails</span>
            <span className="text-zinc-200 font-bold text-xs">{tails}</span>
          </div>
          <div className="text-center bg-zinc-950/30 py-1 px-1 rounded border border-zinc-800/30">
            <span className="block text-zinc-500 text-[8px] mb-0.5">Total</span>
            <span className="text-zinc-200 font-bold text-xs">{total}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex gap-2 mt-4 select-none">
        <button
          onClick={flipCoin}
          disabled={isAnimating}
          className={`flex-grow py-1.5 px-3 rounded-lg text-xs font-bold transition-all active:scale-[0.97] border text-center select-none cursor-pointer ${
            isAnimating
              ? 'bg-zinc-950 border-zinc-900 text-zinc-650 cursor-not-allowed'
              : 'bg-indigo-600/10 hover:bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:text-indigo-300'
          }`}
        >
          {latestResult ? 'Flip Again' : 'Flip Coin'}
        </button>

        {total > 0 && (
          <button
            onClick={resetStats}
            disabled={isAnimating}
            className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-[9px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-all active:scale-[0.97] cursor-pointer"
            title="Reset Statistics"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
