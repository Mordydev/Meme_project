'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedGlass } from '@/components/ui';
import Link from 'next/link';

// Define reward activities with point values
const rewardActivities = [
  { id: 'post', name: 'Create a Post', points: 50, icon: '📝', description: 'Share content with the community', dailyLimit: 200 },
  { id: 'comment', name: 'Write a Comment', points: 15, icon: '💬', description: 'Engage with other members\' content', dailyLimit: 150 },
  { id: 'upvote', name: 'Receive an Upvote', points: 5, icon: '👍', description: 'When others appreciate your content', dailyLimit: 100 },
  { id: 'daily', name: 'Daily Login', points: 20, icon: '🔄', description: 'Show up consistently each day', dailyLimit: 20 },
  { id: 'streak', name: '7-Day Streak', points: 100, icon: '🔥', description: 'Log in for 7 consecutive days', dailyLimit: 100 },
  { id: 'quality', name: 'Quality Content Bonus', points: '50-200', icon: '⭐', description: 'Extra points for exceptional contributions', dailyLimit: 'Staff awarded' },
  { id: 'referral', name: 'Refer a New User', points: 500, icon: '👥', description: 'Invite friends to join the platform', dailyLimit: 'Per unique referral' },
];

export function RewardsSystemDemo() {
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showingAnimation, setShowingAnimation] = useState(false);
  const [activities, setActivities] = useState([]);
  
  // Simulate performing an activity
  const performActivity = (activity) => {
    if (showingAnimation) return;
    
    setSelectedActivity(activity);
    setShowingAnimation(true);
    
    setTimeout(() => {
      setEarnedPoints(prev => prev + (typeof activity.points === 'string' ? parseInt(activity.points) : activity.points));
      
      // Add to activity log
      setActivities(prev => [{
        type: activity.id,
        name: activity.name,
        points: typeof activity.points === 'string' ? parseInt(activity.points) : activity.points,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 4)]);
      
      setShowingAnimation(false);
    }, 1500);
  };
  
  // Convert points to tokens
  const convertToTokens = () => {
    if (earnedPoints < 100 || showingAnimation) return;
    
    setShowingAnimation(true);
    
    // Calculate tokens to convert (100 points = 1 token)
    const pointsToConvert = Math.floor(earnedPoints / 100) * 100;
    const tokensToAdd = pointsToConvert / 100;
    
    setTimeout(() => {
      setEarnedPoints(prev => prev - pointsToConvert);
      setTokens(prev => prev + tokensToAdd);
      
      // Add to activity log
      setActivities(prev => [{
        type: 'conversion',
        name: 'Points to Tokens',
        points: -pointsToConvert,
        tokens: tokensToAdd,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 4)]);
      
      setShowingAnimation(false);
    }, 2000);
  };

  return (
    <section id="rewards" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4">Earn Real Rewards for Your Contributions</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Our dual-token economy rewards your engagement with Success Points (SP) that you can convert to SKC tokens.
          </p>
        </div>
        
        <div className="grid md:grid-cols-12 gap-8">
          {/* Left column: Activities */}
          <div className="md:col-span-5">
            <h3 className="text-xl font-bold mb-6">Try It Yourself!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Click on any activity to simulate earning Success Points, then convert them to tokens.
            </p>
            
            <div className="space-y-4">
              {rewardActivities.map(activity => (
                <motion.button
                  key={activity.id}
                  onClick={() => performActivity(activity)}
                  className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center shadow-sm hover:shadow text-left"
                  whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                  whileTap={{ scale: 0.98 }}
                  disabled={showingAnimation}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl mr-4">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-medium">{activity.name}</h4>
                      <span className="text-primary font-bold">+{activity.points} SP</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                    <div className="text-xs text-gray-500 mt-1">Daily limit: {activity.dailyLimit}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Right column: Points and conversion */}
          <div className="md:col-span-7">
            <AdvancedGlass
              intensity="light"
              borderGlow={true}
              rounded="rounded-xl"
              className="p-6 h-full"
            >
              {/* Points and tokens display */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">Success Points</div>
                  <motion.div 
                    className="text-4xl font-bold text-primary"
                    key={earnedPoints}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {earnedPoints} SP
                  </motion.div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">SKC Tokens</div>
                  <motion.div 
                    className="text-4xl font-bold text-secondary"
                    key={tokens}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {tokens} SKC
                  </motion.div>
                </div>
              </div>
              
              {/* Conversion animation area */}
              <div className="relative h-32 mb-8">
                <AnimatePresence>
                  {showingAnimation && selectedActivity && (
                    <motion.div
                      key="points-animation"
                      initial={{ opacity: 0, y: 20, x: -100 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, y: -20, x: 100 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">{selectedActivity.icon}</div>
                        <div className="text-lg font-medium">{selectedActivity.name}</div>
                        <div className="text-primary font-bold">+{selectedActivity.points} SP</div>
                      </div>
                    </motion.div>
                  )}
                  
                  {showingAnimation && !selectedActivity && (
                    <motion.div
                      key="conversion-animation"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="relative">
                        <motion.div
                          className="absolute top-0 left-0 text-center"
                          animate={{ 
                            x: [0, -30, -60], 
                            y: [0, -20, 0],
                            opacity: [1, 1, 0] 
                          }}
                          transition={{ duration: 1 }}
                        >
                          <div className="text-2xl font-bold text-primary">100 SP</div>
                        </motion.div>
                        
                        <div className="text-4xl mx-10">→</div>
                        
                        <motion.div
                          className="absolute top-0 right-0 text-center"
                          animate={{ 
                            x: [0, 30, 60], 
                            y: [0, -20, 0],
                            opacity: [0, 1, 1] 
                          }}
                          transition={{ duration: 1 }}
                        >
                          <div className="text-2xl font-bold text-secondary">1 SKC</div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Conversion button */}
              <div className="text-center mb-8">
                <button
                  onClick={convertToTokens}
                  disabled={earnedPoints < 100 || showingAnimation}
                  className={`px-6 py-3 rounded-lg font-medium text-white ${
                    earnedPoints >= 100 && !showingAnimation
                      ? 'bg-secondary hover:bg-secondary-600'
                      : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                  }`}
                >
                  Convert SP to SKC (100 SP = 1 SKC)
                </button>
                {earnedPoints < 100 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Need {100 - (earnedPoints % 100)} more SP to convert
                  </p>
                )}
              </div>
              
              {/* Activity log */}
              <div>
                <h4 className="font-medium mb-3">Activity Log:</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto space-y-2">
                  {activities.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      Your activity will appear here
                    </div>
                  ) : (
                    activities.map((activity, i) => (
                      <div key={i} className="text-sm border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
                        <div className="flex justify-between">
                          <span className="font-medium">{activity.name}</span>
                          <span className="text-gray-500">{activity.time}</span>
                        </div>
                        <div className={activity.points < 0 ? 'text-secondary' : 'text-primary'}>
                          {activity.points > 0 ? '+' : ''}{activity.points} SP
                          {activity.tokens && ` → +${activity.tokens} SKC`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </AdvancedGlass>
          </div>
        </div>
      </div>
    </section>
  );
}
