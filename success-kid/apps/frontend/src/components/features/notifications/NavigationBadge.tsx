/**
 * Navigation Badge Component
 * Displays notification indicators within navigation elements
 */
'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/types';

// Navigation badge props
interface NavigationBadgeProps {
  type?: NotificationType; // Notification category to display count for
  showZero?: boolean;      // Whether to show badge when count is zero
  max?: number;            // Maximum count to display before showing +
  variant?: 'dot' | 'count' | 'pulse'; // Visual style of badge
  size?: 'sm' | 'md' | 'lg'; // Badge size
  className?: string;      // Additional CSS classes
}

/**
 * Get badge variant based on notification type
 */
const getBadgeVariant = (type: NotificationType) => {
  switch (type) {
    case 'achievement':
      return 'success';
    case 'market':
      return 'secondary';
    case 'system':
      return 'info';
    case 'points':
      return 'success';
    case 'social':
      return 'primary';
    case 'content':
      return 'default';
    case 'all':
    default:
      return 'primary';
  }
};

/**
 * Navigation Badge Component
 */
export function NavigationBadge({
  type = 'all',
  showZero = false,
  max = 99,
  variant = 'count',
  size = 'md',
  className = ''
}: NavigationBadgeProps) {
  const { getUnreadCount } = useNotifications();
  const prevCount = useRef<number>(0);
  const unreadCount = getUnreadCount(type);
  
  // Track previous count for animation
  useEffect(() => {
    prevCount.current = unreadCount;
  }, [unreadCount]);
  
  // Don't render if count is zero and showZero is false
  if (unreadCount === 0 && !showZero) {
    return null;
  }
  
  // Determine badge variant based on notification type
  const badgeVariant = getBadgeVariant(type);
  
  // Render dot variant
  if (variant === 'dot') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Badge
          variant={badgeVariant}
          dot={true}
          size={size}
          className={className}
          animate={true}
        />
      </motion.div>
    );
  }
  
  // Render pulse variant
  if (variant === 'pulse') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Badge
          variant={badgeVariant}
          dot={true}
          size={size}
          className={className}
          pulse={true}
        />
      </motion.div>
    );
  }
  
  // Render count variant
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={unreadCount}
        initial={prevCount.current < unreadCount ? { scale: 0.8, opacity: 0 } : {}}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
      >
        <Badge
          variant={badgeVariant}
          count={unreadCount}
          max={max}
          size={size}
          className={className}
          animate={true}
        />
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Category-specific Navigation Badge
 * Displays notification count for a specific category
 */
export function CategoryBadge({
  category,
  size = 'sm',
  className = ''
}: {
  category: Exclude<NotificationType, 'all'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <NavigationBadge
      type={category}
      size={size}
      className={className}
    />
  );
}

/**
 * Global Navigation Badge
 * Displays total unread count for all notifications
 */
export function GlobalBadge({
  size = 'md',
  variant = 'count',
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dot' | 'count' | 'pulse';
  className?: string;
}) {
  return (
    <NavigationBadge
      type="all"
      size={size}
      variant={variant}
      className={className}
    />
  );
}

export default NavigationBadge;
