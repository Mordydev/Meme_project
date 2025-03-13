'use client';

import React, { useEffect } from 'react';
import { 
  useLeaderboardStore, 
  LeaderboardPeriod, 
  LeaderboardCategory 
} from '@/store/useLeaderboardStore';
import { LeaderboardTabs, LeaderboardCategorySelector } from './LeaderboardTabs';
import { RankingList, UserRankHighlight } from './RankingList';
import { useAuth } from '@/hooks/useAuth';

/**
 * Props for Leaderboard component
 */
interface LeaderboardProps {
  initialPeriod?: LeaderboardPeriod;
  initialCategory?: LeaderboardCategory;
  limit?: number;
  className?: string;
}

/**
 * Leaderboard component to display user rankings
 */
export function Leaderboard({
  initialPeriod = 'weekly',
  initialCategory = 'points',
  limit = 20,
  className = '',
}: LeaderboardProps) {
  const { 
    rankings, 
    userRank,
    period, 
    category, 
    isLoading,
    error,
    fetchLeaderboard,
    setPeriod,
    setCategory,
  } = useLeaderboardStore();
  
  const { user } = useAuth();
  
  // Fetch leaderboard data on mount and when dependencies change
  useEffect(() => {
    fetchLeaderboard({
      period: initialPeriod,
      category: initialCategory,
      limit,
    });
  }, [fetchLeaderboard, initialPeriod, initialCategory, limit]);
  
  // Handle period change
  const handlePeriodChange = (newPeriod: LeaderboardPeriod) => {
    if (newPeriod !== period) {
      setPeriod(newPeriod);
    }
  };
  
  // Handle category change
  const handleCategoryChange = (newCategory: LeaderboardCategory) => {
    if (newCategory !== category) {
      setCategory(newCategory);
    }
  };
  
  // Handle user selection
  const handleUserSelect = (userId: string) => {
    console.log(`Selected user: ${userId}`);
    // Implementation would navigate to user profile or show details
    // For now we'll just log it
  };
  
  // Get label for current category
  const getCategoryLabel = (cat: LeaderboardCategory): string => {
    switch (cat) {
      case 'points': return 'Points';
      case 'achievements': return 'Achievements';
      case 'content': return 'Content';
      case 'referrals': return 'Referrals';
      default: return 'Score';
    }
  };
  
  // Get label for current period
  const getPeriodLabel = (per: LeaderboardPeriod): string => {
    switch (per) {
      case 'daily': return 'Today\'s';
      case 'weekly': return 'This Week\'s';
      case 'monthly': return 'This Month\'s';
      case 'all-time': return 'All-Time';
      default: return '';
    }
  };
  
  return (
    <div className={`w-full flex flex-col ${className}`}>
      {/* Header with title */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-neutral-800">
          {getPeriodLabel(period)} Leaderboard
        </h2>
        <p className="text-neutral-600">
          Top users ranked by {getCategoryLabel(category).toLowerCase()}
        </p>
      </div>
      
      {/* User's current rank (if available) */}
      {userRank && (
        <UserRankHighlight 
          userRank={userRank} 
          className="mb-6" 
        />
      )}
      
      {/* Period and category selectors */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
        <LeaderboardTabs
          activeTab={period}
          onTabChange={handlePeriodChange}
          className="md:flex-grow"
        />
        <LeaderboardCategorySelector
          activeCategory={category}
          onCategoryChange={handleCategoryChange}
        />
      </div>
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
          <p className="font-medium">Error loading leaderboard</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}
      
      {/* Rankings list */}
      <RankingList
        rankings={rankings}
        currentUserId={user?.id}
        onUserSelect={handleUserSelect}
        isLoading={isLoading}
      />
      
      {/* Pagination could be added here in the future */}
    </div>
  );
}
