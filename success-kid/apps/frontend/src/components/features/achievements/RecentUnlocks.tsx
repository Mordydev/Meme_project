'use client';

import React from 'react';
import Image from 'next/image';
import { useAchievementStore, Achievement } from '@/store/useAchievementStore';

/**
 * Props for RecentUnlocks component
 */
interface RecentUnlocksProps {
  limit?: number;
  onAchievementSelect?: (achievement: Achievement) => void;
  className?: string;
}

/**
 * Displays recently unlocked achievements
 */
export function RecentUnlocks({
  limit = 5,
  onAchievementSelect,
  className = '',
}: RecentUnlocksProps) {
  const { unlockedAchievements, isLoading } = useAchievementStore();
  
  // Sort achievements by unlock date (most recent first)
  const sortedAchievements = [...unlockedAchievements]
    .sort((a, b) => {
      const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit);
  
  // Format date to relative time
  const formatRelativeTime = (date?: Date): string => {
    if (!date) return 'Unknown date';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For older achievements, show actual date
    return date.toLocaleDateString();
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="h-7 bg-neutral-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex gap-3">
              <div className="h-12 w-12 bg-neutral-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // No unlocks yet
  if (sortedAchievements.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-lg font-bold text-neutral-800 mb-4">Recent Achievements</h2>
        <div className="text-center py-6 text-neutral-500">
          <p>No achievements unlocked yet</p>
          <p className="text-sm mt-1">Complete activities to earn achievements!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-lg font-bold text-neutral-800 mb-4">Recent Achievements</h2>
      
      <div className="space-y-4">
        {sortedAchievements.map((achievement) => (
          <div
            key={achievement.id}
            onClick={() => onAchievementSelect?.(achievement)}
            className={`
              flex items-center gap-3
              ${onAchievementSelect ? 'cursor-pointer hover:bg-neutral-50 -mx-3 px-3 py-1 rounded-lg' : ''}
            `}
          >
            {/* Achievement badge */}
            <div className="relative flex-shrink-0">
              <Image
                src={achievement.badgeUrl}
                alt={achievement.title}
                width={48}
                height={48}
                className="rounded-full"
              />
              
              {/* Difficulty indicator */}
              <div 
                className={`
                  absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white
                  ${achievement.difficulty === 'common' ? 'bg-neutral-400' : ''}
                  ${achievement.difficulty === 'uncommon' ? 'bg-green-500' : ''}
                  ${achievement.difficulty === 'rare' ? 'bg-blue-500' : ''}
                  ${achievement.difficulty === 'epic' ? 'bg-purple-500' : ''}
                  ${achievement.difficulty === 'legendary' ? 'bg-amber-500' : ''}
                `}
              />
            </div>
            
            {/* Achievement info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-neutral-800 truncate">
                {achievement.title}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-primary-600 font-medium">
                  +{achievement.pointsReward} Points
                </span>
                <span className="text-neutral-400">•</span>
                <span className="text-neutral-500">
                  {formatRelativeTime(achievement.unlockedAt)}
                </span>
              </div>
            </div>
            
            {/* Arrow indicator if selectable */}
            {onAchievementSelect && (
              <div className="text-neutral-400">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* View all link if more than limit */}
      {unlockedAchievements.length > limit && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => {/* Navigate to full achievements view */}}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View all {unlockedAchievements.length} achievements
          </button>
        </div>
      )}
    </div>
  );
}
