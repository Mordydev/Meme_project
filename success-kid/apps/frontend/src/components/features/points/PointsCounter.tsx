/**
 * Real-time Points Counter Component
 * 
 * Displays user's points balance with real-time updates via WebSockets.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Zap, TrendingUp, Award } from 'lucide-react';

interface PointsCounterProps {
  initialPoints?: number;
  className?: string;
  showRank?: boolean;
  compact?: boolean;
}

/**
 * Points Counter Component with real-time updates
 */
export function PointsCounter({
  initialPoints = 0,
  className = '',
  showRank = false,
  compact = false
}: PointsCounterProps) {
  const [points, setPoints] = useState(initialPoints);
  const [recentChange, setRecentChange] = useState<number | null>(null);
  const [rank, setRank] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const { subscribe, status } = useWebSocket();
  const prefersReducedMotion = useReducedMotion();
  
  // Subscribe to points updates
  useEffect(() => {
    if (status.state !== 'connected') return;
    
    // Subscribe to points balance updates
    const balanceSub = subscribe('points.balance', (message) => {
      const newTotal = message.payload?.total;
      if (typeof newTotal === 'number') {
        setPoints(newTotal);
      }
    });
    
    // Subscribe to points awarded events
    const awardedSub = subscribe('points.awarded', (message) => {
      const amount = message.payload?.amount;
      const newTotal = message.payload?.total;
      
      if (typeof amount === 'number') {
        // Show recent change
        setRecentChange(amount);
        
        // Clear after animation
        setTimeout(() => {
          setRecentChange(null);
        }, 3000);
      }
      
      if (typeof newTotal === 'number') {
        setPoints(newTotal);
      }
    });
    
    // Subscribe to level updates
    const levelSub = subscribe('user.levelUp', (message) => {
      const newLevel = message.payload?.newLevel;
      if (typeof newLevel === 'number') {
        setLevel(newLevel);
      }
    });
    
    // Subscribe to rank updates
    const rankSub = subscribe('user.rankUpdated', (message) => {
      const newRank = message.payload?.rank;
      if (typeof newRank === 'string') {
        setRank(newRank);
      }
    });
    
    // Cleanup subscriptions
    return () => {
      balanceSub();
      awardedSub();
      levelSub();
      rankSub();
    };
  }, [status.state, subscribe]);
  
  // Format points with thousands separator
  const formattedPoints = points.toLocaleString();
  
  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Zap className="w-4 h-4 text-yellow-500" />
        <span className="font-medium">{formattedPoints}</span>
        
        <AnimatePresence>
          {recentChange !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-green-500 font-medium text-sm ml-1"
            >
              +{recentChange.toLocaleString()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  return (
    <div className={`rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20 p-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-800">
            <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Points Balance</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formattedPoints}
              </span>
              
              <AnimatePresence>
                {recentChange !== null && !prefersReducedMotion && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="text-green-600 dark:text-green-400 font-medium text-sm"
                  >
                    +{recentChange.toLocaleString()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {showRank && (
          <div className="flex flex-col items-end">
            {level !== null && (
              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <Award className="w-4 h-4" />
                <span className="font-medium">Level {level}</span>
              </div>
            )}
            
            {rank !== null && (
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
                <TrendingUp className="w-3 h-3" />
                <span>{rank}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
