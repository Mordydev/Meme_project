'use client';

import React, { useState } from 'react';
import { Achievement } from '@/store/useAchievementStore';
import { AchievementCard } from './AchievementCard';

/**
 * Props for the AchievementGrid component
 */
interface AchievementGridProps {
  achievements: Achievement[];
  unlocked: string[]; // IDs of unlocked achievements
  progress: Record<string, number>; // Progress percentages by ID
  onSelect?: (achievement: Achievement) => void;
  className?: string;
}

/**
 * Grid layout for displaying achievement collections
 */
export function AchievementGrid({
  achievements,
  unlocked,
  progress,
  onSelect,
  className = '',
}: AchievementGridProps) {
  // Handle selection
  const handleSelect = (achievement: Achievement) => {
    if (onSelect) {
      onSelect(achievement);
    }
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          isUnlocked={unlocked.includes(achievement.id)}
          progress={progress[achievement.id] || 0}
          onClick={() => handleSelect(achievement)}
        />
      ))}
      
      {achievements.length === 0 && (
        <div className="col-span-full p-8 text-center text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-lg font-medium">No achievements found</p>
          <p className="mt-2">There are no achievements in this category yet.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Props for the FilterableAchievementGrid component
 */
interface FilterableAchievementGridProps extends AchievementGridProps {
  categories: Array<{id: string, name: string, count: number}>;
  filterCompletionStatus?: boolean;
}

/**
 * Achievement grid with filtering capabilities
 */
export function FilterableAchievementGrid({
  achievements,
  unlocked,
  progress,
  onSelect,
  categories,
  filterCompletionStatus = true,
  className = '',
}: FilterableAchievementGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'completed' | 'in-progress'>('all');
  
  // Filter achievements based on current filters
  const filteredAchievements = achievements.filter((achievement) => {
    // Category filter
    if (activeCategory !== 'all' && achievement.category !== activeCategory) {
      return false;
    }
    
    // Completion status filter
    if (completionFilter === 'completed' && !unlocked.includes(achievement.id)) {
      return false;
    }
    
    if (completionFilter === 'in-progress' && 
        (!progress[achievement.id] || progress[achievement.id] === 0 || unlocked.includes(achievement.id))) {
      return false;
    }
    
    return true;
  });

  return (
    <div className={className}>
      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${activeCategory === 'all' 
              ? 'bg-primary-500 text-white' 
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}
          `}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${activeCategory === category.id 
                ? 'bg-primary-500 text-white' 
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}
            `}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>
      
      {/* Completion status filter */}
      {filterCompletionStatus && (
        <div className="mb-6">
          <div className="flex border border-neutral-200 rounded-lg overflow-hidden w-fit">
            <button
              onClick={() => setCompletionFilter('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors
                ${completionFilter === 'all' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'}
              `}
            >
              All
            </button>
            <button
              onClick={() => setCompletionFilter('completed')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-neutral-200
                ${completionFilter === 'completed' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'}
              `}
            >
              Completed
            </button>
            <button
              onClick={() => setCompletionFilter('in-progress')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-neutral-200
                ${completionFilter === 'in-progress' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'}
              `}
            >
              In Progress
            </button>
          </div>
        </div>
      )}
      
      {/* Achievement grid */}
      <AchievementGrid
        achievements={filteredAchievements}
        unlocked={unlocked}
        progress={progress}
        onSelect={onSelect}
      />
      
      {/* Empty state */}
      {filteredAchievements.length === 0 && (
        <div className="p-8 text-center text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-lg font-medium">No achievements found</p>
          <p className="mt-2">Try changing your filters to see more achievements.</p>
        </div>
      )}
    </div>
  );
}
