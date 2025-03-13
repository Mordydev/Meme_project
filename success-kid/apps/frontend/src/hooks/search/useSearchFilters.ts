import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'date';
  options?: FilterOption[];
  range?: {min: number, max: number};
}

export type SearchFilters = Record<string, any>;

/**
 * Hook to fetch and manage search filters
 */
export function useSearchFilters() {
  const [filterDefinitions, setFilterDefinitions] = useState<FilterDefinition[]>([]);
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch available filters on mount
  useEffect(() => {
    const fetchFilters = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get<{filters: FilterDefinition[]}>('/api/v1/search/filters');
        setFilterDefinitions(response.data.filters);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch search filters'));
        setFilterDefinitions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFilters();
  }, []);
  
  /**
   * Update a single filter value
   */
  const updateFilter = (filterId: string, value: any) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterId]: value
    }));
  };
  
  /**
   * Remove a filter
   */
  const removeFilter = (filterId: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[filterId];
      return newFilters;
    });
  };
  
  /**
   * Reset all filters to default/empty state
   */
  const resetFilters = () => {
    setActiveFilters({});
  };
  
  return {
    filterDefinitions,
    activeFilters,
    isLoading,
    error,
    updateFilter,
    removeFilter,
    resetFilters
  };
}
