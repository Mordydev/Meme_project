'use client';

import React from 'react';
import { formatRelativeTime } from '@/lib/format';
import { Wifi } from 'lucide-react';

interface UpdateIndicatorProps {
  timestamp: string;
  className?: string;
}

/**
 * UpdateIndicator Component
 * 
 * Shows when data was last updated with a live indicator for real-time updates.
 */
export default function UpdateIndicator({ timestamp, className }: UpdateIndicatorProps) {
  return (
    <div className={`flex items-center text-xs text-neutral-500 ${className || ''}`}>
      <Wifi className="w-3 h-3 mr-1 text-accent-500" />
      <span>Live data, updated {formatRelativeTime(timestamp)}</span>
    </div>
  );
}
