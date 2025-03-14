'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardCategory } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ImprovementSuggestionItem {
  id: string;
  title: string;
  description: string;
  action: string;
  actionLabel: string;
  difficulty: 'easy' | 'medium' | 'hard';
  potentialGain: 'low' | 'medium' | 'high';
}

interface ImprovementSuggestionsProps {
  currentCategory: LeaderboardCategory;
  currentRank: number;
  className?: string;
}

/**
 * ImprovementSuggestions
 * 
 * Component that provides actionable suggestions to improve ranking
 */
export function ImprovementSuggestions({ 
  currentCategory,
  currentRank,
  className 
}: ImprovementSuggestionsProps) {
  // Generate category-specific suggestions
  const getSuggestions = (): ImprovementSuggestionItem[] => {
    switch (currentCategory) {
      case 'points':
        return [
          {
            id: 'points-1',
            title: 'Daily Activity Streak',
            description: 'Login and perform at least one activity every day to build a streak for bonus points.',
            action: '/activities',
            actionLabel: 'Start Now',
            difficulty: 'easy',
            potentialGain: 'medium'
          },
          {
            id: 'points-2',
            title: 'Content Creation Focus',
            description: 'Creating quality posts earns more points than other activities. Focus on original content.',
            action: '/create',
            actionLabel: 'Create Content',
            difficulty: 'medium',
            potentialGain: 'high'
          },
          {
            id: 'points-3',
            title: 'Target Achievement Badges',
            description: 'Complete specific achievements that award large point bonuses.',
            action: '/achievements',
            actionLabel: 'View Achievements',
            difficulty: 'medium',
            potentialGain: 'high'
          }
        ];
      case 'achievements':
        return [
          {
            id: 'achievements-1',
            title: 'Low-Hanging Achievements',
            description: 'Focus on completing the easier achievements first to boost your count quickly.',
            action: '/achievements?filter=easiest',
            actionLabel: 'Find Easy Wins',
            difficulty: 'easy',
            potentialGain: 'medium'
          },
          {
            id: 'achievements-2',
            title: 'Category Completion',
            description: 'Complete all achievements in a specific category for bonus rewards.',
            action: '/achievements/categories',
            actionLabel: 'View Categories',
            difficulty: 'hard',
            potentialGain: 'high'
          }
        ];
      case 'content':
        return [
          {
            id: 'content-1',
            title: 'Post Consistency',
            description: 'Create content on a regular schedule to build audience and engagement.',
            action: '/create',
            actionLabel: 'Create Content',
            difficulty: 'medium',
            potentialGain: 'medium'
          },
          {
            id: 'content-2',
            title: 'Quality Over Quantity',
            description: 'Focus on creating fewer but higher-quality posts that generate more engagement.',
            action: '/community/top-posts',
            actionLabel: 'Study Top Posts',
            difficulty: 'hard',
            potentialGain: 'high'
          },
          {
            id: 'content-3',
            title: 'Engage With Others',
            description: 'Comment on and react to others\' content to increase your visibility.',
            action: '/community',
            actionLabel: 'Browse Community',
            difficulty: 'easy',
            potentialGain: 'low'
          }
        ];
      case 'referrals':
        return [
          {
            id: 'referrals-1',
            title: 'Share Your Referral Link',
            description: 'Share your referral link on social media and with friends to bring new users.',
            action: '/referrals',
            actionLabel: 'Get Referral Link',
            difficulty: 'easy',
            potentialGain: 'medium'
          },
          {
            id: 'referrals-2',
            title: 'Help Onboard Referrals',
            description: 'Help your referrals complete onboarding for extra points and higher conversion.',
            action: '/referrals/dashboard',
            actionLabel: 'Check Referrals',
            difficulty: 'medium',
            potentialGain: 'medium'
          },
          {
            id: 'referrals-3',
            title: 'Create Content About Benefits',
            description: 'Create content highlighting platform benefits to attract more users through your referrals.',
            action: '/create',
            actionLabel: 'Create Content',
            difficulty: 'medium',
            potentialGain: 'high'
          }
        ];
      default:
        return [];
    }
  };
  
  // Get suggestions based on current category
  const suggestions = getSuggestions();
  
  // Get difficulty badge
  const getDifficultyBadge = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full">Easy</span>;
      case 'medium':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">Medium</span>;
      case 'hard':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">Hard</span>;
      default:
        return null;
    }
  };
  
  // Get potential gain badge
  const getPotentialGainBadge = (gain: 'low' | 'medium' | 'high') => {
    switch (gain) {
      case 'low':
        return <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">Low Impact</span>;
      case 'medium':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Medium Impact</span>;
      case 'high':
        return <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">High Impact</span>;
      default:
        return null;
    }
  };
  
  // Handle action button click
  const handleActionClick = (action: string) => {
    console.log(`Navigate to: ${action}`);
    // In a real implementation, this would use navigation
    // router.push(action);
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Suggestions to Improve Your Rank</h3>
        
        <div className="text-sm text-muted-foreground">
          Current Rank: <span className="font-medium text-foreground">{currentRank}</span>
        </div>
      </div>
      
      {suggestions.length > 0 ? (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleActionClick(suggestion.action)}
                  >
                    {suggestion.actionLabel}
                  </Button>
                </div>
                
                <div className="flex gap-2 mt-3">
                  {getDifficultyBadge(suggestion.difficulty)}
                  {getPotentialGainBadge(suggestion.potentialGain)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No specific suggestions available for this category.
        </div>
      )}
    </div>
  );
}
