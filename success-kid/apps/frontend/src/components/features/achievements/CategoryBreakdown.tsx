'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAchievementStore, AchievementCategory } from '@/store/useAchievementStore';

/**
 * Props for CategoryBreakdown component
 */
interface CategoryBreakdownProps {
  onCategorySelect?: (category: AchievementCategory) => void;
  className?: string;
}

/**
 * Interface for category completion data
 */
interface CategoryCompletion {
  id: AchievementCategory;
  displayName: string;
  total: number;
  unlocked: number;
  percentage: number;
  color: string;
}

/**
 * Visual breakdown of achievement completion by category
 */
export function CategoryBreakdown({
  onCategorySelect,
  className = '',
}: CategoryBreakdownProps) {
  const { achievements, isLoading } = useAchievementStore();
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="h-7 bg-neutral-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 bg-neutral-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Calculate category completion data
  const categoryData = getCategoryCompletionData(achievements);
  
  // Handle category selection
  const handleCategoryClick = (category: AchievementCategory) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };
  
  // If no achievements, show empty state
  if (categoryData.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-lg font-bold text-neutral-800 mb-4">Categories</h2>
        <div className="text-center py-6 text-neutral-500">
          <p>No achievement categories available yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-lg font-bold text-neutral-800 mb-4">Categories</h2>
      
      <div className="space-y-4">
        {categoryData.map((category) => (
          <div 
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`
              relative p-3 border rounded-lg 
              transition-colors duration-200
              ${onCategorySelect ? 'cursor-pointer hover:bg-neutral-50' : ''}
            `}
          >
            {/* Category header */}
            <div className="flex justify-between mb-1">
              <h3 className="font-medium text-neutral-700">{category.displayName}</h3>
              <span className="text-sm">
                <span className="font-semibold">{category.unlocked}</span>
                <span className="text-neutral-500">/{category.total}</span>
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full"
                style={{ backgroundColor: category.color, width: `${category.percentage}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${category.percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            
            {/* Progress label */}
            <div className="mt-1 text-right text-xs text-neutral-500">
              {category.percentage}% complete
            </div>
            
            {/* Progress indicator mark */}
            <div 
              className="absolute right-3 top-3 w-2 h-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper function to prepare category completion data
 */
function getCategoryCompletionData(achievements: any[]): CategoryCompletion[] {
  // If no achievements, return empty array
  if (!achievements.length) {
    return [];
  }
  
  // Category color mapping
  const categoryColors: Record<string, string> = {
    onboarding: '#4CAF50', // Green
    content: '#1E88E5', // Blue
    engagement: '#FFC107', // Yellow
    holder: '#7B1FA2', // Purple
    community: '#F44336', // Red
    milestone: '#FF9800', // Orange
    // Fallback color for other categories
    default: '#607D8B',
  };
  
  // Build category data
  const categoryMap: Record<string, Omit<CategoryCompletion, 'displayName' | 'color'>> = {};
  
  // Collect category data
  achievements.forEach(achievement => {
    if (!categoryMap[achievement.category]) {
      categoryMap[achievement.category] = {
        id: achievement.category as AchievementCategory,
        total: 0,
        unlocked: 0,
        percentage: 0,
      };
    }
    
    categoryMap[achievement.category].total++;
    if (achievement.unlocked) {
      categoryMap[achievement.category].unlocked++;
    }
  });
  
  // Calculate percentages and add display names and colors
  const result = Object.values(categoryMap).map(category => {
    const percentage = Math.round((category.unlocked / category.total) * 100);
    return {
      ...category,
      percentage,
      displayName: getCategoryDisplayName(category.id),
      color: categoryColors[category.id] || categoryColors.default,
    };
  });
  
  // Sort by number of total achievements, then by name
  return result.sort((a, b) => {
    if (b.total === a.total) {
      return a.displayName.localeCompare(b.displayName);
    }
    return b.total - a.total;
  });
}

/**
 * Helper function to format category names
 */
function getCategoryDisplayName(category: string): string {
  switch (category) {
    case 'onboarding': return 'Onboarding';
    case 'content': return 'Content Creation';
    case 'engagement': return 'Community Engagement';
    case 'holder': return 'Token Holder';
    case 'community': return 'Community Builder';
    case 'milestone': return 'Milestones';
    default:
      // Convert camelCase or snake_case to Title Case
      return category
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^\w/, c => c.toUpperCase());
  }
}
