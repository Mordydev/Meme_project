'use client';

import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout';
import { 
  ProfileHeader, 
  ProfileTabs, 
  ProfileTabContent,
  ActivityTimeline,
  AchievementCollection,
  ConnectionsList,
  PostsList,
  PointsHistory
} from '@/components/features/profile';
import { useProfileData } from '@/hooks/useProfileData';
import { Spinner } from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';

interface UserProfilePageProps {
  params: {
    username: string;
  };
}

/**
 * UserProfilePage - View a specific user's profile by username
 */
export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = params;
  const router = useRouter();
  const { profile: currentProfile } = useUserStore();
  const { profile, stats, isLoading, error } = useProfileData(username);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // If this is the current user, redirect to /profile
  useEffect(() => {
    if (currentProfile && currentProfile.username === username) {
      router.replace('/profile');
    }
  }, [currentProfile, username, router]);
  
  // Initialize following state (simulated)
  useEffect(() => {
    // In a real app, this would check if the current user is following this profile
    setIsFollowing(Math.random() > 0.5); // Random for demo
  }, [username]);
  
  // Handle follow/unfollow action
  const handleToggleFollow = async () => {
    if (!profile) return;
    
    setFollowLoading(true);
    
    try {
      // In a real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 600));
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setFollowLoading(false);
    }
  };
  
  // If still loading, show spinner
  if (isLoading || !profile || !stats) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    );
  }
  
  // If error occurred, show error message
  if (error) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-red-500">Error Loading Profile</h2>
          <p className="mt-2">We couldn't load this profile. Please try again later.</p>
        </div>
      </PageLayout>
    );
  }
  
  // Show the profile view
  return (
    <PageLayout>
      {/* Profile Header */}
      <ProfileHeader
        user={profile}
        stats={stats}
        isOwnProfile={false}
        isFollowing={isFollowing}
        onFollow={handleToggleFollow}
        onUnfollow={handleToggleFollow}
      />
      
      {/* Profile Tabs */}
      <ProfileTabs userId={profile.id} defaultTab="posts">
        <ProfileTabContent tabId="posts">
          <PostsList userId={profile.id} />
        </ProfileTabContent>
        
        <ProfileTabContent tabId="achievements">
          <AchievementCollection userId={profile.id} />
        </ProfileTabContent>
        
        <ProfileTabContent tabId="activity">
          <ActivityTimeline userId={profile.id} />
        </ProfileTabContent>
        
        <ProfileTabContent tabId="points">
          <PointsHistory userId={profile.id} />
        </ProfileTabContent>
        
        <ProfileTabContent tabId="connections">
          <div className="space-y-8">
            <ConnectionsList userId={profile.id} type="followers" />
            <ConnectionsList userId={profile.id} type="following" />
          </div>
        </ProfileTabContent>
      </ProfileTabs>
    </PageLayout>
  );
}
