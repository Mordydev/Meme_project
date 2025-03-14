'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateTeam, useJoinTeam } from '@/hooks/queries/competitions';

interface TeamFormationProps {
  competitionId: string;
  onTeamCreated?: (teamId: string) => void;
  onTeamJoined?: (teamId: string) => void;
  className?: string;
}

/**
 * TeamFormation
 * 
 * Component for creating or joining teams for competitions
 */
export function TeamFormation({ 
  competitionId, 
  onTeamCreated,
  onTeamJoined,
  className 
}: TeamFormationProps) {
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();
  
  // Handle team creation
  const handleCreateTeam = () => {
    if (!teamName.trim()) return;
    
    createTeam.mutate({
      name: teamName,
      description: teamDescription,
      competitionId
    }, {
      onSuccess: (data) => {
        onTeamCreated?.(data.teamId);
      }
    });
  };
  
  // Handle join team
  const handleJoinTeam = () => {
    if (!inviteCode.trim()) return;
    
    joinTeam.mutate(inviteCode, {
      onSuccess: (data) => {
        onTeamJoined?.(data.teamId);
      }
    });
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>Team Up for the Competition</CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="create">Create Team</TabsTrigger>
            <TabsTrigger value="join">Join Team</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="pt-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="team-name" className="block text-sm font-medium mb-1">
                  Team Name
                </label>
                <input
                  id="team-name"
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter a team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={createTeam.isPending}
                />
              </div>
              
              <div>
                <label htmlFor="team-description" className="block text-sm font-medium mb-1">
                  Team Description (Optional)
                </label>
                <textarea
                  id="team-description"
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe your team's mission"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  disabled={createTeam.isPending}
                  rows={3}
                />
              </div>
              
              {createTeam.isError && (
                <div className="text-sm text-red-500">
                  {createTeam.error?.message || 'Failed to create team. Please try again.'}
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  onClick={handleCreateTeam}
                  disabled={!teamName.trim() || createTeam.isPending}
                  className="w-full"
                >
                  {createTeam.isPending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Creating Team...
                    </>
                  ) : (
                    'Create Team'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="join" className="pt-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="invite-code" className="block text-sm font-medium mb-1">
                  Invite Code
                </label>
                <input
                  id="invite-code"
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter invite code (e.g. TEAM123)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={joinTeam.isPending}
                />
              </div>
              
              {joinTeam.isError && (
                <div className="text-sm text-red-500">
                  {joinTeam.error?.message || 'Invalid invite code. Please check and try again.'}
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  onClick={handleJoinTeam}
                  disabled={!inviteCode.trim() || joinTeam.isPending}
                  className="w-full"
                >
                  {joinTeam.isPending ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Joining Team...
                    </>
                  ) : (
                    'Join Team'
                  )}
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center pt-2">
                Ask your team creator for the invite code. It's case insensitive.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
