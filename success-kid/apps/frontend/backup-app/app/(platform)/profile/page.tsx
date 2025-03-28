'use client';

import React, { useState } from 'react';
import { PageLayout } from '@/components/layout';
import { 
  ProfileHeader, 
  ProfileTabs, 
  ProfileTabContent,
  ActivityTimeline,
  AchievementCollection,
  ProfileEdit,
  ConnectionsList,
  PostsList,
  PointsHistory
} from '@/components/features/profile';
import { useUserStore, UserProfile } from '@/store/useUserStore';
import { useProfileData } from '@/hooks/useProfileData';
import { Spinner } from '@/components/ui/Spinner';

/**
 * ProfilePage - User profile view with tabs for different content sections
 */
export default function ProfilePage() {
  const { profile, stats, isLoading } = useProfileData();
  const { updateProfile } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle edit profile action
  const handleEditProfile = () => {
    setIsEditing(true);
  };
  
  // Handle save profile changes
  const handleSaveProfile = async (data: Partial<UserProfile>) => {
    try {
      await updateProfile(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
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
  
  // If in edit mode, show the profile edit form
  if (isEditing) {
    return (
      <PageLayout>
        <ProfileEdit
          initialData={profile}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditing(false)}
        />
      </PageLayout>
    );
  }
  
  // Otherwise, show the profile view
  return (
    <PageLayout>
      {/* Profile Header */}
      <ProfileHeader
        user={profile}
        stats={stats}
        isOwnProfile={true}
        onEditProfile={handleEditProfile}
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
