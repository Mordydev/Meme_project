'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface CommunityMetricsProps {
  className?: string;
}

interface Activity {
  user: string;
  action: string;
  target?: string;
  time: string;
  points: number;
  icon: string;
}

export function CommunityMetrics({ className = '' }: CommunityMetricsProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  
  // Sample community activity data
  const recentActivity: Activity[] = [
    {
      user: 'Alex T.',
      action: 'created a post',
      target: 'Introduction to Success Kid Platform',
      time: '5m ago',
      points: 50,
      icon: '📝'
    },
    {
      user: 'Sarah C.',
      action: 'commented on',
      target: 'How to maximize your SP earnings',
      time: '12m ago',
      points: 15,
      icon: '💬'
    },
    {
      user: 'Miguel R.',
      action: 'reached level',
      target: '10',
      time: '25m ago',
      points: 0,
      icon: '⭐'
    },
    {
      user: 'Priya S.',
      action: 'redeemed',
      target: '1,000 SP for 10 SKC',
      time: '32m ago',
      points: 0,
      icon: '💰'
    },
    {
      user: 'Jordan K.',
      action: 'earned badge',
      target: 'Content Champion',
      time: '45m ago',
      points: 0,
      icon: '🏆'
    },
    {
      user: 'Olivia P.',
      action: 'referred',
      target: '3 new members',
      time: '1h ago',
      points: 1500,
      icon: '👥'
    }
  ];
  
  // Community statistics
  const stats = [
    { value: '50,000+', label: 'Active Members' },
    { value: '2,500+', label: 'Daily Content' },
    { value: '120+', label: 'Countries' },
    { value: '4.2M+', label: 'Points Earned' }
  ];
  
  // Top communities/categories
  const topCategories = [
    { name: 'Strategy Discussions', members: 12548, posts: 2734, growth: '+15%' },
    { name: 'Memes & Creativity', members: 9872, posts: 3821, growth: '+24%' },
    { name: 'Token Talk', members: 8541, posts: 1674, growth: '+12%' },
    { name: 'Newcomer Help', members: 7653, posts: 1387, growth: '+18%' }
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
  
  const itemVariants = {
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
  
  return (
    <div className={`space-y-12 ${className}`}>
      {/* Community Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-primary mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Community Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-primary-50 border-b border-gray-200">
          <h3 className="font-semibold">Live Community Activity</h3>
        </div>
        
        <motion.div
          className="divide-y divide-gray-100"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {recentActivity.map((activity, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="px-4 py-3 flex items-center"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg mr-3 flex-shrink-0">
                {activity.icon}
              </div>
              
              <div className="flex-grow min-w-0">
                <p className="text-sm truncate">
                  <span className="font-medium">{activity.user}</span>
                  {' '}{activity.action}{' '}
                  {activity.target && (
                    <span className="text-primary">{activity.target}</span>
                  )}
                </p>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
              
              {activity.points > 0 && (
                <div className="text-sm font-medium text-primary whitespace-nowrap ml-2">
                  +{activity.points} SP
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
        
        <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-600">
          Showing recent activity from the last hour
        </div>
      </div>
      
      {/* Top Categories/Communities */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-6">Top Categories</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Members</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Posts</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topCategories.map((category, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <td className="px-4 py-3 text-sm font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-sm text-right">{category.members.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right">{category.posts.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">{category.growth}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Member Distribution Map */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Global Community</h3>
        <p className="text-gray-600 mb-6">Our community spans across 120+ countries worldwide.</p>
        
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden relative">
          {/* Simple representation of a world map with hotspots */}
          <svg viewBox="0 0 1000 500" className="w-full h-full">
            {/* Background map (simplified) */}
            <rect x="0" y="0" width="1000" height="500" fill="#E3F2FD" />
            
            {/* Continents (extremely simplified) */}
            <path d="M200,150 Q300,100 350,200 Q400,300 300,350 Q200,400 200,150" fill="#D1E7F6" />
            <path d="M450,100 Q550,50 650,150 Q750,250 700,350 Q600,400 500,350 Q450,200 450,100" fill="#D1E7F6" />
            <path d="M700,150 Q800,100 850,200 Q880,300 800,350 Q750,400 700,150" fill="#D1E7F6" />
            
            {/* Hotspots for community activity */}
            {[
              { x: 250, y: 200, size: 20 }, // North America
              { x: 350, y: 320, size: 15 }, // South America
              { x: 480, y: 160, size: 25 }, // Europe
              { x: 550, y: 200, size: 20 }, // Africa
              { x: 650, y: 180, size: 30 }, // Asia
              { x: 800, y: 250, size: 15 }, // Australia
            ].map((spot, index) => (
              <motion.circle
                key={index}
                cx={spot.x}
                cy={spot.y}
                r={spot.size}
                fill="#1E88E5"
                opacity="0.6"
                initial={{ 
                  r: prefersReducedMotion ? spot.size : 0,
                  opacity: prefersReducedMotion ? 0.6 : 0
                }}
                whileInView={{ 
                  r: spot.size,
                  opacity: 0.6
                }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
            ))}
          </svg>
          
          <div className="absolute bottom-4 right-4 bg-white bg-opacity-70 rounded px-3 py-1 text-xs text-gray-700">
            Community hotspots representation
          </div>
        </div>
      </div>
    </div>
  );
}
