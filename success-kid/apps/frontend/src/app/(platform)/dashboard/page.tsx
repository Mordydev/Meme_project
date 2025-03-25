'use client';

import React from 'react';
import { 
  DashboardLayout,
  SectionContainer,
  CardGrid 
} from '@/components/layout';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { PointsSummary } from '@/components/dashboard/PointsSummary';
import { AchievementProgress } from '@/components/dashboard/AchievementProgress';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { MarketMilestoneTracker } from '@/components/dashboard/MarketMilestoneTracker';
import { ReferralCard } from '@/components/dashboard/ReferralCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { cn } from '@/lib/utils';

/**
 * Dashboard Page - Main landing page for authenticated users
 * Serves as the central command center for users to track progress and engage with the platform
 */
export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Welcome Header */}
      <WelcomeHeader />
      
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Stats & Achievements) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Cards Section */}
          <SectionContainer>
            <CardGrid columns={{ default: 1, md: 2 }} gap="md">
              <PointsSummary />
              <ReferralCard />
            </CardGrid>
          </SectionContainer>
          
          {/* Achievement Progress */}
          <SectionContainer
            title="Achievement Progress"
            description="Your progress toward upcoming achievements"
          >
            <AchievementProgress />
          </SectionContainer>
          
          {/* Market Milestone Tracker */}
          <SectionContainer
            title="Market Milestones"
            description="Track our community's progress toward the next milestone"
          >
            <MarketMilestoneTracker />
          </SectionContainer>
        </div>
        
        {/* Right Column (Activity & Quick Actions) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <SectionContainer
            title="Quick Actions"
            description="Get started with these activities"
          >
            <QuickActions />
          </SectionContainer>
          
          {/* Activity Feed */}
          <SectionContainer
            title="Community Activity"
            description="Recent platform activity"
            className="lg:h-[calc(100vh-32rem)]"
            contentClassName="h-full"
          >
            <ActivityFeed className={cn(
              "h-full overflow-auto",
              "max-h-[60vh] lg:max-h-none" // Limit height on mobile
            )} />
          </SectionContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
