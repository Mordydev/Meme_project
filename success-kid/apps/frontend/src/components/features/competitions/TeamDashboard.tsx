'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Team, TeamMember } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { PositionChange } from '../leaderboard/PositionVisualization';
import { MemberContribution } from './MemberContribution';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface TeamDashboardProps {
  teamId: string;
  showMembers?: boolean;
  onMemberSelect?: (userId: string) => void;
  className?: string;
}

/**
 * TeamDashboard
 * 
 * Component to display a team's performance in a competition
 */
export function TeamDashboard({ 
  teamId, 
  showMembers = true,
  onMemberSelect,
  className 
}: TeamDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'rankings'>(
    showMembers ? 'members' : 'overview'
  );
  
  const { user } = useAuth();
  
  // Mock data - would be replaced with actual query
  const [isLoading, setIsLoading] = useState(false);
  const [team, setTeam] = useState<Team>({
    id: teamId,
    name: 'Success Squad',
    description: 'A team dedicated to achieving the highest success in the platform',
    competitionId: 'comp_123',
    members: [
      {
        userId: 'user_1',
        username: 'teamlead',
        displayName: 'Team Leader',
        avatarUrl: '/images/avatars/avatar1.png',
        joinedAt: '2025-02-15T10:30:00Z',
        contribution: 35,
        score: 2450
      },
      {
        userId: 'user_2',
        username: 'activemember',
        displayName: 'Active Member',
        avatarUrl: '/images/avatars/avatar2.png',
        joinedAt: '2025-02-16T14:20:00Z',
        contribution: 28,
        score: 1960
      },
      {
        userId: 'user_3',
        username: 'newjoiner',
        displayName: 'New Joiner',
        avatarUrl: '/images/avatars/avatar3.png',
        joinedAt: '2025-03-10T09:15:00Z',
        contribution: 5,
        score: 350
      },
      {
        userId: 'current_user',
        username: 'currentuser',
        displayName: 'Current User',
        avatarUrl: '/images/avatars/avatar4.png',
        joinedAt: '2025-02-20T11:45:00Z',
        contribution: 32,
        score: 2240
      }
    ],
    memberCount: 4,
    score: 7000,
    rank: 3,
    change: 1,
    createdAt: '2025-02-15T10:00:00Z',
    createdBy: 'user_1'
  });
  
  // Sort members by contribution
  const sortedMembers = [...team.members].sort((a, b) => b.contribution - a.contribution);
  
  // Find current user in team
  const currentUserMember = user ? team.members.find(m => m.userId === user.id || m.userId === 'current_user') : null;
  
  // Format creation date
  const formattedCreationDate = formatDistanceToNow(
    new Date(team.createdAt),
    { addSuffix: true }
  );
  
  // Handle loading state
  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Team Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-12">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-primary-50 dark:bg-primary-950/20 border-b">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{team.name}</CardTitle>
              {team.rank && (
                <div className="flex items-center gap-1.5">
                  <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm font-medium">
                    Rank #{team.rank}
                  </div>
                  {team.change !== undefined && <PositionChange currentPosition={team.rank} previousPosition={team.rank + team.change} />}
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              {team.description || `Created ${formattedCreationDate}`}
            </p>
          </div>
          
          {/* Share/Invite button */}
          {team.inviteCode && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(team.inviteCode || '');
                // Show toast notification here
                alert('Invite code copied!');
              }}
            >
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 16V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 8H19C20.1046 8 21 8.89543 21 10V19C21 20.1046 20.1046 21 19 21H10C8.89543 21 8 20.1046 8 19V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Share Team Code
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Team Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b">
          <div className="flex flex-col items-center p-4 border rounded-md">
            <div className="text-3xl font-bold">{team.memberCount}</div>
            <div className="text-sm text-muted-foreground">Members</div>
          </div>
          
          <div className="flex flex-col items-center p-4 border rounded-md">
            <div className="text-3xl font-bold">{team.score.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Score</div>
          </div>
          
          <div className="flex flex-col items-center p-4 border rounded-md">
            <div className="text-3xl font-bold">
              {team.rank || '--'}
              {team.change && team.change > 0 && (
                <span className="text-success text-lg ml-1">↑{team.change}</span>
              )}
              {team.change && team.change < 0 && (
                <span className="text-red-500 text-lg ml-1">↓{Math.abs(team.change)}</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">Leaderboard Rank</div>
          </div>
        </div>
        
        {/* Your Contribution Section - only shown if user is a member */}
        {currentUserMember && (
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Your Contribution</h3>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <MemberContribution 
                  member={currentUserMember} 
                  showDetails={true}
                />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{currentUserMember.score.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Your Score</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tab Navigation */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as any)}
          className="w-full"
        >
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
          </TabsList>
          
          {/* Team Overview Tab */}
          <TabsContent value="overview" className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Team Summary</h3>
                <p className="text-sm mb-3">
                  {team.description || 'This team was formed to compete in various platform challenges and competitions.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium mb-1">Created By</h4>
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full overflow-hidden mr-1.5">
                        {sortedMembers[0]?.avatarUrl ? (
                          <Image
                            src={sortedMembers[0].avatarUrl}
                            alt={sortedMembers[0].displayName}
                            width={20}
                            height={20}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                            {sortedMembers[0]?.displayName.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <span className="text-sm">{sortedMembers[0]?.displayName || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium mb-1">Created On</h4>
                    <div className="text-sm">
                      {new Date(team.createdAt).toLocaleDateString()} 
                      ({formattedCreationDate})
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Top Contributors</h3>
                <div className="space-y-2">
                  {sortedMembers.slice(0, 3).map((member, index) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between border rounded-md p-2"
                    >
                      <div className="flex items-center">
                        <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-3 font-medium">
                          {index + 1}
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                            {member.avatarUrl ? (
                              <Image
                                src={member.avatarUrl}
                                alt={member.displayName}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                                {member.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{member.displayName}</div>
                            <div className="text-xs text-muted-foreground">@{member.username}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold">{member.score.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{member.contribution}% of total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Team Members Tab */}
          <TabsContent value="members" className="p-4">
            <div className="space-y-2">
              {sortedMembers.map((member) => (
                <div
                  key={member.userId}
                  className={cn(
                    "flex items-center justify-between border rounded-md p-3 transition-colors",
                    member.userId === 'current_user' ? "bg-primary/5 border-primary/20" : "",
                    "hover:bg-muted/50 cursor-pointer"
                  )}
                  onClick={() => onMemberSelect?.(member.userId)}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.displayName}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium">{member.displayName}</span>
                        {member.userId === 'current_user' && (
                          <span className="ml-2 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">{member.score.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{member.contribution}% contribution</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Team Rankings Tab */}
          <TabsContent value="rankings" className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              View how your team compares to others in the competition. Teams are ranked by their total score.
            </p>
            
            <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground rounded-md mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center mr-3 font-semibold">
                  {team.rank || '?'}
                </div>
                <div className="font-medium">{team.name}</div>
              </div>
              <div className="font-semibold">{team.score.toLocaleString()} pts</div>
            </div>
            
            <div className="space-y-2">
              {/* Mock data for other teams */}
              {[
                {id: 'team1', name: 'Victory Vanguard', score: 12500, rank: 1},
                {id: 'team2', name: 'Token Warriors', score: 10800, rank: 2},
                {id: 'team4', name: 'Crypto Crusaders', score: 5200, rank: 4},
                {id: 'team5', name: 'Blockchain Brigade', score: 4100, rank: 5},
              ].map(otherTeam => (
                <div
                  key={otherTeam.id}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mr-3 font-medium">
                      {otherTeam.rank}
                    </div>
                    <div className="font-medium">{otherTeam.name}</div>
                  </div>
                  <div className="font-semibold">{otherTeam.score.toLocaleString()} pts</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
