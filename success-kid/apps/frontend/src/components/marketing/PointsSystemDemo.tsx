'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import tokens from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface PointsSystemDemoProps {
  className?: string;
}

// Demo actions to simulate earning points
const demoActions = [
  { id: 'post', label: 'Create Post', points: 50, icon: '📝' },
  { id: 'comment', label: 'Comment', points: 15, icon: '💬' },
  { id: 'upvote', label: 'Receive Upvote', points: 5, icon: '👍' },
  { id: 'daily', label: 'Daily Login', points: 20, icon: '📅' },
];

export function PointsSystemDemo({ className = '' }: PointsSystemDemoProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  const [points, setPoints] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{ action: string, points: number, timestamp: Date }>>([]);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [autoPlayDemo, setAutoPlayDemo] = useState(false);
  
  // Automatic demo sequence
  useEffect(() => {
    if (!autoPlayDemo) return;
    
    const interval = setInterval(() => {
      const randomAction = demoActions[Math.floor(Math.random() * demoActions.length)];
      handleAction(randomAction.id);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [autoPlayDemo]);
  
  // Handle user action
  const handleAction = (actionId: string) => {
    if (isAnimating) return;
    
    const action = demoActions.find(a => a.id === actionId);
    if (!action) return;
    
    setIsAnimating(true);
    setActiveAction(actionId);
    
    // Add to recent activity
    setRecentActivity(prev => {
      const newActivity = [
        { action: action.label, points: action.points, timestamp: new Date() },
        ...prev
      ];
      // Keep only the 5 most recent activities
      return newActivity.slice(0, 5);
    });
    
    // Animate points increase
    setTimeout(() => {
      setPoints(prev => prev + action.points);
      setIsAnimating(false);
      setActiveAction(null);
      
      // Check if we've hit 100 points for token conversion
      if (points + action.points >= 100) {
        setShowRewardAnimation(true);
        
        setTimeout(() => {
          const newPoints = (points + action.points) % 100;
          const newTokens = tokens + Math.floor((points + action.points) / 100);
          
          setPoints(newPoints);
          setTokens(newTokens);
          setShowRewardAnimation(false);
        }, 2000);
      }
    }, 500);
  };
  
  return (
    <div className={`relative rounded-xl bg-white p-6 shadow-md ${className}`}>
      <h3 className="text-xl font-semibold mb-4">Points System Demo</h3>
      
      {/* Points Display */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 mb-1">Success Points</p>
          <motion.p 
            key={points}
            initial={prefersReducedMotion ? {} : { scale: 0.9, color: tokens.colors.accent.DEFAULT }}
            animate={{ scale: 1, color: '#000' }}
            className="text-2xl font-bold"
          >
            {points} SP
          </motion.p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">Tokens Earned</p>
          <motion.p 
            key={tokens}
            initial={prefersReducedMotion ? {} : { scale: 0.9, color: tokens.colors.secondary.DEFAULT }}
            animate={{ scale: 1, color: '#000' }}
            className="text-2xl font-bold"
          >
            {tokens} SKC
          </motion.p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${points}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-500">
          <span>0 SP</span>
          <span>Convert at 100 SP = 1 SKC</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {demoActions.map((action) => (
          <Button
            key={action.id}
            variant={activeAction === action.id ? "primary" : "outline"}
            onClick={() => handleAction(action.id)}
            disabled={isAnimating}
            className="relative"
          >
            <span className="mr-2">{action.icon}</span>
            {action.label}
            
            {/* Points indicator that appears on click */}
            <AnimatePresence>
              {activeAction === action.id && !prefersReducedMotion && (
                <motion.span
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -30 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-0 text-xs font-bold text-accent"
                >
                  +{action.points} SP
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        ))}
      </div>
      
      {/* Recent Activity */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-gray-700">Recent Activity</h4>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-500">Try an action above to see your activity</p>
        ) : (
          <ul className="text-sm space-y-1">
            {recentActivity.map((activity, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between text-gray-600"
              >
                <span>{activity.action}</span>
                <span className="font-medium text-accent">+{activity.points} SP</span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Auto-play toggle */}
      <div className="mt-4 flex justify-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setAutoPlayDemo(!autoPlayDemo)}
          className="text-xs"
        >
          {autoPlayDemo ? 'Stop Demo' : 'Auto-play Demo'}
        </Button>
      </div>
      
      {/* Reward Animation */}
      <AnimatePresence>
        {showRewardAnimation && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl z-10"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="text-center"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, 0, -5, 0]
                }}
                transition={{ 
                  duration: 1,
                  repeat: 1
                }}
                className="text-5xl mb-3"
              >
                🎉
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-1">Points Converted!</h3>
              <p className="text-white">100 SP → 1 SKC Token</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
