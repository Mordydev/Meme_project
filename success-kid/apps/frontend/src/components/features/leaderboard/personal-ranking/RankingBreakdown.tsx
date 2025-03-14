'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardCategory } from '@/types';

interface CategoryRankSummary {
  currentRank: number;
  bestRank: number;
  totalScore: number;
}

interface RankingBreakdownProps {
  categories: Record<LeaderboardCategory, CategoryRankSummary>;
  className?: string;
}

/**
 * RankingBreakdown
 * 
 * Component to display a breakdown of user's ranking across different categories
 */
export function RankingBreakdown({ categories, className }: RankingBreakdownProps) {
  // Category metadata for display
  const categoryMeta: Record<LeaderboardCategory, { label: string; description: string; icon: React.ReactNode }> = {
    points: {
      label: 'Overall Points',
      description: 'Your ranking based on total success points earned across all activities',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    achievements: {
      label: 'Achievements',
      description: 'How you rank in terms of badges and achievements unlocked',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    content: {
      label: 'Content Creation',
      description: 'Your ranking based on quality and quantity of content created',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19L19 12L22 15L15 22L12 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 13L16.5 5.5L2 2L5.5 16.5L13 18L18 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 2L9.586 9.586" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 13C12.1046 13 13 12.1046 13 11C13 9.89543 12.1046 9 11 9C9.89543 9 9 9.89543 9 11C9 12.1046 9.89543 13 11 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    referrals: {
      label: 'Referrals',
      description: 'How you rank in bringing new members to the community',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-semibold">Category Breakdown</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(categories).map(([key, data]) => {
          const category = key as LeaderboardCategory;
          const meta = categoryMeta[category];
          
          // Calculate improvement from best to current
          const improvement = Math.max(0, data.currentRank - data.bestRank);
          
          return (
            <div key={category} className="border rounded-md p-4">
              <div className="flex items-center mb-2">
                <div className="text-primary mr-2">
                  {meta.icon}
                </div>
                <h4 className="font-medium">{meta.label}</h4>
              </div>
              
              <p className="text-xs text-muted-foreground mb-4">
                {meta.description}
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/30 p-2 rounded">
                  <div className="text-lg font-bold">{data.currentRank}</div>
                  <div className="text-xs text-muted-foreground">Current</div>
                </div>
                
                <div className="bg-muted/30 p-2 rounded">
                  <div className="text-lg font-bold text-success">{data.bestRank}</div>
                  <div className="text-xs text-muted-foreground">Best</div>
                </div>
                
                <div className="bg-muted/30 p-2 rounded">
                  <div className="text-lg font-bold">{data.totalScore.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
              </div>
              
              {improvement > 0 && (
                <div className="mt-2 text-xs text-center text-muted-foreground">
                  You were {improvement} {improvement === 1 ? 'position' : 'positions'} higher at your best
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
