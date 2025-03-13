import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui';

// Types
export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  level: number;
  isFollowing?: boolean;
}

interface ConnectionsListProps {
  userId: string;
  type: 'followers' | 'following';
  onUserSelect?: (id: string) => void;
  className?: string;
  connections?: UserProfile[];
  isLoading?: boolean;
}

interface UserCardProps {
  user: UserProfile;
  isFollowing: boolean;
  onFollow: () => Promise<void>;
}

// UserCard component
function UserCard({ user, isFollowing, onFollow }: UserCardProps) {
  const [followLoading, setFollowLoading] = useState(false);
  const [followState, setFollowState] = useState(isFollowing);
  
  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await onFollow();
      setFollowState(!followState);
    } finally {
      setFollowLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center">
        {/* Avatar */}
        <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted mr-3">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={`${user.displayName}'s avatar`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-lg font-bold">
              {user.displayName[0]}
            </div>
          )}
          
          {/* Level Badge */}
          <div className="absolute -bottom-1 -right-1 bg-secondary text-black text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center border border-white">
            {user.level}
          </div>
        </div>
        
        {/* User Info */}
        <div>
          <h3 className="font-medium">{user.displayName}</h3>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      
      {/* Follow Button */}
      <Button
        variant={followState ? "outline" : "default"}
        size="sm"
        onClick={handleFollow}
        disabled={followLoading}
      >
        {followLoading ? '...' : followState ? 'Following' : 'Follow'}
      </Button>
    </div>
  );
}

// Search and filter component
function ConnectionsFilter({ onSearch }: { onSearch: (term: string) => void }) {
  return (
    <div className="mb-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search connections..."
          className="w-full px-4 py-2 border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
          onChange={(e) => onSearch(e.target.value)}
        />
        <div className="absolute right-3 top-2.5 text-muted-foreground">
          🔍
        </div>
      </div>
    </div>
  );
}

// Empty state for when there are no connections
function EmptyState({ type }: { type: 'followers' | 'following' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <span className="text-4xl">👥</span>
      </div>
      <h3 className="text-lg font-medium mb-2">
        {type === 'followers' ? 'No Followers Yet' : 'Not Following Anyone Yet'}
      </h3>
      <p className="text-muted-foreground max-w-sm">
        {type === 'followers'
          ? 'Be active in the community to attract followers!'
          : 'Start following other users to see them here!'}
      </p>
    </div>
  );
}

// Main ConnectionsList component
export function ConnectionsList({
  userId,
  type,
  onUserSelect,
  className,
  connections = [],
  isLoading = false,
}: ConnectionsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data for development - would be replaced with actual API call
  const mockConnections: UserProfile[] = [
    {
      id: 'user1',
      displayName: 'Alice Cooper',
      username: 'alice',
      avatarUrl: '/images/avatars/alice.jpg',
      level: 6,
      isFollowing: true
    },
    {
      id: 'user2',
      displayName: 'Bob Smith',
      username: 'bobsmith',
      avatarUrl: '/images/avatars/bob.jpg',
      level: 4,
      isFollowing: false
    },
    {
      id: 'user3',
      displayName: 'Charlie Davis',
      username: 'charlie',
      avatarUrl: '/images/avatars/charlie.jpg',
      level: 8,
      isFollowing: true
    }
  ];
  
  // Use mock data for now - would be replaced with actual data
  const displayConnections = connections.length > 0 ? connections : mockConnections;
  
  // Filter connections based on search term
  const filteredConnections = displayConnections.filter(user => {
    if (!searchTerm) return true;
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(lowerCaseSearch) ||
      user.username.toLowerCase().includes(lowerCaseSearch)
    );
  });
  
  // Mock follow handler
  const handleFollow = async () => {
    // Simulate API call
    return new Promise<void>(resolve => {
      setTimeout(resolve, 500);
    });
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full py-8 flex justify-center">
        <div className="animate-pulse">Loading connections...</div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <ConnectionsFilter onSearch={setSearchTerm} />
      
      {filteredConnections.length === 0 ? (
        <EmptyState type={type} />
      ) : (
        <div className="space-y-3">
          {filteredConnections.map(user => (
            <UserCard
              key={user.id}
              user={user}
              isFollowing={user.isFollowing || false}
              onFollow={handleFollow}
            />
          ))}
        </div>
      )}
    </div>
  );
}
