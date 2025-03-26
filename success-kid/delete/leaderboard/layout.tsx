'use client';

import React from 'react';
import { AchievementProvider } from '@/components/features/achievements/AchievementProvider';
import { LevelProvider } from '@/components/features/achievements/LevelProvider';

/**
 * Layout component for the leaderboard pages
 * Wraps all leaderboard pages with the necessary providers
 */
export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AchievementProvider>
      <LevelProvider>
        {children}
      </LevelProvider>
    </AchievementProvider>
  );
}
