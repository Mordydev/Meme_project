'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CompetitionObjective, CompetitionReward } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, formatDistanceToNow } from 'date-fns';
import { useCompetitionDetails, useJoinCompetition } from '@/hooks/queries/competitions';
import { ParticipationTracker } from './ParticipationTracker';
import { CompetitionLeaderboard } from './CompetitionLeaderboard';
import { RewardDisplay } from './RewardDisplay';

interface CompetitionDetailProps {
  competitionId: string;
  onBack?: () => void;
  className?: string;
}

/**
 * CompetitionDetail
 * 
 * Component to display detailed competition information
 */
export function CompetitionDetail({ competitionId, onBack, className }: CompetitionDetailProps) {
  const { data, isLoading, isError } = useCompetitionDetails({ competitionId });
  const joinCompetition = useJoinCompetition();
  
  const handleJoinCompetition = () => {
    if (!data?.competition) return;
    joinCompetition.mutate(competitionId);
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle>Competition Details</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }
  
  // Handle error state
  if (isError || !data?.competition) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle>Competition Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium">Unable to load competition details</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            There was an error loading the competition details. Please try again later.
          </p>
          {onBack && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={onBack}
            >
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  const { competition } = data;
  
  // Format date range
  const formatDateRange = () => {
    const startDate = new Date(competition.startDate);
    const endDate = new Date(competition.endDate);
    
    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };
  
  // Get time remaining or time elapsed
  const getTimeStatus = () => {
    if (competition.status === 'upcoming') {
      return `Starts ${formatDistanceToNow(new Date(competition.startDate), { addSuffix: true })}`;
    } else if (competition.status === 'active') {
      return `Ends ${formatDistanceToNow(new Date(competition.endDate), { addSuffix: true })}`;
    } else {
      return `Ended ${formatDistanceToNow(new Date(competition.endDate), { addSuffix: true })}`;
    }
  };
  
  // Get status badge
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
  
  // Get participation action button
  const getActionButton = () => {
    if (competition.status !== 'active' && competition.status !== 'upcoming') {
      return null;
    }
    
    if (competition.userStatus === 'participating' || 
        (competition.userProgress && competition.userProgress.isParticipating)) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-success-600 text-sm">You're participating</span>
          <Button variant="outline" size="sm">Leave Competition</Button>
        </div>
      );
    } else if (competition.userStatus === 'eligible') {
      return (
        <Button 
          onClick={handleJoinCompetition}
          disabled={joinCompetition.isPending}
        >
          {joinCompetition.isPending ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Joining...
            </>
          ) : (
            'Join Competition'
          )}
        </Button>
      );
    } else {
      return (
        <Button disabled>Not Eligible</Button>
      );
    }
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="mb-1 flex items-center">
              {competition.title}
              <span className="ml-2">{getStatusBadge()}</span>
            </CardTitle>
            <div className="text-sm text-muted-foreground flex items-center space-x-4">
              <span>{formatDateRange()}</span>
              <span>•</span>
              <span>{getTimeStatus()}</span>
            </div>
          </div>
          
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              Back to List
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Description Section */}
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-sm">{competition.description}</p>
        </div>
        
        {/* Tabs for different sections */}
        <Tabs defaultValue="objectives" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none px-4">
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            {competition.rules && (
              <TabsTrigger value="rules">Rules</TabsTrigger>
            )}
          </TabsList>
          
          {/* Objectives Tab */}
          <TabsContent value="objectives" className="p-4">
            <ParticipationTracker
              objectives={competition.objectives}
              userProgress={competition.userProgress}
              status={competition.status}
            />
            {(!competition.userProgress?.isParticipating && 
              competition.status === 'active' && 
              competition.userStatus !== 'ineligible') && (
              <div className="mt-6 flex justify-center">
                {getActionButton()}
              </div>
            )}
          </TabsContent>
          
          {/* Rewards Tab */}
          <TabsContent value="rewards" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competition.rewards.map((reward, index) => (
                <RewardDisplay
                  key={index}
                  reward={reward}
                />
              ))}
            </div>
          </TabsContent>
          
          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="p-4">
            {competition.leaderboard ? (
              <CompetitionLeaderboard
                rankings={competition.leaderboard}
                currentUserId={competition.userProgress?.currentRank ? 'current-user' : undefined}
                currentUserRank={competition.userProgress?.currentRank}
              />
            ) : (
              <div className="text-center py-8">
                <p>Leaderboard will be available once the competition has participants.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Rules Tab */}
          {competition.rules && (
            <TabsContent value="rules" className="p-4">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold mb-2">Competition Rules</h3>
                <p className="whitespace-pre-line">{competition.rules}</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
