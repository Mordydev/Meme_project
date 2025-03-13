'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Copy, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCompetitionStore } from '@/store';
import { cn } from '@/lib/utils';

export interface TeamFormationProps {
  competitionId: string;
  userId: string;
  onTeamCreated?: (teamId: string) => void;
  onTeamJoined?: (teamId: string) => void;
  className?: string;
}

export const TeamFormation: React.FC<TeamFormationProps> = ({
  competitionId,
  userId,
  onTeamCreated,
  onTeamJoined,
  className
}) => {
  // State
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createMode, setCreateMode] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Store
  const { createTeam, joinTeam, error } = useCompetitionStore();
  
  // Handle team creation
  const handleCreateTeam = async () => {
    // Validate inputs
    if (!teamName.trim()) {
      setValidationError('Team name is required');
      return;
    }
    
    if (teamName.length < 3 || teamName.length > 30) {
      setValidationError('Team name must be between 3 and 30 characters');
      return;
    }
    
    setValidationError(null);
    
    // Create team
    const teamId = await createTeam(
      teamName,
      teamDescription,
      competitionId
    );
    
    if (teamId && onTeamCreated) {
      onTeamCreated(teamId);
    }
  };
  
  // Handle team join
  const handleJoinTeam = async () => {
    // Validate invite code
    if (!inviteCode.trim()) {
      setValidationError('Invite code is required');
      return;
    }
    
    setValidationError(null);
    
    // Join team
    const success = await joinTeam(inviteCode);
    
    if (success && onTeamJoined) {
      onTeamJoined(inviteCode); // We don't have teamId here, so passing invite code
    }
  };
  
  // Copy invite code to clipboard
  const copyInviteCode = () => {
    if (navigator.clipboard && inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 text-primary" size={20} />
          Team Formation
        </CardTitle>
        <CardDescription>
          Create a new team or join an existing one for this competition
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Mode selection */}
        {!createMode && !joinMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              className="h-auto flex flex-col items-center py-8"
              onClick={() => setCreateMode(true)}
            >
              <Users size={32} className="mb-4 text-primary" />
              <div className="font-medium">Create New Team</div>
              <p className="text-sm text-neutral-500 mt-2">
                Create and lead your own team for this competition
              </p>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="h-auto flex flex-col items-center py-8"
              onClick={() => setJoinMode(true)}
            >
              <UserPlus size={32} className="mb-4 text-primary" />
              <div className="font-medium">Join Existing Team</div>
              <p className="text-sm text-neutral-500 mt-2">
                Join a team using an invite code from the team leader
              </p>
            </Button>
          </div>
        )}
        
        {/* Create team form */}
        {createMode && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Create a New Team</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="team-name" className="block text-sm font-medium mb-1">
                  Team Name<span className="text-alert ml-1">*</span>
                </label>
                <input
                  id="team-name"
                  type="text"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter a name for your team"
                  maxLength={30}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {teamName.length}/30 characters
                </p>
              </div>
              
              <div>
                <label htmlFor="team-description" className="block text-sm font-medium mb-1">
                  Team Description
                </label>
                <textarea
                  id="team-description"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Describe your team (optional)"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {teamDescription.length}/200 characters
                </p>
              </div>
              
              {validationError && (
                <div className="p-3 bg-alert/10 border border-alert/30 rounded-md text-alert text-sm">
                  {validationError}
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-alert/10 border border-alert/30 rounded-md text-alert text-sm">
                  {error.message}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCreateMode(false);
                    setValidationError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam}>
                  Create Team
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Join team form */}
        {joinMode && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Join an Existing Team</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="invite-code" className="block text-sm font-medium mb-1">
                  Invite Code<span className="text-alert ml-1">*</span>
                </label>
                <div className="flex">
                  <input
                    id="invite-code"
                    type="text"
                    className="flex-grow px-3 py-2 border border-neutral-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter team invite code"
                  />
                  <Button
                    variant="outline"
                    className="rounded-l-none"
                    onClick={copyInviteCode}
                    disabled={!inviteCode}
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Get this code from the team leader
                </p>
              </div>
              
              {validationError && (
                <div className="p-3 bg-alert/10 border border-alert/30 rounded-md text-alert text-sm">
                  {validationError}
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-alert/10 border border-alert/30 rounded-md text-alert text-sm">
                  {error.message}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setJoinMode(false);
                    setValidationError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleJoinTeam}>
                  Join Team
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Badge variant="outline" className="flex items-center gap-1">
          <Users size={14} />
          Team Competition
        </Badge>
      </CardFooter>
    </Card>
  );
};
