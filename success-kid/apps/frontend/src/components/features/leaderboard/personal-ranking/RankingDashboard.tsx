'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaderboardCategory, LeaderboardPeriod } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { useRankingHistory } from '@/hooks/queries/useRankingHistory';
import { HistoricalChart } from './HistoricalChart';
import { RankingBreakdown } from './RankingBreakdown';
import { ImprovementSuggestions } from './ImprovementSuggestions';

interface RankingDashboardProps {
  userId?: string; // Optional, if not provided uses current user
  initialPeriod?: LeaderboardPeriod;
  className?: string;
}

/**
 * RankingDashboard
 * 
 * Component to display a user's historical ranking performance
 */
export function RankingDashboard({ 
  userId,
  initialPeriod = 'monthly',
  className 
}: RankingDashboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [category, setCategory] = useState<LeaderboardCategory>('points');
  
  const { data, isLoading, isError } = useRankingHistory({ 
    category,
    period
  });
  
  // Handle period change
  const handlePeriodChange = (newPeriod: LeaderboardPeriod) => {
    setPeriod(newPeriod);
  };
  
  // Handle category change
  const handleCategoryChange = (newCategory: LeaderboardCategory) => {
    setCategory(newCategory);
  };
  
  // Period tabs configuration
  const periodTabs: { id: LeaderboardPeriod; label: string }[] = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'all-time', label: 'All Time' }
  ];
  
  // Category tabs configuration
  const categoryTabs: { id: LeaderboardCategory; label: string }[] = [
    { id: 'points', label: 'Overall Points' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'content', label: 'Content Creation' },
    { id: 'referrals', label: 'Referrals' }
  ];
  
  // Handle loading state
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle>Your Ranking</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }
  
  // Handle error state
  if (isError || !data) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle>Your Ranking</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium">Unable to load ranking data</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            There was an error loading your ranking history. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Extract current category data
  const currentCategoryData = data.categories[category];
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b pb-2">
        <CardTitle>Your Ranking Performance</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Category Tabs */}
        <div className="border-b">
          <TabsList className="w-full justify-start rounded-none px-4 py-2 bg-transparent">
            {categoryTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onClick={() => handleCategoryChange(tab.id)}
                className={cn(
                  "rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                  category === tab.id ? "bg-primary text-primary-foreground" : ""
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {/* Period Selection */}
        <div className="border-b p-4">
          <div className="inline-flex rounded-md shadow-sm">
            {periodTabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "px-4 py-2 text-sm font-medium border",
                  "rounded-none first:rounded-l-md last:rounded-r-md",
                  period === tab.id 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background text-foreground border-input hover:bg-muted"
                )}
                onClick={() => handlePeriodChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b">
          <div className="flex flex-col items-center p-4 border rounded-md">
            <div className="text-2xl font-bold">{currentCategoryData.currentRank}</div>
            <div className="text-sm text-muted-foreground">Current Rank</div>
          </div>
          
          <div className="flex flex-col items-center p-4 border rounded-md">
            <div className="text-2xl font-bold">{currentCategoryData.bestRank}</div>
            <div className="text-sm text-muted-foreground">Best Rank</div>
          </div>
          
          <div className="flex flex-col items-center p-4 border rounded-md">
            <div className="text-2xl font-bold">{currentCategoryData.totalScore.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Score</div>
          </div>
        </div>
        
        {/* Historical Chart */}
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-4">Ranking History</h3>
          <HistoricalChart 
            rankingHistory={data.history}
            timeframe={period}
          />
        </div>
        
        {/* Tabs for additional sections */}
        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            <TabsTrigger value="breakdown">Category Breakdown</TabsTrigger>
            <TabsTrigger value="improvement">Improvement Tips</TabsTrigger>
          </TabsList>
          
          <TabsContent value="breakdown" className="p-4">
            <RankingBreakdown categories={data.categories} />
          </TabsContent>
          
          <TabsContent value="improvement" className="p-4">
            <ImprovementSuggestions 
              currentCategory={category}
              currentRank={currentCategoryData.currentRank}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
