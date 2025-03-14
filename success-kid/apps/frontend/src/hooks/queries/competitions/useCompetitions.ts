import { useQuery } from '@tanstack/react-query';
import { Competition, CompetitionStatus } from '@/types';

interface UseCompetitionsProps {
  status?: CompetitionStatus;
  limit?: number;
}

/**
 * Hook for fetching available competitions
 * 
 * @param options - Query options
 * @returns Competition data query
 */
export function useCompetitions({ status = 'active', limit = 10 }: UseCompetitionsProps = {}) {
  return useQuery({
    queryKey: ['competitions', { status, limit }],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // const response = await apiClient.get('/api/v1/competitions', { params: { status, limit } });
      // return response.data;
      
      // Simulating API latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock competition data
      const competitions: Competition[] = [
        {
          id: 'comp-001',
          title: 'Spring Community Challenge',
          description: 'Create content and engage with the community to earn points and win rewards!',
          status: 'active',
          type: 'individual',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          rules: 'Participants must follow community guidelines. Points are awarded for posts, comments, and achievements.',
          objectives: [
            {
              id: 'obj-001',
              description: 'Create original posts',
              type: 'posts',
              target: 10,
            },
            {
              id: 'obj-002',
              description: 'Comment on other users\' posts',
              type: 'comments',
              target: 30,
            },
            {
              id: 'obj-003',
              description: 'Receive upvotes on your content',
              type: 'reactions',
              target: 50,
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
          userStatus: 'eligible',
          teamBased: false
        },
        {
          id: 'comp-002',
          title: 'Referral Champion',
          description: 'Invite friends to join the platform and compete for the title of Referral Champion!',
          status: 'active',
          type: 'individual',
          startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          rules: 'Invite new users to the platform. You earn points when they sign up and complete their onboarding.',
          objectives: [
            {
              id: 'obj-001',
              description: 'Invite new users that sign up',
              type: 'referrals',
              target: 5,
            },
            {
              id: 'obj-002',
              description: 'Referred users connect wallet',
              type: 'custom',
              target: 3,
            }
          ],
          rewards: [
            {
              rank: 1,
              type: 'points',
              value: 10000,
              description: 'Success Points',
              imageUrl: '/images/rewards/points.svg'
            },
            {
              rank: 'top 3',
              type: 'token',
              value: '50 SKC',
              description: 'Success Kid Tokens',
              imageUrl: '/images/rewards/token.svg'
            }
          ],
          participantCount: 78,
          userStatus: 'participating',
          teamBased: false
        },
        {
          id: 'comp-003',
          title: 'Team Content Cup',
          description: 'Form teams and collaborate to create the best content. Team up and rise to the top!',
          status: 'upcoming',
          type: 'team',
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          endDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(), // 24 days from now
          rules: 'Teams of 3-5 members compete to create and promote content. Points are awarded based on engagement and quality.',
          objectives: [
            {
              id: 'obj-001',
              description: 'Team creates high-quality posts',
              type: 'posts',
              target: 30,
            },
            {
              id: 'obj-002',
              description: 'Engagement on team content',
              type: 'reactions',
              target: 200,
            }
          ],
          rewards: [
            {
              rank: 1,
              type: 'points',
              value: 20000,
              description: 'Success Points (split among team)',
              imageUrl: '/images/rewards/points.svg'
            },
            {
              rank: 'all participants',
              type: 'badge',
              value: 'Team Competitor',
              description: 'Participation badge',
              imageUrl: '/images/rewards/badge-team.svg'
            }
          ],
          participantCount: 0,
          userStatus: 'eligible',
          teamBased: true
        }
      ];
      
      // Filter by status if needed
      let filteredCompetitions = competitions;
      if (status !== 'all') {
        filteredCompetitions = competitions.filter(comp => comp.status === status);
      }
      
      // Apply limit
      if (limit) {
        filteredCompetitions = filteredCompetitions.slice(0, limit);
      }
      
      return {
        competitions: filteredCompetitions,
        pagination: {
          total: filteredCompetitions.length,
          limit
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
