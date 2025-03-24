'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MessagingButtonProps {
  variant?: 'default' | 'mobile' | 'compact';
  className?: string;
}

/**
 * Messaging Button Component
 * Displays a message icon with unread count and popover
 */
export function MessagingButton({
  variant = 'default',
  className = '',
}: MessagingButtonProps) {
  // State for popover visibility
  const [isOpen, setIsOpen] = useState(false);
  
  // Dummy data for messages - would come from an API in real implementation
  const unreadCount = 3;
  
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
    if (unreadCount === 0) {
      return 'No new messages';
    } else if (unreadCount === 1) {
      return '1 new message';
    } else {
      return `${unreadCount} new messages`;
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
          getVariantClasses(),
          className
        )}
        aria-label={getAriaLabel()}
      >
        <MessageSquare className="w-5 h-5" />
        
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1"
            >
              <Badge 
                variant="primary" 
                count={unreadCount} 
                max={99} 
                size="sm" 
                animate 
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {variant === 'mobile' && (
          <span className="ml-2 text-sm">Messages</span>
        )}
      </button>
    </div>
  );
}

// Create an index file for better imports
export default MessagingButton;