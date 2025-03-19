'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PointsSystemDemoProps {
  className?: string;
  initialPoints?: number;
  pointsInterval?: number;
  pointsIncrement?: number;
  showActivities?: boolean;
  redemptionThreshold?: number;
  variant?: 'light' | 'dark';
}

export function PointsSystemDemo({ 
  className = '',
  initialPoints = 0,
  pointsInterval = 3000,
  pointsIncrement = 5,
  showActivities = true,
  redemptionThreshold = 100,
  variant = 'light'
}: PointsSystemDemoProps) {
  const [points, setPoints] = useState(initialPoints);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  // Determine styling based on variant
  const bgColor = variant === 'light' ? 'bg-white' : 'bg-gray-800';
  const borderColor = variant === 'light' ? 'border-gray-200' : 'border-gray-700';
  const textColor = variant === 'light' ? 'text-gray-900' : 'text-gray-100';
  const secondaryTextColor = variant === 'light' ? 'text-gray-500' : 'text-gray-400';
  const activityBgColor = variant === 'light' ? 'bg-gray-50' : 'bg-gray-700';
  const progressBgColor = variant === 'light' ? 'bg-gray-100' : 'bg-gray-600';
  const progressBarColor = 'bg-primary';
  
  // Simulate points accumulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => prev + pointsIncrement);
      setShowAnimation(true);
      setAnimationKey(prev => prev + 1);
      
      // Hide animation after a short delay
      setTimeout(() => {
        setShowAnimation(false);
      }, 800);
    }, pointsInterval);
    
    return () => clearInterval(interval);
  }, [pointsIncrement, pointsInterval]);
  
  // Sample activity data
  const activities = [
    { action: 'Daily Login Bonus', points: 20 },
    { action: 'Post "Getting Started" created', points: 50 },
    { action: 'Comment received 5 upvotes', points: 25 }
  ];
  
  return (
    <div className={`relative rounded-lg border ${borderColor} ${bgColor} p-6 shadow-lg ${className}`}>
      <h3 className={`text-lg font-semibold ${textColor} mb-4`}>Success Points Dashboard</h3>
      
      {/* Points Display */}
      <div className="mb-6 flex items-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl">
          🏆
        </div>
        <div className="ml-4">
          <div className={`text-sm ${secondaryTextColor}`}>Your Balance</div>
          <div className="relative">
            <div className={`text-2xl font-bold ${textColor}`}>
              {points} <span className="text-sm font-normal">SP</span>
            </div>
            
            {/* Points added animation */}
            <AnimatePresence>
              {showAnimation && (
                <motion.div
                  key={animationKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: -20 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute left-0 top-0 text-sm font-medium text-green-500"
                >
                  +{pointsIncrement} SP
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Activity Log */}
      {showActivities && (
        <div className="mb-4">
          <h4 className={`text-sm font-medium ${secondaryTextColor} mb-2`}>Recent Activity</h4>
          <div className="space-y-2">
            {activities.map((activity, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between rounded-md ${activityBgColor} px-3 py-2 text-sm`}
              >
                <span className={textColor}>{activity.action}</span>
                <span className="font-medium text-green-600">+{activity.points} SP</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Redemption Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className={`text-sm font-medium ${secondaryTextColor}`}>Next Redemption</h4>
          <span className={`text-xs ${secondaryTextColor}`}>{points}/{redemptionThreshold} SP</span>
        </div>
        <div className={`h-2 w-full rounded-full ${progressBgColor}`}>
          <motion.div 
            className={`h-full rounded-full ${progressBarColor}`}
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(points, redemptionThreshold) / redemptionThreshold * 100}%` }}
            transition={{ type: "spring", damping: 10 }}
          />
        </div>
        <div className={`mt-1 text-xs ${secondaryTextColor} text-right`}>
          {Math.max(0, redemptionThreshold - points)} SP until 1 SKC token
        </div>
      </div>
      
      {/* Optional celebration effect when reaching threshold */}
      <AnimatePresence>
        {points >= redemptionThreshold && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm z-10"
          >
            <motion.div 
              className={`bg-white p-6 rounded-lg shadow-xl text-center`}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Redemption Available!</h3>
              <p className="text-gray-600 mb-4">You've earned enough SP to claim 1 SKC token.</p>
              <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600 transition">
                Redeem Now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PointsSystemDemo;
