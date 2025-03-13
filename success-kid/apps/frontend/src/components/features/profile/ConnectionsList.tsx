'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { UserProfile } from '@/store/useUserStore';
import Image from 'next/image';
import Link from 'next/link';

export type ConnectionType = 'followers' | 'following';

export interface ConnectionsListProps {
  userId: string;
  type: ConnectionType;
  onUserSelect?: (id: string) => void;
  className?: string;
}

/**
 * ConnectionsList - Display user connections with management options
 * 
 * @component
 * @param userId - User identifier for fetching connections
 * @param type - Connection type (followers or following)
 * @param onUserSelect - Handler for user selection
 * @param className - Additional CSS classes
 */
export function ConnectionsList({
  userId,
  type,
  onUserSelect,
  className
}: ConnectionsListProps) {
  const [connections, setConnections] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [followInProgress, setFollowInProgress] = useState<Record<string, boolean>>({});
  
  // Get display title based on connection type
  const getTitle = () => {
    return type === 'followers' ? 'People who follow you' : 'People you follow';
  };
  
  // Fetch connections (simulated)
  const fetchConnections = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would be an API call
      // Simulating network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data
      const mockConnections: UserProfile[] = [
        {
          id: 'user1',
          displayName: 'Alice Johnson',
          username: 'alicej',
          avatar: '/images/avatars/avatar1.png',
          level: 12,
          title: 'Content Creator',
          bio: 'Crypto enthusiast and blogger. I write about DeFi and NFTs.',
          joinedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'user2',
          displayName: 'Bob Smith',
          username: 'bobsmith',
          avatar: '/images/avatars/avatar2.png',
          level: 8,
          title: 'Community Contributor',
          bio: 'Web3 developer and tech enthusiast.',
          joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'user3',
          displayName: 'Carol Davis',
          username: 'carold',
          level: 15,
          title: 'Moderator',
          bio: 'Helping build this amazing community!',
          joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'user4',
          displayName: 'Dave Wilson',
          username: 'davew',
          avatar: '/images/avatars/avatar3.png',
          level: 5,
          bio: 'New to crypto but excited to learn and contribute.',
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'user5',
          displayName: 'Emma Lee',
          username: 'emmalee',
          level: 10,
          title: 'Token Holder',
          joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        }
      ];
      
      setConnections(mockConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Follow/unfollow user
  const toggleFollow = async (userId: string) => {
    setFollowInProgress(prev => ({
      ...prev,
      [userId]: true
    }));
    
    try {
      // In a real implementation, this would be an API call
      // Simulating network request
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Update local state optimistically
      // In a real implementation, this would be updated based on API response
      console.log('Toggle follow for user:', userId);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowInProgress(prev => ({
        ...prev,
        [userId]: false
      }));
    }
  };
  
  // Handle user selection
  const handleUserClick = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
  };
  
  // Filter connections based on search query
  const filteredConnections = connections.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Load connections on mount and when type changes
  useEffect(() => {
    fetchConnections();
  }, [type]);
  
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{getTitle()}</h2>
        
        {/* Search input */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-md pr-8"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      
      {/* Connections list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredConnections.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">
            {searchQuery ? 'No matching users found' : type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </h3>
          <p className="text-muted-foreground mt-2">
            {searchQuery 
              ? 'Try a different search term' 
              : type === 'followers' 
                ? 'As you engage with the community, users may follow you' 
                : 'Follow other users to see them here'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredConnections.map(user => (
            <UserCard
              key={user.id}
              user={user}
              isFollowing={type === 'following'} // In a real implementation, this would be actual follow status
              onToggleFollow={() => toggleFollow(user.id)}
              isFollowLoading={followInProgress[user.id] || false}
              onClick={() => handleUserClick(user.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UserCardProps {
  user: UserProfile;
  isFollowing?: boolean;
  isFollowLoading?: boolean;
  onToggleFollow: () => Promise<void>;
  onClick?: () => void;
  className?: string;
}

/**
 * UserCard - Individual user display with connection actions
 * 
 * @component
 * @param user - User profile data
 * @param isFollowing - Follow status
 * @param isFollowLoading - Follow action loading state
 * @param onToggleFollow - Follow toggle handler
 * @param onClick - Click handler
 * @param className - Additional CSS classes
 */
function UserCard({
  user,
  isFollowing = false,
  isFollowLoading = false,
  onToggleFollow,
  onClick,
  className
}: UserCardProps) {
  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleFollow();
  };
  
  // Format date to readable string (e.g., "Joined April 2023")
  const formatJoinDate = (date: Date) => {
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };
  
  // Create initials from display name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-md cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <Link href={`/profile/${user.username}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-md font-bold overflow-hidden">
              {user.avatar ? (
                <Image 
                  src={user.avatar} 
                  alt={`${user.displayName}'s avatar`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(user.displayName)
              )}
            </div>
            
            {/* User info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-medium text-sm md:text-base truncate">
                    {user.displayName}
                  </h4>
                  <p className="text-muted-foreground text-xs truncate">
                    @{user.username} • Level {user.level}
                  </p>
                </div>
                
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollowClick}
                  disabled={isFollowLoading}
                  className="flex-shrink-0"
                >
                  {isFollowLoading ? (
                    <Spinner size="sm" />
                  ) : isFollowing ? (
                    "Unfollow"
                  ) : (
                    "Follow"
                  )}
                </Button>
              </div>
              
              {/* Bio (if available) */}
              {user.bio && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {user.bio}
                </p>
              )}
              
              {/* User tags/badges */}
              {user.title && (
                <div className="mt-2">
                  <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                    {user.title}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
