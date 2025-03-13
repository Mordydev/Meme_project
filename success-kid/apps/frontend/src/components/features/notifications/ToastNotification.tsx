/**
 * Toast Notification Component
 * Displays non-intrusive, accessible toast notifications for immediate alerts
 */
'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Bell, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import { Notification, NotificationType } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

// Toast container props
interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  limit?: number;
}

// Toast notification props
interface ToastNotificationProps {
  notification: Notification;
  onDismiss: () => void;
}

/**
 * Get icon based on notification type
 */
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'achievement':
      return <CheckCircle className="w-5 h-5 text-success-500" />;
    case 'market':
      return <AlertTriangle className="w-5 h-5 text-secondary-500" />;
    case 'system':
      return <Info className="w-5 h-5 text-primary-500" />;
    case 'points':
      return <CheckCircle className="w-5 h-5 text-success-500" />;
    case 'social':
      return <Bell className="w-5 h-5 text-primary-500" />;
    case 'content':
      return <Bell className="w-5 h-5 text-neutral-500" />;
    default:
      return <Info className="w-5 h-5 text-neutral-500" />;
  }
};

/**
 * Get background color based on notification type
 */
const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'achievement':
      return 'bg-success-500/10 border-success-500 text-success-700';
    case 'market':
      return 'bg-secondary-500/10 border-secondary-500 text-secondary-700';
    case 'system':
      return 'bg-primary-500/10 border-primary-500 text-primary-700';
    case 'points':
      return 'bg-success-500/10 border-success-500 text-success-700';
    case 'social':
      return 'bg-primary-500/10 border-primary-500 text-primary-700';
    case 'content':
      return 'bg-neutral-500/10 border-neutral-500 text-neutral-700';
    default:
      return 'bg-neutral-500/10 border-neutral-500 text-neutral-700';
  }
};

/**
 * Individual Toast Notification Component
 */
export function ToastNotification({ notification, onDismiss }: ToastNotificationProps) {
  const { handleAction } = useNotifications();
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-dismiss after 5 seconds (or longer for important notifications)
  useEffect(() => {
    // Determine duration based on type (important notifications stay longer)
    const duration = notification.type === 'achievement' || notification.type === 'market' 
      ? 8000  // Important notifications stay longer
      : 5000; // Standard duration
      
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, duration);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [notification, onDismiss]);
  
  // Handle action click
  const handleActionClick = (index: number) => {
    // Clear auto-dismiss timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Mark as read and perform action
    const actionResult = handleAction(notification, index);
    if (actionResult?.url) {
      router.push(actionResult.url);
    }
    
    // Dismiss toast
    onDismiss();
  };
  
  // Handle toast click (navigates to first action if available)
  const handleToastClick = () => {
    if (notification.actions && notification.actions.length > 0) {
      handleActionClick(0);
    }
  };
  
  // Get color class based on notification type
  const colorClass = getNotificationColor(notification.type);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        type: 'spring',
        stiffness: 500,
        damping: 30 
      }}
      className={`flex items-start p-4 mb-3 border rounded-md shadow-md max-w-md width-full ${colorClass} backdrop-blur-md`}
      role="alert"
      aria-live="polite"
      onMouseEnter={() => {
        // Pause auto-dismiss on hover
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      }}
      onMouseLeave={() => {
        // Resume auto-dismiss on mouse leave
        timerRef.current = setTimeout(() => {
          onDismiss();
        }, 5000);
      }}
    >
      {/* Icon */}
      <div className="shrink-0 mr-3 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      
      {/* Content */}
      <div className="flex-1 mr-2">
        <h4 className="font-medium mb-1">{notification.title}</h4>
        <p className="text-sm opacity-90">{notification.message}</p>
        
        {/* Actions */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex mt-2 space-x-2">
            {notification.actions.map((action, index) => (
              <Button
                key={index}
                variant={index === 0 ? 'primary' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(index);
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {/* Close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/**
 * Toast Notification Container Component
 */
export function ToastContainer({ position = 'top-right', limit = 3 }: ToastContainerProps) {
  const { notifications, markAsRead } = useNotifications();
  
  // Get unread notifications (limited number)
  const unreadNotifications = notifications
    .filter(notification => !notification.read)
    .slice(0, limit);
  
  // Position classes based on container position
  const positionClasses = {
    'top-right': 'top-4 right-4 items-end',
    'top-left': 'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center'
  }[position];
  
  // Handle toast dismissal
  const handleDismiss = (id: string) => {
    markAsRead([id]);
  };
  
  return (
    <div
      className={`fixed z-50 flex flex-col ${positionClasses} pointer-events-none`}
      aria-live="polite"
      role="region"
      aria-label="Notification region"
    >
      <AnimatePresence mode="popLayout">
        {unreadNotifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto max-w-md w-full">
            <ToastNotification
              notification={notification}
              onDismiss={() => handleDismiss(notification.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
