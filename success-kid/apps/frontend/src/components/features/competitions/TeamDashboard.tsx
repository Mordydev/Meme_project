'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Copy, CheckCircle, ChevronRight, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/Spinner';
import { useCompetitionStore } from '@/store';
import { cn, formatCompactNumber, timeAgo } from '@/lib/utils';
import { useReducedMotion } from '@/hooks';

export interface TeamDashboardProps {
  teamId: string;
  showMembers?: boolean;
  onMemberSelect?: (userId: string) => void;
  className?: string;
}

export const TeamDashboard: React.FC<TeamDashboardProps> = ({
  teamId,
  showMembers = true,
  onMemberSelect,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = React.useState(false);
  
  // Store
  const {
    userTeams,
    teamMembers,
    selectedTeamId,
    isTeamLoading,
    fetchUserTeams,
    fetchTeamMembers,
    setSelectedTeamId,
  } = useCompetitionStore();
  
  // Fetch team data
  useEffect(() => {
    fetchUserTeams();
    setSelectedTeamId(teamId);
  }, [fetchUserTeams, setSelectedTeamId, teamId]);
  
  // Find current team
  const currentTeam = userTeams.find(team => team.id === teamId);
  
  // Generate invite link
  const inviteLink = currentTeam ? `${window.location.origin}/teams/join?code=${currentTeam.id}` : '';
  
  // Copy invite link
  const copyInviteLink = () => {
    if (navigator.clipboard && inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Loading state
  if (isTeamLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex justify-center items-center p-12">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }
  
  // Team not found state
  if (!currentTeam) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Users className="text-neutral-300 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-neutral-700">Team not found</h3>
          <p className="text-sm text-neutral-500 mt-1">
            The team you're looking for could not be found or you're not a member.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="mr-2 text-primary" size={20} />
            {currentTeam.name}
          </CardTitle>
          
          {currentTeam.rank && (
            <Badge
              variant={currentTeam.rank <= 3 ? 'default' : 'outline'}
              className="flex items-center gap-1"
            >
              <Trophy size={14} />
              Rank {currentTeam.rank}
            </Badge>
          )}
        </div>
        {currentTeam.description && (
          <CardDescription>
            {currentTeam.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Team stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <div className="text-sm font-medium text-neutral-500 mb-1">Members</div>
              <div className="text-2xl font-bold">
                {currentTeam.memberCount}
              </div>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <div className="text-sm font-medium text-neutral-500 mb-1">Team Score</div>
              <div className="text-2xl font-bold">
                {formatCompactNumber(currentTeam.score)}
              </div>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <div className="text-sm font-medium text-neutral-500 mb-1">
                {currentTeam.change !== undefined ? 'Rank Change' : 'Status'}
              </div>
              <div className="text-2xl font-bold flex items-center">
                {currentTeam.change !== undefined ? (
                  <>
                    {currentTeam.change > 0 ? (
                      <ChevronRight size={20} className="rotate-90 text-success mr-1" />
                    ) : currentTeam.change < 0 ? (
                      <ChevronRight size={20} className="-rotate-90 text-alert mr-1" />
                    ) : (
                      <span className="text-neutral-400 mr-1">—</span>
                    )}
                    {Math.abs(currentTeam.change)}
                  </>
                ) : (
                  <span className="text-neutral-700">Active</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Invite section */}
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h3 className="text-sm font-medium mb-2">Team Invite Link</h3>
            <div className="flex">
              <input
                readOnly
                value={inviteLink}
                className="flex-grow px-3 py-2 bg-white border border-neutral-300 rounded-l-md text-sm focus:outline-none"
              />
              <Button
                variant="outline"
                className="rounded-l-none"
                onClick={copyInviteLink}
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Share this link to invite others to your team
            </p>
          </div>
          
          {/* Team members */}
          {showMembers && teamMembers.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Team Members</h3>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <motion.div
                    key={member.userId}
                    initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : undefined}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "p-3 rounded-lg border flex items-center",
                      onMemberSelect ? "cursor-pointer hover:bg-neutral-50" : ""
                    )}
                    onClick={() => onMemberSelect && onMemberSelect(member.userId)}
                  >
                    {/* User avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200 mr-3">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={`${member.displayName}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* User details */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center">
                        <div className="font-medium truncate mr-2">
                          {member.displayName}
                        </div>
                        {member.contribution >= 25 && (
                          <Star size={14} className="text-secondary" />
                        )}
                      </div>
                      <div className="text-sm text-neutral-500 flex items-center">
                        <span className="truncate">@{member.username}</span>
                        <span className="mx-1">•</span>
                        <span>Joined {timeAgo(member.joinedAt)}</span>
                      </div>
                    </div>
                    
                    {/* Contribution percentage */}
                    <div className="ml-3">
                      <div className="text-right text-sm font-medium">
                        {member.contribution}%
                      </div>
                      <div className="text-xs text-neutral-500">
                        contribution
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t">
        <Badge variant="outline" className="flex items-center gap-1">
          <Users size={14} />
          Team
        </Badge>
        
        <Button variant="outline" className="flex items-center">
          Team Settings
          <ChevronRight size={16} className="ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};
