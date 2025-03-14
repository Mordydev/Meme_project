'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TeamMember } from '@/types';
import { Progress } from '@/components/ui/progress';

interface MemberContributionProps {
  member: TeamMember;
  showDetails?: boolean;
  className?: string;
}

/**
 * MemberContribution
 * 
 * Component to visualize an individual's contribution to a team
 */
export function MemberContribution({ 
  member, 
  showDetails = false,
  className 
}: MemberContributionProps) {
  // Get color based on contribution percentage
  const getContributionColor = (percentage: number) => {
    if (percentage >= 30) return 'bg-success';
    if (percentage >= 15) return 'bg-blue-500';
    if (percentage >= 5) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  // Get status text
  const getContributionStatus = (percentage: number) => {
    if (percentage >= 30) return 'Outstanding';
    if (percentage >= 15) return 'Strong';
    if (percentage >= 5) return 'Average';
    return 'Minimal';
  };
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-medium">
          Contribution
          {showDetails && (
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 text-xs rounded-full",
              member.contribution >= 30 ? "bg-success/10 text-success" : 
              member.contribution >= 15 ? "bg-blue-100 text-blue-700" :
              member.contribution >= 5 ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            )}>
              {getContributionStatus(member.contribution)}
            </span>
          )}
        </div>
        <div className="text-sm font-medium">{member.contribution}%</div>
      </div>
      
      <Progress 
        value={member.contribution} 
        max={100}
        className="h-2"
        indicatorClassName={getContributionColor(member.contribution)}
      />
      
      {showDetails && (
        <div className="mt-1.5 text-xs text-muted-foreground">
          {member.contribution >= 30 ? (
            "You're a top contributor to the team's success!"
          ) : member.contribution >= 15 ? (
            "You're making a strong impact on the team!"
          ) : member.contribution >= 5 ? (
            "You're contributing well to the team's efforts."
          ) : (
            "More participation will boost your contribution."
          )}
        </div>
      )}
    </div>
  );
}
