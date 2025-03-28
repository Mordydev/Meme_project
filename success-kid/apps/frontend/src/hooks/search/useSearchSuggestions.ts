import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/api-client';
import { useDebounce } from './useDebounce';

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'user' | 'content';
  highlight?: [number, number]; // Start and end index
  url?: string;
}

export interface TopResult {
  id: string;
  type: string;
  title: string;
  url: string;
}

export interface SuggestionsResponse {
  suggestions: SearchSuggestion[];
  topResults?: TopResult[];
}

/**
 * Hook to fetch and manage search suggestions
 */
export function useSearchSuggestions(query: string, limit: number = 5) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [topResults, setTopResults] = useState<TopResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Debounce the query to avoid making too many requests
  const debouncedQuery = useDebounce(query, 300);
  
  useEffect(() => {
    // Don't fetch suggestions for empty or very short queries
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      setTopResults([]);
      return;
    }
    
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get<SuggestionsResponse>(
          `/api/v1/search/suggestions?q=${encodeURIComponent(debouncedQuery)}&limit=${limit}`
        );
        
        setSuggestions(response.data.suggestions || []);
        setTopResults(response.data.topResults || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch suggestions'));
        setSuggestions([]);
        setTopResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedQuery, limit]);
  
  return {
    suggestions,
    topResults,
    isLoading,
    error
  };
}
