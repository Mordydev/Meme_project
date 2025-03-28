'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMilestoneData } from '@/hooks/useMarketData';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, Award, ExternalLink } from 'lucide-react';

interface MarketMilestoneTrackerProps {
  className?: string;
}

// Mock milestone data for development
const MOCK_MILESTONE_DATA = {
  currentMarketCap: 450000,
  milestones: [
    { id: 'ms1', value: 100000, label: '$100K', description: 'Initial Growth', achievedAt: '2023-09-01T12:00:00Z' },
    { id: 'ms2', value: 500000, label: '$500K', description: 'Community Establishment', achievedAt: null },
    { id: 'ms3', value: 1000000, label: '$1M', description: 'Major Milestone', achievedAt: null },
    { id: 'ms4', value: 5000000, label: '$5M', description: 'Significant Growth', achievedAt: null },
    { id: 'ms5', value: 10000000, label: '$10M', description: 'Market Recognition', achievedAt: null },
  ],
  nextMilestone: {
    id: 'ms2',
    value: 500000,
    label: '$500K',
    description: 'Community Establishment',
    progress: 0.9, // 90% complete
    remaining: 50000
  },
  // Added for demo purposes
  isCelebrating: false,
  celebratedMilestone: null
};

/**
 * MarketMilestoneTracker - Creates visual representation of community progress toward market cap goals
 */
