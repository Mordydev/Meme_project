'use client';

import React from 'react';
import Link from 'next/link';
import { useUserRecommendations, UserSuggestion } from '@/hooks/search';
import { Spinner } from '@/components/ui/Spinner';

export interface UserRecommendationsProps {
  limit?: number;
  excludeFollowing?: boolean;
  onUserSelect?: (user: UserSuggestion) => void;
  className?: string;
}

export function UserRecommendations({
  limit = 5,
  excludeFollowing = false,
  onUserSelect,
  className = ''
}: UserRecommendationsProps) {
  const {
    userSuggestions,
    isLoading,
    error
  } = useUserRecommendations(limit, excludeFollowing);
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="sm" />
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="rounded-md bg-alert/10 p-3 text-alert text-sm">
        <p>Unable to load user recommendations</p>
      </div>
    );
  }
  
  // Handle empty state
  if (userSuggestions.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-background p-4 text-center text-sm text-neutral-500">
        <p>No user recommendations available</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {userSuggestions.map((user) => (
        <UserSuggestionItem
          key={user.id}
          user={user}
          onClick={onUserSelect ? () => onUserSelect(user) : undefined}
        />
      ))}
    </div>
  );
}

interface UserSuggestionItemProps {
  user: UserSuggestion;
  onClick?: () => void;
}

function UserSuggestionItem({ user, onClick }: UserSuggestionItemProps) {
  // Get reason tag based on recommendation reason
  const getReasonTag = () => {
    switch (user.reason) {
      case 'similar_interests':
        return (
          <span className="text-xs text-neutral-500">
            Similar interests
          </span>
        );
      case 'mutual_connections':
        return (
          <span className="text-xs text-neutral-500">
            {user.mutualConnections} mutual connection{user.mutualConnections !== 1 ? 's' : ''}
          </span>
        );
      case 'popular':
        return (
          <span className="text-xs text-neutral-500">
            Popular creator
          </span>
        );
      default:
        return null;
    }
  };
  
  const UserContent = () => (
    <div className="flex items-center">
      {/* User avatar */}
      <div className="mr-3 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-neutral-200">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary text-white">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{user.displayName}</div>
        <div className="text-sm text-neutral-500 truncate">@{user.username}</div>
      </div>
      
      {/* Follow/connection info */}
      <div className="ml-4 text-right">
        <div className="text-xs font-medium text-neutral-700">
          {user.followerCount.toLocaleString()} follower{user.followerCount !== 1 ? 's' : ''}
        </div>
        <div className="mt-1">{getReasonTag()}</div>
      </div>
    </div>
  );
  
  // Render as link or clickable div based on whether onClick is provided
  if (onClick) {
    return (
      <div
        className="cursor-pointer rounded-md border border-neutral-200 bg-background p-3 transition-colors hover:bg-neutral-50"
        onClick={onClick}
      >
        <UserContent />
      </div>
    );
  }
  
  return (
    <Link
      href={`/profile/${user.username}`}
      className="block rounded-md border border-neutral-200 bg-background p-3 transition-colors hover:bg-neutral-50"
    >
      <UserContent />
    </Link>
  );
}
