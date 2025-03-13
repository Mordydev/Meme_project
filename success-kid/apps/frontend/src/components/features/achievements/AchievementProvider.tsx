'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useAchievementStore } from '@/store/useAchievementStore';
import { usePointsStore } from '@/store/usePointsStore';
import { Achievement, AchievementProgress, AchievementWithProgress, AchievementEvent, AchievementNotification } from '@/types';
import AchievementUnlock from './AchievementUnlock';

interface AchievementContextValue {
  // Data
  achievements: Achievement[];
  unlockedAchievements: AchievementWithProgress[];
  inProgress: AchievementWithProgress[];
  // Methods
  triggerEvent: (event: Omit<AchievementEvent, 'userId' | 'timestamp'>) => Promise<AchievementNotification[]>;
  getAchievement: (id: string) => AchievementWithProgress | null;
  getAchievementsByCategory: (category: string) => AchievementWithProgress[];
  isLoading: boolean;
}

const AchievementContext = createContext<AchievementContextValue | null>(null);

interface AchievementProviderProps {
  children: React.ReactNode;
  userId: string;
}

/**
 * Achievement Provider
 * 
 * Global provider for achievement data and events. Handles:
 * - Loading achievements and progress
 * - Triggering achievement events
 * - Displaying achievement unlock notifications
 * - Updating points when achievements are unlocked
 */
export function AchievementProvider({ children, userId }: AchievementProviderProps) {
  const [currentNotification, setCurrentNotification] = useState<AchievementNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<AchievementNotification[]>([]);
  
  // Achievement store state and actions
  const { 
    achievements, 
    progress, 
    notifications,
    isLoading, 
    fetchAchievements, 
    triggerEvent: storeTriggerEvent,
    dismissNotification 
  } = useAchievementStore();
  
  // Points store for awarding points
  const { addPoints } = usePointsStore();
  
  // Fetch achievements on mount
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);
  
  // Process notifications from store
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      // Take the oldest notification
      const notification = notifications[0];
      setCurrentNotification(notification);
      
      // Award points for the achievement
      addPoints(notification.pointsAwarded, 'achievement', notification.achievementId);
      
      // Remove from store
      dismissNotification(notification.achievementId);
    }
  }, [notifications, currentNotification, addPoints, dismissNotification]);
  
  // Handle notification queue
  useEffect(() => {
    if (!currentNotification && notificationQueue.length > 0) {
      // Display next notification in queue
      const nextNotification = notificationQueue[0];
      setCurrentNotification(nextNotification);
      setNotificationQueue(prev => prev.slice(1));
    }
  }, [currentNotification, notificationQueue]);
  
  // Get all unlocked achievements
  const unlockedAchievements = achievements
    .filter(achievement => progress[achievement.id]?.unlocked)
    .map(achievement => ({
      ...achievement,
      progress: 100,
      unlocked: true,
      unlockedAt: progress[achievement.id]?.unlockedAt
    }));
  
  // Get all in-progress achievements
  const inProgress = achievements
    .filter(achievement => 
      // Has some progress but not unlocked
      progress[achievement.id] && 
      progress[achievement.id].progress > 0 && 
      !progress[achievement.id].unlocked
    )
    .map(achievement => ({
      ...achievement,
      progress: progress[achievement.id]?.progress || 0,
      unlocked: false,
      criteria: progress[achievement.id]?.criteria
    }));
  
  // Get achievement by ID with progress data
  const getAchievement = (id: string): AchievementWithProgress | null => {
    const achievement = achievements.find(a => a.id === id);
    if (!achievement) return null;
    
    const achievementProgress = progress[id];
    return {
      ...achievement,
      progress: achievementProgress?.progress || 0,
      unlocked: achievementProgress?.unlocked || false,
      unlockedAt: achievementProgress?.unlockedAt,
      criteria: achievementProgress?.criteria
    };
  };
  
  // Get achievements by category
  const getAchievementsByCategory = (category: string): AchievementWithProgress[] => {
    return achievements
      .filter(a => a.category === category)
      .map(achievement => ({
        ...achievement,
        progress: progress[achievement.id]?.progress || 0,
        unlocked: progress[achievement.id]?.unlocked || false,
        unlockedAt: progress[achievement.id]?.unlockedAt,
        criteria: progress[achievement.id]?.criteria
      }));
  };
  
  // Trigger achievement event
  const triggerEvent = async (eventData: Omit<AchievementEvent, 'userId' | 'timestamp'>): Promise<AchievementNotification[]> => {
    const event: AchievementEvent = {
      ...eventData,
      userId,
      timestamp: new Date().toISOString()
    };
    
    // Process event in store
    const newNotifications = await storeTriggerEvent(event);
    
    // Queue new notifications
    if (newNotifications.length > 0) {
      if (!currentNotification) {
        // If no active notification, show the first one immediately
        setCurrentNotification(newNotifications[0]);
        
        // Queue the rest
        if (newNotifications.length > 1) {
          setNotificationQueue(prev => [...prev, ...newNotifications.slice(1)]);
        }
      } else {
        // Queue all notifications if there's already one showing
        setNotificationQueue(prev => [...prev, ...newNotifications]);
      }
    }
    
    return newNotifications;
  };
  
  // Clear current notification
  const handleDismissNotification = () => {
    setCurrentNotification(null);
  };
  
  // View achievement details
  const handleViewDetails = () => {
    // This would navigate to the achievement details page
    // or open a modal with more information
    console.log('View achievement details:', currentNotification?.achievementId);
    
    // For now, just dismiss the notification
    setCurrentNotification(null);
  };
  
  const contextValue: AchievementContextValue = {
    achievements,
    unlockedAchievements,
    inProgress,
    triggerEvent,
    getAchievement,
    getAchievementsByCategory,
    isLoading
  };
  
  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
      
      {/* Achievement unlock notification */}
      {currentNotification && (
        <AchievementUnlock
          achievement={{
            id: currentNotification.achievementId,
            title: currentNotification.title,
            description: currentNotification.description,
            iconUrl: currentNotification.badgeUrl
          }}
          points={currentNotification.pointsAwarded}
          onDismiss={handleDismissNotification}
          onViewDetails={handleViewDetails}
        />
      )}
    </AchievementContext.Provider>
  );
}

/**
 * Hook for accessing achievement context
 */
export function useAchievementContext() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievementContext must be used within an AchievementProvider');
  }
  return context;
}
