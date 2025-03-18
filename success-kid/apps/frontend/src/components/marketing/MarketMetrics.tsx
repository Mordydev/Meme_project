'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface MarketMetricsProps {
  className?: string;
}

export function MarketMetrics({ className = '' }: MarketMetricsProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  
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
  
  // Key metrics data
  const metrics = [
    { 
      label: 'Market Cap', 
      value: '$1.25M', 
      change: '+15.4%', 
      isPositive: true, 
      icon: '📈' 
    },
    { 
      label: 'Community Members', 
      value: '52,481', 
      change: '+1,245', 
      isPositive: true, 
      icon: '👥' 
    },
    { 
      label: 'Content Created', 
      value: '12,657', 
      change: '+547', 
      isPositive: true, 
      icon: '📝' 
    },
    { 
      label: 'Points Awarded', 
      value: '4.2M', 
      change: '+89K', 
      isPositive: true, 
      icon: '🏆' 
    },
    { 
      label: 'Token Holders', 
      value: '8,423', 
      change: '+342', 
      isPositive: true, 
      icon: '💰' 
    },
    { 
      label: 'Daily Active Users', 
      value: '6,521', 
      change: '+12.5%', 
      isPositive: true, 
      icon: '🚀' 
    },
  ];
  
  // Market cap milestones data
  const milestones = [
    { value: '$100K', achieved: true, date: 'Jan 2025' },
    { value: '$500K', achieved: true, date: 'Feb 2025' },
    { value: '$1M', achieved: true, date: 'Mar 2025' },
    { value: '$5M', achieved: false, date: null },
    { value: '$10M', achieved: false, date: null },
    { value: '$50M', achieved: false, date: null },
    { value: '$100M', achieved: false, date: null },
  ];
  
  // Current progress calculation
  const currentMarketCap = 1250000; // $1.25M
  const nextMilestone = 5000000; // $5M
  const previousMilestone = 1000000; // $1M
  
  const progressPercentage = Math.min(
    100, 
    Math.round(((currentMarketCap - previousMilestone) / (nextMilestone - previousMilestone)) * 100)
  );
  
  return (
    <div className={`space-y-12 ${className}`}>
      {/* Metrics Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-lg mr-2">
                {metric.icon}
              </div>
              <span className="text-sm text-gray-500">{metric.label}</span>
            </div>
            <div className="text-2xl font-bold mb-1">{metric.value}</div>
            <div className={`text-sm ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {metric.isPositive ? '↑' : '↓'} {metric.change}
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Market Cap Milestone Tracker */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Market Cap Milestones</h3>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
            <span className="text-sm font-medium">Current: $1.25M</span>
          </div>
        </div>
        
        {/* Milestone Progress Bar */}
        <div className="mb-8">
          <div className="h-8 bg-gray-100 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-primary absolute left-0 top-0"
              initial={{ width: 0 }}
              whileInView={{ width: `${progressPercentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            ></motion.div>
            
            {/* Milestone Markers */}
            <div className="absolute inset-0 flex">
              {milestones.map((milestone, index) => {
                // Calculate position as percentage
                const position = index / (milestones.length - 1) * 100;
                
                return (
                  <div 
                    key={index} 
                    className="absolute flex flex-col items-center z-10"
                    style={{ left: `${position}%` }}
                  >
                    <div 
                      className={`w-4 h-4 rounded-full border-2 border-white ${
                        milestone.achieved ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    ></div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Milestone Labels */}
          <div className="flex justify-between text-sm">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`font-medium ${milestone.achieved ? 'text-primary' : 'text-gray-500'}`}>
                  {milestone.value}
                </div>
                {milestone.achieved && milestone.date && (
                  <div className="text-xs text-gray-500">
                    {milestone.date}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Next Milestone Info */}
        <div className="bg-primary/5 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl mr-3">
              🚀
            </div>
            <div>
              <h4 className="font-semibold">Next Milestone: $5 Million</h4>
              <p className="text-gray-600">
                25% of the way there! Join the community and help us reach our next goal.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Token Distribution Visualization */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-6">Token Distribution</h3>
        
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Distribution Pie Chart */}
          <div>
            <svg viewBox="0 0 100 100" className="w-full max-w-xs mx-auto">
              {/* Community Rewards - 50% */}
              <motion.path
                d="M50,50 L50,0 A50,50 0 0,1 100,50 Z"
                fill="#1E88E5"
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              />
              
              {/* Development Team - 20% */}
              <motion.path
                d="M50,50 L100,50 A50,50 0 0,1 84.1,84.1 Z"
                fill="#FFC107"
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
              
              {/* Public Sale - 30% */}
              <motion.path
                d="M50,50 L84.1,84.1 A50,50 0 0,1 15.9,84.1 A50,50 0 0,1 50,0 Z"
                fill="#4CAF50"
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              
              {/* Center circle */}
              <circle cx="50" cy="50" r="20" fill="white" />
              <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="bold">
                7B Tokens
              </text>
            </svg>
          </div>
          
          {/* Distribution Legend */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-primary mr-3"></div>
              <div className="flex-grow">
                <h4 className="font-medium">Community Rewards</h4>
                <p className="text-sm text-gray-500">50% (3.5 billion SKC)</p>
              </div>
              <div className="text-right">
                <span className="font-semibold">50%</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 bg-secondary mr-3"></div>
              <div className="flex-grow">
                <h4 className="font-medium">Development Team</h4>
                <p className="text-sm text-gray-500">20% (1.4 billion SKC)</p>
              </div>
              <div className="text-right">
                <span className="font-semibold">20%</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-4 h-4 bg-accent mr-3"></div>
              <div className="flex-grow">
                <h4 className="font-medium">Public Sale</h4>
                <p className="text-sm text-gray-500">30% (2.1 billion SKC)</p>
              </div>
              <div className="text-right">
                <span className="font-semibold">30%</span>
              </div>
            </div>
            
            <div className="mt-6 bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Community First:</strong> Our tokenomics puts the community first, with 50% of all tokens
                reserved for community members through the Success Points system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
