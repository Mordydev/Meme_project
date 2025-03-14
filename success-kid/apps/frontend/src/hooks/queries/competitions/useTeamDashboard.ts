import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Team, TeamMember } from '@/types';
import { apiClient } from '@/lib/api-client';

interface TeamDashboardOptions {
  teamId: string;
  competitionId?: string;
}

/**
 * useTeamDashboard
 * 
 * Hook for retrieving and managing team dashboard data
 */
export function useTeamDashboard({ teamId, competitionId }: TeamDashboardOptions) {
  const queryClient = useQueryClient();
  
  // Fetch team details
  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      // In a real implementation, this would call the API
      // const response = await apiClient.get(`/api/teams/${teamId}`);
      // return response.data;
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock data
      const mockTeam: Team = {
        id: teamId,
        name: 'Success Squad',
        description: 'A team dedicated to achieving the highest success in the platform',
        competitionId: competitionId || 'comp_123',
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
        createdBy: 'user_1',
        inviteCode: 'SUCCESSTEAM'
      };
      
      return mockTeam;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch team rankings
  const rankingsQuery = useQuery({
    queryKey: ['team-rankings', competitionId],
    queryFn: async () => {
      // In a real implementation, this would call the API
      // const response = await apiClient.get(`/api/competitions/${competitionId}/teams`);
      // return response.data;
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock data
      return [
        {id: 'team1', name: 'Victory Vanguard', score: 12500, rank: 1, memberCount: 5},
        {id: 'team2', name: 'Token Warriors', score: 10800, rank: 2, memberCount: 4},
        {id: teamId, name: 'Success Squad', score: 7000, rank: 3, memberCount: 4},
        {id: 'team4', name: 'Crypto Crusaders', score: 5200, rank: 4, memberCount: 3},
        {id: 'team5', name: 'Blockchain Brigade', score: 4100, rank: 5, memberCount: 6},
      ];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Leave team mutation
  const leaveTeam = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would call the API
      // await apiClient.post(`/api/teams/${teamId}/leave`);
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate team queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['user-teams'] });
    }
  });
  
  // Update team mutation
  const updateTeam = useMutation({
    mutationFn: async (updates: Partial<Team>) => {
      // In a real implementation, this would call the API
      // await apiClient.patch(`/api/teams/${teamId}`, updates);
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate team query to refetch data
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    }
  });
  
  // Generate new invite code mutation
  const generateInviteCode = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would call the API
      // const response = await apiClient.post(`/api/teams/${teamId}/generate-invite`);
      // return response.data;
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 800));
      return { inviteCode: `TEAM${Math.random().toString(36).substring(2, 8).toUpperCase()}` };
    },
    onSuccess: (data) => {
      // Update team data with new invite code
      queryClient.setQueryData(['team', teamId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          inviteCode: data.inviteCode
        };
      });
    }
  });
  
  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      // In a real implementation, this would call the API
      // await apiClient.delete(`/api/teams/${teamId}/members/${memberId}`);
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate team query to refetch data
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    }
  });
  
  return {
    team: teamQuery.data,
    rankings: rankingsQuery.data,
    isLoading: teamQuery.isLoading || rankingsQuery.isLoading,
    isError: teamQuery.isError || rankingsQuery.isError,
    leaveTeam,
    updateTeam,
    generateInviteCode,
    removeMember
  };
}
