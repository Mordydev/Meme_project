'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLevelStore } from '@/store/useLevelStore';
import { LevelBadge } from './LevelBadge';

/**
 * Props for LevelBenefits component
 */
interface LevelBenefitsProps {
  className?: string;
}

/**
 * Component to display current level benefits and perks
 */
export function LevelBenefits({ className = '' }: LevelBenefitsProps) {
  const { userData, isLoading } = useLevelStore();
  
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-neutral-100 rounded-lg p-4 ${className}`}>
        <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-neutral-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-neutral-200 rounded w-4/6"></div>
      </div>
    );
  }
  
  if (!userData) {
    return null;
  }
  
  return (
    <div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-primary-50 p-4 border-b border-neutral-200">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-neutral-800">Current Level Benefits</h3>
          <LevelBadge level={userData.level} size="sm" />
        </div>
        <div className="text-sm text-primary-600 font-medium">
          {userData.title}
        </div>
      </div>
      
      {/* Benefits list */}
      <div className="p-4">
        <ul className="space-y-3">
          {userData.benefits.map((benefit, index) => (
            <motion.li
              key={index}
              className="flex items-start gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-primary-500 mt-0.5">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-neutral-700">{benefit}</span>
            </motion.li>
          ))}
        </ul>
        
        {/* Next level preview */}
        {userData.badges.next && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="text-sm text-neutral-600 mb-2">Next Level Preview:</div>
            <div className="bg-neutral-50 rounded p-3 flex items-center gap-3">
              <div className="opacity-70">
                <LevelBadge 
                  level={userData.level + 1} 
                  size="sm" 
                  badgeUrl={userData.badges.next}
                />
              </div>
              <div className="text-sm text-neutral-500">
                Next level benefits will be revealed when you reach Level {userData.level + 1}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
