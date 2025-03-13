'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAchievements } from '@/hooks/useAchievements';

interface ProgressSummaryProps {
  className?: string;
}

/**
 * ProgressSummary
 * 
 * Component to display an overview of achievement progress with visualization.
 */
export function ProgressSummary({ className }: ProgressSummaryProps) {
  const { 
    achievements, 
    unlockedAchievements, 
    getProgressPercentage, 
    isLoading 
  } = useAchievements();
  
  const progressPercentage = getProgressPercentage();
  const totalAchievements = achievements.length;
  const unlockedCount = unlockedAchievements.length;
  
  // Get a message based on unlock percentage
  const getMessage = () => {
    if (progressPercentage < 10) return "Just getting started. Keep going!";
    if (progressPercentage < 25) return "You're making progress. Keep it up!";
    if (progressPercentage < 50) return "Getting there! You're building momentum.";
    if (progressPercentage < 75) return "Impressive progress! You're well on your way.";
    if (progressPercentage < 100) return "Almost there! Just a few more to complete.";
    return "Amazing! You've unlocked all achievements!";
  };
  
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Achievement Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded-md w-3/4"></div>
            <div className="h-10 bg-muted rounded-md w-full"></div>
            <div className="h-4 bg-muted rounded-md w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress Text */}
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Overall Progress</span>
              <span className="text-2xl font-bold">{progressPercentage}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  progressPercentage < 25 ? "bg-primary/50" :
                  progressPercentage < 50 ? "bg-primary/70" : 
                  progressPercentage < 75 ? "bg-primary" : 
                  progressPercentage < 100 ? "bg-success" : 
                  "bg-success"
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {/* Achievement Count */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {unlockedCount} / {totalAchievements} achievements
              </span>
              <span className="font-medium">{getMessage()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
