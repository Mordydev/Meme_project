/**
 * Real-Time Updates Hook
 * Handles real-time updates using WebSockets
 */
import { useEffect, useCallback } from 'react';
import { useWebSocket } from '@/services/WebSocketService';
import { WebSocketEventType } from '@success-kid/types';
import { useTypedInvalidation } from './use-query-factory';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for handling real-time updates
 * @param userId Current user ID (optional, for user-specific channels)
 */
export function useRealTimeUpdates(userId?: string) {
  const { subscribe, unsubscribe, addEventListener, isConnected } = useWebSocket();
  const { invalidateQueries } = useTypedInvalidation();
  const { toast } = useToast();
  
  // Subscribe to channels when connected and userId changes
  useEffect(() => {
    if (!isConnected) return;
    
    // Subscribe to public channels
    subscribe('public:announcements');
    subscribe('market:updates');
    subscribe('content:new');
    
    // Subscribe to user-specific channels if userId is provided
    if (userId) {
      subscribe(`user:${userId}`);
      subscribe(`user:${userId}:notifications`);
    }
    
    // Unsubscribe when component unmounts
    return () => {
      unsubscribe('public:announcements');
      unsubscribe('market:updates');
      unsubscribe('content:new');
      
      if (userId) {
        unsubscribe(`user:${userId}`);
        unsubscribe(`user:${userId}:notifications`);
      }
    };
  }, [isConnected, userId, subscribe, unsubscribe]);
  
  // Handle points awarded events
  const handlePointsAwarded = useCallback((data: any) => {
    // Show toast notification
    toast({
      title: 'Points Awarded',
      description: `You earned ${data.amount} points from ${data.source}`,
      variant: 'success',
    });
    
    // Invalidate points-related queries
    invalidateQueries(['points']);
  }, [toast, invalidateQueries]);
  
  // Handle achievement unlocked events
  const handleAchievementUnlocked = useCallback((data: any) => {
    // Show achievement notification
    toast({
      title: 'Achievement Unlocked!',
      description: data.achievement.name,
      variant: 'achievement',
      duration: 5000,
    });
    
    // Invalidate achievement and points queries
    invalidateQueries(['achievements']);
    invalidateQueries(['points']);
  }, [toast, invalidateQueries]);
  
  // Handle new notification events
  const handleNewNotification = useCallback((data: any) => {
    // Show notification toast
    toast({
      title: data.notification.title,
      description: data.notification.body,
      variant: 'info',
      action: data.notification.actionUrl ? {
        label: 'View',
        onClick: () => window.open(data.notification.actionUrl, '_blank'),
      } : undefined,
    });
    
    // Invalidate notifications query
    invalidateQueries(['notifications']);
  }, [toast, invalidateQueries]);
  
  // Handle market update events
  const handleMarketUpdate = useCallback((data: any) => {
    // Invalidate market queries
    invalidateQueries(['market']);
  }, [invalidateQueries]);
  
  // Handle milestone reached events
  const handleMilestoneReached = useCallback((data: any) => {
    // Show celebration toast
    toast({
      title: 'Milestone Reached! 🎉',
      description: `We've reached ${data.milestone} with a market cap of $${data.value.toLocaleString()}`,
      variant: 'celebration',
      duration: 10000,
    });
    
    // Invalidate market queries
    invalidateQueries(['market']);
  }, [toast, invalidateQueries]);
  
  // Set up event listeners
  useEffect(() => {
    // Add event listeners
    const removePointsListener = addEventListener(
      WebSocketEventType.POINTS_AWARDED,
      handlePointsAwarded
    );
    
    const removeAchievementListener = addEventListener(
      WebSocketEventType.ACHIEVEMENT_UNLOCKED,
      handleAchievementUnlocked
    );
    
    const removeNotificationListener = addEventListener(
      WebSocketEventType.NOTIFICATION_NEW,
      handleNewNotification
    );
    
    const removeMarketListener = addEventListener(
      WebSocketEventType.MARKET_UPDATE,
      handleMarketUpdate
    );
    
    const removeMilestoneListener = addEventListener(
      WebSocketEventType.MILESTONE_REACHED,
      handleMilestoneReached
    );
    
    // Remove event listeners when component unmounts
    return () => {
      removePointsListener();
      removeAchievementListener();
      removeNotificationListener();
      removeMarketListener();
      removeMilestoneListener();
    };
  }, [
    addEventListener,
    handlePointsAwarded,
    handleAchievementUnlocked,
    handleNewNotification,
    handleMarketUpdate,
    handleMilestoneReached
  ]);
  
  // Return connection status
  return {
    isConnected,
  };
}
