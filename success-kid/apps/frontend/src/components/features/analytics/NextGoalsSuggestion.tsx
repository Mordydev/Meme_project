'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface NextGoalsSuggestionProps {
  suggestedGoals: Array<{
    id: string;
    title: string;
    badgeUrl: string;
    progress: number;
  }>;
  onAchievementSelect?: (id: string) => void;
  className?: string;
}

/**
 * NextGoalsSuggestion
 * 
 * Component to display recommended achievement targets.
 */
export function NextGoalsSuggestion({ 
  suggestedGoals, 
  onAchievementSelect,
  className 
}: NextGoalsSuggestionProps) {
  if (suggestedGoals.length === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Recommended Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              You've made great progress on all available achievements.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Recommended Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestedGoals.map((goal) => (
            <div 
              key={goal.id}
              className={cn(
                "p-3 rounded-md transition-colors",
                "border border-muted",
                goal.progress > 0 ? "bg-primary/5 border-primary/20" : ""
              )}
            >
              <div className="flex items-center mb-2">
                <div className="relative w-12 h-12 flex-shrink-0 mr-3">
                  {goal.badgeUrl ? (
                    <div className="relative w-12 h-12">
                      <Image
                        src={goal.badgeUrl}
                        alt={goal.title}
                        fill
                        className="object-contain"
                      />
                      
                      {goal.progress > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="h-full w-full">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="8"
                              strokeDasharray="283"
                              strokeDashoffset={283 - (283 * goal.progress / 100)}
                              className="text-primary/30"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                            {goal.progress}%
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                      🎯
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{goal.title}</h3>
                  
                  {goal.progress > 0 ? (
                    <div className="mt-1">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          style={{ width: '0%' }}
                          animate={{ width: `${goal.progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {goal.progress}% complete
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Not started yet
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAchievementSelect?.(goal.id)}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
