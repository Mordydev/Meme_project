'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useReferral } from '@/hooks/useReferral';
import { useReferralStore } from '@/store/useReferralStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCompactNumber } from '@/lib/utils';

interface ReferralDashboardProps {
  className?: string;
}

/**
 * Dashboard displaying referral performance metrics
 */
export function ReferralDashboard({ className }: ReferralDashboardProps) {
  const { statistics, isLoading } = useReferral();
  const { fetchReferralStatistics, timeline } = useReferralStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all-time'>('month');

  // Fetch referral statistics when mounted or time range changes
  useEffect(() => {
    fetchReferralStatistics(timeRange);
  }, [fetchReferralStatistics, timeRange]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Referral Performance</h3>
        
        {/* Time Range Selector */}
        <div className="flex space-x-2 mb-6">
          <Button 
            size="sm" 
            variant={timeRange === 'week' ? 'default' : 'outline'}
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button 
            size="sm" 
            variant={timeRange === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
          <Button 
            size="sm" 
            variant={timeRange === 'year' ? 'default' : 'outline'}
            onClick={() => setTimeRange('year')}
          >
            Year
          </Button>
          <Button 
            size="sm" 
            variant={timeRange === 'all-time' ? 'default' : 'outline'}
            onClick={() => setTimeRange('all-time')}
          >
            All Time
          </Button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total Referrals" 
            value={statistics.totalReferrals} 
            isLoading={isLoading}
            icon="👥"
          />
          <StatCard 
            title="Converted" 
            value={statistics.convertedReferrals} 
            isLoading={isLoading}
            icon="✅"
          />
          <StatCard 
            title="Conversion Rate" 
            value={statistics.conversionRate} 
            valueFormat="percent"
            isLoading={isLoading}
            icon="📈"
          />
          <StatCard 
            title="Points Earned" 
            value={statistics.pointsEarned} 
            isLoading={isLoading}
            icon="🏆"
          />
        </div>
      </Card>
      
      {/* Timeline Chart */}
      {timeline && timeline.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
          
          <div className="h-[200px] relative">
            {/* Simple bar chart */}
            <div className="absolute inset-0 flex items-end justify-between pt-6">
              {timeline.map((period, index) => {
                // Get max value for normalization
                const maxValue = Math.max(...timeline.map(t => t.referrals));
                const heightPercentage = maxValue ? (period.referrals / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center w-full">
                    <motion.div 
                      className="w-4/5 max-w-[30px] bg-primary rounded-t"
                      style={{ height: `${heightPercentage}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    />
                    <div className="text-xs mt-2 text-center text-neutral-500">{period.period}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
      
      {/* Conversion Funnel */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
        
        <div className="space-y-4 max-w-md mx-auto">
          <FunnelStep 
            label="Invited" 
            value={statistics.totalReferrals} 
            percentage={100} 
            isLoading={isLoading}
          />
          <FunnelStep 
            label="Registered" 
            value={statistics.totalReferrals - statistics.pendingReferrals} 
            percentage={(statistics.totalReferrals - statistics.pendingReferrals) / statistics.totalReferrals * 100} 
            isLoading={isLoading}
          />
          <FunnelStep 
            label="Converted" 
            value={statistics.convertedReferrals} 
            percentage={statistics.convertedReferrals / statistics.totalReferrals * 100} 
            isLoading={isLoading}
          />
        </div>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  valueFormat?: 'number' | 'percent' | 'compact';
  isLoading?: boolean;
  icon?: string;
}

function StatCard({ title, value, valueFormat = 'number', isLoading, icon }: StatCardProps) {
  const formattedValue = () => {
    if (valueFormat === 'percent') return `${value.toFixed(1)}%`;
    if (valueFormat === 'compact') return formatCompactNumber(value);
    return value.toLocaleString();
  };
  
  return (
    <div className="bg-neutral-50 rounded-lg p-4">
      <div className="flex items-center mb-2">
        {icon && <span className="text-xl mr-2">{icon}</span>}
        <span className="text-sm text-neutral-600">{title}</span>
      </div>
      
      {isLoading ? (
        <div className="h-8 w-16 bg-neutral-200 animate-pulse rounded"></div>
      ) : (
        <div className="text-2xl font-semibold">{formattedValue()}</div>
      )}
    </div>
  );
}

interface FunnelStepProps {
  label: string;
  value: number;
  percentage: number;
  isLoading?: boolean;
}

function FunnelStep({ label, value, percentage, isLoading }: FunnelStepProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        {isLoading ? (
          <div className="h-4 w-12 bg-neutral-200 animate-pulse rounded"></div>
        ) : (
          <span>{value.toLocaleString()}</span>
        )}
      </div>
      
      <div className="w-full bg-neutral-200 rounded-full h-2.5">
        {isLoading ? (
          <div className="bg-neutral-300 animate-pulse h-2.5 rounded-full" style={{ width: '60%' }}></div>
        ) : (
          <motion.div 
            className="bg-primary h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(percentage, 2)}%` }}
            transition={{ duration: 0.5 }}
          />
        )}
      </div>
    </div>
  );
}
