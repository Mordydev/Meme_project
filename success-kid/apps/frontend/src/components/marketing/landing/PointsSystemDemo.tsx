'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

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
  pointsInterval = 2000, // Faster updates for more active feeling
  pointsIncrement = 5,
  showActivities = true,
  redemptionThreshold = 100,
  variant = 'light'
}: PointsSystemDemoProps) {
  const [points, setPoints] = useState(initialPoints);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [activities, setActivities] = useState([
    { action: 'Daily Login Bonus', points: 20, timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { action: 'Post "Getting Started" created', points: 50, timestamp: new Date(Date.now() - 1000 * 60 * 120) },
    { action: 'Comment received 5 upvotes', points: 25, timestamp: new Date(Date.now() - 1000 * 60 * 240) },
    { action: 'Completed your profile', points: 100, timestamp: new Date(Date.now() - 1000 * 60 * 360) },
    { action: 'Referred new member', points: 500, timestamp: new Date(Date.now() - 1000 * 60 * 480) },
    { action: 'Weekly Streak Bonus', points: 200, timestamp: new Date(Date.now() - 1000 * 60 * 500) },
    { action: 'Community Challenge Completed', points: 300, timestamp: new Date(Date.now() - 1000 * 60 * 520) },
    { action: 'Helpful comment badge earned', points: 150, timestamp: new Date(Date.now() - 1000 * 60 * 540) },
    { action: 'Market milestone participation', points: 250, timestamp: new Date(Date.now() - 1000 * 60 * 560) }
  ]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [reachedRedemption, setReachedRedemption] = useState(false);
  const progressControls = useAnimation();
  const demoContainerRef = useRef<HTMLDivElement>(null);
  
  // Determine styling based on variant
  const bgColor = variant === 'light' ? 'bg-white' : 'bg-gray-800';
  const borderColor = variant === 'light' ? 'border-gray-200' : 'border-gray-700';
  const textColor = variant === 'light' ? 'text-gray-900' : 'text-gray-100';
  const secondaryTextColor = variant === 'light' ? 'text-gray-500' : 'text-gray-400';
  const activityBgColor = variant === 'light' ? 'bg-gray-50' : 'bg-gray-700';
  const progressBgColor = variant === 'light' ? 'bg-gray-100' : 'bg-gray-600';
  const progressBarColor = 'bg-primary';
  
  // Simulate points accumulation and activity cycling
  useEffect(() => {
    const pointInterval = setInterval(() => {
      // Add new random activity periodically
      const newActivity = generateRandomActivity();
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
      setCurrentActivityIndex(prev => (prev + 1) % 3);
      
      // Increment points
      setPoints(prev => {
        const newPoints = prev + pointsIncrement;
        // Check if we've reached redemption threshold
        if (newPoints >= redemptionThreshold && !reachedRedemption) {
          setReachedRedemption(true);
          setTimeout(() => setReachedRedemption(false), 5000);
        }
        // Reset the points more frequently for clearer demo loop
        if (newPoints >= redemptionThreshold * 1.2) {
          return 0; // Reset to 0 to start the cycle over
        }
        return newPoints;
      });
      
      // Animate the points increase
      setShowAnimation(true);
      setAnimationKey(prev => prev + 1);
      
      // Hide animation after a short delay
      setTimeout(() => {
        setShowAnimation(false);
      }, 800);
      
      // Update progress bar animation
      progressControls.start({ 
        width: `${Math.min(points + pointsIncrement, redemptionThreshold) / redemptionThreshold * 100}%`,
        transition: { type: "spring", damping: 10 }
      });
      
    }, pointsInterval);
    
    return () => clearInterval(pointInterval);
  }, [pointsIncrement, pointsInterval, points, redemptionThreshold, reachedRedemption, progressControls]);
  
  // Generate a random activity for demo purposes
  const generateRandomActivity = () => {
    const activities = [
      { action: 'Created a new post', points: 50 },
      { action: 'Comment upvoted', points: 5 },
      { action: 'Replied to discussion', points: 15 },
      { action: 'Content featured', points: 75 },
      { action: 'Achievement unlocked', points: 100 },
      { action: 'Daily streak bonus', points: 20 },
      { action: 'Profile completed', points: 25 },
      { action: 'Content received 10+ likes', points: 50 },
      { action: 'Quality content bonus', points: 150 },
      { action: 'Weekly participation bonus', points: 100 },
      { action: 'Helped new community member', points: 30 },
      { action: 'Referred new member', points: 500 },
      { action: 'Created viral meme', points: 200 },
      { action: 'Featured on leaderboard', points: 100 },
      { action: 'Community challenge completed', points: 250 },
      { action: 'Shared content on social media', points: 35 },
      { action: 'First redemption bonus', points: 50 },
      { action: 'New achievement: Content Creator', points: 150 },
      { action: 'New achievement: Community Pillar', points: 300 },
      { action: 'Special event participation', points: 125 },
      { action: 'Market milestone contribution', points: 80 },
      { action: 'Quality feedback provided', points: 40 },
      { action: 'Content featured by moderator', points: 120 },
      { action: 'Helpful resource shared', points: 70 },
      { action: 'Perfect streak: 7 days', points: 140 },
    ];
    
    const randomIndex = Math.floor(Math.random() * activities.length);
    return {
      ...activities[randomIndex],
      timestamp: new Date()
    };
  };
  
  // Format relative time for activities
  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m ago`;
  };
  
  return (
    <div ref={demoContainerRef} className={`relative rounded-lg border ${borderColor} ${bgColor} p-6 shadow-xl ${className} overflow-hidden`} style={{ minHeight: '460px', height: '100%', width: '100%', maxWidth: '550px', margin: '0 auto' }}>
      {/* Animated border gradient */}
      <motion.div 
        className="absolute inset-0 rounded-lg z-0 opacity-20"
        style={{ 
          background: 'linear-gradient(90deg, #1E88E5, #FFC107, #4CAF50, #1E88E5)',
          backgroundSize: '400% 100%'
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 0%'],
          boxShadow: [
            'inset 0 0 20px rgba(30, 136, 229, 0.2)',
            'inset 0 0 40px rgba(30, 136, 229, 0.4)',
            'inset 0 0 20px rgba(30, 136, 229, 0.2)',
          ]
        }}
        transition={{
          backgroundPosition: {
            duration: 15,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear'
          },
          boxShadow: {
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }
        }}
      />
      
      {/* No floating particles for cleaner look */}
      <h3 className={`text-lg font-semibold ${textColor} mb-4 relative z-10`}>Success Points Dashboard</h3>
      
      {/* Points Display */}
      <div className="mb-6 flex items-center relative z-10">
        <motion.div 
          className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl relative"
          animate={{
            boxShadow: ['0 0 0px rgba(30, 136, 229, 0)', '0 0 20px rgba(30, 136, 229, 0.5)', '0 0 0px rgba(30, 136, 229, 0)'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          <motion.div
            animate={{
              rotate: [0, 10, 0, -10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: 'loop'
            }}
          >
            🏆
          </motion.div>
          
          {/* Particles around the trophy */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [0, Math.cos(i * Math.PI / 2.5) * 30],
                y: [0, Math.sin(i * Math.PI / 2.5) * 30],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2 + (i % 3),
                repeat: Infinity,
                delay: i * 0.5,
                repeatDelay: 1
              }}
            />
          ))}
        </motion.div>
        <div className="ml-4">
          <div className={`text-sm ${secondaryTextColor}`}>Your Balance</div>
          <div className="relative">
            <div className={`text-2xl font-bold ${textColor}`}>
              {points.toLocaleString()} <span className="text-sm font-normal">SP</span>
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
        <div className="mb-4 relative z-10">
          <h4 className={`text-sm font-medium ${secondaryTextColor} mb-2`}>Recent Activity</h4>
          <div className="space-y-2 h-[180px] overflow-hidden w-full">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <motion.div 
                  key={`activity-${index}-${activity.action}`}
                  className={`flex items-center justify-between rounded-md ${activityBgColor} px-3 py-2 text-sm relative`}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ type: "spring", duration: 0.5, delay: index === 0 ? 0 : 0.05 * index }}
                >
                  <div className="flex flex-col">
                    <span className={textColor}>{activity.action}</span>
                    <span className={`text-xs ${secondaryTextColor}`}>{getRelativeTime(activity.timestamp)}</span>
                  </div>
                  <div className="flex items-center">
                    <motion.span 
                      className="font-medium text-green-600 flex items-center"
                      initial={{ scale: index === 0 ? 1.2 : 1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      +{activity.points} SP
                      {index === 0 && (
                        <motion.div 
                          className="ml-1 w-2 h-2 rounded-full bg-green-500"
                          animate={{ opacity: [1, 0.5, 1], scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </motion.span>
                    
                    {/* Add sparkle effect for higher point activities */}
                    {activity.points >= 100 && (
                      <motion.span 
                        className="ml-1"
                        animate={{
                          opacity: [0, 1, 0],
                          rotate: [0, 15, 0],
                          scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: index === 0 ? Infinity : 0,
                          repeatDelay: 2
                        }}
                      >
                        ✨
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {/* Redemption Progress */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <h4 className={`text-sm font-medium ${secondaryTextColor}`}>Next Redemption</h4>
          <span className={`text-xs ${secondaryTextColor}`}>{points}/{redemptionThreshold} SP</span>
        </div>
        <div className={`h-2 w-full rounded-full ${progressBgColor} overflow-hidden relative`}>
          <motion.div 
            className={`h-full rounded-full ${progressBarColor}`}
            initial={{ width: "0%" }}
            animate={progressControls}
            style={{ width: `${Math.min(points, redemptionThreshold) / redemptionThreshold * 100}%` }}
          />
          
          {/* Animated shine effect */}
          <motion.div 
            className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            animate={{ x: [-100, 400] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              repeatDelay: 2
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <motion.div 
            className={`text-xs ${textColor} font-medium flex items-center`}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span 
              className="inline-block text-sm mr-1"
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💰
            </motion.span>
            1 SKC ≈ $0.0023
          </motion.div>
          <div className={`text-xs ${secondaryTextColor}`}>
            {Math.max(0, redemptionThreshold - points)} SP until 1 SKC token
          </div>
        </div>
      </div>
      
      {/* Enhanced celebration effect when reaching threshold */}
      <AnimatePresence>
        {reachedRedemption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm z-20"
          >
            <motion.div 
              className={`bg-white p-6 rounded-lg shadow-xl text-center relative overflow-hidden`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              {/* Celebration particles */}
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-2 h-2 rounded-full bg-primary"
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 1,
                    scale: 1 
                  }}
                  animate={{ 
                    x: Math.random() * 200 - 100, 
                    y: Math.random() * 200 - 100, 
                    opacity: 0,
                    scale: Math.random() * 2
                  }}
                  transition={{ 
                    duration: 1.5 + Math.random(), 
                    ease: "easeOut",
                    delay: Math.random() * 0.5
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                    backgroundColor: i % 3 === 0 ? '#FFC107' : i % 3 === 1 ? '#1E88E5' : '#4CAF50'
                  }}
                />
              ))}
              
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, 10, -10, 0] }}
                transition={{ delay: 0.2, rotate: { repeat: 2, duration: 0.5 } }}
                className="text-5xl mb-3 relative"
              >
                🎉
                {/* Emanating circles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary"
                    initial={{ width: 30, height: 30, opacity: 0.8 }}
                    animate={{ 
                      width: [30, 100 + (i * 20)], 
                      height: [30, 100 + (i * 20)],
                      opacity: [0.8, 0]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      delay: 0.3 + (i * 0.2),
                      repeat: 1,
                      repeatDelay: 1
                    }}
                  />
                ))}
              </motion.div>
              
              <motion.h3 
                className="text-xl font-bold text-gray-900 mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Redemption Available!
              </motion.h3>
              
              <motion.p 
                className="text-gray-600 mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                You've earned enough SP to claim 1 SKC token.
              </motion.p>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: 0.5,
                  type: "spring",
                  stiffness: 300,
                  damping: 15
                }}
              >
                <button className="relative bg-primary text-white px-6 py-3 rounded-md overflow-hidden group">
                  <span className="relative z-10">Redeem Now</span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-400 z-0"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 2,
                      ease: "linear"
                    }}
                  />
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PointsSystemDemo;
