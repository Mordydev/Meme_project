'use client';

import React from 'react';

interface UpdateNotificationProps {
  count?: number;
  onClick: () => void;
  position?: 'top' | 'bottom';
}

/**
 * Notification for new feed updates
 */
export function UpdateNotification({
  count,
  onClick,
  position = 'top'
}: UpdateNotificationProps) {
  return (
    <div className={`sticky ${position === 'top' ? 'top-0' : 'bottom-0'} z-10 flex justify-center my-2`}>
      <button
        onClick={onClick}
        className="bg-primary text-primary-foreground shadow-md rounded-full px-4 py-2 text-sm font-medium flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
          {position === 'top' ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          )}
        </svg>
        {count ? `Show ${count} new updates` : 'Show new updates'}
      </button>
    </div>
  );
}

export default UpdateNotification;
