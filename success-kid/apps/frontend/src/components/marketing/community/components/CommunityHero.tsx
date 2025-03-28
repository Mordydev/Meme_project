'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedButton, AdvancedGlass } from '@/components/ui';
import Link from 'next/link';

// Simulated community activity for visualization
const communityActivity = [
  { type: 'post', user: 'Alex', content: 'Just reached level 10!', points: 50, timeAgo: '2m' },
  { type: 'comment', user: 'Maria', content: 'Great tutorial, thanks!', points: 15, timeAgo: '5m' },
  { type: 'reward', user: 'Chris', content: 'Redeemed 5,000 SP for 50 SKC', points: null, timeAgo: '12m' },
  { type: 'achievement', user: 'Taylor', content: 'Unlocked Content Creator badge', points: 200, timeAgo: '18m' },
  { type: 'referral', user: 'Jamie', content: 'Invited 3 new members', points: 300, timeAgo: '25m' },
  { type: 'post', user: 'Sandra', content: 'Shared my success story', points: 50, timeAgo: '31m' },
  { type: 'milestone', user: 'Community', content: 'Reached 5,000 members!', points: null, timeAgo: '44m' },
  { type: 'comment', user: 'Michael', content: 'This community is awesome', points: 15, timeAgo: '53m' },
];

export function CommunityHero() {
  const [visibleActivities, setVisibleActivities] = useState([]);
  const [activityIndex, setActivityIndex] = useState(0);
  const [communityStats, setCommunityStats] = useState({
    members: 0,
    dailyPosts: 0,
    pointsAwarded: 0,
    countries: 0
  });
  
  // Animate the community stats with counting effect
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const frameRate = 30; // 30 FPS
    const frames = duration / (1000 / frameRate);
    const targets = {
      members: 5000,
      dailyPosts: 350,
      pointsAwarded: 125000,
      countries: 120
    };
    let frame = 0;
    
    const interval = setInterval(() => {
      frame++;
      
      if (frame <= frames) {
        const progress = frame / frames;
        setCommunityStats({
          members: Math.floor(targets.members * progress),
          dailyPosts: Math.floor(targets.dailyPosts * progress),
          pointsAwarded: Math.floor(targets.pointsAwarded * progress),
          countries: Math.floor(targets.countries * progress)
        });
      } else {
        clearInterval(interval);
      }
    }, 1000 / frameRate);
    
    return () => clearInterval(interval);
  }, []);
  
  // Simulate real-time community activity feed
  useEffect(() => {
    // Show initial activities
    setVisibleActivities(communityActivity.slice(0, 3));
    
    // Rotate through activities to simulate real-time updates
    const interval = setInterval(() => {
      setActivityIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % communityActivity.length;
        
        // Update visible activities (keep last 3)
        setVisibleActivities(prev => {
          const updated = [...prev];
          updated.unshift(communityActivity[nextIndex]);
          return updated.slice(0, 3);
        });
        
        return nextIndex;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Animated background elements */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800"
        animate={{
          background: [
            'radial-gradient(circle at 30% 30%, rgba(30, 136, 229, 0.05) 0%, rgba(255, 255, 255, 0) 60%)',
            'radial-gradient(circle at 70% 70%, rgba(30, 136, 229, 0.05) 0%, rgba(255, 255, 255, 0) 60%)',
            'radial-gradient(circle at 30% 30%, rgba(30, 136, 229, 0.05) 0%, rgba(255, 255, 255, 0) 60%)',
          ]
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
      />
      
      {/* Floating particles to represent community */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: 6 + Math.random() * 12,
            height: 6 + Math.random() * 12,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 5 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Join a Community Built on Success</h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
              Connect with thousands of like-minded individuals, earn rewards for your contributions, and be part of a vibrant ecosystem where everyone's success is celebrated.
            </p>
            
            {/* Community statistics */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { label: 'Community Members', value: communityStats.members.toLocaleString() },
                { label: 'Daily Content Created', value: communityStats.dailyPosts.toLocaleString() },
                { label: 'Success Points Awarded Today', value: communityStats.pointsAwarded.toLocaleString() },
                { label: 'Countries Represented', value: communityStats.countries.toLocaleString() }
              ].map((stat, index) => (
                <div key={index} className="bg-white bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-50 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                  <p className="text-primary font-bold text-2xl">{stat.value}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
            
            {/* Call to action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <EnhancedButton
                variant="primary"
                size="lg"
                href="/join"
                shine={true}
                glow={true}
              >
                Join Our Community
              </EnhancedButton>
              
              <EnhancedButton
                variant="outline"
                size="lg"
                href="#how-it-works"
                rightIcon={
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    →
                  </motion.span>
                }
              >
                See How It Works
              </EnhancedButton>
            </div>
          </motion.div>
          
          {/* Right column: Live community activity feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <AdvancedGlass
              intensity="medium"
              borderGlow={true}
              animated={true}
              rounded="rounded-xl"
              className="p-6"
            >
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <h2 className="text-xl font-bold">Live Community Activity</h2>
              </div>
              
              <div className="space-y-4 min-h-[300px]">
                <AnimatePresence>
                  {visibleActivities.map((activity, index) => (
                    <motion.div
                      key={`${activity.type}-${activity.user}-${index}`}
                      initial={{ opacity: 0, y: -20, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start">
                        <div className="bg-primary/10 rounded-full p-2 mr-3">
                          {activity.type === 'post' && '📝'}
                          {activity.type === 'comment' && '💬'}
                          {activity.type === 'reward' && '💰'}
                          {activity.type === 'achievement' && '🏆'}
                          {activity.type === 'referral' && '🔄'}
                          {activity.type === 'milestone' && '🎯'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className="font-semibold">{activity.user}</span>
                            <span className="text-xs text-gray-500">{activity.timeAgo} ago</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm my-1">{activity.content}</p>
                          {activity.points && (
                            <div className="text-xs font-medium text-primary">
                              +{activity.points} SP earned
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              <div className="mt-4 text-center">
                <Link href="/dashboard" className="text-primary text-sm font-medium hover:underline">
                  View All Activity →
                </Link>
              </div>
            </AdvancedGlass>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
