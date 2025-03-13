'use client';

import { useAchievementContext } from '@/components/features/achievements/AchievementProvider';
import { AchievementEvent, AchievementWithProgress } from '@/types';

/**
 * Hook for accessing and interacting with achievements
 * 
 * This hook provides a simplified interface to the achievement system
 * and wraps the useAchievementContext hook.
 */
export function useAchievements() {
  const { 
    achievements, 
    unlockedAchievements, 
    inProgress, 
    triggerEvent, 
    getAchievement, 
    getAchievementsByCategory,
    isLoading 
  } = useAchievementContext();
  
  /**
   * Trigger a simple achievement event
   * 
   * This is a simplified version of triggerEvent that doesn't require
   * the full event structure and uses common event types.
   */
  const triggerAchievement = async (eventType: string, metadata: Record<string, any> = {}) => {
    const event: Omit<AchievementEvent, 'userId' | 'timestamp'> = {
      type: eventType,
      metadata
    };
    
    return triggerEvent(event);
  };
  
  /**
   * Get all achievements with unlock status
   */
  const getAllAchievements = (): AchievementWithProgress[] => {
    return achievements.map(achievement => {
      return getAchievement(achievement.id) as AchievementWithProgress;
    });
  };
  
  /**
   * Get achievement progress as a percentage
   */
  const getProgressPercentage = (): number => {
    if (achievements.length === 0) return 0;
    return Math.round((unlockedAchievements.length / achievements.length) * 100);
  };
  
  return {
    isLoading,
    achievements: getAllAchievements(),
    unlockedAchievements,
    inProgressAchievements: inProgress,
    triggerAchievement,
    getAchievement,
    getAchievementsByCategory,
    getProgressPercentage
  };
}
