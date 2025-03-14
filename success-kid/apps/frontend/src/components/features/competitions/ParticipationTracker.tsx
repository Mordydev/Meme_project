'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CompetitionObjective } from '@/types';
import { CheckCircle, Circle } from 'lucide-react';

interface ParticipationTrackerProps {
  objectives: CompetitionObjective[];
  userProgress?: {
    isParticipating: boolean;
    currentRank?: number;
    score?: number;
    progress?: Record<string, number>;
  };
  status: 'active' | 'upcoming' | 'past';
  className?: string;
}

/**
 * ParticipationTracker
 * 
 * Component to track progress on competition objectives
 */
export function ParticipationTracker({ 
  objectives, 
  userProgress,
  status,
  className 
}: ParticipationTrackerProps) {
  const isParticipating = userProgress?.isParticipating;
  
  // Get progress for an objective
  const getObjectiveProgress = (objective: CompetitionObjective) => {
    if (!isParticipating || !userProgress?.progress) {
      return { current: 0, percentage: 0, completed: false };
    }
    
    const current = userProgress.progress[objective.id] || 0;
    const percentage = Math.min(100, Math.round((current / objective.target) * 100));
    const completed = current >= objective.target;
    
    return { current, percentage, completed };
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-semibold">Competition Objectives</h3>
      
      {objectives.map((objective) => {
        const { current, percentage, completed } = getObjectiveProgress(objective);
        
        return (
          <div key={objective.id} className="border rounded-md p-4">
            <div className="flex items-start">
              <div className="text-primary mt-0.5 mr-3">
                {completed ? (
                  <CheckCircle size={20} className="text-success" />
                ) : (
                  <Circle size={20} />
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium">{objective.description}</h4>
                <div className="text-sm text-muted-foreground mt-1">
                  Target: {objective.target} {objective.type}
                </div>
                
                {isParticipating && (
                  <>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium">
                        {current} / {objective.target} ({percentage}%)
                      </span>
                      {completed && (
                        <span className="text-xs bg-success/10 text-success rounded-full px-2 py-0.5">
                          Completed
                        </span>
                      )}
                    </div>
                    
                    <div className="w-full bg-muted mt-2 rounded-full h-2 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          completed ? "bg-success" : "bg-primary"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {status === 'active' && !isParticipating && (
        <p className="text-sm text-muted-foreground mt-4">
          Join this competition to start tracking your progress toward these objectives.
        </p>
      )}
    </div>
  );
}
