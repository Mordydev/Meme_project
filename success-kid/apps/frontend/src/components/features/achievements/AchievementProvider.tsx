'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAchievementStore } from '@/store/useAchievementStore';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { usePointsStore } from '@/store/usePointsStore';

/**
 * Context for the achievement system
 */
export interface AchievementContextType {
  isLoading: boolean;
  error: Error | null;
}

const AchievementContext = createContext<AchievementContextType | null>(null);

/**
 * Props for the AchievementProvider component
 */
export interface AchievementProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for the achievement system
 * Handles loading achievements and listening for achievement events
 */
export function AchievementProvider({ children }: AchievementProviderProps) {
  const { 
    fetchAchievements, 
    isLoading, 
    error,
    unlockAchievement
  } = useAchievementStore();
  const { user, isLoaded: authLoaded } = useAuth();
  const { subscribe } = useWebSocketContext();
  const { addPoints } = usePointsStore();

  // Fetch achievements when user is loaded
  useEffect(() => {
    if (authLoaded && user?.id) {
      fetchAchievements();
    }
  }, [authLoaded, user?.id, fetchAchievements]);

  // Listen for achievement unlocked events from WebSocket
  useEffect(() => {
    if (!authLoaded || !user?.id) return;

    const unsubscribe = subscribe('achievement.unlocked', (message) => {
      if (message.data?.achievement) {
        const { achievement, timestamp } = message.data;
        
        // Update achievement state
        unlockAchievement({
          id: achievement.id,
          unlockedAt: new Date(timestamp || Date.now()),
        });
        
        // Add points if awarded
        if (achievement.pointsReward && achievement.pointsReward > 0) {
          addPoints(achievement.pointsReward, 'achievement', achievement.id);
        }
      }
    });

    return () => unsubscribe();
  }, [authLoaded, user?.id, subscribe, unlockAchievement, addPoints]);

  // Memoize context value
  const value = useMemo(() => ({
    isLoading,
    error,
  }), [isLoading, error]);

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

/**
 * Hook to use the achievement context
 */
export function useAchievementContext() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievementContext must be used within an AchievementProvider');
  }
  return context;
}
