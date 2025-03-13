/**
 * Frontend events system for real-time updates and notifications
 */
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { websocketClient, WebSocketMessage } from './websocket-client';

/**
 * Notification event interface
 */
export interface NotificationEvent {
  id: string;
  type: string;
  message: string;
  data?: any;
  read: boolean;
  timestamp: string;
}

/**
 * Event store state interface
 */
interface EventState {
  notifications: NotificationEvent[];
  connected: boolean;
  
  // Actions
  addNotification: (notification: Omit<NotificationEvent, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setConnected: (connected: boolean) => void;
}

/**
 * Event store for managing notifications and WebSocket state
 */
export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      notifications: [],
      connected: false,
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            ...notification,
            read: false,
          },
          ...state.notifications.slice(0, 49), // Keep last 50 notifications
        ],
      })),
      
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        ),
      })),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      setConnected: (connected) => set({ connected }),
    }),
    {
      name: 'event-storage', // Local storage key
      partialize: (state) => ({ notifications: state.notifications.slice(0, 20) }), // Only persist recent notifications
    }
  )
);

/**
 * Initialize WebSocket event handling
 */
export function initializeEvents(): void {
  // Handle connection status
  websocketClient.onConnectionChange((connected) => {
    useEventStore.getState().setConnected(connected);
  });
  
  // Handle points updates
  websocketClient.subscribe('points.update', (message: WebSocketMessage) => {
    if (message.data) {
      useEventStore.getState().addNotification({
        type: 'points',
        message: `You earned ${message.data.amount} points from ${message.data.source}!`,
        data: message.data,
        timestamp: message.data.timestamp || new Date().toISOString(),
      });
    }
  });
  
  // Handle achievement unlocks
  websocketClient.subscribe('achievement.unlocked', (message: WebSocketMessage) => {
    if (message.data?.achievement) {
      const achievement = message.data.achievement;
      useEventStore.getState().addNotification({
        type: 'achievement',
        message: `Achievement unlocked: ${achievement.name}!`,
        data: message.data,
        timestamp: message.data.timestamp || new Date().toISOString(),
      });
    }
  });
  
  // Handle new content notifications
  websocketClient.subscribe('content.new', (message: WebSocketMessage) => {
    if (message.data) {
      useEventStore.getState().addNotification({
        type: 'content',
        message: `New post from ${message.data.author}: "${message.data.preview}"`,
        data: message.data,
        timestamp: message.data.timestamp || new Date().toISOString(),
      });
    }
  });
  
  // Handle milestone reached events
  websocketClient.subscribe('milestone.reached', (message: WebSocketMessage) => {
    if (message.data) {
      useEventStore.getState().addNotification({
        type: 'milestone',
        message: `Market milestone reached: ${message.data.milestone} at ${message.data.value}!`,
        data: message.data,
        timestamp: message.data.timestamp || new Date().toISOString(),
      });
    }
  });
  
  // Subscribe to error messages
  websocketClient.subscribe('error', (message: WebSocketMessage) => {
    console.error('WebSocket error:', message.data);
    // Optionally add to notifications if user-facing
    if (message.data?.message) {
      useEventStore.getState().addNotification({
        type: 'error',
        message: `Error: ${message.data.message}`,
        data: message.data,
        timestamp: new Date().toISOString(),
      });
    }
  });
}