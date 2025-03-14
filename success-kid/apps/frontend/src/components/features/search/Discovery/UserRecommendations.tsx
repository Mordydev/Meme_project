'use client';

import React from 'react';
import { useUserRecommendations } from '@/hooks/queries/useSearch';
import { UserSuggestion } from '@/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface UserRecommendationsProps {
  limit?: number;
  excludeFollowing?: boolean;
  showFollowButton?: boolean;
  className?: string;
}

export function UserRecommendations({
  limit = 5,
  excludeFollowing = true,
  showFollowButton = true,
  className,
}: UserRecommendationsProps) {
  const { data: users, isLoading, error, refetch } = useUserRecommendations({
    limit,
    excludeFollowing,
  });
  
  // Refetch recommendations
  const handleRefresh = () => {
    refetch();
  };
  
  // Map reason to friendly label
  const mapReasonToLabel = (reason: string, mutualConnections?: number): string => {
    switch (reason) {
      case 'similar_interests':
        return 'Similar interests';
      case 'popular':
        return 'Popular creator';
      case 'mutual_connections':
        return mutualConnections 
          ? `${mutualConnections} mutual connection${mutualConnections !== 1 ? 's' : ''}`
          : 'Mutual connections';
      default:
        return reason;
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-sm text-neutral-500 mt-1">Finding people to follow...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-neutral-500 mb-2">
          Unable to load recommendations
        </p>
        <button
          onClick={handleRefresh}
          className="text-primary hover:text-primary-dark text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!users || users.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <div className="rounded-full bg-neutral-100 w-10 h-10 flex items-center justify-center mx-auto mb-3">
          <UserIcon className="h-5 w-5 text-neutral-400" />
        </div>
        <p className="text-sm text-neutral-500">
          No recommendations available
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <h3 className="font-medium">People to Follow</h3>
        <button
          onClick={handleRefresh}
          className="text-xs text-primary hover:text-primary-dark"
        >
          Refresh
        </button>
      </div>
      
      <div className="divide-y divide-neutral-200">
        {users.map((user) => (
          <UserSuggestionCard
            key={user.id}
            user={user}
            showFollowButton={showFollowButton}
          />
        ))}
      </div>
      
      <Link
        href="/explore/people"
        className="block text-center text-sm text-primary hover:text-primary-dark font-medium"
      >
        See more suggestions
      </Link>
    </div>
  );
}

// User Suggestion Card Component
interface UserSuggestionCardProps {
  user: UserSuggestion;
  showFollowButton: boolean;
}

function UserSuggestionCard({
  user,
  showFollowButton,
}: UserSuggestionCardProps) {
  const [isFollowing, setIsFollowing] = React.useState(false);
  
  // Toggle follow status
  const toggleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFollowing(!isFollowing);
    // In a real implementation, this would make an API call
  };
  
  return (
    <div className="py-3">
      <Link
        href={`/profile/${user.id}`}
        className="flex items-center hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
      >
        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || user.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            (user.displayName || user.username).substring(0, 2).toUpperCase()
          )}
        </div>
        
        {/* User Info */}
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-neutral-900 truncate hover:text-primary transition-colors">
                {user.displayName || user.username}
              </h4>
              {user.displayName && (
                <p className="text-xs text-neutral-500 truncate">
                  @{user.username}
                </p>
              )}
            </div>
            
            {showFollowButton && (
              <button
                onClick={toggleFollow}
                className={cn(
                  "ml-3 px-3 py-1 rounded-full text-xs font-medium",
                  isFollowing
                    ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    : "bg-primary text-white hover:bg-primary-dark"
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          
          {/* Recommendation Reason */}
          <p className="text-xs text-neutral-500 mt-1">
            {mapReasonToLabel(user.reason, user.mutualConnections)}
            {user.followerCount > 0 && (
              <span className="ml-2">
                • {user.followerCount.toLocaleString()} follower{user.followerCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </Link>
    </div>
  );
}

// Icon component
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
