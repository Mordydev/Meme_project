/**
 * Notification Provider
 * Manages notification state and WebSocket connections
 */
'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationSettings, Notification, NotificationType } from '@/types';

// Create context type
type NotificationContextType = {
  notifications: Notification[];
  unread: number;
  markAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  getFilteredNotifications: (type?: NotificationType) => Notification[];
  getUnreadCount: (type?: NotificationType) => number;
};

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unread: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  settings: useNotificationStore.getState().settings,
  updateSettings: () => {},
  getFilteredNotifications: () => [],
  getUnreadCount: () => 0
});

// Hook to use notification context
export const useNotificationContext = () => useContext(NotificationContext);

// Provider props
interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Notification Provider Component
 * @param props Component props
 * @returns Provider component
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  // Get notification utilities and state
  const {
    notifications,
    groupedNotifications,
    unread,
    settings,
    markAsRead,
    markAllAsRead,
    clearAll,
    updateSettings,
    getFilteredNotifications,
    getUnreadCount,
    isConnected
  } = useNotifications();
  
  // Sync unread count to page title
  useEffect(() => {
    const originalTitle = document.title;
    
    if (unread > 0) {
      document.title = `(${unread}) ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }
    
    return () => {
      document.title = originalTitle;
    };
  }, [unread]);
  
  // Create context value
  const value: NotificationContextType = {
    notifications,
    unread,
    markAsRead,
    markAllAsRead, 
    clearAll,
    settings,
    updateSettings,
    getFilteredNotifications,
    getUnreadCount
  };
  
  // Render provider with value
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
