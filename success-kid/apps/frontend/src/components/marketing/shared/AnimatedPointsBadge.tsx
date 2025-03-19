'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface AnimatedPointsBadgeProps {
  label: string;
  points: number;
  icon?: string;
  className?: string;
  delay?: number;
  variant?: 'default' | 'outline' | 'filled' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  animation?: 'drop' | 'scale' | 'slide' | 'none';
  pointsColor?: string;
}

export function AnimatedPointsBadge({
  label,
  points,
  icon = "🏆",
  className = '',
  delay = 0,
  variant = 'default',
  size = 'md',
  animation = 'drop',
  pointsColor = 'text-primary-500'
}: AnimatedPointsBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Size classes
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base"
  };
  
  // Variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return "bg-transparent border border-gray-200 text-gray-800";
      case 'filled':
        return "bg-primary-500/10 text-primary-500";
      case 'minimal':
        return "bg-transparent shadow-none";
      default: // default
        return "bg-white shadow-sm";
    }
  };
  
  // Animation variants
  const getAnimationProps = () => {
    // No animation for reduced motion preference
    if (prefersReducedMotion || animation === 'none') {
      return {};
    }
    
    switch (animation) {
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: {
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: delay
          }
        };
      case 'slide':
        return {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: {
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: delay
          }
        };
      default: // drop
        return {
          initial: { opacity: 0, y: -20, scale: 0.9 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: {
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: delay
          }
        };
    }
  };

  return (
    <motion.div
      {...getAnimationProps()}
      className={`inline-flex items-center rounded-full ${sizeClasses[size]} ${getVariantClasses()} ${className}`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      <span className="mr-2 text-gray-700">{label}</span>
      <span className={`font-semibold ${pointsColor}`}>+{points} SP</span>
    </motion.div>
  );
}

export default AnimatedPointsBadge;
