'use client';

import React, { useEffect, useCallback } from 'react';
import { useWebSocketContext } from './WebSocketProvider';
import { useNotificationStore, Notification } from '@/store/useNotificationStore';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/useUIStore';

// Define WebSocket notification event types
interface NotificationEvent {
  type: 'notification:new';
  data: Omit<Notification, 'id' | 'read' | 'createdAt'>;
}

interface ReadUpdateEvent {
  type: 'notification:read_update';
  data: {
    ids: string[];
    read: boolean;
    unreadCount: number;
  };
}

interface ClearEvent {
  type: 'notification:clear';
  data: {
    clearAll: boolean;
    ids?: string[];
  };
}

type WebSocketNotificationEvent = NotificationEvent | ReadUpdateEvent | ClearEvent;

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { subscribe, connected, isAuthenticated } = useWebSocketContext();
  const { user } = useAuth();
  const addNotification = useNotificationStore(state => state.addNotification);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const clearAll = useNotificationStore(state => state.clearAll);
  const removeNotification = useNotificationStore(state => state.removeNotification);
  const addToast = useUIStore(state => state.addToast);
  
  // Handle notifications from WebSocket
  const handleNotificationEvent = useCallback((event: WebSocketNotificationEvent) => {
    switch (event.type) {
      case 'notification:new':
        // Add the notification to the store
        addNotification(event.data);
        
        // Show toast notification for immediate visibility
        // Only show toast for non-marketing and non-system notifications
        if (!['system'].includes(event.data.type)) {
          addToast(
            event.data.title,
            event.data.type === 'achievement' ? 'success' : 'info',
            7000 // Longer display for achievements
          );
        }
        break;
        
      case 'notification:read_update':
        // Update read status for specified notifications
        if (event.data.read) {
          markAsRead(event.data.ids);
        }
        break;
        
      case 'notification:clear':
        // Handle clearing notifications
        if (event.data.clearAll) {
          clearAll();
        } else if (event.data.ids) {
          event.data.ids.forEach(id => removeNotification(id));
        }
        break;
    }
  }, [addNotification, markAsRead, clearAll, removeNotification, addToast]);
  
  // Subscribe to notification events when connected
  useEffect(() => {
    if (!connected || !isAuthenticated) return;
    
    // Subscribe to each notification event type
    const unsubscribeNew = subscribe('notification:new', handleNotificationEvent);
    const unsubscribeRead = subscribe('notification:read_update', handleNotificationEvent);
    const unsubscribeClear = subscribe('notification:clear', handleNotificationEvent);
    
    // Return cleanup function to unsubscribe
    return () => {
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeClear();
    };
  }, [connected, isAuthenticated, subscribe, handleNotificationEvent]);
  
  // Handle reconnection scenario - fetch missed notifications
  useEffect(() => {
    if (connected && isAuthenticated && user?.id) {
      // When reconnecting, we'll fetch missed notifications from the server
      // This is typically done via an API call rather than WebSocket
      const fetchMissedNotifications = async () => {
        try {
          const response = await fetch('/api/notifications?limit=20');
          if (!response.ok) return;
          
          const data = await response.json();
          if (data.data && Array.isArray(data.data.notifications)) {
            // Process each notification to ensure we don't have duplicates
            // This is simplified; you might need more sophisticated deduplication
            data.data.notifications.forEach((notification: any) => {
              // Add to store using a format that matches our store expectations
              addNotification({
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                actions: notification.actions,
              });
            });
          }
        } catch (error) {
          console.error('Failed to fetch missed notifications:', error);
        }
      };
      
      fetchMissedNotifications();
    }
  }, [connected, isAuthenticated, user?.id, addNotification]);
  
  return <>{children}</>;
}

export default NotificationProvider;
