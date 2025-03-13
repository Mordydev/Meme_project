'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface RecentUnlocksProps {
  recentUnlocks: Array<{
    id: string;
    title: string;
    badgeUrl: string;
    unlockedAt: string;
  }>;
  onAchievementSelect?: (id: string) => void;
  className?: string;
}

/**
 * RecentUnlocks
 * 
 * Component to display recently earned achievements.
 */
export function RecentUnlocks({ 
  recentUnlocks, 
  onAchievementSelect,
  className 
}: RecentUnlocksProps) {
  if (recentUnlocks.length === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium">No achievements yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              Start participating in the community to earn achievements!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Recent Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentUnlocks.map((achievement) => (
            <div 
              key={achievement.id}
              className={cn(
                "flex items-center p-3 rounded-md transition-colors",
                "border border-muted hover:border-muted-foreground/50",
                "cursor-pointer"
              )}
              onClick={() => onAchievementSelect?.(achievement.id)}
            >
              <div className="relative w-12 h-12 flex-shrink-0 mr-3">
                {achievement.badgeUrl ? (
                  <Image
                    src={achievement.badgeUrl}
                    alt={achievement.title}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                    🏆
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{achievement.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
