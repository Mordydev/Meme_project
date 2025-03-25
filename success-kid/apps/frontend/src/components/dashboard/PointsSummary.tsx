'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatCompactNumber } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Wallet, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsSummaryProps {
  className?: string;
}

// Mock data - in a real implementation, this would come from an API
const MOCK_POINTS_DATA = {
  balance: 1250,
  previousBalance: 1125,
  recentTransactions: [
    { id: 'tx1', amount: 50, source: 'Content Creation', timestamp: new Date(Date.now() - 1800000) },
    { id: 'tx2', amount: 25, source: 'Comment Upvotes', timestamp: new Date(Date.now() - 3600000) },
    { id: 'tx3', amount: 50, source: 'Daily Login Streak', timestamp: new Date(Date.now() - 86400000) },
  ],
  redemptionThreshold: 1000
};

/**
 * PointsSummary - Displays current points balance with animated changes and trend indicators
 */
export function PointsSummary({ className }: PointsSummaryProps) {
  const prefersReducedMotion = useReducedMotion();
  const [currentBalance, setCurrentBalance] = useState(MOCK_POINTS_DATA.balance);
  const [previousBalance, setPreviousBalance] = useState(MOCK_POINTS_DATA.previousBalance);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Calculate change and percentage
  const pointsChange = currentBalance - previousBalance;
  const percentChange = previousBalance ? 
    Math.round((pointsChange / previousBalance) * 100) : 
    0;
  
  // Determine if points are increasing or decreasing
  useEffect(() => {
    if (currentBalance > previousBalance) {
      setIsIncreasing(true);
    } else if (currentBalance < previousBalance) {
      setIsIncreasing(false);
    }
    // Don't change state if equal
  }, [currentBalance, previousBalance]);
  
  // Simulate points update (only for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      // 30% chance of getting points in this demo
      if (Math.random() < 0.3) {
        const amount = Math.floor(Math.random() * 50) + 10;
        setPreviousBalance(currentBalance);
        setCurrentBalance(prev => prev + amount);
        setShowAnimation(true);
        
        // Reset animation flag after animation completes
        setTimeout(() => setShowAnimation(false), 2000);
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [currentBalance]);
  
  // For the redemption progress - calculate percentage towards next 1000 points
  const redemptionProgress = Math.min(100, (currentBalance % 1000) / 10);
  const redemptionGoal = Math.ceil(currentBalance / 1000) * 1000;
  const pointsToGoal = redemptionGoal - currentBalance;
  
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5",
      "shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Success Points
        </h3>
        <div className="flex items-center space-x-1">
          {isIncreasing ? (
            <ArrowUpRight className="w-4 h-4 text-accent-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-alert-500" />
          )}
          <span className={cn(
            "text-sm font-medium",
            isIncreasing ? "text-accent-500" : "text-alert-500"
          )}>
            {Math.abs(percentChange)}%
          </span>
        </div>
      </div>
      
      {/* Points Balance with Animation */}
      <div className="relative h-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBalance}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute"
          >
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-primary-500">
                {formatCompactNumber(currentBalance)}
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">SP</span>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Celebration animation for point increase */}
        {showAnimation && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.2, 1.1, 0.8], y: [10, -20, -30, -40] }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 text-sm font-semibold text-accent-500"
          >
            +{pointsChange} points
          </motion.div>
        )}
      </div>
      
      {/* Recent Transactions Preview */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Recent Activity
          </h4>
          <a 
            href="/points/history" 
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center"
          >
            View All
            <ArrowRight className="w-3 h-3 ml-1" />
          </a>
        </div>
        <div className="space-y-1.5">
          {MOCK_POINTS_DATA.recentTransactions.map(tx => (
            <div key={tx.id} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 truncate max-w-[60%]">
                {tx.source}
              </span>
              <span className="font-medium text-accent-500">
                +{tx.amount} SP
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Redemption Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Next Redemption
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {pointsToGoal} SP to go
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary-500 rounded-full"
            style={{ width: `${redemptionProgress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${redemptionProgress}%` }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          />
        </div>
        <div className="mt-3 flex justify-center">
          <a
            href="/points/redeem"
            className="flex items-center px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 
              text-primary-700 dark:text-primary-300 text-sm font-medium hover:bg-primary-200 
              dark:hover:bg-primary-900/50 transition-colors"
          >
            <Wallet className="w-4 h-4 mr-1.5" />
            <span>Redeem for Tokens</span>
          </a>
        </div>
      </div>
    </div>
  );
}
