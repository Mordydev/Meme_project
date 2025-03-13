'use client';

import React from 'react';
import Image from 'next/image';
import { Achievement } from '@/store/useAchievementStore';
import { ProgressRing } from './ProgressRing';

/**
 * Props for AchievementCard component
 */
interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Card to display an individual achievement with progress
 */
export function AchievementCard({
  achievement,
  isUnlocked,
  progress = 0,
  onClick,
  size = 'md',
  className = '',
}: AchievementCardProps) {
  // Size-based styles
  const sizeClasses = {
    sm: 'h-24 w-24 p-1',
    md: 'h-36 w-36 p-2',
    lg: 'h-48 w-48 p-3',
  };
  
  // Difficulty-based color
  const difficultyColors = {
    common: 'border-neutral-300 bg-neutral-50',
    uncommon: 'border-green-300 bg-green-50',
    rare: 'border-blue-300 bg-blue-50',
    epic: 'border-purple-300 bg-purple-50',
    legendary: 'border-amber-300 bg-amber-50',
  };
  
  // Badge size
  const badgeSize = {
    sm: 50,
    md: 80,
    lg: 100,
  };
  
  // Format date if available
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };
  
  return (
    <div 
      className={`
        relative rounded-lg 
        ${sizeClasses[size]} 
        ${difficultyColors[achievement.difficulty]} 
        border-2
        transition-all duration-300 ease-in-out
        ${isUnlocked ? 'shadow-md' : 'shadow-sm opacity-75'}
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Locked overlay for incomplete achievements */}
      {!isUnlocked && progress < 100 && (
        <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
          <ProgressRing
            progress={progress}
            size={size === 'sm' ? 60 : size === 'md' ? 90 : 120}
            strokeWidth={4}
            bgColor="rgba(0, 0, 0, 0.1)"
            fgColor="rgba(30, 136, 229, 0.8)"
          />
        </div>
      )}
      
      {/* Achievement badge/icon */}
      <div className="flex flex-col items-center justify-center h-full">
        <div className={`relative ${isUnlocked ? 'saturate-100' : 'saturate-0'}`}>
          <Image
            src={achievement.badgeUrl}
            alt={achievement.title}
            width={badgeSize[size]}
            height={badgeSize[size]}
            className="object-contain"
          />
        </div>
        
        {/* Title for medium and large sizes */}
        {size !== 'sm' && (
          <div className="text-center mt-2">
            <h3 className={`font-bold ${size === 'md' ? 'text-xs' : 'text-sm'} truncate max-w-full`}>
              {achievement.title}
            </h3>
            
            {/* Date display for unlocked achievements in large size */}
            {isUnlocked && size === 'lg' && (
              <p className="text-xs text-neutral-600 mt-1">
                {formatDate(achievement.unlockedAt)}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Progress percentage */}
      {!isUnlocked && progress > 0 && (
        <div className="absolute bottom-1 right-1 bg-white bg-opacity-90 rounded-full px-1 py-0.5 text-xs">
          {progress}%
        </div>
      )}
      
      {/* Difficulty badge */}
      {size === 'lg' && (
        <div className="absolute top-2 left-2">
          <span className={`
            text-xs px-1.5 py-0.5 rounded-full 
            ${achievement.difficulty === 'common' ? 'bg-neutral-200 text-neutral-800' : ''}
            ${achievement.difficulty === 'uncommon' ? 'bg-green-200 text-green-800' : ''}
            ${achievement.difficulty === 'rare' ? 'bg-blue-200 text-blue-800' : ''}
            ${achievement.difficulty === 'epic' ? 'bg-purple-200 text-purple-800' : ''}
            ${achievement.difficulty === 'legendary' ? 'bg-amber-200 text-amber-800' : ''}
          `}>
            {achievement.difficulty}
          </span>
        </div>
      )}
    </div>
  );
}
