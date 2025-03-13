'use client';

import React, { useEffect } from 'react';
import { 
  Trophy, Calendar, Users, AlertCircle, CheckCircle, 
  ChevronLeft, Award, Clock, Zap, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/Spinner';
import { useCompetitionStore } from '@/store';
import { Competition, CompetitionStatus } from '@/types/leaderboard';
import { ParticipationTracker } from './ParticipationTracker';
import { cn, formatDate } from '@/lib/utils';
import { useReducedMotion } from '@/hooks';

// Status badge styles
const STATUS_BADGE = {
  active: { variant: 'default', icon: Trophy, label: 'Active', color: 'text-primary' },
  upcoming: { variant: 'secondary', icon: Clock, label: 'Upcoming', color: 'text-secondary' },
  past: { variant: 'outline', icon: CheckCircle, label: 'Completed', color: 'text-neutral-500' },
};

export interface CompetitionDetailProps {
  competitionId: string;
  onBack?: () => void;
  onParticipate?: () => void;
  onShare?: () => void;
  className?: string;
}

export const CompetitionDetail: React.FC<CompetitionDetailProps> = ({
  competitionId,
  onBack,
  onParticipate,
  onShare,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  const {
    selectedCompetition,
    isCompetitionLoading,
    fetchCompetitionDetails,
    joinCompetition,
  } = useCompetitionStore();
  
  // Fetch competition details
  useEffect(() => {
    fetchCompetitionDetails(competitionId);
  }, [fetchCompetitionDetails, competitionId]);
  
  // Handle competition join
  const handleJoinCompetition = async () => {
    if (!selectedCompetition) return;
    
    const success = await joinCompetition(selectedCompetition.id);
    
    if (success && onParticipate) {
      onParticipate();
    }
  };
  
  // Loading state
  if (isCompetitionLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex justify-center items-center p-12">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }
  
  // Error state if competition is not found
  if (!selectedCompetition) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="text-alert mb-3" size={48} />
          <h3 className="text-lg font-semibold text-neutral-700">Competition not found</h3>
          <p className="text-sm text-neutral-500 mt-1">
            The competition you're looking for could not be found or has been removed.
          </p>
          {onBack && (
            <Button 
              variant="outline" 
              className="mt-4 flex items-center"
              onClick={onBack}
            >
              <ChevronLeft size={16} className="mr-1" />
              Back to Competitions
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Extract competition data
  const {
    title,
    description,
    status,
    startDate,
    endDate,
    participantCount,
    isTeamBased,
    rewards,
    userStatus,
    rules,
    objectives,
    leaderboard,
    userProgress,
  } = selectedCompetition;
  
  // Status badge configuration
  const badge = STATUS_BADGE[status];
  const BadgeIcon = badge.icon;
  
  // Determine participation status
  const isParticipating = userProgress?.isParticipating;
  const canJoin = status === 'active' && !isParticipating && userStatus !== 'ineligible';
  
  // Format dates
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center mb-2">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2 p-0 h-8 w-8"
              onClick={onBack}
            >
              <ChevronLeft size={16} />
              <span className="sr-only">Back</span>
            </Button>
          )}
          <Badge variant={badge.variant as any} className="flex items-center gap-1 px-2">
            <BadgeIcon size={14} />
            <span>{badge.label}</span>
          </Badge>
        </div>
        
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Competition details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Calendar size={20} className={cn("mr-3", badge.color)} />
              <div>
                <div className="text-sm font-medium">Duration</div>
                <div className="text-sm text-neutral-500">
                  {formattedStartDate} - {formattedEndDate}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Users size={20} className={cn("mr-3", badge.color)} />
              <div>
                <div className="text-sm font-medium">Participants</div>
                <div className="text-sm text-neutral-500">
                  {participantCount} {isTeamBased ? 'teams' : 'members'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Trophy size={20} className={cn("mr-3", badge.color)} />
              <div>
                <div className="text-sm font-medium">Type</div>
                <div className="text-sm text-neutral-500">
                  {isTeamBased ? 'Team-based' : 'Individual'} Competition
                </div>
              </div>
            </div>
          </div>
          
          {/* Participation/Status Section */}
          {isParticipating && userProgress && (
            <ParticipationTracker 
              objectives={objectives}
              userProgress={userProgress}
              competitionStatus={status}
            />
          )}
          
          {/* Tabs for objectives, rules, rewards, leaderboard */}
          <Tabs defaultValue="objectives" className="mt-6">
            <TabsList>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            
            {/* Objectives Tab */}
            <TabsContent value="objectives" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Competition Objectives</h3>
                <div className="space-y-3">
                  {objectives.map((objective) => (
                    <motion.div
                      key={objective.id}
                      initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : undefined}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                    >
                      <div className="flex items-start">
                        <div className={`${badge.color} p-2 bg-white rounded-full mr-3`}>
                          <Zap size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium">{objective.description}</h4>
                          <div className="mt-1 text-sm text-neutral-600">
                            Target: {objective.target} {objective.type === 'posts' ? 'posts' : 
                              objective.type === 'comments' ? 'comments' : 
                              objective.type === 'achievements' ? 'achievements' : 
                              'tasks'}
                          </div>
                          
                          {isParticipating && userProgress?.progress && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>
                                  {userProgress.progress[objective.id] || 0} / {objective.target}
                                </span>
                              </div>
                              <div className="w-full bg-neutral-200 rounded-full h-2">
                                <div
                                  className="bg-primary rounded-full h-2"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      ((userProgress.progress[objective.id] || 0) / objective.target) * 100
                                    )}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Rewards Tab */}
            <TabsContent value="rewards" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Rewards</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rewards.map((reward, index) => (
                    <motion.div
                      key={`reward-${index}`}
                      initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : undefined}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                    >
                      <div className="flex items-start">
                        <div className="bg-secondary/20 p-2 rounded-full mr-3">
                          <Award size={20} className="text-secondary" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {typeof reward.rank === 'number'
                              ? `${reward.rank}${getOrdinalSuffix(reward.rank)} Place`
                              : reward.rank}
                          </h4>
                          <div className="flex items-center mt-1">
                            <span className="text-lg font-bold">
                              {reward.value}
                            </span>
                            <span className="ml-1 text-neutral-600">
                              {reward.type === 'points' ? 'Success Points' : 
                               reward.type === 'badge' ? 'Badge' : 
                               reward.type === 'token' ? 'SKC Tokens' : 
                               reward.type}
                            </span>
                          </div>
                          {reward.description && (
                            <p className="mt-1 text-sm text-neutral-500">
                              {reward.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Rules Tab */}
            <TabsContent value="rules" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Competition Rules</h3>
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="prose prose-sm max-w-none">
                    {rules.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Standings</h3>
                {!leaderboard || leaderboard.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-50 rounded-lg border border-neutral-200">
                    <Trophy className="mx-auto text-neutral-300 mb-3" size={32} />
                    <h4 className="font-medium text-neutral-700">No participants yet</h4>
                    <p className="text-sm text-neutral-500 mt-1">
                      Be the first to join this competition!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((participant, index) => (
                      <div
                        key={participant.userId}
                        className={cn(
                          "p-3 rounded-lg flex items-center",
                          participant.userId === userProgress?.isParticipating
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-neutral-50 border border-neutral-200"
                        )}
                      >
                        {/* Rank */}
                        <div className="w-8 h-8 flex items-center justify-center mr-3">
                          {index < 3 ? (
                            <div className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center",
                              index === 0 ? "bg-yellow-100 text-yellow-800" :
                              index === 1 ? "bg-neutral-200 text-neutral-800" :
                              "bg-amber-100 text-amber-800"
                            )}>
                              {participant.rank}
                            </div>
                          ) : (
                            <span className="font-bold">{participant.rank}</span>
                          )}
                        </div>
                        
                        {/* User info */}
                        <div className="flex-grow overflow-hidden">
                          <div className="font-medium truncate">{participant.username}</div>
                          <div className="text-sm text-neutral-500">
                            Score: {participant.score}
                          </div>
                        </div>
                        
                        {/* Progress indicators */}
                        <div className="ml-auto">
                          <div className="flex space-x-1">
                            {Object.entries(participant.progress).map(([objectiveId, progress]) => {
                              const objective = objectives.find(o => o.id === objectiveId);
                              if (!objective) return null;
                              
                              const progressPercent = (progress / objective.target) * 100;
                              
                              return (
                                <div
                                  key={objectiveId}
                                  className="w-8 h-8 bg-neutral-100 rounded-full overflow-hidden"
                                  title={`${objective.description}: ${progress}/${objective.target}`}
                                >
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t">
        {canJoin ? (
          <Button 
            className="w-full sm:w-auto flex items-center justify-center"
            onClick={handleJoinCompetition}
          >
            <Trophy size={16} className="mr-2" />
            {isTeamBased ? 'Join with Team' : 'Join Competition'}
          </Button>
        ) : isParticipating ? (
          <div className="flex items-center">
            <CheckCircle size={16} className="text-success mr-2" />
            <span className="text-sm font-medium">
              You're participating
            </span>
          </div>
        ) : status === 'upcoming' ? (
          <Button 
            variant="outline" 
            className="w-full sm:w-auto flex items-center justify-center"
            disabled
          >
            <Clock size={16} className="mr-2" />
            Starting {formattedStartDate}
          </Button>
        ) : status === 'past' ? (
          <div className="flex items-center text-neutral-500">
            <CheckCircle size={16} className="mr-2" />
            <span className="text-sm">Competition ended</span>
          </div>
        ) : userStatus === 'ineligible' ? (
          <div className="flex items-center text-neutral-500">
            <AlertCircle size={16} className="mr-2" />
            <span className="text-sm">Not eligible to participate</span>
          </div>
        ) : null}
        
        {onShare && (
          <Button 
            variant="outline" 
            className="ml-2"
            onClick={onShare}
          >
            Share
            <ArrowRight size={16} className="ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Helper function to get ordinal suffix
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}
