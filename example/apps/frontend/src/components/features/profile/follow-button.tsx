'use client';

import { Button } from '@/components/ui/button';
import { followUser, unfollowUser } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  className?: string;
}

export function FollowButton({
  userId,
  initialIsFollowing,
  className,
}: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
      }
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Failed to update follow status', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : 'primary'}
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
