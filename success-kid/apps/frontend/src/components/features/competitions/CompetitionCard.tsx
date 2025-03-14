'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Competition } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-indicator';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface CompetitionCardProps {
  competition: Competition;
  onSelect?: (competitionId: string) => void;
  className?: string;
}

/**
 * CompetitionCard
 * 
 * Component to display a competition summary in a card format
 */
export function CompetitionCard({ competition, onSelect, className }: CompetitionCardProps) {
  // Get status label and color for badge
  const getStatusBadge = () => {
    switch (competition.status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'upcoming':
        return <Badge variant="warning">Upcoming</Badge>;
      case 'past':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return null;
    }
  };
  
  // Format competition dates
  const formatDates = () => {
    if (competition.status === 'upcoming') {
      return `Starts ${formatDistanceToNow(new Date(competition.startDate), { addSuffix: true })}`;
    } else if (competition.status === 'active') {
      return `Ends ${formatDistanceToNow(new Date(competition.endDate), { addSuffix: true })}`;
    } else {
      return `Ended ${formatDistanceToNow(new Date(competition.endDate), { addSuffix: true })}`;
    }
  };
  
  // Format participation status
  const getParticipationStatus = () => {
    if (!competition.userStatus) return null;
    
    if (competition.userStatus === 'participating') {
      return <span className="text-success-600 text-sm font-medium">You're participating</span>;
    } else if (competition.userStatus === 'eligible') {
      return <span className="text-primary text-sm font-medium">You're eligible to join</span>;
    } else {
      return <span className="text-muted-foreground text-sm">Not eligible</span>;
    }
  };
  
  // Get team or individual badge
  const getCompetitionTypeBadge = () => {
    return competition.teamBased 
      ? <Badge variant="outline">Team-based</Badge>
      : <Badge variant="outline">Individual</Badge>;
  };
  
  return (
    <Card 
      className={cn("overflow-hidden transition-shadow hover:shadow-md", className)}
      onClick={() => onSelect?.(competition.id)}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{competition.title}</span>
          {getStatusBadge()}
        </CardTitle>
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
          <span>{formatDates()}</span>
          {getCompetitionTypeBadge()}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm mb-4">{competition.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">{competition.participantCount}</div>
            <div className="text-muted-foreground">Participants</div>
          </div>
          
          <div className="text-sm text-right">
            <div className="font-medium">{competition.objectives.length}</div>
            <div className="text-muted-foreground">Objectives</div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/20 pt-3 flex items-center justify-between">
        {getParticipationStatus()}
        
        <Button 
          variant="default" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(competition.id);
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
