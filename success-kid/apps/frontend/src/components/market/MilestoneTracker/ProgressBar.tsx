'use client';

import React from 'react';
import { Milestone } from '@/types';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ProgressBarProps {
  current: number;
  target: number;
  milestones: Milestone[];
  className?: string;
}

/**
 * ProgressBar Component
 * 
 * Displays visual progress toward the next milestone.
 */
export default function ProgressBar({ current, target, milestones, className }: ProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Calculate percentage of progress to next milestone
  const calculateProgress = () => {
    // Find the previous milestone or start at 0
    const previousMilestone = [...milestones]
      .filter(m => m.value < current)
      .sort((a, b) => b.value - a.value)[0];
    
    const previousValue = previousMilestone?.value || 0;
    
    // Calculate progress percentage
    const range = target - previousValue;
    if (range <= 0) return 100; // Avoid division by zero
    
    const progress = ((current - previousValue) / range) * 100;
    return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
  };
  
  const progressPercentage = calculateProgress();

  return (
    <div className={`relative w-full h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden ${className || ''}`}>
      <motion.div 
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progressPercentage}%` }}
        transition={{ 
          duration: prefersReducedMotion ? 0 : 1, 
          ease: "easeOut"
        }}
      />
    </div>
  );
}
