import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient, AppError } from '@/lib/api-client';
import {
  Competition,
  CompetitionSummary,
  CompetitionStatus,
  Team,
  TeamMember,
} from '@/types/leaderboard';

/**
 * Competition store state
 */
interface CompetitionState {
  // Competition data
  competitions: CompetitionSummary[];
  selectedCompetition: Competition | null;
  
  // Team data for team competitions
  userTeams: Team[];
  selectedTeamId: string | null;
  teamMembers: TeamMember[];
  teamRankings: Team[];
  
  // Filters
  statusFilter: CompetitionStatus | 'all';
  
  // Loading and error states
  isLoading: boolean;
  isCompetitionLoading: boolean;
  isTeamLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchCompetitions: (status?: CompetitionStatus | 'all') => Promise<void>;
  fetchCompetitionDetails: (competitionId: string) => Promise<void>;
  joinCompetition: (competitionId: string) => Promise<boolean>;
  
  // Team actions
  fetchUserTeams: () => Promise<void>;
  fetchTeamMembers: (teamId: string) => Promise<void>;
  fetchTeamRankings: (competitionId: string) => Promise<void>;
  createTeam: (name: string, description: string, competitionId: string, invitedMembers?: string[]) => Promise<string | null>;
  joinTeam: (inviteCode: string) => Promise<boolean>;
  
  // UI actions
  setStatusFilter: (status: CompetitionStatus | 'all') => void;
  setSelectedTeamId: (teamId: string | null) => void;
  resetError: () => void;
}

/**
 * Competition store
 */
export const useCompetitionStore = create<CompetitionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      competitions: [],
      selectedCompetition: null,
      userTeams: [],
      selectedTeamId: null,
      teamMembers: [],
      teamRankings: [],
      statusFilter: 'active',
      isLoading: false,
      isCompetitionLoading: false,
      isTeamLoading: false,
      error: null,
      
      // Fetch competitions list
      fetchCompetitions: async (status = 'active') => {
        set({ 
          isLoading: true, 
          error: null,
          statusFilter: status
        });
        
        try {
          const params = new URLSearchParams({
            status
          });
          
          const response = await apiClient.get(`/api/v1/competitions?${params.toString()}`);
          
          if (response.data) {
            set({
              competitions: response.data.competitions,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching competitions:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error : new Error('Failed to fetch competitions')
          });
        }
      },
      
      // Fetch details for a specific competition
      fetchCompetitionDetails: async (competitionId) => {
        set({ isCompetitionLoading: true, error: null });
        
        try {
          const response = await apiClient.get(`/api/v1/competitions/${competitionId}`);
          
          if (response.data) {
            set({
              selectedCompetition: response.data.competition,
              isCompetitionLoading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching competition details:', error);
          set({ 
            isCompetitionLoading: false, 
            error: error instanceof Error ? error : new Error('Failed to fetch competition details')
          });
        }
      },
      
      // Join a competition
      joinCompetition: async (competitionId) => {
        try {
          const response = await apiClient.post(`/api/v1/competitions/${competitionId}/join`);
          
          if (response.data && response.data.success) {
            // Refresh competition details to update user status
            await get().fetchCompetitionDetails(competitionId);
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error joining competition:', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to join competition')
          });
          return false;
        }
      },
      
      // Fetch teams the user belongs to
      fetchUserTeams: async () => {
        set({ isTeamLoading: true, error: null });
        
        try {
          const response = await apiClient.get('/api/v1/teams');
          
          if (response.data) {
            set({
              userTeams: response.data.teams,
              isTeamLoading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching user teams:', error);
          set({ 
            isTeamLoading: false, 
            error: error instanceof Error ? error : new Error('Failed to fetch user teams')
          });
        }
      },
      
      // Fetch members of a specific team
      fetchTeamMembers: async (teamId) => {
        set({ isTeamLoading: true, error: null });
        
        try {
          const response = await apiClient.get(`/api/v1/teams/${teamId}/members`);
          
          if (response.data) {
            set({
              teamMembers: response.data.members,
              isTeamLoading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching team members:', error);
          set({ 
            isTeamLoading: false, 
            error: error instanceof Error ? error : new Error('Failed to fetch team members')
          });
        }
      },
      
      // Fetch team rankings for a competition
      fetchTeamRankings: async (competitionId) => {
        set({ isTeamLoading: true, error: null });
        
        try {
          const response = await apiClient.get(`/api/v1/competitions/${competitionId}/teams`);
          
          if (response.data) {
            set({
              teamRankings: response.data.teams,
              isTeamLoading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching team rankings:', error);
          set({ 
            isTeamLoading: false, 
            error: error instanceof Error ? error : new Error('Failed to fetch team rankings')
          });
        }
      },
      
      // Create a new team
      createTeam: async (name, description, competitionId, invitedMembers) => {
        try {
          const response = await apiClient.post('/api/v1/teams', {
            data: {
              name,
              description,
              competitionId,
              invitedMembers
            }
          });
          
          if (response.data && response.data.teamId) {
            // Refresh user teams
            await get().fetchUserTeams();
            return response.data.teamId;
          }
          return null;
        } catch (error) {
          console.error('Error creating team:', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to create team')
          });
          return null;
        }
      },
      
      // Join a team using invite code
      joinTeam: async (inviteCode) => {
        try {
          const response = await apiClient.post('/api/v1/teams/join', {
            data: {
              inviteCode
            }
          });
          
          if (response.data && response.data.success) {
            // Refresh user teams
            await get().fetchUserTeams();
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error joining team:', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to join team')
          });
          return false;
        }
      },
      
      // Set status filter for competitions list
      setStatusFilter: (status) => {
        if (status !== get().statusFilter) {
          set({ statusFilter: status });
          get().fetchCompetitions(status);
        }
      },
      
      // Set selected team ID
      setSelectedTeamId: (teamId) => {
        set({ selectedTeamId: teamId });
        if (teamId) {
          get().fetchTeamMembers(teamId);
        }
      },
      
      // Reset error state
      resetError: () => set({ error: null }),
    }),
    {
      name: 'competition-store',
    }
  )
);
