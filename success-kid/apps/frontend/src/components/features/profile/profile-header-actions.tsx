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
  isFollowing = false 
}: ProfileHeaderActionsProps) {
  const router = useRouter();
  const { followUser, unfollowUser, isLoading } = useFollowUser();
  const [followState, setFollowState] = useState(isFollowing);
  
  // Handle edit profile click
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };
  
  // Handle follow click
  const handleFollow = async () => {
    try {
      if (followState) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      setFollowState(!followState);
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };
  
  if (isOwnProfile) {
    return (
      <Button variant="outline" onClick={handleEditProfile}>
        Edit Profile
      </Button>
    );
  }
  
  return (
    <Button 
      variant={followState ? "outline" : "default"}
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : followState ? 'Following' : 'Follow'}
    </Button>
  );
}
