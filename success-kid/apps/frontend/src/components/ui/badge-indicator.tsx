'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'dot' | 'pulse';

export interface BadgeIndicatorProps {
  count?: number;
  max?: number;
  showZero?: boolean;
  variant?: BadgeVariant;
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'alert';
}

export const BadgeIndicator: React.FC<BadgeIndicatorProps> = ({
  count = 0,
  max = 99,
  showZero = false,
  variant = 'default',
  className,
  color = 'primary',
}) => {
  const controls = useAnimation();
  const prevCount = useRef(count);
  
  // Apply animation when count changes
  useEffect(() => {
    if (count > 0 && count !== prevCount.current) {
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 }
      });
    }
    prevCount.current = count;
  }, [count, controls]);
  
  // Skip rendering if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }
  
  // Calculate display count
  const displayCount = count > max ? `${max}+` : count.toString();
  
  // Determine badge color
  const getBadgeColor = () => {
    switch (color) {
      case 'primary':
        return 'bg-primary-500 text-white';
      case 'secondary':
        return 'bg-secondary-500 text-black';
      case 'success':
        return 'bg-success-500 text-white';
      case 'alert':
        return 'bg-alert-500 text-white';
      default:
        return 'bg-primary-500 text-white';
    }
  };
  
  // Render based on variant
  switch (variant) {
    case 'dot':
      return (
        <motion.span
          animate={controls}
          className={cn(
            'absolute right-0 top-0 h-2.5 w-2.5 rounded-full',
            getBadgeColor(),
            className
          )}
          aria-hidden="true"
        />
      );
      
    case 'pulse':
      return (
        <motion.span
          animate={controls}
          className={cn(
            'absolute right-0 top-0 h-2.5 w-2.5 rounded-full',
            getBadgeColor(),
            className
          )}
          aria-hidden="true"
        >
          <span className="absolute h-full w-full rounded-full bg-inherit opacity-75 animate-ping" />
        </motion.span>
      );
      
    default: // 'default' - shows the count
      return (
        <motion.span
          animate={controls}
          className={cn(
            'absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-medium',
            getBadgeColor(),
            className
          )}
          aria-label={`${count} notifications`}
        >
          {displayCount}
        </motion.span>
      );
  }
};

export default BadgeIndicator;
