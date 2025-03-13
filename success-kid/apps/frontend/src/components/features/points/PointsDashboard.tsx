'use client';

import { useState, useEffect } from 'react';
import PointsSummary from './PointsSummary';
import PointsBreakdown from './PointsBreakdown';
import RecentTransactions from './RecentTransactions';
import DailyCapStatus from './DailyCapStatus';
import EarningOpportunities from './EarningOpportunities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { usePointsData } from '@/hooks/usePointsData';

export interface PointsDashboardProps {
  userId: string;
  initialData?: any;
}

export default function PointsDashboard({ userId, initialData }: PointsDashboardProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = usePointsData(userId, initialData);
  
  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    // This is a placeholder for WebSocket implementation
    // In a real implementation, we would connect to a WebSocket server
    // and listen for events like 'points:earned', 'points:cap_updated', etc.
    
    const cleanup = () => {
      // Cleanup WebSocket connection
    };
    
    return cleanup;
  }, [userId]);
  
  // Handle error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-alert">
            <p className="text-lg font-semibold">Failed to load points data</p>
            <p className="mt-2">Please try refreshing the page.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Summary Cards - Full Width on Mobile, Split on Larger Screens */}
      <div className="md:col-span-2">
        <PointsSummary 
          currentBalance={data?.currentBalance || 0}
          lifetimeEarned={data?.lifetimeEarned || 0}
          redeemed={data?.redeemed || 0}
          dailyEarned={data?.dailyEarned || 0}
          isLoading={isLoading}
        />
      </div>
      
      {/* Points Breakdown - Pie Chart */}
      <div className="md:col-span-1">
        <PointsBreakdown 
          breakdown={data?.breakdown || []}
          isLoading={isLoading}
        />
      </div>
      
      {/* Recent Transactions - Full Width */}
      <div className="md:col-span-2 lg:col-span-2">
        <RecentTransactions 
          transactions={data?.transactions || []}
          isLoading={isLoading}
        />
      </div>
      
      {/* Right Column - Caps and Opportunities */}
      <div className="flex flex-col space-y-6 md:col-span-2 lg:col-span-1">
        <DailyCapStatus 
          caps={data?.caps || {}}
          isLoading={isLoading}
        />
        
        <EarningOpportunities />
      </div>
    </div>
  );
}
