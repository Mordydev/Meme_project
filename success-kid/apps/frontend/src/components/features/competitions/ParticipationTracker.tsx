'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Circle, Trophy } from 'lucide-react';
import { CompetitionObjective, CompetitionStatus } from '@/types/leaderboard';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks';

export interface ParticipationTrackerProps {
  objectives: CompetitionObjective[];
  userProgress: {
    currentRank?: number;
    score?: number;
    progress?: Record<string, number>;
  };
  competitionStatus: CompetitionStatus;
  className?: string;
}

export const ParticipationTracker: React.FC<ParticipationTrackerProps> = ({
  objectives,
  userProgress,
  competitionStatus,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Calculate overall progress percentage
  const calculateOverallProgress = () => {
    if (!objectives.length || !userProgress.progress) return 0;
    
    // Sum up progress percentages for each objective
    const progressSum = objectives.reduce((sum, objective) => {
      const currentProgress = userProgress.progress?.[objective.id] || 0;
      const objectivePercentage = Math.min(100, (currentProgress / objective.target) * 100);
      return sum + objectivePercentage;
    }, 0);
    
    // Calculate average progress percentage
    return progressSum / objectives.length;
  };
  
  const overallProgress = calculateOverallProgress();
  const isCompleted = competitionStatus === 'past';
  const hasRank = userProgress.currentRank !== undefined;
  
  return (
    <div className={cn("bg-neutral-50 rounded-lg border border-neutral-200 p-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium flex items-center">
            <Trophy className="text-primary mr-2" size={20} />
            Your Participation
          </h3>
          
          {hasRank && (
            <div className="mt-1 text-sm">
              <span className="text-neutral-600">Current rank:</span>{' '}
              <span className="font-bold">{userProgress.currentRank}</span>
              {userProgress.score !== undefined && (
                <span className="ml-2 text-neutral-500">
                  ({userProgress.score} points)
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Overall progress */}
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-32 mr-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <motion.div
                className="bg-primary rounded-full h-3"
                initial={prefersReducedMotion ? { width: `${overallProgress}%` } : { width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
          
          {isCompleted && (
            <div className="mt-2 md:mt-0 text-sm flex items-center">
              <span className={cn(
                "px-2 py-1 rounded text-white font-medium",
                overallProgress >= 100 ? "bg-success" : "bg-neutral-500"
              )}>
                {overallProgress >= 100 ? "Completed" : "Participated"}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Objective progress list */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {objectives.map((objective) => {
          const currentProgress = userProgress.progress?.[objective.id] || 0;
          const progressPercentage = Math.min(100, (currentProgress / objective.target) * 100);
          const isComplete = currentProgress >= objective.target;
          
          return (
            <div 
              key={objective.id}
              className="flex items-center bg-white p-3 rounded border border-neutral-200"
            >
              <div className="mr-3">
                {isComplete ? (
                  <CheckCircle className="text-success" size={20} />
                ) : isCompleted ? (
                  <XCircle className="text-neutral-400" size={20} />
                ) : (
                  <Circle className="text-neutral-400" size={20} />
                )}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="text-sm font-medium truncate">{objective.description}</div>
                <div className="mt-1 flex items-center">
                  <div className="w-full mr-2">
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <motion.div
                        className={cn(
                          "rounded-full h-2",
                          isComplete ? "bg-success" : "bg-primary"
                        )}
                        initial={prefersReducedMotion ? { width: `${progressPercentage}%` } : { width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className="text-xs whitespace-nowrap">
                    {currentProgress}/{objective.target}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
