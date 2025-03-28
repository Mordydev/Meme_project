import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/api-client';

export interface SearchFilters {
  types?: string[];
  [key: string]: any;
}

export interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'comment' | 'achievement' | string;
  title?: string;
  snippet: string;
  highlightRanges: Array<{start: number, end: number}>;
  url: string;
  author?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  metadata: {
    createdAt: string;
    relevanceScore: number;
    matches: string[];
  };
}

export interface SearchResultsResponse {
  results: SearchResult[];
  totalResults: number;
  page: number;
  pageSize: number;
  totalPages: number;
  correctedQuery?: string;
}

/**
 * Hook to fetch and manage search results
 */
export function useSearchResults(
  query: string,
  filters: SearchFilters = {},
  sort: string = 'relevance',
  page: number = 1,
  limit: number = 10
) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(limit);
  const [correctedQuery, setCorrectedQuery] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Don't search if query is empty
    if (!query || query.trim() === '') {
      setResults([]);
      setTotalResults(0);
      setTotalPages(0);
      setCorrectedQuery(undefined);
      return;
    }
    
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query params
        const params = new URLSearchParams({
          q: query,
          page: page.toString(),
          limit: limit.toString(),
          sort
        });
        
        // Add filters to query params
        if (filters.types && filters.types.length > 0) {
          filters.types.forEach((type: string) => {
            params.append('types', type);
          });
        }
        
        // Add other filters
        Object.entries(filters).forEach(([key, value]) => {
          if (key !== 'types' && value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, v.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });
        
        const response = await apiClient.get<SearchResultsResponse>(
          `/api/v1/search?${params.toString()}`
        );
        
        setResults(response.data.results);
        setTotalResults(response.data.totalResults);
        setCurrentPage(response.data.page);
        setPageSize(response.data.pageSize);
        setTotalPages(response.data.totalPages);
        setCorrectedQuery(response.data.correctedQuery);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch search results'));
        setResults([]);
        setTotalResults(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [query, filters, sort, page, limit]);
  
  return {
    results,
    totalResults,
    currentPage,
    pageSize,
    totalPages,
    correctedQuery,
    isLoading,
    error,
    setPage: setCurrentPage
  };
}
