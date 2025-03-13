'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { AchievementCategory } from '@/types';

interface CategoryBreakdownProps {
  categories: Array<{
    category: AchievementCategory;
    total: number;
    unlocked: number;
    percentage: number;
  }>;
  onCategorySelect?: (category: AchievementCategory) => void;
  className?: string;
}

/**
 * CategoryBreakdown
 * 
 * Component to display achievement completion by category.
 */
export function CategoryBreakdown({ 
  categories, 
  onCategorySelect,
  className 
}: CategoryBreakdownProps) {
  // Category icon mapping
  const getCategoryIcon = (category: AchievementCategory): React.ReactNode => {
    switch (category) {
      case 'onboarding':
        return <span className="text-xl">🚀</span>;
      case 'engagement':
        return <span className="text-xl">👋</span>;
      case 'content':
        return <span className="text-xl">✍️</span>;
      case 'community':
        return <span className="text-xl">👥</span>;
      case 'wallet':
        return <span className="text-xl">💰</span>;
      case 'referral':
        return <span className="text-xl">🔗</span>;
      case 'milestones':
        return <span className="text-xl">🏆</span>;
      default:
        return <span className="text-xl">🎯</span>;
    }
  };
  
  // Category color mapping
  const getCategoryColor = (category: AchievementCategory): string => {
    switch (category) {
      case 'onboarding':
        return 'bg-blue-500';
      case 'engagement':
        return 'bg-green-500';
      case 'content':
        return 'bg-purple-500';
      case 'community':
        return 'bg-orange-500';
      case 'wallet':
        return 'bg-yellow-500';
      case 'referral':
        return 'bg-pink-500';
      case 'milestones':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Achievement Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => (
            <div 
              key={category.category} 
              className={cn(
                "p-3 rounded-md transition-colors",
                "border border-muted hover:border-muted-foreground/50",
                "cursor-pointer"
              )}
              onClick={() => onCategorySelect?.(category.category)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center mr-3 bg-muted">
                    {getCategoryIcon(category.category)}
                  </div>
                  <h3 className="font-medium capitalize">{category.category}</h3>
                </div>
                <span className="font-semibold">
                  {category.percentage}%
                </span>
              </div>
              
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", getCategoryColor(category.category))}
                  style={{ width: '0%' }}
                  animate={{ width: `${category.percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              
              <div className="mt-1 text-xs text-muted-foreground">
                {category.unlocked} of {category.total} achievements
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
