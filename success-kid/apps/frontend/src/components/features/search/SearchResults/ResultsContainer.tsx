'use client';

import React, { useState, useEffect } from 'react';
import { useSearch } from '@/hooks/queries/useSearch';
import { useSearchAnalytics } from '@/hooks/queries/useSearch';
import { SearchFilters, SearchSortOption } from '@/types';
import { ResultsHeader } from './ResultsHeader';
import { ResultsList } from './ResultsList';
import { NoResultsState } from './NoResultsState';
import { cn } from '@/lib/utils';

interface ResultsContainerProps {
  query: string;
  initialFilters?: SearchFilters;
  initialSort?: SearchSortOption;
  className?: string;
}

/**
 * Container component for search results with filtering and sorting
 */
export function ResultsContainer({
  query,
  initialFilters = {},
  initialSort = 'relevance',
  className,
}: ResultsContainerProps) {
  // State for current filters and sorting
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [sort, setSort] = useState<SearchSortOption>(initialSort);
  const [page, setPage] = useState(1);
  
  // Reset page when query, filters, or sort changes
  useEffect(() => {
    setPage(1);
  }, [query, filters, sort]);
  
  // Fetch search results
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = useSearch({
    query,
    page,
    filters,
    sort,
    enabled: query.trim().length >= 2
  });
  
  // Track search analytics
  const { trackQuery } = useSearchAnalytics();
  
  useEffect(() => {
    if (data && !isLoading && query.trim().length >= 2) {
      trackQuery(query, data.totalResults, filters);
    }
  }, [data, isLoading, query, filters, trackQuery]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };
  
  // Handle sort changes
  const handleSortChange = (newSort: SearchSortOption) => {
    setSort(newSort);
  };
  
  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      <ResultsHeader
        query={query}
        totalResults={data?.totalResults || 0}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        activeFilters={filters}
        activeSort={sort}
        isLoading={isLoading}
        correctedQuery={data?.correctedQuery}
      />
      
      {isLoading && (
        <div className="py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {isError && (
        <div className="py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-alert/60 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Search error</h3>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : 'There was a problem searching. Please try again.'}
          </p>
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}
      
      {!isLoading && !isError && data?.results.length === 0 && (
        <NoResultsState query={query} />
      )}
      
      {!isLoading && !isError && data?.results.length > 0 && (
        <ResultsList
          results={data.results}
          query={query}
          page={page}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
