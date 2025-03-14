'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MiniRedemptionWidget } from './MiniRedemptionWidget';
import { useRouter } from 'next/navigation';
import { useRedemptionEligibility } from '@/hooks/useRedemptionData';
import { useAuth } from '@/hooks/useAuth';

interface DashboardRedemptionWidgetProps {
  className?: string;
}

export const DashboardRedemptionWidget: React.FC<DashboardRedemptionWidgetProps> = ({
  className,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = useRedemptionEligibility(user?.id || '');
  
  // Navigate to redemption page
  const navigateToRedemption = () => {
    router.push('/wallet/redeem');
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Points Redemption</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Points Redemption</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-neutral-500 text-center py-4">Unable to load redemption information</p>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={navigateToRedemption}
          >
            View Redemption Options
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Points Redemption</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-neutral-600">Points Balance:</span>
            <span className="font-medium">{data.pointsBalance} SP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Weekly Redemption:</span>
            <span className="font-medium">
              {data.limits.weeklyUsed} / {data.limits.weeklyLimit} SP
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-100 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, (data.limits.weeklyUsed / data.limits.weeklyLimit) * 100)}%` }}
            />
          </div>
        </div>
        
        <MiniRedemptionWidget
          userId={user?.id || ''}
          onRedeemClick={navigateToRedemption}
          showBalance={false}
        />
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={navigateToRedemption}
        >
          View Redemption History
        </Button>
      </CardFooter>
    </Card>
  );
};
