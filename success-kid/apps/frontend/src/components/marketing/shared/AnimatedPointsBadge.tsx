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
      className={`inline-flex items-center rounded-full ${sizeClasses[size]} ${getVariantClasses()} ${className} relative overflow-hidden group`}
      whileHover={{
        scale: 1.05,
        boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Subtle gradient animation inside the badge */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-primary-200/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear', repeatDelay: 1 }}
        style={{ opacity: 0.5 }}
      />
      
      {icon && (
        <motion.span 
          className="mr-1"
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.span>
      )}
      <span className="mr-2 text-gray-700">{label}</span>
      <motion.span 
        className={`font-semibold ${pointsColor} flex items-center`}
        whileHover={{
          scale: 1.1,
          transition: { duration: 0.2 }
        }}
      >
        <span className="mr-0.5">+</span>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: delay + 0.3, duration: 0.3 }
          }}
        >
          {points}
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { delay: delay + 0.5, duration: 0.3 }
          }}
          className="ml-1"
        >
          SP
        </motion.span>
      </motion.span>
    </motion.div>
  );
}

export default AnimatedPointsBadge;
