'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePointsStore } from '@/store/usePointsStore';
import { PointsSummary } from './PointsSummary';
import { PointsBreakdown } from './PointsBreakdown';
import { RecentTransactions } from './RecentTransactions';
import { DailyCapStatus } from './DailyCapStatus';
import { PointsRedemptionCalculator } from './PointsRedemptionCalculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Primary dashboard for Success Points showing summary, breakdown, and transactions
 */
export function PointsDashboard() {
  const { 
    balance, 
    transactions,
    dashboardData,
    isLoading,
    fetchBalance,
    fetchDashboard,
    fetchTransactions,
    fetchRedemptionEligibility,
    fetchTrends
  } = usePointsStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch data when component mounts
  useEffect(() => {
    // Fetch all required data for the dashboard
    const fetchData = async () => {
      await Promise.all([
        fetchDashboard(),
        fetchTransactions(),
        fetchRedemptionEligibility(),
        fetchTrends('week')
      ]);
    };
    
    fetchData();
  }, [fetchDashboard, fetchTransactions, fetchRedemptionEligibility, fetchTrends]);
  
  // Calculate daily points earned (transactions from today) if dashboardData not available
  const today = new Date().toDateString();
  const dailyPoints = dashboardData?.dailyEarned ?? transactions
    .filter(tx => new Date(tx.timestamp).toDateString() === today && tx.amount > 0)
    .reduce((total, tx) => total + tx.amount, 0);
  
  // Lifetime points from dashboardData or calculate
  const lifetimePoints = dashboardData?.lifetimeEarned ?? balance + transactions
    .filter(tx => tx.amount < 0)
    .reduce((total, tx) => total + Math.abs(tx.amount), 0);
  
  // Redeemed points from dashboardData or calculate
  const redeemedPoints = dashboardData?.redeemed ?? transactions
    .filter(tx => tx.amount < 0 && tx.source === 'redemption')
    .reduce((total, tx) => total + Math.abs(tx.amount), 0);
  
  if (isLoading && !dashboardData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Points summary section */}
      <PointsSummary 
        currentBalance={balance}
        lifetimeEarned={lifetimePoints}
        dailyEarned={dailyPoints}
        redeemed={redeemedPoints}
      />
      
      {/* Tabs for different dashboard views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="caps">Daily Caps</TabsTrigger>
          <TabsTrigger value="redeem">Redeem</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PointsBreakdown />
            <Card>
              <CardHeader>
                <CardTitle>Earning Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Discover ways to earn more Success Points through platform engagement.
                </p>
                <div className="mt-4 space-y-3">
                  <EarningOpportunity 
                    title="Create Quality Content" 
                    points={50}
                    description="Post valuable content to earn points and engagement rewards"
                  />
                  <EarningOpportunity 
                    title="Daily Login Streak" 
                    points={20}
                    description="Log in daily to build your streak bonus"
                  />
                  <EarningOpportunity 
                    title="Comment & Engage" 
                    points={15}
                    description="Participate in discussions to earn engagement points"
                  />
                  <EarningOpportunity 
                    title="Refer New Members" 
                    points={500}
                    description="Invite friends to join the platform"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <RecentTransactions limit={5} showViewAll />
        </TabsContent>
        
        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          <RecentTransactions showFilters />
        </TabsContent>
        
        {/* Daily Caps Tab */}
        <TabsContent value="caps" className="mt-6">
          <DailyCapStatus />
        </TabsContent>
        
        {/* Redeem Tab */}
        <TabsContent value="redeem" className="mt-6">
          <PointsRedemptionCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for displaying earning opportunities
function EarningOpportunity({ 
  title, 
  points, 
  description 
}: { 
  title: string; 
  points: number; 
  description: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-primary"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center font-mono text-lg font-semibold text-primary">
        +{points}
      </div>
    </div>
  );
}
