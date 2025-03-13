'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardUser } from '@/types';
import { Card } from '@/components/ui/card';
import { LevelBadge } from '../levels';
import Image from 'next/image';

interface UserRankCardProps {
  user: LeaderboardUser;
  isCurrentUser?: boolean;
  isEvenRow?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * UserRankCard
 * 
 * Component to display a single user's ranking in the leaderboard.
 */
export function UserRankCard({ 
  user, 
  isCurrentUser = false,
  isEvenRow = false,
  onClick,
  className 
}: UserRankCardProps) {
  
  // Render position change indicator
  const renderPositionChange = () => {
    if (!user.change) return null;
    
    if (user.change > 0) {
      return (
        <div className="flex items-center text-green-500 text-xs font-medium">
          <svg className="w-4 h-4 mr-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5L12 19M12 5L19 12M12 5L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{user.change}</span>
        </div>
      );
    }
    
    if (user.change < 0) {
      return (
        <div className="flex items-center text-red-500 text-xs font-medium">
          <svg className="w-4 h-4 mr-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 19L12 5M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{Math.abs(user.change)}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-gray-400 text-xs">
        <svg className="w-4 h-4 mr-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12H19M5 12H7M19 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>0</span>
      </div>
    );
  };
  
  // Get rank label CSS based on position
  const getRankLabelCSS = () => {
    if (user.rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (user.rank === 2) return 'bg-gray-100 text-gray-800';
    if (user.rank === 3) return 'bg-amber-100 text-amber-800';
    return 'bg-muted text-muted-foreground';
  };
  
  return (
    <Card
      className={cn(
        "p-3 transition-colors",
        isCurrentUser ? "bg-primary/5 border-primary/20" : isEvenRow ? "bg-muted/30" : "",
        "hover:bg-primary/5 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center">
        {/* Rank & Position Change */}
        <div className="flex flex-col items-center mr-3">
          <div className={cn(
            "w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold",
            getRankLabelCSS()
          )}>
            {user.rank}
          </div>
          <div className="mt-1">
            {renderPositionChange()}
          </div>
        </div>
        
        {/* Avatar & User Info */}
        <div className="flex items-center flex-1">
          <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="font-semibold truncate">
                {user.displayName}
              </span>
              {isCurrentUser && (
                <span className="ml-2 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                  You
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              @{user.username}
            </div>
          </div>
        </div>
        
        {/* Level & Score */}
        <div className="flex items-center">
          <div className="flex flex-col items-end mr-4 text-right">
            <span className="font-bold">{user.score.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">points</span>
          </div>
          
          <LevelBadge level={user.level} size="sm" showLabel={false} />
        </div>
      </div>
    </Card>
  );
}
