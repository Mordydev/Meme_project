'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CompetitionRanking } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { UserRankCard } from '../leaderboard/UserRankCard';

interface CompetitionLeaderboardProps {
  rankings: CompetitionRanking[];
  currentUserId?: string;
  currentUserRank?: number;
  isLoading?: boolean;
  onUserSelect?: (userId: string) => void;
  className?: string;
}

/**
 * CompetitionLeaderboard
 * 
 * Component to display competition rankings
 */
export function CompetitionLeaderboard({ 
  rankings, 
  currentUserId,
  currentUserRank,
  isLoading = false,
  onUserSelect,
  className 
}: CompetitionLeaderboardProps) {
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
        <h3 className="text-lg font-medium">No participants yet</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          The competition doesn't have any participants yet. Be the first to join!
        </p>
      </div>
    );
  }
  
  // Convert CompetitionRanking to LeaderboardUser format for UserRankCard
  const mapToLeaderboardUsers = rankings.map(ranking => ({
    rank: ranking.rank,
    userId: ranking.userId,
    username: ranking.username,
    displayName: ranking.displayName,
    avatarUrl: ranking.avatarUrl,
    level: 1, // Default level since we don't have this in CompetitionRanking
    score: ranking.score,
    change: 0 // Default change since we don't track this in competitions
  }));
  
  // Find current user in top rankings or create separate entry
  let currentUserInTopRankings = false;
  if (currentUserId) {
    currentUserInTopRankings = rankings.some(user => user.userId === currentUserId);
  }
  
  // Determine if we need zebra striping for the list
  const useZebraStriping = rankings.length > 5;
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        {/* Top Rankings */}
        {mapToLeaderboardUsers.map((user, index) => (
          <UserRankCard
            key={user.userId}
            user={user}
            isCurrentUser={user.userId === currentUserId}
            isEvenRow={useZebraStriping && index % 2 === 0}
            onClick={() => onUserSelect?.(user.userId)}
          />
        ))}
      </div>
      
      {/* Current User Ranking (if not in top) */}
      {!currentUserInTopRankings && currentUserRank && currentUserRank > rankings.length && (
        <>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">
                {currentUserRank - rankings.length} more participants
              </span>
            </div>
          </div>
          
          <UserRankCard
            user={{
              rank: currentUserRank,
              userId: 'current-user',
              username: 'currentuser',
              displayName: 'You',
              level: 1,
              score: 0, // This would be populated with actual score
              change: 0
            }}
            isCurrentUser={true}
            onClick={() => onUserSelect?.('current-user')}
          />
        </>
      )}
    </div>
  );
}