export function MarketMilestoneTracker({ className }: MarketMilestoneTrackerProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // In a real implementation, this would use the actual hook
  // const { currentMarketCap, milestones, nextMilestone, isLoading, error, isCelebrating, celebratedMilestone } = useMilestoneData();
  
  // For development, we'll use our mock data
  const [milestoneData, setMilestoneData] = useState(MOCK_MILESTONE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to trigger a milestone celebration (for demo purposes)
  const triggerCelebration = () => {
    if (milestoneData.nextMilestone) {
      const nextMilestoneId = milestoneData.nextMilestone.id;
      const updatedMilestones = milestoneData.milestones.map(m => 
        m.id === nextMilestoneId 
          ? { ...m, achievedAt: new Date().toISOString() } 
          : m
      );
      
      // Find the milestone after this one
      const currentIndex = milestoneData.milestones.findIndex(m => m.id === nextMilestoneId);
      const nextIndex = currentIndex + 1;
      
      // Update state with celebration
      setMilestoneData({
        ...milestoneData,
        currentMarketCap: milestoneData.nextMilestone.value,
        milestones: updatedMilestones,
        nextMilestone: nextIndex < milestoneData.milestones.length ? {
          ...milestoneData.milestones[nextIndex],
          progress: 0,
          remaining: milestoneData.milestones[nextIndex].value - milestoneData.nextMilestone.value
        } : null,
        isCelebrating: true,
        celebratedMilestone: milestoneData.milestones.find(m => m.id === nextMilestoneId)
      });
      
      // Auto-dismiss celebration after a delay
      setTimeout(() => {
        setMilestoneData(prev => ({ ...prev, isCelebrating: false }));
      }, 5000);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.2,
        staggerChildren: 0.1
      }
    }
  };
  
  const milestoneVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    }
  };
  
  const progressVariants = {
    hidden: { width: 0 },
    visible: { 
      width: `${milestoneData.nextMilestone?.progress * 100}%`,
      transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
    }
  };
  
  const celebrationVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={cn("text-center p-6", className)}>
        <div className="text-alert-500">
          <TrendingUp className="w-8 h-8 mx-auto mb-2" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Couldn't load market data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
          There was a problem fetching the latest market data
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {/* Milestone Celebration Overlay (shown when a milestone is achieved) */}
      <AnimatePresence>
        {milestoneData.isCelebrating && milestoneData.celebratedMilestone && (
          <motion.div
            className="relative bg-gradient-to-br from-primary-100 to-secondary-100 
              dark:from-primary-900/30 dark:to-secondary-900/30 rounded-lg p-6 mb-6 
              border border-primary-200 dark:border-primary-800 overflow-hidden"
            variants={prefersReducedMotion ? undefined : celebrationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Confetti effect background (CSS-only for simplicity) */}
            <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-2 h-2 bg-primary-500 rounded-full animate-falling-slow"></div>
              <div className="absolute top-0 left-1/3 w-3 h-3 bg-secondary-500 rounded-full animate-falling-medium"></div>
              <div className="absolute top-0 left-2/3 w-2 h-2 bg-accent-500 rounded-full animate-falling-fast"></div>
              <div className="absolute top-0 left-3/4 w-1 h-1 bg-primary-500 rounded-full animate-falling-medium"></div>
              <div className="absolute top-0 left-1/2 w-3 h-3 bg-secondary-500 rounded-full animate-falling-slow"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="mb-2">
                <Award className="w-12 h-12 mx-auto text-secondary-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Milestone Achieved! 🎉
              </h3>
              <p className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-2">
                {milestoneData.celebratedMilestone.label} Market Cap
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our community has reached the {milestoneData.celebratedMilestone.description} milestone!
              </p>
              <a 
                href="/market"
                className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-md 
                  hover:bg-primary-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Market Details
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Current Market Cap Display */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Market Cap
          </h3>
          <div className="text-3xl font-bold text-primary-700 dark:text-primary-300">
            {formatCurrency(milestoneData.currentMarketCap)}
          </div>
        </div>
        <div className="flex-shrink-0">
          <a 
            href="/market"
            className="bg-primary-100 dark:bg-primary-900/20 hover:bg-primary-200 
              dark:hover:bg-primary-900/40 text-primary-800 dark:text-primary-200
              text-sm px-3 py-1 rounded-md inline-flex items-center transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1.5" />
            Details
          </a>
        </div>
      </div>
      
      {/* Next Milestone Progress */}
      {milestoneData.nextMilestone && (
        <div className="mb-6">
          <div className="flex justify-between items-center text-sm">
            <div className="text-gray-700 dark:text-gray-300">
              Next: <span className="font-medium">{milestoneData.nextMilestone.label}</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {formatCurrency(milestoneData.nextMilestone.remaining)} to go
            </div>
          </div>
          
          <div className="mt-2 h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${milestoneData.nextMilestone.progress * 100}%` }}
              variants={prefersReducedMotion ? undefined : progressVariants}
              initial="hidden"
              animate="visible"
            ></motion.div>
          </div>
          
          <div className="mt-1 text-right">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(milestoneData.nextMilestone.progress * 100)}% complete
            </span>
          </div>
          
          {/* Test button for demo purposes - would be removed in production */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={triggerCelebration}
              className="mt-2 px-3 py-1 bg-secondary-500 text-white text-xs rounded hidden"
            >
              Test Celebration
            </button>
          )}
        </div>
      )}
      
      {/* Milestone Timeline */}
      <motion.div
        className="relative pt-8"
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Timeline track */}
        <div className="absolute top-12 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-0"></div>
        
        {/* Milestone markers */}
        <div className="relative z-10 flex justify-between">
          {milestoneData.milestones.map((milestone, index) => {
            const isAchieved = !!milestone.achievedAt;
            const isCurrent = milestone.id === milestoneData.nextMilestone?.id;
            
            return (
              <motion.div
                key={milestone.id}
                className="flex flex-col items-center"
                variants={prefersReducedMotion ? undefined : milestoneVariants}
              >
                {/* Milestone dot */}
                <div 
                  className={cn(
                    "w-5 h-5 rounded-full border-2",
                    isAchieved 
                      ? "bg-accent-500 border-accent-300 dark:border-accent-700" 
                      : isCurrent
                        ? "bg-primary-100 dark:bg-primary-900/30 border-primary-500"
                        : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  )}
                ></div>
                
                {/* Milestone value */}
                <div className="mt-2 text-sm font-medium text-center">
                  <div className={cn(
                    isAchieved 
                      ? "text-accent-700 dark:text-accent-300" 
                      : isCurrent
                        ? "text-primary-700 dark:text-primary-300"
                        : "text-gray-600 dark:text-gray-400"
                  )}>
                    {milestone.label}
                  </div>
                  
                  {/* Date achieved (if applicable) */}
                  {isAchieved && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(milestone.achievedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
