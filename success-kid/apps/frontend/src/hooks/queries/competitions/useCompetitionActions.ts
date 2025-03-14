import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for joining a competition
 * 
 * @returns Competition join mutation
 */
export function useJoinCompetition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (competitionId: string) => {
      // In a real implementation, this would be an API call
      // const response = await apiClient.post(`/api/v1/competitions/${competitionId}/join`);
      // return response.data;
      
      // Simulating API latency
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock response
      return {
        success: true,
        competitionId,
        joinedAt: new Date().toISOString()
      };
    },
    onSuccess: (_, competitionId) => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    }
  });
}

/**
 * Hook for leaving a competition
 * 
 * @returns Competition leave mutation
 */
export function useLeaveCompetition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (competitionId: string) => {
      // In a real implementation, this would be an API call
      // const response = await apiClient.post(`/api/v1/competitions/${competitionId}/leave`);
      // return response.data;
      
      // Simulating API latency
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock response
      return {
        success: true,
        competitionId
      };
    },
    onSuccess: (_, competitionId) => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
    }
  });
}
