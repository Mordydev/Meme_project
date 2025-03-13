'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardUser } from '@/types';
import { UserRankCard } from './UserRankCard';
import { Spinner } from '@/components/ui/Spinner';

interface RankingListProps {
  rankings: LeaderboardUser[];
  currentUserId?: string; // The current logged-in user ID for highlighting
  isLoading?: boolean;
  onUserSelect?: (userId: string) => void;
  className?: string;
}

/**
 * RankingList
 * 
 * Component to display an ordered list of users in a leaderboard format.
 */
export function RankingList({ 
  rankings, 
  currentUserId,
  isLoading = false,
  onUserSelect,
  className 
}: RankingListProps) {
  // Handle empty state or loading state
  if (isLoading) {
    return (
      <div className={cn("flex justify-center py-8", className)}>
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (rankings.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="text-4xl mb-4">🏆</div>
        <h3 className="text-lg font-medium">No rankings available</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          The leaderboard doesn't have any entries for this time period yet. Be the first to earn points!
        </p>
      </div>
    );
  }
  
  // Determine if we need zebra striping for the list
  const useZebraStriping = rankings.length > 5;
  
  return (
    <div className={cn("space-y-2", className)}>
      {rankings.map((user, index) => (
        <UserRankCard
          key={user.userId}
          user={user}
          isCurrentUser={user.userId === currentUserId}
          isEvenRow={useZebraStriping && index % 2 === 0}
          onClick={() => onUserSelect?.(user.userId)}
        />
      ))}
    </div>
  );
}
