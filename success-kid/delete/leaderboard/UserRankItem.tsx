'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn, formatCompactNumber } from '@/lib/utils';
import { PositionChange } from './PositionChange';
import { RankedUser } from '@/types/leaderboard';
import { useReducedMotion } from '@/hooks';

export interface UserRankItemProps {
  user: RankedUser;
  isCurrentUser?: boolean;
  showChange?: boolean;
  onSelect?: () => void;
  className?: string;
}

export const UserRankItem: React.FC<UserRankItemProps> = ({
  user,
  isCurrentUser = false,
  showChange = true,
  onSelect,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const {
    rank,
    username,
    displayName,
    avatarUrl,
    level,
    score,
    change,
    badges = [],
  } = user;
  
  const handleClick = () => {
    if (onSelect) {
      onSelect();
    }
  };
  
  return (
    <motion.div
      initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-center p-3 rounded-lg',
        isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'hover:bg-neutral-100',
        onSelect && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      {/* Rank */}
      <div className="flex items-center justify-center w-8 mr-3">
        <span className={cn(
          'text-lg font-bold',
          isCurrentUser ? 'text-primary' : 'text-neutral-700'
        )}>
          {rank}
        </span>
      </div>
      
      {/* User info */}
      <div className="flex-shrink-0 relative mr-3">
        <img
          src={avatarUrl || '/images/avatars/default.png'}
          alt={`${displayName}'s avatar`}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="absolute -bottom-1 -right-1 bg-secondary text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
          {level}
        </div>
      </div>
      
      {/* User details */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center">
          <h3 className={cn(
            'font-semibold truncate',
            isCurrentUser ? 'text-primary' : 'text-neutral-900'
          )}>
            {displayName}
          </h3>
          {badges.length > 0 && (
            <div className="ml-2 flex space-x-1">
              {badges.slice(0, 2).map((badge) => (
                <Badge key={badge} variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              ))}
              {badges.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{badges.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-neutral-500 truncate">@{username}</p>
      </div>
      
      {/* Score and change */}
      <div className="flex flex-col items-end ml-3">
        <span className="font-mono font-bold text-neutral-800">
          {formatCompactNumber(score)}
        </span>
        
        {showChange && change !== undefined && (
          <PositionChange
            currentPosition={rank}
            previousPosition={rank + change}
            size="sm"
          />
        )}
      </div>
    </motion.div>
  );
};
