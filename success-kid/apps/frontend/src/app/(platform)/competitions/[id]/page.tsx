'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CompetitionDetail, TeamFormation, TeamDashboard } from '@/components/features/competitions';
import { useCompetitionStore } from '@/store';
import { useAuth } from '@/hooks';

export default function CompetitionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCompetition, userTeams } = useCompetitionStore();
  
  // State for team dialog
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  
  // Get competition ID from params
  const competitionId = params.id;
  
  // Check if user is already in a team for this competition
  const userTeam = userTeams.find(team => 
    selectedCompetition?.id === competitionId && selectedCompetition?.isTeamBased
  );
  
  // Handle navigation back to competitions list
  const handleBack = () => {
    router.push('/competitions');
  };
  
  // Handle participation with team selection
  const handleParticipate = () => {
    // If team-based and user doesn't have a team, show team form
    if (selectedCompetition?.isTeamBased && !userTeam) {
      setShowTeamDialog(true);
    }
  };
  
  // Handle team creation
  const handleTeamCreated = (teamId: string) => {
    setShowTeamDialog(false);
    // Reload competition details to update participation status
    if (competitionId) {
      router.refresh();
    }
  };
  
  // Handle team joining
  const handleTeamJoined = () => {
    setShowTeamDialog(false);
    // Reload competition details to update participation status
    if (competitionId) {
      router.refresh();
    }
  };
  
  // Handle member selection
  const handleMemberSelect = (userId: string) => {
    // Navigate to user profile
    router.push(`/profile/${userId}`);
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="space-y-6">
        {/* Competition details */}
        <CompetitionDetail
          competitionId={competitionId}
          onBack={handleBack}
          onParticipate={handleParticipate}
          onShare={() => {/* Share functionality would go here */}}
        />
        
        {/* Team dashboard if user is in a team */}
        {userTeam && (
          <TeamDashboard
            teamId={userTeam.id}
            showMembers={true}
            onMemberSelect={handleMemberSelect}
          />
        )}
        
        {/* Team formation dialog */}
        {showTeamDialog && (
          <TeamFormation
            competitionId={competitionId}
            userId={user?.id || ''}
            onTeamCreated={handleTeamCreated}
            onTeamJoined={handleTeamJoined}
          />
        )}
      </div>
    </div>
  );
}
