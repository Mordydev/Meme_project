'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CompetitionReward } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface RewardDisplayProps {
  reward: CompetitionReward;
  className?: string;
}

/**
 * RewardDisplay
 * 
 * Component to display competition rewards
 */
export function RewardDisplay({ reward, className }: RewardDisplayProps) {
  // Get reward icon based on type
  const getRewardIcon = () => {
    if (reward.imageUrl) {
      return (
        <div className="relative w-12 h-12">
          <Image
            src={reward.imageUrl}
            alt={`${reward.type} reward`}
            fill
            className="object-contain"
          />
        </div>
      );
    }
    
    // Default icons if no image provided
    switch (reward.type) {
      case 'points':
        return (
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'badge':
        return (
          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-secondary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'token':
        return (
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 9H10.5C9.67157 9 9 9.67157 9 10.5C9 11.3284 9.67157 12 10.5 12H13.5C14.3284 12 15 12.6716 15 13.5C15 14.3284 14.3284 15 13.5 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 12V22H4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 7H2V12H22V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
    }
  };
  
  // Format rank position
  const formatRank = (rank: number | string) => {
    if (typeof rank === 'string') {
      return rank.charAt(0).toUpperCase() + rank.slice(1);
    }
    
    switch (rank) {
      case 1:
        return '1st Place';
      case 2:
        return '2nd Place';
      case 3:
        return '3rd Place';
      default:
        return `${rank}th Place`;
    }
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center">
          {getRewardIcon()}
          
          <div className="ml-4">
            <h4 className="font-medium">{formatRank(reward.rank)}</h4>
            <div className="flex items-baseline">
              <span className="text-lg font-bold">{reward.value}</span>
              <span className="text-sm text-muted-foreground ml-2">{reward.description}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
