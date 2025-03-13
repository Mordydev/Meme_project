'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardPeriod, LeaderboardCategory, LeaderboardUser } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaderboardTabs } from './LeaderboardTabs';
import { RankingList } from './RankingList';
import { UserRankHighlight } from './UserRankHighlight';
import { CategorySelector } from './CategorySelector';
import { useAuth } from '@/hooks/useAuth';

// Mock query hook for leaderboard data (would be replaced with actual query)
const useLeaderboardData = (
  period: LeaderboardPeriod,
  category: LeaderboardCategory
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [rankings, setRankings] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Generate mock data
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        userId: `user_${i + 1}`,
        username: `user${i + 1}`,
        displayName: `User ${i + 1}`,
        avatarUrl: `/images/avatars/avatar${(i % 10) + 1}.png`,
        level: Math.floor(Math.random() * 10) + 1,
        score: Math.floor(Math.random() * 10000) + 1000,
        change: Math.floor(Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1),
      })).sort((a, b) => b.score - a.score);
      
      // Update ranks after sorting
      mockData.forEach((user, index) => {
        user.rank = index + 1;
      });
      
      // Set mock user rank (always add current user into the rankings)
      const currentUserRank = Math.floor(Math.random() * 30) + 1;
      const mockUserRank: LeaderboardUser = {
        rank: currentUserRank,
        userId: 'current_user',
        username: 'currentuser',
        displayName: 'Current User',
        avatarUrl: '/images/avatars/avatar3.png',
        level: 4,
        score: Math.floor(Math.random() * 5000) + 1000,
        change: Math.floor(Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1),
      };
      
      setRankings(mockData);
      setUserRank(mockUserRank);
      setIsLoading(false);
    };
    
    fetchData();
  }, [period, category]);
  
  return { rankings, userRank, isLoading };
};

interface LeaderboardProps {
  className?: string;
}

/**
 * Leaderboard
 * 
 * Component to display user rankings with filtering by time period and category.
 */
export function Leaderboard({ className }: LeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [category, setCategory] = useState<LeaderboardCategory>('points');
  
  const { user } = useAuth();
  const { rankings, userRank, isLoading } = useLeaderboardData(period, category);
  
  // Calculate points needed for next rank (if there is a user ahead)
  const pointsToNextRank = (() => {
    if (!userRank) return undefined;
    
    // Find the user right above the current user
    const nextRankUser = rankings.find(r => r.rank === userRank.rank - 1);
    if (!nextRankUser) return undefined;
    
    return nextRankUser.score - userRank.score;
  })();
  
  // Handle view profile click
  const handleViewProfile = () => {
    // Navigate to profile or open modal
    console.log('Navigate to user profile');
  };
  
  // Handle user select from list
  const handleUserSelect = (userId: string) => {
    // Navigate to selected user profile
    console.log('Selected user:', userId);
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Category Selector */}
        <CategorySelector
          activeCategory={category}
          onCategoryChange={setCategory}
        />
        
        {/* Period Tabs */}
        <LeaderboardTabs
          activeTab={period}
          onTabChange={setPeriod}
        />
        
        {/* User Rank Highlight (if logged in) */}
        {userRank && user && (
          <UserRankHighlight
            userRank={userRank}
            pointsToNextRank={pointsToNextRank}
            onViewProfile={handleViewProfile}
            className="mb-6"
          />
        )}
        
        {/* Rankings List */}
        <RankingList
          rankings={rankings}
          currentUserId={user?.id}
          isLoading={isLoading}
          onUserSelect={handleUserSelect}
        />
      </CardContent>
    </Card>
  );
}
