'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Users,
  UserPlus,
  UserCheck,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

interface SuggestedUser {
  id: string;
  username: string;
  avatarUrl: string;
  reason: string;
  stats: {
    posts: number;
    followers: number;
  };
  isFollowing: boolean;
}

// Mock data for development
const mockSuggestedUsers: SuggestedUser[] = [
  {
    id: 'user1',
    username: 'crypto_enthusiast',
    avatarUrl: '/images/avatars/user1.png',
    reason: 'Popular in Token Talk',
    stats: { posts: 48, followers: 230 },
    isFollowing: false
  },
  {
    id: 'user2',
    username: 'success_kid_fan',
    avatarUrl: '/images/avatars/user2.png',
    reason: 'Creates top memes',
    stats: { posts: 86, followers: 412 },
    isFollowing: false
  },
  {
    id: 'user3',
    username: 'meme_creator',
    avatarUrl: '/images/avatars/user3.png',
    reason: 'Rising contributor',
    stats: { posts: 24, followers: 98 },
    isFollowing: false
  },
  {
    id: 'user4',
    username: 'token_holder',
    avatarUrl: '/images/avatars/user4.png',
    reason: 'Top contributor',
    stats: { posts: 142, followers: 567 },
    isFollowing: false
  },
];

interface UserSuggestionsProps {
  initialCount?: number;
  className?: string;
}

export function UserSuggestions({ 
  initialCount = 3,
  className 
}: UserSuggestionsProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load suggested users
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would be an API call
        // const response = await fetch('/api/user-suggestions');
        // const data = await response.json();
        
        // Using mock data for now
        setTimeout(() => {
          setUsers(mockSuggestedUsers);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        setIsLoading(false);
      }
    };
    
    fetchSuggestedUsers();
  }, []);
  
  // Handle follow/unfollow
  const handleFollowToggle = (userId: string) => {
    setUsers(currentUsers =>
      currentUsers.map(user => {
        if (user.id === userId) {
          const newIsFollowing = !user.isFollowing;
          
          // Show toast with points earned if following (not when unfollowing)
          if (newIsFollowing) {
            toast({
              title: "Points earned!",
              description: "You earned 10 Success Points for following a user",
              duration: 3000,
            });
          }
          
          return {
            ...user,
            isFollowing: newIsFollowing,
            stats: {
              ...user.stats,
              followers: user.isFollowing 
                ? user.stats.followers - 1 
                : user.stats.followers + 1
            }
          };
        }
        return user;
      })
    );
    
    // In a real implementation, this would make an API call to follow/unfollow
  };
  
  // Handle refresh suggestions
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // In a real implementation, this would be an API call with new suggestions
    setTimeout(() => {
      // For demo, shuffle the existing users and reset follow state
      const shuffled = [...mockSuggestedUsers]
        .sort(() => Math.random() - 0.5)
        .map(user => ({ ...user, isFollowing: false }));
      
      setUsers(shuffled);
      setIsRefreshing(false);
    }, 600);
  };
  
  // Handle show more/less
  const toggleShowMore = () => {
    if (visibleCount === initialCount) {
      setVisibleCount(users.length);
    } else {
      setVisibleCount(initialCount);
    }
  };
  
  // Visible users based on current count
  const visibleUsers = users.slice(0, visibleCount);
  const hasMore = users.length > visibleCount;
  const hasLess = visibleCount > initialCount;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span>Suggested Users</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            aria-label="Refresh suggestions"
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              (isLoading || isRefreshing) && "animate-spin"
            )} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          // Loading skeletons
          <div className="space-y-4">
            {Array.from({ length: initialCount }).map((_, i) => (
              <UserSuggestionSkeleton key={i} />
            ))}
          </div>
        ) : visibleUsers.length > 0 ? (
          // User suggestions list
          <div className="space-y-4">
            {visibleUsers.map(user => (
              <UserSuggestionCard
                key={user.id}
                user={user}
                onFollowToggle={() => handleFollowToggle(user.id)}
              />
            ))}
            
            {/* Show more/less button */}
            {(hasMore || hasLess) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={toggleShowMore}
              >
                {hasMore ? 'Show more' : 'Show less'}
                <ChevronRight className={cn(
                  "h-4 w-4 ml-1 transition-transform",
                  !hasMore && "rotate-90"
                )} />
              </Button>
            )}
          </div>
        ) : (
          // Empty state
          <div className="py-6 text-center text-muted-foreground">
            <p>No suggestions available</p>
            <Button 
              variant="link" 
              size="sm"
              onClick={handleRefresh}
            >
              Refresh suggestions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface UserSuggestionCardProps {
  user: SuggestedUser;
  onFollowToggle: () => void;
}

function UserSuggestionCard({ user, onFollowToggle }: UserSuggestionCardProps) {
  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <Link 
        href={`/profile/${user.username}`}
        className="flex-shrink-0"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.username}
            width={40}
            height={40}
            className="rounded-full h-10 w-10 object-cover"
          />
        ) : (
          <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center">
            <span className="text-primary font-medium text-lg">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </Link>
      
      {/* User info */}
      <div className="flex-1 min-w-0">
        <Link 
          href={`/profile/${user.username}`}
          className="font-medium hover:underline block truncate"
        >
          {user.username}
        </Link>
        
        <p className="text-xs text-muted-foreground">
          {user.reason}
        </p>
        
        <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>{user.stats.posts} posts</span>
          <span>{user.stats.followers} followers</span>
        </div>
      </div>
      
      {/* Follow button */}
      <Button
        variant={user.isFollowing ? "secondary" : "outline"}
        size="sm"
        className={cn(
          "h-8 px-2.5",
          user.isFollowing && "bg-secondary/30"
        )}
        onClick={onFollowToggle}
      >
        {user.isFollowing ? (
          <>
            <UserCheck className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Following</span>
          </>
        ) : (
          <>
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Follow</span>
          </>
        )}
      </Button>
    </div>
  );
}

function UserSuggestionSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      
      <div className="flex-1">
        <Skeleton className="h-4 w-28 mb-1.5" />
        <Skeleton className="h-3 w-24 mb-1" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      
      <Skeleton className="h-8 w-16 rounded-md flex-shrink-0" />
    </div>
  );
}
