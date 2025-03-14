'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCompactNumber } from '@/lib/utils';
import { useReferralStore } from '@/store/useReferralStore';

type TimeRange = 'week' | 'month' | 'year' | 'all-time';

interface ReferralDashboardProps {
  className?: string;
}

export function ReferralDashboard({ className }: ReferralDashboardProps) {
  const { 
    statistics, 
    timeline,
    timeRange,
    setTimeRange,
    fetchStatistics,
    isStatsLoading
  } = useReferralStore();
  
  // Load statistics on mount
  useEffect(() => {
    fetchStatistics(timeRange);
  }, [fetchStatistics, timeRange]);
  
  // Handle time range change
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Referrals Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
              ) : (
                formatCompactNumber(statistics.totalReferrals)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              People you&apos;ve invited to the platform
            </p>
          </CardContent>
        </Card>
        
        {/* Converted Referrals Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Converted Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
              ) : (
                formatCompactNumber(statistics.convertedReferrals)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Referrals who completed key actions
            </p>
          </CardContent>
        </Card>
        
        {/* Conversion Rate Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
              ) : (
                `${statistics.conversionRate.toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of successful referrals
            </p>
          </CardContent>
        </Card>
        
        {/* Points Earned Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
              ) : (
                formatCompactNumber(statistics.pointsEarned)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total Success Points from referrals
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Referral Performance</h3>
        <div className="flex space-x-2">
          <Button 
            variant={timeRange === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleTimeRangeChange('week')}
            className="text-xs"
          >
            Week
          </Button>
          <Button 
            variant={timeRange === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleTimeRangeChange('month')}
            className="text-xs"
          >
            Month
          </Button>
          <Button 
            variant={timeRange === 'year' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleTimeRangeChange('year')}
            className="text-xs"
          >
            Year
          </Button>
          <Button 
            variant={timeRange === 'all-time' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleTimeRangeChange('all-time')}
            className="text-xs"
          >
            All Time
          </Button>
        </div>
      </div>
      
      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isStatsLoading ? (
            <div className="h-64 w-full animate-pulse rounded bg-gray-200" />
          ) : timeline.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-center text-muted-foreground">
                No referral activity for the selected time period
              </p>
            </div>
          ) : (
            <div className="h-64">
              {/* In a real implementation, this would be a chart component */}
              <div className="flex h-full items-end space-x-2">
                {timeline.map((item, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center">
                    <div 
                      className="w-full bg-primary"
                      style={{ 
                        height: `${(item.referrals / Math.max(...timeline.map(t => t.referrals))) * 100}%`,
                        minHeight: item.referrals > 0 ? '4px' : '0'
                      }}
                    />
                    <span className="mt-2 text-xs">{item.period}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
