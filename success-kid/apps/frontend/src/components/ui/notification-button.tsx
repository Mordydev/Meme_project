'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BadgeIndicator } from './badge-indicator';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';

interface NotificationButtonProps {
  className?: string;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({
  className,
}) => {
  const unread = useNotificationStore(state => state.unread);
  const openModal = useUIStore(state => state.openModal);
  
  const handleClick = () => {
    openModal('notification-center');
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full',
        className
      )}
      aria-label={`Notifications ${unread > 0 ? `(${unread} unread)` : ''}`}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        whileTap={{ scale: 0.9 }}
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
      </motion.svg>
      {unread > 0 && (
        <BadgeIndicator
          count={unread}
          color="primary"
          className="ring-2 ring-white dark:ring-neutral-900"
        />
      )}
    </button>
  );
};

export default NotificationButton;
