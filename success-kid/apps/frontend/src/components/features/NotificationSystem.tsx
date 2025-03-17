/**
 * Real-time Notification System
 * 
 * Provides toast-style notifications for real-time events via WebSockets.
 */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { 
  Bell, 
  Check, 
  X, 
  Award, 
  Zap, 
  MessageSquare, 
  Heart, 
  AlertCircle, 
  Info,
  Trophy,
  Wallet
} from 'lucide-react';

/**
 * Notification types
 */
export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'info' 
  | 'warning'
  | 'achievement'
  | 'points'
  | 'level'
  | 'comment'
  | 'like'
  | 'wallet';

/**
 * Notification interface
 */
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  createdAt: Date;
}

interface NotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  defaultDuration?: number;
  containerClassName?: string;
}

// Component for the actual notification system
export function NotificationSystem({
  position = 'bottom-right',
  maxNotifications = 5,
  defaultDuration = 5000,
  containerClassName = ''
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { subscribe, status } = useWebSocket();
  const prefersReducedMotion = useReducedMotion();
  
  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };
  
  // Add a notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    setNotifications(prev => {
      // Generate ID
      const id = Math.random().toString(36).substring(2, 9);
      
      // Add new notification
      const newNotifications = [
        {
          ...notification,
          id,
          createdAt: new Date(),
          autoClose: notification.autoClose === undefined ? true : notification.autoClose,
          duration: notification.duration || defaultDuration
        },
        ...prev
      ];
      
      // Limit number of notifications
      return newNotifications.slice(0, maxNotifications);
    });
  }, [maxNotifications, defaultDuration]);
  
  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  // Handle auto-close for notifications
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    notifications.forEach(notification => {
      if (notification.autoClose) {
        const timeout = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
        
        timeouts.push(timeout);
      }
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [notifications, removeNotification]);
  
  // Subscribe to WebSocket events
  useEffect(() => {
    if (status.state !== 'connected') return;
    
    // Achievement unlocked notification
    const achievementSub = subscribe('achievement.unlocked', (message) => {
      const achievement = message.payload?.achievement;
      const pointsAwarded = message.payload?.pointsAwarded;
      
      if (achievement) {
        addNotification({
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: `${achievement.name}${pointsAwarded ? ` (+${pointsAwarded} points)` : ''}`,
          duration: 8000 // Longer duration for achievements
        });
      }
    });
    
    // Points awarded notification
    const pointsSub = subscribe('points.awarded', (message) => {
      const amount = message.payload?.amount;
      const source = message.payload?.source;
      
      if (amount > 0) {
        addNotification({
          type: 'points',
          title: 'Points Awarded',
          message: `You earned ${amount} points${source ? ` from ${formatSource(source)}` : ''}`,
          duration: 4000
        });
      }
    });
    
    // Level up notification
    const levelSub = subscribe('user.levelUp', (message) => {
      const newLevel = message.payload?.newLevel;
      
      if (newLevel) {
        addNotification({
          type: 'level',
          title: 'Level Up!',
          message: `You've reached level ${newLevel}`,
          duration: 6000
        });
      }
    });
    
    // New comment notification
    const commentSub = subscribe('content.commented', (message) => {
      const comment = message.payload?.comment;
      
      if (comment) {
        addNotification({
          type: 'comment',
          title: 'New Comment',
          message: `${comment.authorName || 'Someone'} commented on your post`,
          duration: 5000
        });
      }
    });
    
    // React to content notification
    const reactSub = subscribe('content.reaction', (message) => {
      const reaction = message.payload?.reaction;
      const actorName = message.payload?.actorName;
      
      if (reaction) {
        addNotification({
          type: 'like',
          title: 'New Reaction',
          message: `${actorName || 'Someone'} reacted to your post`,
          duration: 4000
        });
      }
    });
    
    // Wallet connected notification
    const walletSub = subscribe('wallet.connected', (message) => {
      addNotification({
        type: 'wallet',
        title: 'Wallet Connected',
        message: 'Your wallet has been successfully connected',
        duration: 5000
      });
    });
    
    // Error notification
    const errorSub = subscribe('error', (message) => {
      const errorMessage = message.payload?.message;
      
      if (errorMessage) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          duration: 8000 // Longer duration for errors
        });
      }
    });
    
    // Cleanup subscriptions
    return () => {
      achievementSub();
      pointsSub();
      levelSub();
      commentSub();
      reactSub();
      walletSub();
      errorSub();
    };
  }, [status.state, subscribe, addNotification]);
  
  // Format source for points notifications
  const formatSource = (source: string): string => {
    return source
      .replace(/_/g, ' ')
      .replace(/\./g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div 
      className={`fixed z-50 flex flex-col gap-2 max-w-md w-full ${positionClasses[position]} ${containerClassName}`}
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={prefersReducedMotion ? 
              { opacity: 0 } : 
              position.includes('right') ? 
                { opacity: 0, x: 20 } : 
                { opacity: 0, x: -20 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? 
              { opacity: 0 } : 
              position.includes('right') ? 
                { opacity: 0, x: 20 } : 
                { opacity: 0, x: -20 }
            }
            transition={{ duration: 0.2 }}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 overflow-hidden ${getNotificationBorderColor(notification.type)}`}
          >
            <div className="p-4 flex items-start gap-3">
              <div className={`flex-shrink-0 p-1 rounded-full ${getNotificationBgColor(notification.type)}`}>
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {notification.message}
                </p>
              </div>
              
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {notification.autoClose && (
              <div 
                className="h-1 bg-blue-100 dark:bg-blue-900"
                style={{
                  width: '100%',
                  animation: `notification-timer ${notification.duration}ms linear forwards`
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      <style jsx>{`
        @keyframes notification-timer {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Return appropriate icon based on notification type
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'success':
      return <Check className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'achievement':
      return <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    case 'points':
      return <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    case 'level':
      return <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    case 'comment':
      return <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'like':
      return <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'wallet':
      return <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />;
    default:
      return <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
  }
}

// Return appropriate border color based on notification type
function getNotificationBorderColor(type: NotificationType): string {
  switch (type) {
    case 'success':
      return 'border-green-500';
    case 'error':
      return 'border-red-500';
    case 'warning':
      return 'border-yellow-500';
    case 'info':
      return 'border-blue-500';
    case 'achievement':
      return 'border-purple-500';
    case 'points':
      return 'border-yellow-500';
    case 'level':
      return 'border-amber-500';
    case 'comment':
      return 'border-blue-500';
    case 'like':
      return 'border-red-500';
    case 'wallet':
      return 'border-green-500';
    default:
      return 'border-blue-500';
  }
}

// Return appropriate background color based on notification type
function getNotificationBgColor(type: NotificationType): string {
  switch (type) {
    case 'success':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'error':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'warning':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'info':
      return 'bg-blue-100 dark:bg-blue-900/30';
    case 'achievement':
      return 'bg-purple-100 dark:bg-purple-900/30';
    case 'points':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'level':
      return 'bg-amber-100 dark:bg-amber-900/30';
    case 'comment':
      return 'bg-blue-100 dark:bg-blue-900/30';
    case 'like':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'wallet':
      return 'bg-green-100 dark:bg-green-900/30';
    default:
      return 'bg-blue-100 dark:bg-blue-900/30';
  }
}
