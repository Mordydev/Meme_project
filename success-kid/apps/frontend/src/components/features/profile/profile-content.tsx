'use client';

import React from 'react';
import { 
  ProfileTabs, 
  TabsContent,
  ActivityTimeline,
  AchievementCollection,
  ConnectionsList,
  ProfileProvider,
  useProfile
} from '@/components/features/profile';

interface ProfileContentProps {
  userId: string;
}

// Inner content component that consumes the profile context
function ProfileContentInner() {
  const { 
    activeTab, 
    setActiveTab, 
    activities, 
    isLoading, 
    achievements,
    connections,
    loadMoreActivities 
  } = useProfile();
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  return (
    <ProfileTabs
      userId="" // Not used directly as we're using context
      defaultTab={activeTab as any}
      onTabChange={handleTabChange}
    >
      <TabsContent value="activity">
        <ActivityTimeline 
          userId="" // Not used directly as we're using context
          isLoading={isLoading && activeTab === 'activity'}
          activities={activities}
          onLoadMore={loadMoreActivities}
        />
      </TabsContent>
      
      <TabsContent value="achievements">
        <AchievementCollection
          userId="" // Not used directly as we're using context
          isLoading={isLoading && activeTab === 'achievements'}
          achievements={achievements}
        />
      </TabsContent>
      
      <TabsContent value="connections">
        <ConnectionsList
          userId="" // Not used directly as we're using context
          type="followers"
          isLoading={isLoading && activeTab === 'connections'}
          connections={connections.followers}
        />
      </TabsContent>
      
      <TabsContent value="stats">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Detailed Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activity Stats */}
            <div className="bg-muted p-4 rounded-md">
              <h4 className="font-medium mb-3">Activity</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posts Created</span>
                  <span className="font-medium">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comments</span>
                  <span className="font-medium">142</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reactions</span>
                  <span className="font-medium">318</span>
                </div>
              </div>
            </div>
            
            {/* Points Stats */}
            <div className="bg-muted p-4 rounded-md">
              <h4 className="font-medium mb-3">Points</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Earned</span>
                  <span className="font-medium">1,250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From Content</span>
                  <span className="font-medium">850</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From Achievements</span>
                  <span className="font-medium">400</span>
                </div>
              </div>
            </div>
            
            {/* Achievements Stats */}
            <div className="bg-muted p-4 rounded-md">
              <h4 className="font-medium mb-3">Achievements</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unlocked</span>
                  <span className="font-medium">8 / 25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Common</span>
                  <span className="font-medium">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rare</span>
                  <span className="font-medium">3</span>
                </div>
              </div>
            </div>
            
            {/* Engagement Stats */}
            <div className="bg-muted p-4 rounded-md">
              <h4 className="font-medium mb-3">Engagement</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Responses</span>
                  <span className="font-medium">6.2 per post</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Most Active Day</span>
                  <span className="font-medium">Wednesday</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activity Streak</span>
                  <span className="font-medium">7 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </ProfileTabs>
  );
}

// Wrapper component that provides the profile context
export function ProfileContent({ userId }: ProfileContentProps) {
  return (
    <ProfileProvider userId={userId} isOwnProfile={true}>
      <ProfileContentInner />
    </ProfileProvider>
  );
}
