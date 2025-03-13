import { useQuery } from '@tanstack/react-query';

async function fetchPointsDashboard(userId: string) {
  try {
    const response = await fetch('/api/points/dashboard');
    if (!response.ok) {
      throw new Error('Failed to fetch points data');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching points dashboard:', error);
    throw error;
  }
}

export function usePointsData(userId: string, initialData?: any) {
  return useQuery({
    queryKey: ['points', 'dashboard', userId],
    queryFn: () => fetchPointsDashboard(userId),
    initialData,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

export function usePointsTransactions(userId: string, filters?: any, initialData?: any) {
  return useQuery({
    queryKey: ['points', 'transactions', userId, filters],
    queryFn: async () => {
      // Build query params from filters
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const response = await fetch(`/api/points/transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      return data.data;
    },
    initialData,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRedemptionEligibility(userId: string, initialData?: any) {
  return useQuery({
    queryKey: ['points', 'redemption', 'eligibility', userId],
    queryFn: async () => {
      const response = await fetch('/api/points/redemption/eligibility');
      if (!response.ok) {
        throw new Error('Failed to fetch redemption eligibility');
      }
      const data = await response.json();
      return data.data;
    },
    initialData,
    staleTime: 60 * 1000, // 1 minute
  });
}
