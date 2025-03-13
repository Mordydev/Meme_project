'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useLevelContext } from './LevelProvider';

interface LevelBadgeProps {
  level?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * LevelBadge
 * 
 * Component to display user level with an appropriate badge visualization.
 * Can display current user's level or a specific level.
 */
export function LevelBadge({
  level,
  size = 'md',
  showLabel = true,
  className
}: LevelBadgeProps) {
  // Get current user's level from context if no specific level is provided
  const levelContext = useLevelContext();
  
  // Use provided level or get from context
  const displayLevel = level || levelContext.level;
  const badgeUrl = level 
    ? `/images/levels/level-${Math.min(level, 10)}.svg` // Fallback for specific level
    : levelContext.badges.current;
  
  // Size mappings
  const sizeClasses = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-lg'
  };
  
  // Label position based on size
  const labelClasses = {
    xs: 'text-[8px] -mt-0.5',
    sm: 'text-xs -mt-1',
    md: 'text-sm -mt-1',
    lg: 'text-base'
  };
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn(
        "relative flex items-center justify-center rounded-full bg-primary/10",
        sizeClasses[size]
      )}>
        {badgeUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={badgeUrl}
              alt={`Level ${displayLevel}`}
              fill
              className="object-contain p-0.5"
            />
          </div>
        ) : (
          <span className="font-bold text-primary">{displayLevel}</span>
        )}
      </div>
      
      {showLabel && (
        <span className={cn(
          "font-medium text-muted-foreground",
          labelClasses[size]
        )}>
          Lvl {displayLevel}
        </span>
      )}
    </div>
  );
}
