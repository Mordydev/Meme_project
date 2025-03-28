import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'engagement' | 'rewards' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO date string
  read: boolean;
  actionUrl?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      },
      
      markAsRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map((notification) =>
            notification.id === id && !notification.read
              ? { ...notification, read: true }
              : notification
          );
          
          const unreadCount = notifications.filter((n) => !n.read).length;
          
          return {
            notifications,
            unreadCount,
          };
        });
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        }));
      },
      
      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },
    }),
    {
      name: 'success-kid-notifications',
    }
  )
);
