'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAchievements } from '@/hooks/useAchievements';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { Badge, Award, Trophy, Star, ArrowRight } from 'lucide-react';

interface AchievementProgressProps {
  className?: string;
}

// Mock achievements data for development purposes
// In a real implementation, this would come from the useAchievements hook
const mockAchievements = [
  {
    id: 'community-contributor',
    name: 'Community Contributor',
    description: 'Create 5 posts that receive engagement',
    progress: 0.6, // 60% complete
    points: 250,
    icon: 'Badge',
    category: 'community'
  },
  {
    id: 'engagement-master',
    name: 'Engagement Master',
    description: 'Receive 25 upvotes on your content',
    progress: 0.4, // 40% complete
    points: 300,
    icon: 'Award',
    category: 'engagement'
  },
  {
    id: 'daily-streak',
    name: 'Week-Long Streak',
    description: 'Log in for 7 consecutive days',
    progress: 0.8, // 80% complete
    points: 500,
    icon: 'Trophy',
    category: 'loyalty'
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'Create your first 10 pieces of content',
    progress: 0.2, // 20% complete
    points: 400,
    icon: 'Star',
    category: 'content'
  }
];

/**
 * AchievementProgress - Visualizes user's progress toward next achievements to drive engagement
 */
export function AchievementProgress({ className }: AchievementProgressProps) {
  // In a real implementation, this would use the actual hook data
  // const { inProgressAchievements, isLoading } = useAchievements();
  const prefersReducedMotion = useReducedMotion();
  
  // For development, we'll use our mock data
  const inProgressAchievements = useMemo(() => mockAchievements, []);
  const isLoading = false;
  
  // Get the icon component based on the icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Badge':
        return <Badge className="w-5 h-5" />;
      case 'Award':
        return <Award className="w-5 h-5" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5" />;
      case 'Star':
        return <Star className="w-5 h-5" />;
      default:
        return <Award className="w-5 h-5" />;
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-4 animate-pulse", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }
  
  // Empty state
  if (inProgressAchievements.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <Award className="w-10 h-10 mb-2 text-primary-300 dark:text-primary-700" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Achievements In Progress</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
          Start engaging with the platform to unlock achievements!
        </p>
        <a 
          href="/achievements" 
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          View Available Achievements
        </a>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <motion.div 
        className="space-y-4"
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
      >
        {inProgressAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 
              hover:shadow-md transition-shadow duration-200"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            <div className="flex gap-3">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 rounded-lg w-10 h-10 flex items-center justify-center",
                "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300"
              )}>
                {getIconComponent(achievement.icon)}
              </div>
              
              {/* Content */}
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {achievement.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {achievement.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-primary-100 dark:bg-primary-900/30 
                      text-primary-700 dark:text-primary-300 text-xs font-medium px-2 py-1 rounded-full">
                      +{achievement.points} SP
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${achievement.progress * 100}%`,
                      backgroundColor: achievement.progress > 0.6 
                        ? 'var(--color-accent)' 
                        : 'var(--color-primary)'
                    }}
                    initial={prefersReducedMotion ? undefined : { width: 0 }}
                    animate={{ width: `${achievement.progress * 100}%` }}
                    transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  />
                </div>
                
                {/* Progress Text */}
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(achievement.progress * 100)}% complete
                  </span>
                  {achievement.progress >= 0.8 && (
                    <span className="text-xs text-accent-600 dark:text-accent-400 font-medium">
                      Almost there!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* View All link */}
      <div className="mt-4 text-center">
        <a 
          href="/achievements" 
          className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 
            hover:text-primary-800 dark:hover:text-primary-200 font-medium"
        >
          View All Achievements
          <ArrowRight className="w-4 h-4 ml-1" />
        </a>
      </div>
    </div>
  );
}
