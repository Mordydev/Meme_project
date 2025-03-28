'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LevelBadge } from './LevelBadge';

/**
 * Props for LevelProgressBar component
 */
interface LevelProgressBarProps {
  level: number;
  nextLevel: number;
  currentPoints: number;
  pointsForNextLevel: number;
  animate?: boolean;
  className?: string;
}

/**
 * Progress bar for tracking level advancement
 */
export function LevelProgressBar({
  level,
  nextLevel,
  currentPoints,
  pointsForNextLevel,
  animate = true,
  className = '',
}: LevelProgressBarProps) {
  // Calculate progress percentage
  const progress = Math.min(100, Math.max(0, (currentPoints / pointsForNextLevel) * 100));
  
  // Calculate points needed for next level
  const pointsNeeded = pointsForNextLevel - currentPoints;
  
  return (
    <div className={`w-full ${className}`}>
      {/* Level indicators */}
      <div className="flex justify-between mb-1">
        <LevelBadge level={level} size="sm" showLabel={false} />
        <LevelBadge level={nextLevel} size="sm" showLabel={false} />
      </div>
      
      {/* Progress bar */}
      <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary-500"
          style={{ width: `${progress}%` }}
          initial={animate ? { width: '0%' } : undefined}
          animate={animate ? { width: `${progress}%` } : undefined}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      
      {/* Progress information */}
      <div className="flex justify-between mt-1 text-xs text-neutral-600">
        <div>{currentPoints} points</div>
        <div>
          {pointsNeeded > 0 
            ? `${pointsNeeded} points to Level ${nextLevel}` 
            : `Ready for Level ${nextLevel}!`}
        </div>
      </div>
    </div>
  );
}
