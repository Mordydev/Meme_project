'use client';

import React from 'react';
import { Leaderboard } from '@/components/features/achievements';

/**
 * Dedicated leaderboard page
 */
export default function LeaderboardPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Community Leaderboard</h1>
        <p className="text-neutral-600">
          See who's leading the Success Kid community in points, achievements, and more
        </p>
      </div>
      
      {/* Full-page leaderboard */}
      <div className="bg-white rounded-lg shadow p-6">
        <Leaderboard limit={50} />
      </div>
    </div>
  );
}
