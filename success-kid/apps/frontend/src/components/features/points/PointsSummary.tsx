'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCompactNumber } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PointsSummaryProps {
  currentBalance: number;
  lifetimeEarned: number;
  dailyEarned: number;
  redeemed?: number;
}

/**
 * Component to display key points metrics
 */
export function PointsSummary({
  currentBalance,
  lifetimeEarned,
  dailyEarned,
  redeemed = 0,
}: PointsSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Current Balance */}
      <Card className="border-2 border-primary bg-primary/5">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Current Balance</h3>
          <motion.div
            key={currentBalance}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mt-2"
          >
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-primary"
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
              <span className="font-mono text-3xl font-bold text-primary">
                {formatCompactNumber(currentBalance)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Success Points available for redemption
            </p>
          </motion.div>
        </CardContent>
      </Card>

      {/* Lifetime Earned */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Lifetime Earned</h3>
          <div className="mt-2 flex items-center gap-2">
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
              />
            </svg>
            <span className="font-mono text-2xl font-bold">
              {formatCompactNumber(lifetimeEarned)}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Total points earned since joining
          </p>
        </CardContent>
      </Card>

      {/* Daily Earned */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Today's Earnings</h3>
          <div className="mt-2 flex items-center gap-2">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <span className="font-mono text-2xl font-bold">
              {formatCompactNumber(dailyEarned)}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Points earned in the last 24 hours
          </p>
        </CardContent>
      </Card>

      {/* Redeemed */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Redeemed</h3>
          <div className="mt-2 flex items-center gap-2">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
              />
            </svg>
            <span className="font-mono text-2xl font-bold">
              {formatCompactNumber(redeemed)}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Points converted to tokens
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
