'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePositionAnimation, useReducedMotion } from '@/hooks';

export interface PositionChangeProps {
  currentPosition: number;
  previousPosition?: number;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PositionChange: React.FC<PositionChangeProps> = ({
  currentPosition,
  previousPosition,
  showAnimation = true,
  size = 'md',
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const {
    isAnimating,
    improved,
    declined,
    noChange,
    positionChange,
    startAnimation,
  } = usePositionAnimation(currentPosition, previousPosition, {
    delayStart: true,
    animationDuration: 1000,
  });
  
  // Start animation when component mounts if animation is enabled
  useEffect(() => {
    if (showAnimation && !prefersReducedMotion) {
      startAnimation();
    }
  }, [showAnimation, prefersReducedMotion, startAnimation]);
  
  // Return null if no previous position
  if (previousPosition === undefined) {
    return null;
  }
  
  // Size-based styling
  const sizeClasses = {
    sm: 'h-5 text-xs',
    md: 'h-6 text-sm',
    lg: 'h-7 text-base',
  };
  
  // Icon size based on component size
  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  };
  
  // Position change color and icon
  const Icon = improved ? ChevronUp : declined ? ChevronDown : Minus;
  const colorClass = improved 
    ? 'text-success' 
    : declined 
      ? 'text-alert' 
      : 'text-neutral-500';
  
  // Format change display without sign
  const changeDisplay = Math.abs(positionChange);
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        sizeClasses[size],
        colorClass,
        className
      )}
      aria-label={improved 
        ? `Improved by ${changeDisplay} positions` 
        : declined 
          ? `Declined by ${changeDisplay} positions` 
          : 'No change in position'
      }
    >
      <Icon size={iconSize[size]} className="flex-shrink-0" />
      
      {!noChange && (
        <span className="font-mono">
          {showAnimation && !prefersReducedMotion && isAnimating ? (
            <motion.span
              initial={{ opacity: 0, y: improved ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {changeDisplay}
            </motion.span>
          ) : (
            changeDisplay
          )}
        </span>
      )}
    </div>
  );
};
