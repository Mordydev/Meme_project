'use client';

import { useState, useEffect } from 'react';
import { usePointsStore } from '@/store/usePointsStore';
import { useAchievements } from '@/hooks/useAchievements';
import { useReferralStore } from '@/store/useReferralStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PointsOverview } from './PointsOverview';
import { TransactionHistory } from './TransactionHistory';
import { AchievementGallery } from './AchievementGallery';
import { LeaderboardSection } from './LeaderboardSection';
import { RedemptionCenter } from './RedemptionCenter';
import { ReferralProgram } from './ReferralProgram';
import { AchievementCelebrationModal } from './AchievementCelebrationModal';
import { AlertTriangle } from 'lucide-react';

/**
 * Main Rewards Page Component
 * Serves as a comprehensive rewards hub with multiple tabbed sections
 */
export function RewardsPage() {
  const { 
    balance, 
    dashboardData, 
    fetchBalance, 
    fetchDashboard,
    isLoading: pointsLoading, 
    error: pointsError 
  } = usePointsStore();
  
  const {
    achievements,
    unlockedAchievements,
    currentAchievement,
    dismissAchievement,
    isLoading: achievementsLoading
  } = useAchievements();
  
  const {
    referralCode,
    statistics: referralStats,
    fetchReferralInfo,
    isLoading: referralLoading
  } = useReferralStore();
  
  const [activeTab, setActiveTab] = useState('points');
  
  // Load initial data
  useEffect(() => {
    fetchBalance();
    fetchDashboard();
    fetchReferralInfo();
  }, [fetchBalance, fetchDashboard, fetchReferralInfo]);
  
  // Load tab-specific data when tab changes
  useEffect(() => {
    // Add specific data loading based on active tab if needed
  }, [activeTab]);
  
  const isLoading = pointsLoading || achievementsLoading || referralLoading;
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Rewards Center</h1>
          <p className="text-neutral-500 mt-1">Track your progress, earn rewards, and redeem your Success Points</p>
        </div>
      </div>
      
      {/* Error Alert */}
      {pointsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Error loading rewards data</h3>
            <p className="text-red-700 text-sm mt-1">{pointsError.message}</p>
          </div>
        </div>
      )}
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 md:w-fit w-full">
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="redeem">Redemption</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>
        
        {/* Points Overview Tab */}
        <TabsContent value="points" className="space-y-6">
          <PointsOverview 
            balance={balance}
            dashboardData={dashboardData}
            isLoading={isLoading}
          />
        </TabsContent>
        
        {/* Transaction History Tab */}
        <TabsContent value="history" className="space-y-6">
          <TransactionHistory />
        </TabsContent>
        
        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <AchievementGallery 
            achievements={achievements}
            unlockedAchievements={unlockedAchievements}
            isLoading={isLoading} 
          />
        </TabsContent>
        
        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <LeaderboardSection />
        </TabsContent>
        
        {/* Redemption Tab */}
        <TabsContent value="redeem" className="space-y-6">
          <RedemptionCenter 
            balance={balance}
            isLoading={isLoading}
          />
        </TabsContent>
        
        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-6">
          <ReferralProgram 
            referralCode={referralCode}
            referralStats={referralStats}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
      
      {/* Achievement Celebration Modal */}
      {currentAchievement && (
        <AchievementCelebrationModal
          achievement={currentAchievement}
          onClose={dismissAchievement}
        />
      )}
    </div>
  );
}
