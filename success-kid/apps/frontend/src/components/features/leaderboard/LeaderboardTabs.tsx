'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardPeriod } from '@/types';

interface LeaderboardTabsProps {
  activeTab: LeaderboardPeriod;
  onTabChange: (tab: LeaderboardPeriod) => void;
  className?: string;
}

/**
 * LeaderboardTabs
 * 
 * Component for switching between different time periods of the leaderboard.
 */
export function LeaderboardTabs({ 
  activeTab, 
  onTabChange, 
  className 
}: LeaderboardTabsProps) {
  const tabs: { id: LeaderboardPeriod; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'all-time', label: 'All Time' }
  ];
  
  return (
    <div className={cn("border-b flex", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2 font-medium text-sm relative",
            "transition-colors duration-200",
            activeTab === tab.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
