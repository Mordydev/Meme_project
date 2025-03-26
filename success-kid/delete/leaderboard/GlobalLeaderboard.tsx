'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLeaderboardStore } from '@/store';
import { UserRankingList } from './UserRankingList';
import { LeaderboardCategory, TimeFrame } from '@/types/leaderboard';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';

const TIME_PERIODS: { value: TimeFrame; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'all-time', label: 'All-time' },
];

const CATEGORIES: { value: LeaderboardCategory; label: string }[] = [
  { value: 'points', label: 'Points' },
  { value: 'content', label: 'Content' },
  { value: 'comments', label: 'Engagement' },
  { value: 'achievements', label: 'Achievements' },
  { value: 'referrals', label: 'Referrals' },
];

export interface GlobalLeaderboardProps {
  initialCategory?: LeaderboardCategory; 
  initialTimeframe?: TimeFrame;
  highlightUserId?: string;
  onUserSelect?: (userId: string) => void;
  className?: string;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  initialCategory,
  initialTimeframe,
  highlightUserId,
  onUserSelect,
  className,
}) => {
  const { user } = useAuth();
  const {
    rankings,
    userRank,
    pagination,
    period,
    category,
    isLoading,
    setPeriod,
    setCategory,
    setPage,
    fetchLeaderboard,
  } = useLeaderboardStore();
  
  // Initial fetch
  useEffect(() => {
    fetchLeaderboard({
      period: initialTimeframe || 'weekly',
      category: initialCategory || 'points',
    });
  }, [fetchLeaderboard, initialTimeframe, initialCategory]);
  
  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory as LeaderboardCategory);
  };
  
  // Handle time period change
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod as TimeFrame);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setPage(page);
  };
  
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Category Tabs */}
        <Tabs
          defaultValue={initialCategory || 'points'}
          value={category}
          onValueChange={handleCategoryChange}
          className="mb-6"
        >
          <TabsList className="w-full">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="flex-1"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Create a content for each category */}
          {CATEGORIES.map((cat) => (
            <TabsContent key={cat.value} value={cat.value} className="mt-4">
              {/* Time Period Selection */}
              <div className="mb-6">
                <Tabs
                  defaultValue={initialTimeframe || 'weekly'}
                  value={period}
                  onValueChange={handlePeriodChange}
                >
                  <TabsList>
                    {TIME_PERIODS.map((timePeriod) => (
                      <TabsTrigger
                        key={timePeriod.value}
                        value={timePeriod.value}
                      >
                        {timePeriod.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Ranking List */}
              <UserRankingList
                rankings={rankings}
                currentUser={userRank}
                currentUserId={highlightUserId || user?.id}
                isLoading={isLoading}
                showPagination={true}
                onPageChange={handlePageChange}
                onUserSelect={onUserSelect}
                total={pagination?.total || 0}
                limit={pagination?.limit || 20}
                offset={pagination?.offset || 0}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
