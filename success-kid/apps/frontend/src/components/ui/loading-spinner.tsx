'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'white';
  thickness?: 'thin' | 'regular' | 'thick';
  withText?: boolean;
  text?: string;
  className?: string;
  centered?: boolean;
}

/**
 * LoadingSpinner - Professional animated loading indicator
 * 
 * @example
 * // Basic usage
 * <LoadingSpinner />
 * 
 * // Custom size and color
 * <LoadingSpinner size="lg" color="secondary" />
 * 
 * // With text
 * <LoadingSpinner withText text="Loading your dashboard..." />
 */
export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  thickness = 'regular',
  withText = false,
  text = 'Loading...',
  className,
  centered = false,
}: LoadingSpinnerProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Size mappings
  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  
  // Color mappings
  const colorMap = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    accent: 'text-accent-500',
    neutral: 'text-neutral-500',
    white: 'text-white',
  };
  
  // Thickness mappings
  const thicknessMap = {
    thin: 'border-2',
    regular: 'border-3',
    thick: 'border-4',
  };
  
  // Container class for centered option
  const containerClass = centered ? 'flex flex-col items-center justify-center' : '';
  
  return (
    <div className={cn(containerClass, withText ? 'space-y-2' : '', className)}>
      <motion.div
        className={cn(
          'rounded-full',
          'border-t-transparent',
          sizeMap[size],
          thicknessMap[thickness],
          colorMap[color]
        )}
        animate={{ 
          rotate: prefersReducedMotion ? 0 : 360,
        }}
        transition={{ 
          duration: prefersReducedMotion ? 0 : 1, 
          ease: "linear", 
          repeat: Infinity,
          repeatType: "loop"
        }}
        data-testid="loading-spinner"
      />
      
      {withText && (
        <div className={cn(
          'text-sm font-medium',
          colorMap[color] === 'text-white' ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'
        )}>
          {text}
        </div>
      )}
    </div>
  );
}
