'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { NotificationType } from '@/store/useNotificationStore';

interface NotificationEmptyStateProps {
  type: NotificationType;
}

const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({ type }) => {
  // Get empty state message based on notification type
  const getMessage = () => {
    switch (type) {
      case 'achievement':
        return "You haven't earned any achievements yet. Keep participating to unlock badges and rewards!";
      case 'social':
        return "You don't have any social notifications. Start connecting with other community members!";
      case 'content':
        return "No content notifications yet. Create and engage with posts to see updates here.";
      case 'market':
        return "No market updates to display. Connect your wallet and explore the marketplace!";
      case 'system':
        return "No system notifications at the moment. We'll notify you of important updates here.";
      default:
        return "Your notification inbox is empty. Start engaging with the community to see updates here!";
    }
  };
  
  // Get illustration based on notification type
  const getIllustration = () => {
    switch (type) {
      case 'achievement':
        return (
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" className="text-neutral-300 dark:text-neutral-600">
            <circle cx="12" cy="8" r="7" strokeWidth="1.5"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" strokeWidth="1.5"></polyline>
          </svg>
        );
      case 'social':
        return (
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" className="text-neutral-300 dark:text-neutral-600">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="1.5"></path>
            <circle cx="9" cy="7" r="4" strokeWidth="1.5"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="1.5"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="1.5"></path>
          </svg>
        );
      default:
        return (
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" className="text-neutral-300 dark:text-neutral-600">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="1.5"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="1.5"></path>
          </svg>
        );
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col items-center justify-center py-10 text-center"
    >
      <div className="mb-4 text-neutral-300 dark:text-neutral-600">
        {getIllustration()}
      </div>
      <h3 className="mb-2 text-lg font-medium text-neutral-900 dark:text-white">
        No notifications
      </h3>
      <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
        {getMessage()}
      </p>
    </motion.div>
  );
};

export default NotificationEmptyState;
