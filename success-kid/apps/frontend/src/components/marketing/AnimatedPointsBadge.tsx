'use client';

import React from 'react';
import { motion } from 'framer-motion';
import tokens from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface AnimatedPointsBadgeProps {
  label: string;
  points: number;
  icon?: string;
  className?: string;
  delay?: number;
}

export function AnimatedPointsBadge({ 
  label, 
  points, 
  icon = '🏆', 
  className = '',
  delay = 0 
}: AnimatedPointsBadgeProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  
  // Animation variants
  const badgeVariants = {
    hidden: { 
      opacity: prefersReducedMotion ? 1 : 0, 
      y: prefersReducedMotion ? 0 : 20,
      scale: prefersReducedMotion ? 1 : 0.8
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.5,
        delay,
        ease: tokens.animation.easings.standard
      }
    }
  };
  
  // Special animation for the points number
  const numberVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3,
        delay: delay + 0.3,
        ease: tokens.animation.easings.emphatic
      }
    }
  };
  
  return (
    <motion.div
      className={`inline-flex items-center px-3 py-1 rounded-full bg-white shadow-md ${className}`}
      variants={badgeVariants}
      initial="hidden"
      animate="visible"
    >
      <span className="mr-2 text-lg">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}:</span>
      <motion.span
        className="ml-1 text-sm font-bold text-primary"
        variants={numberVariants}
        initial={prefersReducedMotion ? "visible" : "hidden"}
        animate="visible"
      >
        +{points} SP
      </motion.span>
    </motion.div>
  );
}
