'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';

interface CapInfo {
  limit: number;
  used: number;
  resetsAt: string;
}

interface DailyCapStatusProps {
  caps: Record<string, CapInfo>;
  isLoading?: boolean;
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    content: 'Content Creation',
    engagement: 'Engagement',
    achievements: 'Achievements',
    referrals: 'Referrals',
    default: 'Other'
  };
  
  return labels[category] || category;
};

export default function DailyCapStatus({
  caps,
  isLoading = false
}: DailyCapStatusProps) {
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  
  useEffect(() => {
    // Find the earliest reset time
    let earliestReset: string | null = null;
    
    Object.values(caps).forEach((cap) => {
      if (!earliestReset || new Date(cap.resetsAt) < new Date(earliestReset)) {
        earliestReset = cap.resetsAt;
      }
    });
    
    if (earliestReset) {
      // Set up interval to update the countdown
      const updateCountdown = () => {
        const now = new Date();
        const reset = new Date(earliestReset!);
        const diffMs = reset.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          setTimeUntilReset('Resetting...');
          return;
        }
        
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeUntilReset(`${diffHrs}h ${diffMins}m`);
      };
      
      // Initial update
      updateCountdown();
      
      // Set interval for updates
      const interval = setInterval(updateCountdown, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [caps]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Caps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-36">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const categories = Object.keys(caps);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Daily Caps</span>
          {timeUntilReset && (
            <span className="text-sm font-normal text-muted-foreground">
              Resets in: {timeUntilReset}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No active caps</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category, index) => {
              const cap = caps[category];
              const percentage = Math.min(100, Math.round((cap.used / cap.limit) * 100));
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{getCategoryLabel(category)}</span>
                    <span className="text-sm text-muted-foreground">
                      {cap.used}/{cap.limit} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${percentage >= 90 ? 'bg-alert' : percentage >= 70 ? 'bg-secondary' : 'bg-primary'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cap.limit - cap.used} points remaining today
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
