'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
  unlockedAt?: Date;
}

/**
 * Achievement definitions with metadata
 */
const ACHIEVEMENTS: Record<string, Omit<Achievement, 'unlockedAt'>> = {
  first_steps: {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your profile setup',
    iconUrl: '/images/achievements/first-steps.svg'
  },
  profile_complete: {
    id: 'profile_complete',
    title: 'Identity Established',
    description: 'Create your Success Kid identity',
    iconUrl: '/images/achievements/profile-complete.svg'
  },
  connect_wallet: {
    id: 'connect_wallet',
    title: 'Wallet Warrior',
    description: 'Connect your first wallet',
    iconUrl: '/images/achievements/wallet-connected.svg'
  },
  first_post: {
    id: 'first_post',
    title: 'Content Creator',
    description: 'Share your first post with the community',
    iconUrl: '/images/achievements/first-post.svg'
  },
  first_comment: {
    id: 'first_comment',
    title: 'Conversation Starter',
    description: 'Join the discussion with your first comment',
    iconUrl: '/images/achievements/first-comment.svg'
  }
};

export type AchievementId = keyof typeof ACHIEVEMENTS;

export function useAchievements() {
  const [isAwarding, setIsAwarding] = useState(false);
  const { profile, updateProfile } = useUserStore();
  
  /**
   * Trigger an achievement unlock
   */
  const triggerAchievement = async (achievementId: AchievementId): Promise<Achievement | null> => {
    if (!profile) return null;
    
    // Check if achievement is already unlocked
    if (profile.achievements?.includes(achievementId)) {
      return null;
    }
    
    setIsAwarding(true);
    
    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate a network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create the unlocked achievement with current timestamp
      const achievement = {
        ...ACHIEVEMENTS[achievementId],
        unlockedAt: new Date()
      };
      
      // Update profile with new achievement
      const updatedAchievements = [
        ...(profile.achievements || []),
        achievementId
      ];
      
      updateProfile({
        achievements: updatedAchievements
      });
      
      return achievement;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return null;
    } finally {
      setIsAwarding(false);
    }
  };
  
  /**
   * Get all achievements with unlock status
   */
  const getAchievements = (): Array<Achievement & { unlocked: boolean }> => {
    return Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: profile?.achievements?.includes(achievement.id) || false,
      unlockedAt: undefined // This would come from the API in a real implementation
    }));
  };
  
  /**
   * Get a specific achievement by ID
   */
  const getAchievement = (achievementId: AchievementId): (Achievement & { unlocked: boolean }) | null => {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return null;
    
    return {
      ...achievement,
      unlocked: profile?.achievements?.includes(achievementId) || false,
      unlockedAt: undefined // This would come from the API in a real implementation
    };
  };
  
  return {
    isAwarding,
    triggerAchievement,
    getAchievements,
    getAchievement
  };
}
