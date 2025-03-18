import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface PointsSystemDemoProps {
  className?: string;
}

export function PointsSystemDemo({ className = '' }: PointsSystemDemoProps) {
  const [points, setPoints] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Simulate points accumulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints(prev => prev + 5);
      setShowAnimation(true);
      
      // Hide animation after a short delay
      setTimeout(() => {
        setShowAnimation(false);
      }, 800);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`relative rounded-lg border border-gray-200 bg-white p-6 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Points Dashboard</h3>
      
      {/* Points Display */}
      <div className="mb-6 flex items-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl">
          🏆
        </div>
        <div className="ml-4">
          <div className="text-sm text-gray-500">Your Balance</div>
          <div className="relative">
            <div className="text-2xl font-bold text-gray-900">
              {points} <span className="text-sm font-normal">SP</span>
            </div>
            
            {/* Points added animation */}
            {showAnimation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute left-0 top-0 text-sm font-medium text-green-500"
              >
                +5 SP
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Activity Log */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
            <span>Daily Login Bonus</span>
            <span className="font-medium text-green-600">+20 SP</span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
            <span>Post "Getting Started" created</span>
            <span className="font-medium text-green-600">+50 SP</span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
            <span>Comment received 5 upvotes</span>
            <span className="font-medium text-green-600">+25 SP</span>
          </div>
        </div>
      </div>
      
      {/* Redemption Progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-gray-700">Next Redemption</h4>
          <span className="text-xs text-gray-500">{points}/100 SP</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <motion.div 
            className="h-full rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(points, 100)}%` }}
            transition={{ type: "spring", damping: 10 }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500 text-right">
          {Math.max(0, 100 - points)} SP until 1 SKC token
        </div>
      </div>
    </div>
  );
}

export default PointsSystemDemo;
