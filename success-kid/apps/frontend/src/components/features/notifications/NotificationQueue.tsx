/**
 * Notification Queue Manager
 * Handles batching and prioritization of notifications to prevent UI overload
 */
'use client';

import React, { useEffect, useReducer, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types';

// Priority levels for different notification types
const PRIORITY_LEVELS = {
  achievement: 100,  // Highest priority
  market: 90,
  points: 80,
  social: 70,
  system: 60,
  content: 50      // Lowest priority
};

// Queue actions
type QueueAction = 
  | { type: 'ADD', notification: Notification }
  | { type: 'PROCESS' }
  | { type: 'CLEAR' };

// Queue state
interface QueueState {
  pending: Notification[];
  processing: boolean;
}

// Notification context props
interface NotificationQueueProps {
  children: React.ReactNode;
  maxNotificationsPerMinute?: number;
  processingDelay?: number;
}

/**
 * Prioritize notifications in queue
 */
function prioritizeNotifications(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    // First by priority level
    const priorityDiff = (PRIORITY_LEVELS[b.type] || 0) - (PRIORITY_LEVELS[a.type] || 0);
    
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    
    // Then by timestamp (newer first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Queue reducer
 */
function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'ADD':
      return {
        ...state,
        // Add to pending queue and prioritize
        pending: prioritizeNotifications([...state.pending, action.notification])
      };
    case 'PROCESS':
      return {
        ...state,
        processing: true
      };
    case 'CLEAR':
      return {
        ...state,
        processing: false,
        // Reprioritize remaining notifications
        pending: state.pending.length > 0 ? prioritizeNotifications(state.pending) : []
      };
    default:
      return state;
  }
}

/**
 * Notification Queue Component
 */
export function NotificationQueue({ 
  children, 
  maxNotificationsPerMinute = 10,
  processingDelay = 500
}: NotificationQueueProps) {
  // Queue state
  const [state, dispatch] = useReducer(queueReducer, {
    pending: [],
    processing: false
  });
  
  // Track notification processing
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);
  const processedCountRef = useRef<number>(0);
  
  // Get notifications hook
  const { addNotification } = useNotifications();
  
  // Process notifications at a controlled rate
  useEffect(() => {
    // Skip if no pending notifications or already processing
    if (state.pending.length === 0 || state.processing) {
      return;
    }
    
    // Check rate limiting
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessedTimeRef.current;
    
    // Reset counter after a minute
    if (timeSinceLastProcess > 60000) {
      processedCountRef.current = 0;
    }
    
    // If we've processed too many notifications in the last minute, add delay
    if (processedCountRef.current >= maxNotificationsPerMinute) {
      const nextProcessTime = lastProcessedTimeRef.current + 60000;
      const delayNeeded = nextProcessTime - now;
      
      if (delayNeeded > 0) {
        processingTimerRef.current = setTimeout(() => {
          dispatch({ type: 'PROCESS' });
        }, delayNeeded);
        
        return;
      }
    }
    
    // Process the next notification
    dispatch({ type: 'PROCESS' });
  }, [state.pending, state.processing, maxNotificationsPerMinute]);
  
  // Handle notification processing
  useEffect(() => {
    if (!state.processing || state.pending.length === 0) {
      return;
    }
    
    // Get next notification (already prioritized)
    const nextNotification = state.pending[0];
    const remainingNotifications = state.pending.slice(1);
    
    // Process notification
    processingTimerRef.current = setTimeout(() => {
      // Add notification to the system
      addNotification(nextNotification);
      
      // Update tracking
      lastProcessedTimeRef.current = Date.now();
      processedCountRef.current += 1;
      
      // Clear processing state
      dispatch({ type: 'CLEAR' });
    }, processingDelay);
    
    // Cleanup
    return () => {
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }
    };
  }, [state.processing, state.pending, addNotification, processingDelay]);
  
  /**
   * Queue a notification
   */
  const queueNotification = (notification: Notification) => {
    dispatch({ type: 'ADD', notification });
  };
  
  // Provide context value to children
  const contextValue = {
    queueNotification,
    pendingCount: state.pending.length,
    isProcessing: state.processing
  };
  
  // This is a non-visual component
  return null;
}

export default NotificationQueue;
