/**
 * Notification Store
 * Manages notification state and provides notification operations
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Notification, NotificationSettings, NotificationType, defaultNotificationSettings } from '@/types';

// Constants
const MAX_NOTIFICATIONS = 100;

// Notification state interface
interface NotificationState {
  // Notification data
  notifications: Notification[];
  unread: number;
  settings: NotificationSettings;
  
  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  resetSettings: () => void;
  
  // Getters
  getByType: (type: NotificationType) => Notification[];
  getUnreadCount: (type?: NotificationType) => number;
}

/**
 * Notification Store
 */
export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        notifications: [],
        unread: 0,
        settings: defaultNotificationSettings,
        
        // Add notification
        addNotification: (notification) => {
          // Skip notifications that are disabled in settings
          const { settings } = get();
          if (notification.type !== 'all' && !settings.categories[notification.type]) {
            return;
          }
          
          // Check for quiet hours
          if (settings.quietHours.enabled) {
            const now = new Date();
            const startParts = settings.quietHours.start.split(':').map(Number);
            const endParts = settings.quietHours.end.split(':').map(Number);
            
            const startHour = startParts[0];
            const startMinute = startParts[1] || 0;
            const endHour = endParts[0];
            const endMinute = endParts[1] || 0;
            
            const hour = now.getHours();
            const minute = now.getMinutes();
            
            const currentTime = hour * 60 + minute;
            const startTime = startHour * 60 + startMinute;
            const endTime = endHour * 60 + endMinute;
            
            // Check if current time is within quiet hours
            // Handle cases where quiet hours span across midnight
            if (startTime > endTime) {
              // e.g., 22:00 to 08:00
              if (currentTime >= startTime || currentTime <= endTime) {
                // During quiet hours, skip immediate notifications
                if (settings.frequency === 'immediate') {
                  return;
                }
              }
            } else {
              // e.g., 01:00 to 08:00
              if (currentTime >= startTime && currentTime <= endTime) {
                // During quiet hours, skip immediate notifications
                if (settings.frequency === 'immediate') {
                  return;
                }
              }
            }
          }
          
          set(state => {
            // Add to start of array, enforce maximum, update unread count
            const updatedNotifications = [notification, ...state.notifications]
              .slice(0, MAX_NOTIFICATIONS);
              
            return {
              notifications: updatedNotifications,
              unread: state.unread + 1
            };
          });
        },
        
        // Mark notifications as read
        markAsRead: (ids) => {
          if (!ids.length) return;
          
          set(state => {
            const updatedNotifications = state.notifications.map(notification => 
              ids.includes(notification.id) && !notification.read
                ? { ...notification, read: true }
                : notification
            );
            
            // Count how many were actually marked as read
            const markedCount = state.notifications.filter(
              notification => ids.includes(notification.id) && !notification.read
            ).length;
            
            return {
              notifications: updatedNotifications,
              unread: Math.max(0, state.unread - markedCount)
            };
          });
        },
        
        // Mark all notifications as read
        markAllAsRead: () => {
          set(state => ({
            notifications: state.notifications.map(notification => ({
              ...notification,
              read: true
            })),
            unread: 0
          }));
        },
        
        // Remove a notification
        removeNotification: (id) => {
          set(state => {
            const notification = state.notifications.find(n => n.id === id);
            const unreadDelta = notification && !notification.read ? 1 : 0;
            
            return {
              notifications: state.notifications.filter(n => n.id !== id),
              unread: Math.max(0, state.unread - unreadDelta)
            };
          });
        },
        
        // Clear all notifications
        clearAll: () => {
          set({
            notifications: [],
            unread: 0
          });
        },
        
        // Update notification settings
        updateSettings: (newSettings) => {
          set(state => ({
            settings: {
              ...state.settings,
              ...newSettings,
              // Handle nested objects
              ...(newSettings.categories && {
                categories: {
                  ...state.settings.categories,
                  ...newSettings.categories
                }
              }),
              ...(newSettings.delivery && {
                delivery: {
                  ...state.settings.delivery,
                  ...newSettings.delivery
                }
              }),
              ...(newSettings.quietHours && {
                quietHours: {
                  ...state.settings.quietHours,
                  ...newSettings.quietHours
                }
              })
            }
          }));
        },
        
        // Reset settings to defaults
        resetSettings: () => {
          set({
            settings: defaultNotificationSettings
          });
        },
        
        // Get notifications by type
        getByType: (type) => {
          const { notifications } = get();
          if (type === 'all') {
            return notifications;
          }
          return notifications.filter(notification => notification.type === type);
        },
        
        // Get unread count, optionally filtered by type
        getUnreadCount: (type) => {
          const { notifications } = get();
          if (!type || type === 'all') {
            return get().unread;
          }
          return notifications.filter(
            notification => notification.type === type && !notification.read
          ).length;
        }
      }),
      {
        name: 'notification-storage',
        // Only persist settings and read status, not the actual notifications
        // This prevents storage bloat while preserving user preferences
        partialize: (state) => ({
          settings: state.settings,
          // Store only IDs of read notifications to save space
          readIds: state.notifications
            .filter(n => n.read)
            .map(n => n.id)
        }),
        // Merge persisted state with initial state
        merge: (persisted, current) => {
          const readIds = (persisted as any).readIds || [];
          
          return {
            ...current,
            settings: {
              ...current.settings,
              ...(persisted as any).settings
            },
            // Mark notifications as read based on persisted readIds
            notifications: current.notifications.map(notification => ({
              ...notification,
              read: notification.read || readIds.includes(notification.id)
            })),
            // Recalculate unread count
            unread: current.notifications.filter(
              n => !n.read && !readIds.includes(n.id)
            ).length
          };
        }
      }
    )
  )
);
