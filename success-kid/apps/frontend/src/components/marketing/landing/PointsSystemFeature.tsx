'use client';

import React from 'react';
import { motion } from 'framer-motion';
import tokens from '@/theme/tokens';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface PointsActivity {
  activity: string;
  description: string;
  points: number;
  icon: string;
}

export function PointsSystemFeature() {
  const prefersReducedMotion = useReducedMotionPreference();
  
  const pointsActivities: PointsActivity[] = [
    { 
      activity: 'Create Post', 
      description: 'Share valuable content with the community',
      points: 50, 
      icon: '📝'
    },
    { 
      activity: 'Comment', 
      description: 'Engage in discussions with other members',
      points: 15, 
      icon: '💬'
    },
    { 
      activity: 'Receive Upvote', 
      description: 'Get recognized for quality contributions',
      points: 5, 
      icon: '👍'
    },
    { 
      activity: 'Daily Login', 
      description: 'Stay active in the community',
      points: 20, 
      icon: '📅'
    },
    { 
      activity: 'Refer New User', 
      description: 'Grow the community with new members',
      points: 500, 
      icon: '👥'
    },
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const cardVariants = {
    hidden: { 
      opacity: prefersReducedMotion ? 1 : 0, 
      y: prefersReducedMotion ? 0 : 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  
  // Conversion diagram animation
  const arrowVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Points to Token Conversion Visualization */}
      <div className="mb-10 p-6 bg-gray-50 rounded-xl">
        <h3 className="text-xl font-semibold mb-6 text-center">How Points Become Tokens</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-center">
          {/* Success Points */}
          <motion.div 
            className="flex flex-col items-center text-center px-6 py-4"
            initial={{ scale: prefersReducedMotion ? 1 : 0.8, opacity: prefersReducedMotion ? 1 : 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 flex items-center justify-center bg-primary/10 rounded-full mb-3">
              <span className="text-3xl">🏆</span>
            </div>
            <h4 className="text-lg font-semibold mb-1">Success Points</h4>
            <p className="text-sm text-gray-600">Earned through activity</p>
          </motion.div>
          
          {/* Arrow */}
          <div className="py-4 md:py-0">
            <svg width="100" height="50" viewBox="0 0 100 50" className="text-primary">
              <motion.path 
                d="M5,25 H70 L95,25" 
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={prefersReducedMotion ? "visible" : "hidden"}
                whileInView="visible"
                viewport={{ once: true }}
                variants={arrowVariants}
              />
              <motion.path 
                d="M80,10 L95,25 L80,40" 
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={prefersReducedMotion ? "visible" : "hidden"}
                whileInView="visible"
                viewport={{ once: true }}
                variants={arrowVariants}
              />
              <text 
                x="50" 
                y="15" 
                textAnchor="middle" 
                fontSize="12" 
                fill="currentColor"
                className="font-medium"
              >
                100:1 ratio
              </text>
            </svg>
          </div>
          
          {/* SKC Tokens */}
          <motion.div 
            className="flex flex-col items-center text-center px-6 py-4"
            initial={{ scale: prefersReducedMotion ? 1 : 0.8, opacity: prefersReducedMotion ? 1 : 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="w-20 h-20 flex items-center justify-center bg-secondary/10 rounded-full mb-3">
              <span className="text-3xl">💰</span>
            </div>
            <h4 className="text-lg font-semibold mb-1">SKC Tokens</h4>
            <p className="text-sm text-gray-600">Redeemable value</p>
          </motion.div>
        </div>
        
        <div className="mt-6 text-center text-sm bg-primary/5 p-3 rounded-lg">
          <strong className="text-primary">Daily Redemption Cap:</strong> 10,000 SP (100 SKC) per user
        </div>
      </div>
      
      {/* Earn Points Table */}
      <motion.div
        className="space-y-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <h3 className="text-xl font-semibold mb-4">Ways to Earn Success Points</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          {pointsActivities.map((activity, index) => (
            <motion.div 
              key={index}
              variants={cardVariants}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-start shadow-sm"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full mr-4 text-xl">
                {activity.icon}
              </div>
              <div>
                <div className="flex items-center mb-1">
                  <h4 className="font-semibold">{activity.activity}</h4>
                  <span className="ml-2 text-sm font-bold text-primary">+{activity.points} SP</span>
                </div>
                <p className="text-sm text-gray-600">{activity.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Daily Caps Info */}
      <motion.div
        className="bg-gray-50 p-6 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg font-semibold mb-3">Daily Earning Opportunities</h3>
        <p className="text-gray-600 mb-4">We've implemented fair daily limits to maintain a sustainable economy:</p>
        
        <div className="space-y-2">
          <div className="flex justify-between pb-2 border-b border-gray-200">
            <span className="text-gray-700">Creating Posts</span>
            <span className="font-medium">Up to 200 SP/day</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-gray-200">
            <span className="text-gray-700">Comments</span>
            <span className="font-medium">Up to 150 SP/day</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-gray-200">
            <span className="text-gray-700">Received Upvotes</span>
            <span className="font-medium">Up to 100 SP/day</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-gray-200">
            <span className="text-gray-700">Given Upvotes</span>
            <span className="font-medium">Up to 50 SP/day</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Referrals</span>
            <span className="font-medium">Unlimited</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
