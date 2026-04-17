'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LifeOSData, defaultPrayers } from '@/lib/types';
import { getLifeOSData, saveLifeOSData, getTodayString } from '@/lib/storage';

interface LifeOSContextType {
  data: LifeOSData;
  updateData: (newData: Partial<LifeOSData> | ((prev: LifeOSData) => Partial<LifeOSData>)) => void;
  isLoaded: boolean;
  quickAddType: 'task' | 'meal' | 'weight' | null;
  openQuickAdd: (type: 'task' | 'meal' | 'weight') => void;
  closeQuickAdd: () => void;
  showFeedback: (message: string, type?: 'success' | 'info') => void;
  feedback: { message: string; type: 'success' | 'info' } | null;
}

const LifeOSContext = createContext<LifeOSContextType | undefined>(undefined);

export const LifeOSProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<LifeOSData | null>(null);
  const [quickAddType, setQuickAddType] = useState<'task' | 'meal' | 'weight' | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    const loadedData = getLifeOSData();
    const today = getTodayString();

    // Seeding empty prayers for today if no data is found
    if (!loadedData.prayers[today]) {
      loadedData.prayers[today] = { ...defaultPrayers };
      saveLifeOSData(loadedData);
    }

    setData(loadedData);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- safe: initialization only
  }, []);

  const updateData: LifeOSContextType['updateData'] = (newData) => {
    setData((prev) => {
      if (!prev) return prev;
      const updates = typeof newData === 'function' ? newData(prev) : newData;
      const merged = { ...prev, ...updates };
      saveLifeOSData(merged);
      return merged;
    });
  };

  const openQuickAdd = (type: 'task' | 'meal' | 'weight') => {
    setQuickAddType(type);
  };
  const closeQuickAdd = () => setQuickAddType(null);

  const showFeedback = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <LifeOSContext.Provider value={{ data: data as LifeOSData, updateData, isLoaded: !!data, quickAddType, openQuickAdd, closeQuickAdd, feedback, showFeedback }}>
      {data ? children : <div className="min-h-screen flex items-center justify-center text-zinc-500">Loading Life OS...</div>}
    </LifeOSContext.Provider>
  );
};

export const useLifeOS = () => {
  const context = useContext(LifeOSContext);
  if (!context) {
    throw new Error('useLifeOS must be used within a LifeOSProvider');
  }
  return context;
};
