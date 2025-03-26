'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GlobalLeaderboard, CategoryLeaderboards, PersonalRanking } from '@/components/features/leaderboard';
import { LeaderboardCategory, TimeFrame } from '@/types/leaderboard';
import { useAuth } from '@/hooks';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('global');
  
  // Handle user selection
  const handleUserSelect = (userId: string) => {
    // Navigate to user profile
    console.log('Selected user:', userId);
    // In a real implementation, this would navigate to the user profile
  };
  
  // Default category and time period
  const initialCategory: LeaderboardCategory = 'points';
  const initialTimeframe: TimeFrame = 'weekly';
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
      <p className="text-neutral-500 mb-8">
        Track the top contributors and your own ranking across the community
      </p>
      
      <Tabs
        defaultValue="global"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-8">
          <TabsTrigger value="global">Global Ranking</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="personal">Your Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          <GlobalLeaderboard
            initialCategory={initialCategory}
            initialTimeframe={initialTimeframe}
            highlightUserId={user?.id}
            onUserSelect={handleUserSelect}
          />
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoryLeaderboards
            categories={['points', 'content', 'comments', 'achievements', 'referrals']}
            initialCategory={initialCategory}
            initialTimeframe={initialTimeframe}
            onUserSelect={handleUserSelect}
          />
        </TabsContent>
        
        <TabsContent value="personal">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PersonalRanking
                userId={user?.id}
                initialTimeframe="monthly"
                showGoals={true}
              />
            </div>
            <div>
              {/* Display achievements or additional stats in a sidebar */}
              <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                <h2 className="text-xl font-semibold mb-4">Your Achievement Highlights</h2>
                <p className="text-neutral-500">
                  This section will display your top achievements and badges.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
