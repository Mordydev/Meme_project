'use client';

import React from 'react';
import Image from 'next/image';

/**
 * Props for LevelBadge component
 */
interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  badgeUrl?: string;
  className?: string;
}

/**
 * Level badge component
 * Displays the user's level in a stylized badge
 */
export function LevelBadge({
  level,
  size = 'md',
  showLabel = true,
  badgeUrl,
  className = '',
}: LevelBadgeProps) {
  // Size classes
  const sizeConfig = {
    sm: {
      container: 'h-6 w-6 text-xs',
      withLabel: 'px-1.5',
    },
    md: {
      container: 'h-8 w-8 text-sm',
      withLabel: 'px-2',
    },
    lg: {
      container: 'h-10 w-10 text-base',
      withLabel: 'px-2.5',
    },
  };

  // If we have a custom badge URL, show the image
  if (badgeUrl) {
    const badgeSize = size === 'sm' ? 24 : size === 'md' ? 32 : 40;
    
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <div className="relative">
          <Image
            src={badgeUrl}
            alt={`Level ${level}`}
            width={badgeSize}
            height={badgeSize}
            className="object-contain"
          />
          
          {/* Level overlay */}
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
            {level}
          </div>
        </div>
        
        {showLabel && (
          <span className="ml-1.5 font-medium text-neutral-700 text-sm">
            Level {level}
          </span>
        )}
      </div>
    );
  }

  // Default styled badge
  return (
    <div className={`inline-flex items-center ${className}`}>
      <div
        className={`
          ${sizeConfig[size].container}
          rounded-full bg-primary-500 text-white font-bold 
          flex items-center justify-center
          ${showLabel ? 'rounded-r-none' : ''}
        `}
      >
        {level}
      </div>
      
      {showLabel && (
        <div
          className={`
            ${sizeConfig[size].withLabel}
            h-full bg-primary-100 text-primary-800 font-medium 
            rounded-r-full flex items-center
          `}
        >
          Level {level}
        </div>
      )}
    </div>
  );
}
