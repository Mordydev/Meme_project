'use client';

import React, { useState, useEffect } from 'react';
import { useAchievementStore, Achievement } from '@/store/useAchievementStore';
import { useLevelStore } from '@/store/useLevelStore';
import {
  AchievementProvider,
  AchievementTracker,
  ProgressSummary,
  CategoryBreakdown,
  RecentUnlocks,
  NextGoalsSuggestion,
  AchievementDetail,
  FilterableAchievementGrid,
  AchievementCelebration,
  LevelProvider,
  LevelUpCelebration,
  Leaderboard,
} from '@/components/features/achievements';

/**
 * Main achievements page that displays all gamification elements
 */
export default function AchievementsPage() {
  const { 
    achievements,
    unlockedAchievements,
    isLoading,
    currentAchievement,
    dismissAchievement,
  } = useAchievementStore();
  
  const { showLevelUp, dismissLevelUp } = useLevelStore();
  
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  // Reset selected achievement when data changes
  useEffect(() => {
    if (achievements.length > 0 && selectedAchievement) {
      const updatedAchievement = achievements.find(a => a.id === selectedAchievement.id);
      if (updatedAchievement) {
        setSelectedAchievement(updatedAchievement);
      }
    }
  }, [achievements, selectedAchievement]);
  
  // Prepare data for achievement grid
  const achievementCategories = React.useMemo(() => {
    if (!achievements.length) return [];
    
    // Count achievements by category
    const categoryCounts = achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = { count: 0, name: getCategoryName(achievement.category) };
      }
      acc[achievement.category].count++;
      return acc;
    }, {} as Record<string, { count: number; name: string }>);
    
    // Convert to array format needed by component
    return Object.entries(categoryCounts).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count,
    }));
  }, [achievements]);
  
  // Progress data for achievement grid
  const achievementProgress = React.useMemo(() => {
    return achievements.reduce((acc, achievement) => {
      acc[achievement.id] = achievement.progress;
      return acc;
    }, {} as Record<string, number>);
  }, [achievements]);
  
  // Unlocked achievement IDs for achievement grid
  const unlockedIds = React.useMemo(() => {
    return unlockedAchievements.map(a => a.id);
  }, [unlockedAchievements]);
  
  // Handle achievement selection from list
  const handleAchievementSelect = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };
  
  // Close achievement detail view
  const closeAchievementDetail = () => {
    setSelectedAchievement(null);
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Hidden achievement tracker for event listening */}
      <AchievementTracker />
      
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Achievements & Gamification</h1>
        <p className="text-neutral-600">
          Track your progress, earn rewards, and compete with others
        </p>
      </div>
      
      {/* Two-column layout on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - Achievement grid and details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress summary */}
          <ProgressSummary />
          
          {/* Achievement grid */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-neutral-800 mb-4">Achievement Collection</h2>
            
            <FilterableAchievementGrid
              achievements={achievements}
              unlocked={unlockedIds}
              progress={achievementProgress}
              categories={achievementCategories}
              onSelect={handleAchievementSelect}
            />
          </div>
        </div>
        
        {/* Sidebar - Analytics and recommendations */}
        <div className="space-y-6">
          {/* Sidebar widgets */}
          <RecentUnlocks 
            limit={3} 
            onAchievementSelect={handleAchievementSelect} 
          />
          
          <NextGoalsSuggestion 
            limit={3} 
            onGoalSelect={handleAchievementSelect} 
          />
          
          <CategoryBreakdown />
          
          {/* Mini leaderboard */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-neutral-800 mb-4">Leaderboard Snapshot</h2>
            <Leaderboard 
              limit={5} 
              className="h-96 overflow-auto"
            />
            <div className="mt-4 text-center">
              <a
                href="/leaderboard"
                className="inline-block px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View Full Leaderboard
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Achievement detail modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/50 p-4">
          <div 
            className="max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <AchievementDetail
              achievement={selectedAchievement}
              isUnlocked={unlockedIds.includes(selectedAchievement.id)}
              progress={achievementProgress[selectedAchievement.id] || 0}
              onClose={closeAchievementDetail}
            />
          </div>
        </div>
      )}
      
      {/* Achievement unlock celebration */}
      {currentAchievement && (
        <AchievementCelebration
          achievement={currentAchievement}
          onClose={dismissAchievement}
          onShare={() => console.log('Share achievement:', currentAchievement.id)}
        />
      )}
      
      {/* Level up celebration */}
      {showLevelUp && (
        <LevelUpCelebration onClose={dismissLevelUp} />
      )}
    </div>
  );
}

/**
 * Helper function to get formatted category name
 */
function getCategoryName(category: string): string {
  switch (category) {
    case 'onboarding': return 'Onboarding';
    case 'content': return 'Content Creation';
    case 'engagement': return 'Community Engagement';
    case 'holder': return 'Token Holder';
    case 'community': return 'Community Builder';
    case 'milestone': return 'Milestones';
    default: 
      return category
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^\w/, c => c.toUpperCase());
  }
}
