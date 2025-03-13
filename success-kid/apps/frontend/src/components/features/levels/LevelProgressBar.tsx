'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useLevelContext } from './LevelProvider';

interface LevelProgressBarProps {
  progress?: number;
  level?: number;
  nextLevel?: number;
  showLabels?: boolean;
  showPoints?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

/**
 * LevelProgressBar
 * 
 * Component to display progress toward the next level.
 * Can display current user's progress or a specific progress value.
 */
export function LevelProgressBar({
  progress,
  level,
  nextLevel,
  showLabels = true,
  showPoints = false,
  variant = 'default',
  className
}: LevelProgressBarProps) {
  // Get data from context if not provided
  const levelContext = useLevelContext();
  
  // Use provided values or get from context
  const displayProgress = progress !== undefined ? progress : levelContext.progress;
  const displayLevel = level !== undefined ? level : levelContext.level;
  const displayNextLevel = nextLevel !== undefined ? nextLevel : levelContext.level + 1;
  
  // Determine color based on progress
  const getProgressColor = () => {
    if (displayProgress < 30) return 'bg-primary/60';
    if (displayProgress < 70) return 'bg-primary';
    return 'bg-primary/90';
  };
  
  // Compact variant just shows the progress bar
  if (variant === 'compact') {
    return (
      <div className={cn("w-full", className)}>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={getProgressColor()}
            style={{ width: '0%' }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  }
  
  // Default variant with optional labels
  if (variant === 'default') {
    return (
      <div className={cn("w-full space-y-1.5", className)}>
        {showLabels && (
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Level {displayLevel}</span>
            <span>Level {displayNextLevel}</span>
          </div>
        )}
        
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", getProgressColor())}
            style={{ width: '0%' }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        
        {showPoints && (
          <div className="text-xs text-muted-foreground">
            <span>{levelContext.pointsToNextLevel.toLocaleString()} points to next level</span>
          </div>
        )}
      </div>
    );
  }
  
  // Detailed variant with current/next level details
  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="flex justify-between items-end">
        <div>
          <span className="text-sm text-muted-foreground">Current Level</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold">{displayLevel}</span>
            <span className="text-sm font-medium">{levelContext.title}</span>
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-sm text-muted-foreground">{displayProgress}% Complete</span>
          {showPoints && (
            <div className="text-sm">
              <span>{levelContext.pointsToNextLevel.toLocaleString()} points needed</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getProgressColor())}
          style={{ width: '0%' }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="font-medium">Level {displayLevel}</span>
        <span className="text-muted-foreground">Level {displayNextLevel}</span>
      </div>
    </div>
  );
}
