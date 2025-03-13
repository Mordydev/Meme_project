'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LeaderboardUser } from '@/types';
import { Card } from '@/components/ui/card';
import { LevelBadge } from '../levels';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface UserRankHighlightProps {
  userRank: LeaderboardUser;
  pointsToNextRank?: number;
  className?: string;
  onViewProfile?: () => void;
}

/**
 * UserRankHighlight
 * 
 * Component to highlight the current user's position on the leaderboard.
 */
export function UserRankHighlight({ 
  userRank, 
  pointsToNextRank,
  className,
  onViewProfile
}: UserRankHighlightProps) {
  return (
    <Card className={cn("p-4 border-primary/20 bg-primary/5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full mr-4 font-bold text-xl",
            userRank.rank <= 3 ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
          )}>
            {userRank.rank}
          </div>
          
          <div>
            <h3 className="font-semibold">Your Current Rank</h3>
            <p className="text-sm text-muted-foreground">
              {pointsToNextRank ? (
                <span>Need {pointsToNextRank.toLocaleString()} more points to rank up</span>
              ) : (
                <span>Keep earning points to improve your rank!</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="text-right mr-4">
            <div className="font-bold text-xl">{userRank.score.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
          
          <LevelBadge level={userRank.level} size="md" />
        </div>
      </div>
      
      {/* Position Change Section */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center">
          {userRank.change !== undefined && (
            <>
              {userRank.change > 0 ? (
                <div className="flex items-center text-green-600 mr-2">
                  <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5L12 19M12 5L19 12M12 5L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="font-medium">Up {userRank.change} {userRank.change === 1 ? 'position' : 'positions'}</span>
                </div>
              ) : userRank.change < 0 ? (
                <div className="flex items-center text-red-500 mr-2">
                  <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 19L12 5M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="font-medium">Down {Math.abs(userRank.change)} {Math.abs(userRank.change) === 1 ? 'position' : 'positions'}</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600 mr-2">
                  <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M5 12H7M19 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="font-medium">No change</span>
                </div>
              )}
            </>
          )}
        </div>
        
        <Button variant="outline" size="sm" onClick={onViewProfile}>
          View Profile
        </Button>
      </div>
    </Card>
  );
}
