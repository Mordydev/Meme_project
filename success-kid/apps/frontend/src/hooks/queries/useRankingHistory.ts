import { useQuery } from '@tanstack/react-query';
import { LeaderboardCategory, LeaderboardPeriod } from '@/types';

interface RankingHistoryPoint {
  date: string;
  rank: number;
  score: number;
}

interface CategoryRankSummary {
  currentRank: number;
  bestRank: number;
  totalScore: number;
}

interface RankingHistoryResponse {
  history: RankingHistoryPoint[];
  categories: Record<LeaderboardCategory, CategoryRankSummary>;
}

interface UseRankingHistoryProps {
  category?: LeaderboardCategory;
  period?: LeaderboardPeriod;
}

/**
 * Hook for fetching user's ranking history
 * 
 * @param options - Query options
 * @returns Ranking history query
 */
export function useRankingHistory({ 
  category = 'points', 
  period = 'monthly' 
}: UseRankingHistoryProps = {}) {
  return useQuery<RankingHistoryResponse>({
    queryKey: ['rankingHistory', { category, period }],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // const response = await apiClient.get('/api/v1/leaderboard/history', { 
      //   params: { category, period } 
      // });
      // return response.data;
      
      // Simulating API latency
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Generate historical data for the past 30 days
      const now = new Date();
      const history: RankingHistoryPoint[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (29 - i));
        
        // Generate somewhat realistic ranking data with some trends
        const baseRank = 25;
        const trend = Math.sin(i / 5) * 10; // Creates a wave pattern
        const noise = Math.random() * 6 - 3; // Random noise between -3 and 3
        
        return {
          date: date.toISOString(),
          rank: Math.max(1, Math.round(baseRank + trend + noise)),
          score: 1000 + i * 100 + Math.round(Math.random() * 100)
        };
      });
      
      // Mock category summaries
      const categories: Record<LeaderboardCategory, CategoryRankSummary> = {
        points: {
          currentRank: 15,
          bestRank: 8,
          totalScore: 5280
        },
        achievements: {
          currentRank: 22,
          bestRank: 17,
          totalScore: 2150
        },
        content: {
          currentRank: 12,
          bestRank: 5,
          totalScore: 3450
        },
        referrals: {
          currentRank: 31,
          bestRank: 25,
          totalScore: 950
        }
      };
      
      return { history, categories };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
