'use client';

import { useState, useCallback } from 'react';
import { useAchievementStore, Achievement } from '@/store/useAchievementStore';
import { useAuth } from './useAuth';

/**
 * Hook for working with achievements in component contexts
 * Provides easy access to achievement data and actions
 */
export function useAchievements() {
  const { 
    achievements,
    unlockedAchievements,
    inProgressAchievements,
    achievementsByCategory,
    isLoading,
    error,
    triggerEvent,
    updateProgress,
  } = useAchievementStore();
  
  const { isLoaded, isSignedIn } = useAuth();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  /**
   * Check progress for a specific achievement
   */
  const checkAchievement = useCallback((id: string) => {
    const achievement = achievements.find(a => a.id === id);
    if (!achievement) {
      return { id, progress: 0 };
    }
    return { id: achievement.id, progress: achievement.progress };
  }, [achievements]);
  
  /**
   * Get all achievements for a specific category
   */
  const getAchievementsByCategory = useCallback((category: string) => {
    return achievementsByCategory[category as keyof typeof achievementsByCategory] || [];
  }, [achievementsByCategory]);
  
  /**
   * Trigger an achievement check manually
   */
  const triggerAchievementCheck = useCallback(async (
    achievementId: string, 
    eventData?: any
  ) => {
    if (!isLoaded || !isSignedIn) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) {
      return { success: false, error: 'Achievement not found' };
    }
    
    setIsUnlocking(true);
    
    try {
      // Trigger the achievement event
      const result = await triggerEvent('manual_check', {
        achievementId,
        ...eventData
      });
      
      const unlockedAchievement = result.unlockedAchievements.find(a => a.id === achievementId);
      
      if (unlockedAchievement) {
        // Set the current achievement to display the notification
        setCurrentAchievement(unlockedAchievement);
        
        return { 
          success: true,
          achievement: unlockedAchievement
        };
      } else {
        // Just update progress
        const progressUpdate = result.updatedProgress.find(p => p.id === achievementId);
        
        if (progressUpdate) {
          return { 
            success: true,
            progress: progressUpdate.progress,
            achievement: null
          };
        }
        
        return { success: false, error: 'No progress update or unlock' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check achievement';
      return { success: false, error: errorMessage };
    } finally {
      setIsUnlocking(false);
    }
  }, [isLoaded, isSignedIn, achievements, triggerEvent]);
  
  /**
   * Dismiss the currently displayed achievement notification
   */
  const dismissAchievement = useCallback(() => {
    setCurrentAchievement(null);
  }, []);
  
  return {
    achievements,
    unlockedAchievements,
    inProgressAchievements,
    currentAchievement,
    isLoading,
    isUnlocking,
    error,
    checkAchievement,
    getAchievementsByCategory,
    triggerAchievementCheck,
    dismissAchievement,
    updateProgress,
  };
}
