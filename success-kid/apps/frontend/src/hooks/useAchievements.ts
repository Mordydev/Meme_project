'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  points: number;
  unlockedAt?: Date;
}

// Mock achievements data
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete the platform onboarding process',
    iconUrl: '/images/badges/first-steps.svg',
    points: 100,
  },
  {
    id: 'profile-complete',
    title: 'Identity Established',
    description: 'Complete your user profile with all details',
    iconUrl: '/images/badges/profile-complete.svg',
    points: 50,
  },
  {
    id: 'first-post',
    title: 'Content Creator',
    description: 'Create your first post in the community',
    iconUrl: '/images/badges/first-post.svg',
    points: 50,
  },
  {
    id: 'wallet-connected',
    title: 'Wallet Warrior',
    description: 'Connect your crypto wallet to the platform',
    iconUrl: '/images/badges/wallet-connected.svg',
    points: 100,
  },
  {
    id: 'first-comment',
    title: 'Conversation Starter',
    description: 'Leave your first comment on a post',
    iconUrl: '/images/badges/first-comment.svg',
    points: 25,
  },
];

export function useAchievements() {
  const { isLoaded, isSignedIn, user } = useAuth();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const triggerAchievement = useCallback(async (achievementId: string) => {
    if (!isLoaded || !isSignedIn || !user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) {
      return { success: false, error: 'Achievement not found' };
    }
    
    setIsUnlocking(true);
    
    try {
      // In a real implementation, we would make an API call to record the achievement
      // For now, we'll simulate a successful unlock
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set the current achievement to display the notification
      setCurrentAchievement({
        ...achievement,
        unlockedAt: new Date(),
      });
      
      return { 
        success: true,
        achievement: {
          ...achievement,
          unlockedAt: new Date(),
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlock achievement';
      return { success: false, error: errorMessage };
    } finally {
      setIsUnlocking(false);
    }
  }, [isLoaded, isSignedIn, user]);
  
  const dismissAchievement = useCallback(() => {
    setCurrentAchievement(null);
  }, []);
  
  return {
    currentAchievement,
    isUnlocking,
    triggerAchievement,
    dismissAchievement,
    ACHIEVEMENTS,
  };
}
