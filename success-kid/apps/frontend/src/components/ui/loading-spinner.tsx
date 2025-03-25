'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
  label?: string;
}

/**
 * LoadingSpinner - Animated loading indicator with consistent styling
 * Supports different sizes and colors with accessibility features
 */
export function LoadingSpinner({ 
  size = 'md',
  color = 'primary',
  className, 
  label = 'Loading' 
}: LoadingSpinnerProps) {
  // Map size to actual dimensions
  const sizeMap: Record<SpinnerSize, string> = {
    'xs': 'h-4 w-4 border-2',
    'sm': 'h-5 w-5 border-2',
    'md': 'h-8 w-8 border-2',
    'lg': 'h-12 w-12 border-3',
    'xl': 'h-16 w-16 border-4'
  };
  
  // Map color to Tailwind classes
  const colorMap: Record<string, string> = {
    'primary': 'border-primary',
    'secondary': 'border-secondary',
    'accent': 'border-accent',
    'white': 'border-white',
    'gray': 'border-gray-500',
  };
  
  const getColorClass = () => {
    return colorMap[color] || 'border-primary';
  };
  
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <motion.div
        className={cn(
          "rounded-full border-t-transparent",
          sizeMap[size],
          getColorClass()
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          ease: "linear",
          repeat: Infinity,
        }}
        aria-hidden="true"
      />
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

export default LoadingSpinner;