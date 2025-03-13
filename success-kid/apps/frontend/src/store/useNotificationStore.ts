import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type NotificationType = 
  | 'achievement' 
  | 'social' 
  | 'system' 
  | 'content' 
  | 'market' 
  | 'all';

export type NotificationAction = {
  label: string;
  action: string;
  url?: string;
};

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationSettings {
  categories: {
    [key in Exclude<NotificationType, 'all'>]: boolean;
  };
  delivery: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  frequency: 'immediate' | 'batched' | 'daily';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
}

const defaultSettings: NotificationSettings = {
  categories: {
    achievement: true,
    social: true,
    system: true,
    content: true,
    market: true,
  },
  delivery: {
    inApp: true,
    email: true,
    push: false,
  },
  frequency: 'immediate',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
};

// Maximum number of notifications to store
const MAX_NOTIFICATIONS = 100;

interface NotificationState {
  // Notification data
  notifications: Notification[];
  unread: number;
  
  // User settings
  settings: NotificationSettings;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  updateCategorySettings: (category: Exclude<NotificationType, 'all'>, enabled: boolean) => void;
  getFilteredNotifications: (type?: NotificationType) => Notification[];
  shouldShowNotification: (type: Exclude<NotificationType, 'all'>) => boolean;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        notifications: [],
        unread: 0,
        settings: defaultSettings,
        
        // Add a new notification
        addNotification: (notification) => {
          const now = new Date().toISOString();
          const id = `notification_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          
          // Check if this notification type is enabled
          const type = notification.type as Exclude<NotificationType, 'all'>;
          if (!get().shouldShowNotification(type)) {
            return;
          }
          
          set((state) => {
            const newNotification: Notification = {
              ...notification,
              id,
              read: false,
              createdAt: now,
            };
            
            // Add to beginning of array and limit total count
            const updatedNotifications = [
              newNotification,
              ...state.notifications
            ].slice(0, MAX_NOTIFICATIONS);
            
            return {
              notifications: updatedNotifications,
              unread: state.unread + 1,
            };
          });
        },
        
        // Mark specified notifications as read
        markAsRead: (ids) => set((state) => {
          if (ids.length === 0) return state;
          
          const updatedNotifications = state.notifications.map(notification => {
            if (ids.includes(notification.id) && !notification.read) {
              return { ...notification, read: true };
            }
            return notification;
          });
          
          // Count how many were actually marked as read (were previously unread)
          const markedCount = state.notifications.filter(
            n => ids.includes(n.id) && !n.read
          ).length;
          
          return {
            notifications: updatedNotifications,
            unread: Math.max(0, state.unread - markedCount),
          };
        }),
        
        // Mark all notifications as read
        markAllAsRead: () => set((state) => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            read: true,
          })),
          unread: 0,
        })),
        
        // Remove a notification
        removeNotification: (id) => set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          const isUnread = notification && !notification.read;
          
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unread: isUnread ? Math.max(0, state.unread - 1) : state.unread,
          };
        }),
        
        // Clear all notifications
        clearAll: () => set({ notifications: [], unread: 0 }),
        
        // Update notification settings
        updateSettings: (newSettings) => set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        })),
        
        // Update a specific category setting
        updateCategorySettings: (category, enabled) => set((state) => ({
          settings: {
            ...state.settings,
            categories: {
              ...state.settings.categories,
              [category]: enabled,
            },
          },
        })),
        
        // Get notifications filtered by type
        getFilteredNotifications: (type = 'all') => {
          const { notifications } = get();
          if (type === 'all') return notifications;
          return notifications.filter(n => n.type === type);
        },
        
        // Check if a notification type should be shown based on settings
        shouldShowNotification: (type) => {
          const { settings } = get();
          
          // Check if this category is enabled
          if (!settings.categories[type]) return false;
          
          // Check quiet hours if enabled
          if (settings.quietHours.enabled) {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const currentTime = hours * 60 + minutes;
            
            const [startHours, startMinutes] = settings.quietHours.start.split(':').map(Number);
            const [endHours, endMinutes] = settings.quietHours.end.split(':').map(Number);
            
            const startTime = startHours * 60 + startMinutes;
            const endTime = endHours * 60 + endMinutes;
            
            // Handle cases where quiet hours cross midnight
            if (startTime > endTime) {
              // If current time is between start and midnight OR between midnight and end
              if (currentTime >= startTime || currentTime <= endTime) {
                return false;
              }
            } else if (currentTime >= startTime && currentTime <= endTime) {
              return false;
            }
          }
          
          return true;
        },
      }),
      {
        name: 'notification-storage',
        // Only persist settings and read status
        partialize: (state) => ({
          notifications: state.notifications.map(({ id, read, createdAt }) => ({ id, read, createdAt })),
          settings: state.settings,
        }),
        // Custom merge strategy to handle the partial persisted state
        merge: (persisted, current) => {
          const persistedNotificationMap = new Map(
            (persisted as any).notifications?.map((n: any) => [n.id, n]) || []
          );
          
          // Merge notification data with persisted read status
          const mergedNotifications = current.notifications.map(notification => {
            const persisted = persistedNotificationMap.get(notification.id);
            return persisted ? { ...notification, read: persisted.read } : notification;
          });
          
          // Calculate unread count
          const unread = mergedNotifications.filter(n => !n.read).length;
          
          return {
            ...current,
            notifications: mergedNotifications,
            unread,
            settings: (persisted as any).settings || current.settings,
          };
        },
      }
    )
  )
);
