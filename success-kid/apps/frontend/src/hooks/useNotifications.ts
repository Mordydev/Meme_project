/**
 * Notification Hook
 * Provides access to notification functionality and WebSocket integration
 */
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Notification, NotificationSettings, NotificationType } from '@/types';
import { useUIStore } from '@/store/useUIStore';

/**
 * Hook for notification management
 * @returns Notification utilities and state
 */
export function useNotifications() {
  // Access notification store
  const {
    notifications,
    unread,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateSettings,
    resetSettings,
    getByType,
    getUnreadCount
  } = useNotificationStore();
  
  // Access UI store for toast management
  const { addToast } = useUIStore();
  
  // Access WebSocket for real-time notifications
  const { socket, connected, status } = useWebSocket();
  
  // Listen for notification events via WebSocket
  useEffect(() => {
    if (!connected || !socket) return;
    
    // Create our own subscribe function since it's not provided by useWebSocket
    const subscribe = (event: string, handler: (data: any) => void) => {
      // Register the event handler
      socket.on(event, handler);
      
      // Return unsubscribe function
      return () => {
        socket.off(event, handler);
      };
    };

    // Achievement notifications
    const unsubscribeAchievement = subscribe('achievement.unlocked', (message) => {
      const { achievement } = message.data;
      
      // Create notification from achievement event
      const notification: Notification = {
        id: `achievement_${Date.now()}`,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You earned the "${achievement.name}" badge`,
        read: false,
        createdAt: new Date().toISOString(),
        data: achievement,
        actions: [
          {
            label: 'View Achievement',
            action: 'view_achievement',
            url: `/achievements/${achievement.id}`
          }
        ]
      };
      
      // Add to notification store
      addNotification(notification);
      
      // Show toast notification if settings allow
      if (settings.categories.achievement && settings.delivery.inApp) {
        addToast(`Achievement Unlocked: ${achievement.name}`, 'success', 5000);
      }
    });
    
    // Points notifications
    const unsubscribePoints = subscribe('points.update', (message) => {
      const { amount, source } = message.data;
      
      // Create notification from points event
      const notification: Notification = {
        id: `points_${Date.now()}`,
        type: 'points',
        title: 'Points Earned',
        message: `You earned ${amount} points from ${formatPointSource(source)}`,
        read: false,
        createdAt: new Date().toISOString(),
        data: { amount, source },
        actions: [
          {
            label: 'View Points',
            action: 'view_points',
            url: '/profile/points'
          }
        ]
      };
      
      // Add to notification store
      addNotification(notification);
      
      // Show toast notification if settings allow
      if (settings.categories.points && settings.delivery.inApp) {
        addToast(`+${amount} Points: ${formatPointSource(source)}`, 'success', 3000);
      }
    });
    
    // Market milestone notifications
    const unsubscribeMilestone = subscribe('milestone.reached', (message) => {
      const { milestone, value } = message.data;
      
      // Create notification from milestone event
      const notification: Notification = {
        id: `milestone_${Date.now()}`,
        type: 'market',
        title: 'Market Milestone Reached!',
        message: `We've reached ${value} market cap!`,
        read: false,
        createdAt: new Date().toISOString(),
        data: { milestone, value },
        actions: [
          {
            label: 'View Market',
            action: 'view_market',
            url: '/market'
          }
        ]
      };
      
      // Add to notification store
      addNotification(notification);
      
      // Always show toast for milestones as they're important community events
      addToast(`Milestone: ${value} Market Cap Reached! 🎉`, 'success', 8000);
    });
    
    // New content notifications
    const unsubscribeContent = subscribe('content.new', (message) => {
      const { author, preview } = message.data;
      
      // Create notification from content event
      const notification: Notification = {
        id: `content_${Date.now()}`,
        type: 'content',
        title: 'New Community Content',
        message: `${author} posted: ${preview.slice(0, 50)}${preview.length > 50 ? '...' : ''}`,
        read: false,
        createdAt: new Date().toISOString(),
        data: message.data,
        actions: [
          {
            label: 'View Post',
            action: 'view_content',
            url: `/content/${message.data.id}`
          }
        ]
      };
      
      // Add to notification store
      addNotification(notification);
      
      // Only show toast for major content or if from followed users
      // This would require additional logic to determine if content is major or from followed users
    });
    
    // Social notifications (comments, mentions, follows)
    const unsubscribeSocial = subscribe('user.social', (message) => {
      const { type, user, targetId } = message.data;
      
      let title = '';
      let action = '';
      let url = '';
      
      switch (type) {
        case 'follow':
          title = 'New Follower';
          action = 'view_profile';
          url = `/profile/${user.id}`;
          break;
        case 'comment':
          title = 'New Comment';
          action = 'view_comment';
          url = `/content/${targetId}`;
          break;
        case 'mention':
          title = 'New Mention';
          action = 'view_mention';
          url = `/content/${targetId}`;
          break;
        default:
          title = 'Social Update';
          action = 'view_social';
          url = '/notifications';
      }
      
      // Create notification from social event
      const notification: Notification = {
        id: `social_${Date.now()}`,
        type: 'social',
        title,
        message: `${user.name} ${getSocialVerb(type)} you`,
        read: false,
        createdAt: new Date().toISOString(),
        data: message.data,
        actions: [
          {
            label: 'View',
            action,
            url
          }
        ]
      };
      
      // Add to notification store
      addNotification(notification);
      
      // Show toast for social notifications
      if (settings.categories.social && settings.delivery.inApp) {
        addToast(`${user.name} ${getSocialVerb(type)} you`, 'info', 4000);
      }
    });
    
    // System notifications
    const unsubscribeSystem = subscribe('system.notification', (message) => {
      const { title, message: content, actionUrl, actionLabel } = message.data;
      
      // Create notification from system event
      const notification: Notification = {
        id: `system_${Date.now()}`,
        type: 'system',
        title,
        message: content,
        read: false,
        createdAt: new Date().toISOString(),
        data: message.data,
        actions: actionUrl ? [
          {
            label: actionLabel || 'View',
            action: 'system_action',
            url: actionUrl
          }
        ] : undefined
      };
      
      // Add to notification store
      addNotification(notification);
      
      // Show toast for system notifications
      if (settings.categories.system && settings.delivery.inApp) {
        addToast(title, 'info', 4000);
      }
    });
    
    // Clean up subscriptions on unmount
    return () => {
      unsubscribeAchievement();
      unsubscribePoints();
      unsubscribeMilestone();
      unsubscribeContent();
      unsubscribeSocial();
      unsubscribeSystem();
    };
  }, [
    connected, 
    socket,
    addNotification, 
    addToast, 
    settings.categories.achievement,
    settings.categories.points,
    settings.categories.social,
    settings.categories.system,
    settings.delivery.inApp
  ]);
  
  // Handle notification action
  const handleAction = useCallback((notification: Notification, actionIndex: number) => {
    const action = notification.actions?.[actionIndex];
    if (!action) return;
    
    // Mark notification as read when action is taken
    markAsRead([notification.id]);
    
    // Return action details for navigation or other handling
    return {
      action: action.action,
      url: action.url,
      data: notification.data
    };
  }, [markAsRead]);
  
  // Get filtered notifications by type
  const getFilteredNotifications = useCallback((type: NotificationType = 'all') => {
    return getByType(type);
  }, [getByType]);
  
  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const grouped: { [key: string]: Notification[] } = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(notification);
    });
    
    return grouped;
  }, [notifications]);
  
  // Request notification permissions for the browser
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }, []);
  
  return {
    // State
    notifications,
    groupedNotifications,
    unread,
    settings,
    isConnected: connected,
    
    // Actions
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateSettings,
    resetSettings,
    handleAction,
    
    // Helpers
    getFilteredNotifications,
    getUnreadCount,
    requestNotificationPermission
  };
}

// Helper functions
function formatPointSource(source: string): string {
  // Format source string to be more readable
  // e.g., "content_creation" -> "Content Creation"
  return source
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getSocialVerb(type: string): string {
  switch (type) {
    case 'follow':
      return 'followed';
    case 'comment':
      return 'commented on';
    case 'mention':
      return 'mentioned';
    case 'like':
      return 'liked';
    default:
      return 'interacted with';
  }
}

export default useNotifications;
