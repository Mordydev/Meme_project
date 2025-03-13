'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { formatCompactNumber } from '@/lib/utils';
import { PointsDisplay } from './PointsDisplay';
import { Spinner } from '@/components/ui/Spinner';

interface PointsSummaryProps {
  currentBalance: number;
  lifetimeEarned: number;
  redeemed: number;
  dailyEarned: number;
  isLoading?: boolean;
}

export default function PointsSummary({
  currentBalance,
  lifetimeEarned,
  redeemed,
  dailyEarned,
  isLoading = false
}: PointsSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Points Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate conversion value (100 SP = 1 SKC)
  const tokenValue = currentBalance / 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Points Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Current Balance - Larger, Highlighted */}
          <motion.div 
            className="sm:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PointsDisplay 
              points={currentBalance} 
              label="Available Balance" 
              variant="highlight"
              animated
            />
          </motion.div>
          
          {/* Token Value */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="bg-secondary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Token Value</span>
                  <span className="text-3xl font-mono font-bold">
                    {tokenValue.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">SKC Tokens</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Daily Earned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Earned Today</span>
                  <span className="text-3xl font-mono font-bold">
                    {formatCompactNumber(dailyEarned)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">Points</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Lifetime Stats */}
          <motion.div
            className="sm:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Lifetime Earned</span>
                    <span className="text-2xl font-mono font-bold">
                      {formatCompactNumber(lifetimeEarned)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Redeemed</span>
                    <span className="text-2xl font-mono font-bold">
                      {formatCompactNumber(redeemed)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
