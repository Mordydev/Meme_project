'use client';

import React from 'react';
import Image from 'next/image';
import { UserRanking } from '@/store/useLeaderboardStore';
import { LevelBadge } from './LevelBadge';

/**
 * Props for RankingList component
 */
interface RankingListProps {
  rankings: UserRanking[];
  currentUserId?: string;
  onUserSelect?: (userId: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Displays a list of ranked users in the leaderboard
 */
export function RankingList({
  rankings,
  currentUserId,
  onUserSelect,
  isLoading = false,
  className = '',
}: RankingListProps) {
  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        {[...Array(5)].map((_, index) => (
          <div 
            key={index}
            className="flex items-center p-3 border-b border-neutral-100 animate-pulse"
          >
            <div className="w-8 h-6 bg-neutral-200 rounded mr-4"></div>
            <div className="w-10 h-10 bg-neutral-200 rounded-full mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-neutral-200 rounded w-1/5"></div>
            </div>
            <div className="h-6 bg-neutral-200 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  // If no rankings, show empty state
  if (rankings.length === 0) {
    return (
      <div className={`w-full text-center p-6 border rounded-lg ${className}`}>
        <div className="text-neutral-500">
          <p className="text-lg font-medium">No rankings available</p>
          <p className="mt-1">Check back soon for updated rankings</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {/* Leaderboard list */}
      <div className="border rounded-lg divide-y divide-neutral-100">
        {rankings.map((user) => (
          <UserRankCard
            key={user.userId}
            user={user}
            isCurrentUser={user.userId === currentUserId}
            onClick={onUserSelect ? () => onUserSelect(user.userId) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Props for UserRankCard component
 */
interface UserRankCardProps {
  user: UserRanking;
  isCurrentUser?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Card to display a single user in the rankings
 */
export function UserRankCard({
  user,
  isCurrentUser = false,
  onClick,
  className = '',
}: UserRankCardProps) {
  // Get appropriate rank badge background color
  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return 'bg-amber-100 text-amber-800'; // Gold
    if (rank === 2) return 'bg-neutral-200 text-neutral-800'; // Silver
    if (rank === 3) return 'bg-amber-700 text-amber-50'; // Bronze
    return 'bg-neutral-100 text-neutral-600'; // Default
  };

  // Format score based on value size
  const formatScore = (score: number): string => {
    if (score >= 1000000) {
      return `${(score / 1000000).toFixed(1)}M`;
    }
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}K`;
    }
    return score.toString();
  };

  // Position change indicator
  const PositionChange = ({ change }: { change?: number }) => {
    if (change === undefined || change === 0) {
      return (
        <span className="text-neutral-400 text-xs">
          <span className="inline-block w-4">−</span>
        </span>
      );
    }

    if (change > 0) {
      return (
        <span className="text-green-600 text-xs font-medium">
          <span className="inline-block w-4">↑{change}</span>
        </span>
      );
    }

    return (
      <span className="text-red-600 text-xs font-medium">
        <span className="inline-block w-4">↓{Math.abs(change)}</span>
      </span>
    );
  };

  return (
    <div
      className={`
        flex items-center p-3 transition-colors
        ${isCurrentUser ? 'bg-primary-50' : 'bg-white hover:bg-neutral-50'}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Rank */}
      <div className="flex items-center mr-3 w-14 justify-between">
        <div
          className={`
            w-8 h-6 flex items-center justify-center rounded 
            font-semibold text-sm ${getRankBadgeColor(user.rank)}
          `}
        >
          {user.rank}
        </div>
        <PositionChange change={user.change} />
      </div>

      {/* Avatar */}
      <div className="mr-3 relative">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.displayName}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* Rank 1-3 crown indicator */}
        {user.rank <= 3 && (
          <div className="absolute -top-1 -right-1">
            {user.rank === 1 && (
              <span className="text-lg">👑</span>
            )}
            {user.rank === 2 && (
              <span className="text-lg">🥈</span>
            )}
            {user.rank === 3 && (
              <span className="text-lg">🥉</span>
            )}
          </div>
        )}
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <p className="font-medium text-neutral-900 truncate">
            {user.displayName}
          </p>
          {isCurrentUser && (
            <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
        <div className="flex items-center text-sm text-neutral-500">
          <span className="truncate">@{user.username}</span>
          <span className="mx-1">•</span>
          <LevelBadge level={user.level} size="sm" showLabel={false} />
        </div>
      </div>

      {/* Score */}
      <div className="font-bold text-primary-600 text-lg min-w-16 text-right">
        {formatScore(user.score)}
      </div>
    </div>
  );
}

/**
 * Props for UserRankHighlight component
 */
interface UserRankHighlightProps {
  userRank: {
    rank: number;
    score: number;
    change?: number;
  } | null;
  className?: string;
}

/**
 * Highlighted section showing current user's rank in leaderboard
 */
export function UserRankHighlight({
  userRank,
  className = '',
}: UserRankHighlightProps) {
  if (!userRank) {
    return null;
  }

  // Format position text
  const getPositionText = (rank: number): string => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  return (
    <div className={`bg-primary-50 border border-primary-100 rounded-lg p-4 ${className}`}>
      <h3 className="text-primary-800 font-medium text-sm mb-1">Your Position</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-primary-700">{getPositionText(userRank.rank)}</span>
          <span className="ml-2 text-sm text-primary-600">place</span>
        </div>
        <div className="flex items-center">
          <span className="font-bold text-primary-700 text-lg mr-2">{userRank.score}</span>
          
          {/* Position change indicator */}
          {userRank.change !== undefined && (
            <div
              className={`
                flex items-center text-sm font-medium px-2 py-0.5 rounded-full
                ${userRank.change > 0 
                  ? 'bg-green-100 text-green-800' 
                  : userRank.change < 0 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-neutral-100 text-neutral-800'}
              `}
            >
              {userRank.change > 0 && (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="m18 15-6-6-6 6"></path>
                  </svg>
                  {userRank.change}
                </>
              )}
              {userRank.change < 0 && (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                  {Math.abs(userRank.change)}
                </>
              )}
              {userRank.change === 0 && (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M5 12h14"></path>
                  </svg>
                  No change
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
