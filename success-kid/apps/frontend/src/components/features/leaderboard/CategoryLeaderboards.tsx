'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserRankingList } from './UserRankingList';
import { LeaderboardCategory, TimeFrame } from '@/types/leaderboard';
import { useLeaderboardStore } from '@/store';
import { useAuth } from '@/hooks';
import { cn, formatCompactNumber } from '@/lib/utils';

// Category metadata for display
const CATEGORY_METADATA: Record<LeaderboardCategory, {
  title: string;
  description: string;
  icon: React.ReactNode;
  metricLabel: string;
}> = {
  points: {
    title: 'Points Leaderboard',
    description: 'Top users by Success Points earned',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    metricLabel: 'Total Points',
  },
  content: {
    title: 'Content Creators',
    description: 'Top users by content creation',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    metricLabel: 'Total Posts',
  },
  comments: {
    title: 'Community Engagers',
    description: 'Top users by engagement activity',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    metricLabel: 'Total Comments',
  },
  achievements: {
    title: 'Achievement Masters',
    description: 'Top users by achievements unlocked',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"/>
      </svg>
    ),
    metricLabel: 'Achievements',
  },
  referrals: {
    title: 'Community Builders',
    description: 'Top users by referrals',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 11L19 13L23 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    metricLabel: 'Referrals',
  },
};

// Time periods
const TIME_PERIODS: { value: TimeFrame; label: string }[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'all-time', label: 'All Time' },
];

export interface CategoryLeaderboardsProps {
  categories?: LeaderboardCategory[];
  initialCategory?: LeaderboardCategory;
  initialTimeframe?: TimeFrame;
  onUserSelect?: (userId: string) => void;
  className?: string;
}

export const CategoryLeaderboards: React.FC<CategoryLeaderboardsProps> = ({
  categories = ['points', 'content', 'comments', 'achievements', 'referrals'],
  initialCategory = 'points',
  initialTimeframe = 'weekly',
  onUserSelect,
  className,
}) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>(initialCategory);
  const [selectedPeriod, setSelectedPeriod] = useState<TimeFrame>(initialTimeframe);
  
  const {
    rankings,
    userRank,
    pagination,
    isLoading,
    fetchLeaderboard,
    setPage,
  } = useLeaderboardStore();
  
  // Initial fetch
  useEffect(() => {
    fetchLeaderboard({
      category: selectedCategory,
      period: selectedPeriod,
    });
  }, [fetchLeaderboard, selectedCategory, selectedPeriod]);
  
  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category as LeaderboardCategory);
    fetchLeaderboard({
      category: category as LeaderboardCategory,
      period: selectedPeriod,
    });
  };
  
  // Handle time period change
  const handlePeriodChange = (period: TimeFrame) => {
    setSelectedPeriod(period);
    fetchLeaderboard({
      category: selectedCategory,
      period,
    });
  };
  
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center">
          <div className="text-primary mr-3">
            {CATEGORY_METADATA[selectedCategory].icon}
          </div>
          <div>
            <CardTitle>{CATEGORY_METADATA[selectedCategory].title}</CardTitle>
            <CardDescription>{CATEGORY_METADATA[selectedCategory].description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Category Selector */}
        <Tabs
          defaultValue={initialCategory}
          value={selectedCategory}
          onValueChange={handleCategoryChange}
          className="mb-6"
        >
          <TabsList className="w-full">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="flex-1"
              >
                {CATEGORY_METADATA[cat].title.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {/* Time period tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TIME_PERIODS.map((period) => (
            <Badge
              key={period.value}
              variant={selectedPeriod === period.value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handlePeriodChange(period.value)}
            >
              {period.label}
            </Badge>
          ))}
        </div>
        
        {/* Category-specific stats */}
        <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-neutral-500">
                {CATEGORY_METADATA[selectedCategory].metricLabel}
              </h4>
              <p className="text-2xl font-bold">
                {formatCompactNumber(rankings.reduce((sum, user) => sum + user.score, 0))}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-500">Top Contributor</h4>
              <p className="text-2xl font-bold">
                {rankings.length > 0 ? rankings[0].displayName : '-'}
              </p>
            </div>
          </div>
        </div>
        
        {/* User ranking list */}
        <UserRankingList
          rankings={rankings}
          currentUser={userRank}
          currentUserId={user?.id}
          isLoading={isLoading}
          showPagination={true}
          onPageChange={(page) => setPage(page)}
          onUserSelect={onUserSelect}
          total={pagination?.total || 0}
          limit={pagination?.limit || 20}
          offset={pagination?.offset || 0}
        />
      </CardContent>
    </Card>
  );
};
