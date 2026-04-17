'use client';

import React from 'react';
import { useLifeOS } from './LifeOSProvider';

export const FeedbackToast = () => {
  const { feedback } = useLifeOS();

  if (!feedback) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
      <div className={`px-4 py-2 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${
        feedback.type === 'success'
          ? 'bg-green-600 text-white shadow-green-600/30'
          : 'bg-blue-600 text-white shadow-blue-600/30'
      }`}>
        {feedback.type === 'success' && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        )}
        <span>{feedback.message}</span>
      </div>
    </div>
  );
};
