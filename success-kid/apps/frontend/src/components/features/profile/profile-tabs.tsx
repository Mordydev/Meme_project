import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export type ProfileTabType = 'activity' | 'achievements' | 'connections' | 'stats';

export interface ProfileTabsProps {
  userId: string;
  defaultTab?: ProfileTabType;
  children?: React.ReactNode;
  onTabChange?: (tab: ProfileTabType) => void;
}

export interface ProfileTabContentProps {
  userId: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

// Tab-specific content components
export function ActivityTabContent({ userId, isLoading, children }: ProfileTabContentProps) {
  return (
    <div className="min-h-[200px]">
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse">Loading activity...</div>
        </div>
      ) : children ? (
        children
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          No activity found for this user
        </div>
      )}
    </div>
  );
}

export function AchievementsTabContent({ userId, isLoading, children }: ProfileTabContentProps) {
  return (
    <div className="min-h-[200px]">
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse">Loading achievements...</div>
        </div>
      ) : children ? (
        children
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          No achievements yet
        </div>
      )}
    </div>
  );
}

export function ConnectionsTabContent({ userId, isLoading, children }: ProfileTabContentProps) {
  return (
    <div className="min-h-[200px]">
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse">Loading connections...</div>
        </div>
      ) : children ? (
        children
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          No connections found
        </div>
      )}
    </div>
  );
}

export function StatsTabContent({ userId, isLoading, children }: ProfileTabContentProps) {
  return (
    <div className="min-h-[200px]">
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse">Loading stats...</div>
        </div>
      ) : children ? (
        children
      ) : (
        <div className="text-center p-8 text-muted-foreground">
          No stats available
        </div>
      )}
    </div>
  );
}

export function ProfileTabs({
  userId,
  defaultTab = 'activity',
  children,
  onTabChange,
}: ProfileTabsProps) {
  const handleTabChange = (value: string) => {
    onTabChange?.(value as ProfileTabType);
  };

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start mb-6 overflow-x-auto no-scrollbar">
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
        <TabsTrigger value="connections">Connections</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>
      
      {children}
    </Tabs>
  );
}
