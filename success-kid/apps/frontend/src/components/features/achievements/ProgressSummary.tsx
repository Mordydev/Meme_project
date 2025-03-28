'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLevelStore } from '@/store/useLevelStore';
import { useAchievementStore } from '@/store/useAchievementStore';
import { LevelBadge } from './LevelBadge';

/**
 * Props for ProgressSummary component
 */
interface ProgressSummaryProps {
  className?: string;
}

/**
 * Dashboard component showing overall progress with achievements and levels
 */
export function ProgressSummary({ className = '' }: ProgressSummaryProps) {
  const { userData: levelData, isLoading: levelLoading } = useLevelStore();
  const { 
    achievements, 
    unlockedAchievements, 
    isLoading: achievementsLoading 
  } = useAchievementStore();
  
  // Loading state
  const isLoading = levelLoading || achievementsLoading;
  
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="h-7 bg-neutral-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 bg-neutral-100 rounded"></div>
          <div className="h-24 bg-neutral-100 rounded"></div>
          <div className="h-24 bg-neutral-100 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Calculate achievement completion percentage
  const totalAchievements = achievements.length;
  const unlockedCount = unlockedAchievements.length;
  const completionPercentage = totalAchievements > 0 
    ? Math.round((unlockedCount / totalAchievements) * 100) 
    : 0;
  
  // Calculate category completion stats
  const categories = Object.entries(
    achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = { total: 0, unlocked: 0 };
      }
      acc[achievement.category].total++;
      if (achievement.unlocked) {
        acc[achievement.category].unlocked++;
      }
      return acc;
    }, {} as Record<string, { total: number; unlocked: number }>)
  ).map(([category, stats]) => ({
    category,
    displayName: getCategoryDisplayName(category),
    ...stats,
    percentage: Math.round((stats.unlocked / stats.total) * 100)
  }));
  
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-lg font-bold text-neutral-800 mb-4">Your Progress</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Level progress */}
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-neutral-700">Current Level</h3>
            {levelData && (
              <LevelBadge 
                level={levelData.level} 
                size="sm"
                badgeUrl={levelData.badges.current} 
              />
            )}
          </div>
          
          {levelData && (
            <>
              <p className="text-sm text-neutral-600 mb-2">
                {levelData.title}
              </p>
              <div className="mt-2">
                <div className="text-xs text-neutral-500 mb-1 flex justify-between">
                  <span>{levelData.currentPoints} / {levelData.nextLevelPoints} points</span>
                  <span>{levelData.progress}%</span>
                </div>
                <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelData.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Achievement progress */}
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-neutral-700">Achievements</h3>
            <span className="text-sm font-semibold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              {completionPercentage}% Complete
            </span>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary-700">{unlockedCount}</span>
            <span className="text-neutral-600">/ {totalAchievements} unlocked</span>
          </div>
          
          <div className="mt-2">
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
        
        {/* Top category */}
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <h3 className="font-medium text-neutral-700 mb-2">Top Category</h3>
          
          {categories.length > 0 ? (
            <>
              <p className="text-primary-700 font-medium">
                {getTopCategory(categories)?.displayName || 'None'}
              </p>
              
              <div className="space-y-2 mt-3">
                {categories.slice(0, 3).map(category => (
                  <div key={category.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-600">{category.displayName}</span>
                      <span className="text-neutral-700 font-medium">
                        {category.unlocked}/{category.total}
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${category.percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-neutral-500 text-sm">No achievements yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to format category names
 */
function getCategoryDisplayName(category: string): string {
  switch (category) {
    case 'onboarding': return 'Onboarding';
    case 'content': return 'Content Creation';
    case 'engagement': return 'Community Engagement';
    case 'holder': return 'Token Holder';
    case 'community': return 'Community Builder';
    case 'milestone': return 'Milestones';
    default:
      // Convert camelCase or snake_case to Title Case
      return category
        .replace(/([A-Z])/g, ' $1') // Add space before capital letter
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
  }
}

/**
 * Helper function to find top category by completion percentage
 */
function getTopCategory(categories: Array<{
  category: string;
  displayName: string;
  total: number;
  unlocked: number;
  percentage: number;
}>) {
  if (categories.length === 0) return null;
  
  // Sort by percentage, then by number unlocked if percentages are equal
  return [...categories].sort((a, b) => {
    if (a.percentage === b.percentage) {
      return b.unlocked - a.unlocked;
    }
    return b.percentage - a.percentage;
  })[0];
}
