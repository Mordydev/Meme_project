'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/store/useNotificationStore';

interface NotificationItemProps {
  notification: Notification;
  isSelected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  isSelected = false,
  onSelect,
  onClick,
}) => {
  const router = useRouter();
  
  // Format the creation time relative to now
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    includeSeconds: true,
  });
  
  // Handle action click
  const handleActionClick = (action: string, url?: string) => {
    if (url) {
      // Navigate to the URL
      router.push(url);
    }
    
    // Mark as read
    if (onClick) {
      onClick();
    }
  };
  
  // Get the icon based on notification type
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'achievement':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100 text-success-600 dark:bg-success-800/20 dark:text-success-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
          </div>
        );
      case 'social':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 text-secondary-600 dark:bg-secondary-800/20 dark:text-secondary-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
        );
      case 'content':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-800/20 dark:text-primary-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        );
      case 'market':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-800/20 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800/40 dark:text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800/40 dark:text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        );
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative flex cursor-pointer items-start gap-3 rounded-md p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
        notification.read ? 'bg-white dark:bg-neutral-800' : 'bg-primary-50 dark:bg-primary-900/10'
      }`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      {/* Checkbox for selection */}
      <div className="absolute right-3 top-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-600 dark:focus:ring-primary-400"
          aria-label={`Select notification: ${notification.title}`}
        />
      </div>
      
      {/* Icon */}
      {getTypeIcon()}
      
      {/* Content */}
      <div className="flex-1 pr-6">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
          {notification.title}
        </h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {notification.message}
        </p>
        
        {/* Actions */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="mt-2 flex gap-2">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30"
                onClick={(e) => {
                  e.stopPropagation();
                  handleActionClick(action.action, action.url);
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        
        {/* Timestamp */}
        <div className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          {timeAgo}
        </div>
      </div>
      
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute right-8 top-3.5 h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-400" />
      )}
    </motion.div>
  );
};

export default NotificationItem;
