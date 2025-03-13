'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface Milestone {
  id: string;
  title: string;
  description: string;
  achievedAt: string;
  type: 'achievement' | 'level' | 'points' | 'content' | 'wallet';
  icon?: string;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  className?: string;
}

/**
 * MilestoneTimeline
 * 
 * Component to display key achievements and progress milestones over time.
 */
export function MilestoneTimeline({ 
  milestones, 
  className 
}: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Your Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-4">🗓️</div>
            <h3 className="text-lg font-medium">No milestones yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              As you participate in the community, your journey will be recorded here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Sort milestones by date (newest first)
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );
  
  // Helper function to get icon based on milestone type
  const getMilestoneIcon = (type: Milestone['type'], icon?: string) => {
    if (icon) return icon;
    
    switch (type) {
      case 'achievement':
        return '🏆';
      case 'level':
        return '⭐';
      case 'points':
        return '💰';
      case 'content':
        return '✍️';
      case 'wallet':
        return '💼';
      default:
        return '🎯';
    }
  };
  
  // Helper function to get color based on milestone type
  const getMilestoneColor = (type: Milestone['type']) => {
    switch (type) {
      case 'achievement':
        return 'border-purple-200 bg-purple-50 text-purple-800';
      case 'level':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'points':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'content':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'wallet':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };
  
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Your Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-muted">
          {sortedMilestones.map((milestone, index) => (
            <div key={milestone.id} className="relative">
              {/* Timeline dot */}
              <div className={cn(
                "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center border-2",
                getMilestoneColor(milestone.type)
              )}>
                <span className="text-xs">
                  {getMilestoneIcon(milestone.type, milestone.icon)}
                </span>
              </div>
              
              {/* Milestone content */}
              <div className="bg-muted/30 rounded-md p-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                  <h3 className="font-medium">{milestone.title}</h3>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(milestone.achievedAt), 'MMM d, yyyy')}
                  </time>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {milestone.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
