'use client';

import React, { useState } from 'react';
import { AchievementProvider } from '@/components/features/achievements/AchievementProvider';
import { AchievementGrid } from '@/components/features/achievements/AchievementGrid';
import { AchievementDetail } from '@/components/features/achievements/AchievementDetail';
import { LevelProvider } from '@/components/features/levels/LevelProvider';
import { LevelProgressBar } from '@/components/features/levels/LevelProgressBar';
import { LevelBadge } from '@/components/features/levels/LevelBadge';
import { LevelBenefits } from '@/components/features/levels/LevelBenefits';
import { Leaderboard } from '@/components/features/leaderboard/Leaderboard';
import { GamificationDashboard } from '@/components/features/analytics/GamificationDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AchievementsPage() {
  const { user } = useAuth();
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Track which tab to show
  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard' | 'analytics'>('achievements');
  
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
  
  // Simulate achievement event for demo
  const handleTriggerEvent = async (type: string) => {
    if (!window) return;
    
    // Access AchievementProvider context via ref (in a real implementation,
    // you would use the useAchievements hook directly in the component)
    const achievementContext = (window as any).achievementContext;
    if (achievementContext && achievementContext.triggerEvent) {
      await achievementContext.triggerEvent({
        type,
        metadata: { timestamp: new Date().toISOString() }
      });
    }
  };
  
  return (
    <AchievementProvider userId={user?.id || 'guest'}>
      <LevelProvider>
        <div className="container mx-auto py-6 space-y-6">
          {/* Level progress section */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">Your Level</CardTitle>
                <LevelBadge size="md" />
              </CardHeader>
              <CardContent className="pt-4">
                <LevelProgressBar variant="detailed" showPoints />
                
                {/* Demo buttons for testing events */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleTriggerEvent('profile_updated')}>
                    Simulate Profile Update
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTriggerEvent('wallet_connected')}>
                    Simulate Wallet Connection
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTriggerEvent('content_created')}>
                    Simulate Content Creation
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTriggerEvent('comment_created')}>
                    Simulate Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <LevelBenefits />
          </div>
          
          {/* Tabs for achievements, leaderboard, analytics */}
          <Tabs 
            defaultValue="achievements" 
            onValueChange={(value) => setActiveTab(value as any)}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="achievements" className="space-y-4">
              <AchievementGrid 
                onSelect={handleAchievementSelect}
                selectedId={selectedAchievementId || undefined}
              />
            </TabsContent>
            
            <TabsContent value="leaderboard">
              <Leaderboard />
            </TabsContent>
            
            <TabsContent value="analytics">
              <GamificationDashboard />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Expose context for demo */}
        <div style={{ display: 'none' }} ref={(el) => {
          if (el && window) {
            // This is just for the demo to allow triggering events
            // In a real implementation, you would use the useAchievements hook
            (window as any).achievementContext = {
              triggerEvent: async (event: any) => {
                const { achievements } = await import('@/hooks/useAchievements');
                if (achievements && achievements.triggerAchievement) {
                  return achievements.triggerAchievement(event.type, event.metadata);
                }
              }
            };
          }
        }} />
      </LevelProvider>
    </AchievementProvider>
  );
}
