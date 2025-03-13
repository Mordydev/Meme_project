/**
 * Notification Bell Component
 * Displays a bell icon with notification count and toggles notification center
 */
'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui';
import { NotificationCenter } from './NotificationCenter';

interface NotificationBellProps {
  variant?: 'default' | 'mobile' | 'compact';
  className?: string;
}

/**
 * Notification Bell Component
 */
export function NotificationBell({ 
  variant = 'default',
  className = '' 
}: NotificationBellProps) {
  // State for notification center visibility
  const [isOpen, setIsOpen] = useState(false);
  
  // Get notification data
  const { unread } = useNotifications();
  
  // Toggle notification center
  const toggleNotificationCenter = () => {
    setIsOpen(!isOpen);
  };
  
  // Get dynamic classes based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case 'mobile':
        return 'w-full flex items-center justify-center py-2';
      case 'compact':
        return 'w-8 h-8 flex items-center justify-center';
      default:
        return 'h-10 px-3 flex items-center';
    }
  };
  
  // Generate accessible label
  const getAriaLabel = () => {
    if (unread === 0) {
      return 'No new notifications';
    } else if (unread === 1) {
      return '1 new notification';
    } else {
      return `${unread} new notifications`;
    }
  };
  
  return (
    <>
      <button
        onClick={toggleNotificationCenter}
        className={`relative rounded-full hover:bg-neutral-100 transition-colors ${getVariantClasses()} ${className}`}
        aria-label={getAriaLabel()}
      >
        <Bell className="w-5 h-5" />
        
        <AnimatePresence>
          {unread > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0"
            >
              <Badge 
                variant="primary" 
                count={unread} 
                max={99} 
                size="sm" 
                animate 
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {variant === 'mobile' && (
          <span className="ml-2 text-sm">Notifications</span>
        )}
      </button>
      
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}

export default NotificationBell;
