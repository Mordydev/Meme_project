'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAchievementStore, Achievement } from '@/store/useAchievementStore';

/**
 * Props for NextGoalsSuggestion component
 */
interface NextGoalsSuggestionProps {
  limit?: number;
  onGoalSelect?: (achievement: Achievement) => void;
  className?: string;
}

/**
 * Recommended achievement targets based on user progress
 */
export function NextGoalsSuggestion({
  limit = 3,
  onGoalSelect,
  className = '',
}: NextGoalsSuggestionProps) {
  const { 
    achievements, 
    inProgressAchievements, 
    isLoading 
  } = useAchievementStore();
  
  // Compute recommended goals
  const recommendedGoals = useMemo(() => {
    if (isLoading || !achievements.length) {
      return [];
    }
    
    // First priority: In-progress achievements (sorted by progress)
    const inProgress = [...inProgressAchievements]
      .sort((a, b) => b.progress - a.progress);
    
    // Second priority: Easy achievements (common difficulty, not started)
    const easyAchievements = achievements.filter(a => 
      !a.unlocked && 
      a.progress === 0 && 
      a.difficulty === 'common'
    );
    
    // Third priority: Other achievements (sorted by difficulty)
    const difficultyOrder = { 
      common: 1, 
      uncommon: 2, 
      rare: 3, 
      epic: 4, 
      legendary: 5 
    };
    
    const otherAchievements = achievements.filter(a => 
      !a.unlocked && 
      a.progress === 0 && 
      a.difficulty !== 'common'
    ).sort((a, b) => 
      difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
      difficultyOrder[b.difficulty as keyof typeof difficultyOrder]
    );
    
    // Combine all priorities and take the requested number
    return [...inProgress, ...easyAchievements, ...otherAchievements].slice(0, limit);
  }, [achievements, inProgressAchievements, isLoading, limit]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="h-7 bg-neutral-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="h-28 bg-neutral-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // No recommendations yet
  if (recommendedGoals.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-lg font-bold text-neutral-800 mb-4">Recommended Goals</h2>
        <div className="text-center py-6 text-neutral-500">
          <p>No recommendations available</p>
          <p className="text-sm mt-1">Stay tuned for personalized achievement suggestions!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-lg font-bold text-neutral-800 mb-4">Recommended Goals</h2>
      
      <div className="space-y-4">
        {recommendedGoals.map((achievement) => (
          <div
            key={achievement.id}
            onClick={() => onGoalSelect?.(achievement)}
            className={`
              border rounded-lg p-3
              ${onGoalSelect ? 'cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {/* Achievement badge */}
              <div className="relative flex-shrink-0">
                <Image
                  src={achievement.badgeUrl}
                  alt={achievement.title}
                  width={56}
                  height={56}
                  className={`rounded-full ${achievement.progress === 0 ? 'opacity-60' : ''}`}
                />
              </div>
              
              {/* Achievement info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-neutral-800">
                  {achievement.title}
                </h3>
                <p className="text-sm text-neutral-600 line-clamp-2">
                  {achievement.description}
                </p>
                
                {/* Reward display */}
                <div className="flex items-center mt-1">
                  <span className="text-sm text-primary-600 font-medium">
                    +{achievement.pointsReward} Points
                  </span>
                  
                  {/* Difficulty badge */}
                  <span
                    className={`
                      ml-2 text-xs px-2 py-0.5 rounded-full
                      ${achievement.difficulty === 'common' ? 'bg-neutral-100 text-neutral-800' : ''}
                      ${achievement.difficulty === 'uncommon' ? 'bg-green-100 text-green-800' : ''}
                      ${achievement.difficulty === 'rare' ? 'bg-blue-100 text-blue-800' : ''}
                      ${achievement.difficulty === 'epic' ? 'bg-purple-100 text-purple-800' : ''}
                      ${achievement.difficulty === 'legendary' ? 'bg-amber-100 text-amber-800' : ''}
                    `}
                  >
                    {achievement.difficulty}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress bar (if has progress) */}
            {achievement.progress > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress}%</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${achievement.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
