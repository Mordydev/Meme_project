import { useQuery } from '@tanstack/react-query';
import { Competition, CompetitionRanking } from '@/types';

interface UseCompetitionDetailsProps {
  competitionId: string;
}

/**
 * Hook for fetching detailed competition information
 * 
 * @param options - Query options
 * @returns Competition details query
 */
export function useCompetitionDetails({ competitionId }: UseCompetitionDetailsProps) {
  return useQuery({
    queryKey: ['competition', competitionId],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // const response = await apiClient.get(`/api/v1/competitions/${competitionId}`);
      // return response.data;
      
      // Simulating API latency
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Generate mock leaderboard
      const mockLeaderboard: CompetitionRanking[] = Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        userId: `user-${i + 1}`,
        username: `user${i + 1}`,
        displayName: `User ${i + 1}`,
        avatarUrl: `/images/avatars/avatar${(i % 10) + 1}.png`,
        score: Math.floor(Math.random() * 100) + 50,
        progress: {
          'obj-001': Math.floor(Math.random() * 12),
          'obj-002': Math.floor(Math.random() * 35),
          'obj-003': Math.floor(Math.random() * 60)
        }
      })).sort((a, b) => b.score - a.score);
      
      // Mock competition detail data
      const competition: Competition = {
        id: competitionId,
        title: 'Spring Community Challenge',
        description: 'Create content and engage with the community to earn points and win rewards!',
        status: 'active',
        type: 'individual',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        rules: 'Participants must follow community guidelines. Points are awarded for posts, comments, and achievements. Multiple submissions are encouraged to maximize your chances of winning!',
        objectives: [
          {
            id: 'obj-001',
            description: 'Create original posts',
            type: 'posts',
            target: 10,
            currentProgress: 4,
            completed: false
          },
          {
            id: 'obj-002',
            description: 'Comment on other users\' posts',
            type: 'comments',
            target: 30,
            currentProgress: 15,
            completed: false
          },
          {
            id: 'obj-003',
            description: 'Receive upvotes on your content',
            type: 'reactions',
            target: 50,
            currentProgress: 22,
            completed: false
          }
        ],
        rewards: [
          {
            rank: 1,
            type: 'points',
            value: 5000,
            description: 'Success Points',
            imageUrl: '/images/rewards/points.svg'
          },
          {
            rank: 2,
            type: 'points',
            value: 2500,
            description: 'Success Points',
            imageUrl: '/images/rewards/points.svg'
          },
          {
            rank: 3,
            type: 'points',
            value: 1000,
            description: 'Success Points',
            imageUrl: '/images/rewards/points.svg'
          },
          {
            rank: 'top 10',
            type: 'badge',
            value: 'Spring Champion',
            description: 'Exclusive profile badge',
            imageUrl: '/images/rewards/badge-champion.svg'
          }
        ],
        participantCount: 123,
        leaderboard: mockLeaderboard,
        userStatus: 'participating',
        userProgress: {
          isParticipating: true,
          currentRank: 15,
          score: 41,
          progress: {
            'obj-001': 4,
            'obj-002': 15,
            'obj-003': 22
          }
        },
        teamBased: false
      };
      
      return { competition };
    },
    enabled: !!competitionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
