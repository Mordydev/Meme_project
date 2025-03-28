'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useFollowUser } from '@/hooks/profile/use-follow-user';

interface ProfileHeaderActionsProps {
  userId: string;
  isOwnProfile: boolean;
  isFollowing?: boolean;
}

export function ProfileHeaderActions({
  userId,
  isOwnProfile,
  isFollowing = false,
}: ProfileHeaderActionsProps) {
  const router = useRouter();
  const { followUser, unfollowUser, isLoading } = useFollowUser();
  const [followState, setFollowState] = useState(isFollowing);
  
  // Handle edit profile
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };
  
  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (isLoading) return;
    
    try {
      if (followState) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      setFollowState(!followState);
    } catch (error) {
      console.error('Error toggling follow state:', error);
    }
  };
  
  // View connections
  const handleViewConnections = () => {
    router.push('/profile?tab=connections');
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      {isOwnProfile ? (
        <>
          <Button 
            variant="default" 
            onClick={handleEditProfile}
          >
            Edit Profile
          </Button>
          <Button 
            variant="outline" 
            onClick={handleViewConnections}
          >
            Connections
          </Button>
        </>
      ) : (
        <>
          <Button 
            variant={followState ? "outline" : "default"} 
            onClick={handleFollowToggle}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : followState ? 'Following' : 'Follow'}
          </Button>
          <Button 
            variant="outline"
          >
            Message
          </Button>
        </>
      )}
    </div>
  );
}
