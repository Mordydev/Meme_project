import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Team } from '@/types';

/**
 * Hook for fetching user's teams
 * 
 * @returns User teams query
 */
export function useUserTeams() {
  return useQuery({
    queryKey: ['userTeams'],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // const response = await apiClient.get('/api/v1/teams/me');
      // return response.data;
      
      // Simulating API latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock user teams data
      const teams: Team[] = [
        {
          id: 'team-001',
          name: 'Content Champions',
          description: 'We create amazing content together!',
          competitionId: 'comp-003',
          members: [
            {
              userId: 'current-user',
              username: 'currentuser',
              displayName: 'Current User',
              avatarUrl: '/images/avatars/avatar1.png',
              joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              contribution: 35,
              score: 120
            },
            {
              userId: 'user-002',
              username: 'user2',
              displayName: 'User 2',
              avatarUrl: '/images/avatars/avatar2.png',
              joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              contribution: 40,
              score: 140
            },
            {
              userId: 'user-003',
              username: 'user3',
              displayName: 'User 3',
              avatarUrl: '/images/avatars/avatar3.png',
              joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              contribution: 25,
              score: 90
            }
          ],
          memberCount: 3,
          score: 350,
          rank: 2,
          change: 1,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'current-user'
        }
      ];
      
      return { teams };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching competition team leaderboard
 * 
 * @param competitionId - ID of the competition
 * @returns Team leaderboard query
 */
export function useTeamLeaderboard(competitionId: string) {
  return useQuery({
    queryKey: ['teamLeaderboard', competitionId],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // const response = await apiClient.get(`/api/v1/competitions/${competitionId}/teams`);
      // return response.data;
      
      // Simulating API latency
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock team leaderboard
      const teams: Team[] = Array.from({ length: 10 }, (_, i) => ({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
        competitionId,
        members: [],
        memberCount: Math.floor(Math.random() * 3) + 3, // 3-5 members
        score: Math.floor(Math.random() * 500) + 200,
        rank: i + 1,
        change: Math.floor(Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1),
        createdAt: new Date(Date.now() - (Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: `user-${i + 1}`
      })).sort((a, b) => b.score - a.score);
      
      // Recalculate ranks after sorting
      teams.forEach((team, index) => {
        team.rank = index + 1;
      });
      
      // Mock user's team
      const userTeam = {
        rank: 2,
        teamId: 'team-001',
        name: 'Content Champions',
        score: 350,
        memberCount: 3,
        userContribution: 35 // Percentage of team score
      };
      
      return { teams, userTeam };
    },
    enabled: !!competitionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for creating a new team
 * 
 * @returns Team creation mutation
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; competitionId: string; invitedMembers?: string[] }) => {
      // In a real implementation, this would be an API call
      // const response = await apiClient.post('/api/v1/teams', { data });
      // return response.data;
      
      // Simulating API latency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock response
      return {
        teamId: 'new-team-' + Date.now(),
        name: data.name,
        createdAt: new Date().toISOString(),
        inviteCode: 'TEAM' + Math.random().toString(36).substring(2, 8).toUpperCase()
      };
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['userTeams'] });
    }
  });
}

/**
 * Hook for joining an existing team
 * 
 * @returns Team join mutation
 */
export function useJoinTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      // In a real implementation, this would be an API call
      // const response = await apiClient.post('/api/v1/teams/join', { data: { inviteCode } });
      // return response.data;
      
      // Simulating API latency
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock response
      return {
        success: true,
        teamId: 'joined-team-001',
        teamName: 'Content Champions',
        joinedAt: new Date().toISOString()
      };
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['userTeams'] });
    }
  });
}
