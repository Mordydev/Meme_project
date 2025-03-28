'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserResource } from '@clerk/types';
import { UserStats } from './profile-header';
import { UserActivity } from './activity-timeline';
import { UserAchievement } from './achievement-collection';
import { UserProfile } from './connections-list';

// Context types
interface ProfileContextValue {
  user: UserResource | null;
  stats: UserStats;
  isOwnProfile: boolean;
  isFollowing: boolean;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activities: UserActivity[];
  achievements: UserAchievement[];
  connections: {
    followers: UserProfile[];
    following: UserProfile[];
  };
  loadMoreActivities: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create context
const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

// Provider props
interface ProfileProviderProps {
  userId: string;
  user?: UserResource | null;
  isOwnProfile?: boolean;
  children: ReactNode;
}

// Provider component
export function ProfileProvider({
  userId,
  user = null,
  isOwnProfile = false,
  children,
}: ProfileProviderProps) {
  // State
  const [stats, setStats] = useState<UserStats>({
    points: 0,
    achievements: 0,
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  
  // Load initial data
  const refreshProfile = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, these would be API calls
      // Mock data for now
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock stats
      setStats({
        points: 1250,
        achievements: 8,
        posts: 23,
        followers: 15,
        following: 42,
      });
      
      // Mock following status
      setIsFollowing(Math.random() > 0.5);
      
      // Mock activities
      setActivities([
        {
          id: '1',
          type: 'post',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: {
            postId: 'post1',
            title: 'My First Post',
            previewText: 'This is my first post on the platform!'
          }
        },
        {
          id: '2',
          type: 'achievement',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          details: {
            achievementId: 'achievement1',
            title: 'First Steps'
          }
        },
      ]);
      
      // Mock achievements
      setAchievements([
        {
          id: 'achievement1',
          title: 'First Steps',
          description: 'Complete your profile setup and join the Success Kid community.',
          iconUrl: '/images/badges/first-steps.svg',
          unlockedAt: new Date().toISOString(),
          difficulty: 'common',
          pointsReward: 50
        },
        {
          id: 'achievement2',
          title: 'Content Creator',
          description: 'Create your first post on the platform.',
          iconUrl: '/images/badges/content-creator.svg',
          unlockedAt: new Date(Date.now() - 86400000).toISOString(),
          difficulty: 'common',
          pointsReward: 100
        },
      ]);
      
      // Mock followers
      setFollowers([
        {
          id: 'user1',
          displayName: 'Alice Cooper',
          username: 'alice',
          avatarUrl: '/images/avatars/alice.jpg',
          level: 6,
          isFollowing: true
        },
      ]);
      
      // Mock following
      setFollowing([
        {
          id: 'user2',
          displayName: 'Bob Smith',
          username: 'bobsmith',
          avatarUrl: '/images/avatars/bob.jpg',
          level: 4,
          isFollowing: false
        },
      ]);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load more activities
  const loadMoreActivities = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock new activities
      const newActivities: UserActivity[] = [
        {
          id: '3',
          type: 'comment',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          details: {
            postId: 'post2',
            previewText: 'Great content! I love this platform.'
          }
        },
        {
          id: '4',
          type: 'level_up',
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          details: {
            level: 5
          }
        },
      ];
      
      setActivities(prev => [...prev, ...newActivities]);
    } catch (error) {
      console.error('Error loading more activities:', error);
    }
  };
  
  // Load initial data
  useEffect(() => {
    refreshProfile();
  }, [userId]);
  
  // Create context value
  const contextValue: ProfileContextValue = {
    user,
    stats,
    isOwnProfile,
    isFollowing,
    isLoading,
    activeTab,
    setActiveTab,
    activities,
    achievements,
    connections: {
      followers,
      following,
    },
    loadMoreActivities,
    refreshProfile,
  };
  
  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

// Hook for using profile context
export function useProfile() {
  const context = useContext(ProfileContext);
  
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  
  return context;
}
