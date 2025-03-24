'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedBadgeProps {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  animate?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'alert' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * AnimatedBadge - Notification counter with animations
 * 
 * @example
 * // Basic usage
 * <AnimatedBadge count={5} />
 * 
 * // Custom variant with unlimited count
 * <AnimatedBadge count={150} maxCount={999} variant="secondary" />
 */
export function AnimatedBadge({
  count = 0,
  maxCount = 99,
  showZero = false,
  animate = true,
  className,
  variant = 'alert',
  size = 'md',
}: AnimatedBadgeProps) {
  const [prevCount, setPrevCount] = useState(count);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Determine if we should display the badge
  const shouldDisplay = count > 0 || showZero;
  
  // Format the count with max limit
  const formattedCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  // Check if count has changed to trigger animation
  useEffect(() => {
    if (count !== prevCount) {
      setShouldAnimate(true);
      setPrevCount(count);
      
      // Reset animation flag after animation completes
      const timeout = setTimeout(() => {
        setShouldAnimate(false);
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [count, prevCount]);
  
  // Determine variant styling
  const variantClasses = {
    primary: 'bg-primary-500 text-white',
    secondary: 'bg-secondary-500 text-black',
    accent: 'bg-accent-500 text-white',
    alert: 'bg-alert-500 text-white',
    neutral: 'bg-neutral-500 text-white',
  };
  
  // Determine size styling
  const sizeClasses = {
    sm: 'min-w-4 h-4 text-[10px] px-1',
    md: 'min-w-5 h-5 text-xs px-1',
    lg: 'min-w-6 h-6 text-sm px-1.5',
  };
  
  // Skip animation for users who prefer reduced motion
  const shouldApplyAnimation = animate && !prefersReducedMotion && shouldAnimate;
  
  return (
    <AnimatePresence mode="wait">
      {shouldDisplay && (
        <motion.div
          key={`badge-${formattedCount}`}
          initial={animate ? { scale: 0.5, opacity: 0 } : undefined}
          animate={
            shouldApplyAnimation
              ? { 
                  scale: [0.5, 1.2, 1], 
                  opacity: 1 
                }
              : { scale: 1, opacity: 1 }
          }
          exit={{ scale: 0.5, opacity: 0 }}
          transition={
            shouldApplyAnimation
              ? { 
                  duration: 0.4, 
                  times: [0, 0.6, 1],
                  ease: [0.2, 0.9, 0.3, 1.3] 
                }
              : { duration: 0.2 }
          }
          className={cn(
            'flex items-center justify-center rounded-full font-semibold',
            variantClasses[variant],
            sizeClasses[size],
            className
          )}
        >
          {formattedCount}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
