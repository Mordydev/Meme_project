'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GamificationAnalytics, AchievementCategory } from '@/types';
import { useAchievements } from '@/hooks/useAchievements';
import { ProgressSummary } from '../achievements/ProgressSummary';
import { CategoryBreakdown } from './CategoryBreakdown';
import { RecentUnlocks } from './RecentUnlocks';
import { MilestoneTimeline } from './MilestoneTimeline';
import { NextGoalsSuggestion } from './NextGoalsSuggestion';
import { AchievementDetail } from '../achievements/AchievementDetail';
import { Spinner } from '@/components/ui/Spinner';

interface GamificationDashboardProps {
  className?: string;
}

/**
 * GamificationDashboard
 * 
 * Component to display a comprehensive view of a user's achievement progress,
 * recent unlocks, and suggested next goals.
 */
export function GamificationDashboard({ className }: GamificationDashboardProps) {
  const { achievements, unlockedAchievements, getAchievement, isLoading } = useAchievements();
  
  const [analyticsData, setAnalyticsData] = useState<GamificationAnalytics | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  
  // Generate analytics data based on achievements
  useEffect(() => {
    if (isLoading) return;
    
    // Generate mock analytics data
    setTimeout(() => {
      const getCategoryBreakdown = () => {
        const categories: AchievementCategory[] = ['onboarding', 'engagement', 'content', 'community', 'wallet', 'referral', 'milestones'];
        
        return categories.map(category => {
          const categoryAchievements = achievements.filter(a => a.category === category);
          const unlocked = unlockedAchievements.filter(a => a.category === category).length;
          const total = categoryAchievements.length;
          const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
          
          return {
            category,
            total,
            unlocked,
            percentage
          };
        }).filter(c => c.total > 0); // Only include categories with achievements
      };
      
      const getRecentUnlocks = () => {
        return unlockedAchievements
          .slice(0, 5)
          .map(a => ({
            id: a.id,
            title: a.title,
            badgeUrl: a.badgeUrl,
            unlockedAt: a.unlockedAt || new Date().toISOString()
          }))
          .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
      };
      
      const getSuggestedGoals = () => {
        // Find incomplete achievements with some progress
        const inProgress = achievements
          .filter(a => !unlockedAchievements.some(ua => ua.id === a.id))
          .map(a => {
            const achievement = getAchievement(a.id);
            return {
              id: a.id,
              title: a.title,
              badgeUrl: a.badgeUrl,
              progress: achievement?.progress || 0
            };
          })
          .filter(a => a.progress > 0)
          .sort((a, b) => b.progress - a.progress);
        
        // If we don't have enough in-progress achievements, add some not-started ones
        if (inProgress.length < 3) {
          const notStarted = achievements
            .filter(a => 
              !unlockedAchievements.some(ua => ua.id === a.id) && 
              !inProgress.some(ip => ip.id === a.id)
            )
            .slice(0, 3 - inProgress.length)
            .map(a => ({
              id: a.id,
              title: a.title,
              badgeUrl: a.badgeUrl,
              progress: 0
            }));
          
          return [...inProgress, ...notStarted].slice(0, 3);
        }
        
        return inProgress.slice(0, 3);
      };
      
      // Generate milestone data
      const getMilestones = () => {
        const achievementMilestones = unlockedAchievements
          .slice(0, 5)
          .map(a => ({
            id: a.id,
            title: a.title,
            description: a.description,
            achievedAt: a.unlockedAt || new Date().toISOString(),
            type: 'achievement' as const
          }));
        
        // Add some mock level and points milestones
        const additionalMilestones = [
          {
            id: 'level-3',
            title: 'Reached Level 3',
            description: 'Unlocked new profile customization options',
            achievedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
            type: 'level' as const
          },
          {
            id: 'points-1000',
            title: 'Earned 1,000 Points',
            description: 'Accumulated 1,000 Success Points through participation',
            achievedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
            type: 'points' as const
          },
          {
            id: 'wallet-connect',
            title: 'Connected Wallet',
            description: 'Linked your wallet to enable token transactions',
            achievedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
            type: 'wallet' as const
          }
        ];
        
        return [...achievementMilestones, ...additionalMilestones]
          .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
          .slice(0, 8);
      };
      
      const analytics: GamificationAnalytics = {
        totalAchievements: achievements.length,
        unlockedCount: unlockedAchievements.length,
        completion: achievements.length > 0 
          ? Math.round((unlockedAchievements.length / achievements.length) * 100) 
          : 0,
        categoryBreakdown: getCategoryBreakdown(),
        recentUnlocks: getRecentUnlocks(),
        suggestedGoals: getSuggestedGoals()
      };
      
      setAnalyticsData({
        ...analytics,
        // Add milestone data
        milestones: getMilestones()
      } as GamificationAnalytics & { milestones: any[] });
      
      setIsAnalyticsLoading(false);
    }, 1000);
  }, [achievements, unlockedAchievements, isLoading, getAchievement]);
  
  // Handle category selection
  const handleCategorySelect = (category: AchievementCategory) => {
    // Navigate to achievements page filtered by category
    console.log('Selected category:', category);
  };
  
  // Handle achievement selection
  const handleAchievementSelect = (id: string) => {
    setSelectedAchievementId(id);
    setIsDetailOpen(true);
  };
  
  // Handle close achievement detail
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedAchievementId(null);
  };
  
  // Get selected achievement
  const selectedAchievement = selectedAchievementId
    ? getAchievement(selectedAchievementId)
    : null;
  
  if (isLoading || isAnalyticsLoading) {
    return (
      <div className={cn("flex justify-center py-12", className)}>
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (!analyticsData) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium">Analytics not available</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          We couldn't load your achievement analytics. Please try again later.
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Progress */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ProgressSummary className="lg:col-span-2" />
        <NextGoalsSuggestion 
          suggestedGoals={analyticsData.suggestedGoals}
          onAchievementSelect={handleAchievementSelect}
        />
      </div>
      
      {/* Category Breakdown and Recent Unlocks */}
      <div className="grid gap-6 md:grid-cols-2">
        <CategoryBreakdown 
          categories={analyticsData.categoryBreakdown}
          onCategorySelect={handleCategorySelect}
        />
        <RecentUnlocks 
          recentUnlocks={analyticsData.recentUnlocks}
          onAchievementSelect={handleAchievementSelect}
        />
      </div>
      
      {/* Milestone Timeline */}
      <MilestoneTimeline milestones={analyticsData.milestones || []} />
      
      {/* Achievement Detail Modal */}
      <AchievementDetail
        achievement={selectedAchievement}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
