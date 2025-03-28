'use client';

import React from 'react';
import { ResultItem } from './ResultItem';
import { NoResultsState } from './NoResultsState';
import { Spinner } from '@/components/ui/Spinner';
import { SearchFilters, SearchResult } from '@/hooks/search';

export interface SearchResultsProps {
  results: SearchResult[];
  totalResults: number;
  query: string;
  correctedQuery?: string;
  isLoading: boolean;
  error?: Error | null;
  onResultClick?: (result: SearchResult) => void;
}

export function SearchResults({
  results,
  totalResults,
  query,
  correctedQuery,
  isLoading,
  error,
  onResultClick
}: SearchResultsProps) {
  // Display loading state
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="rounded-md bg-alert/10 p-4 text-alert">
        <p>Error searching for &quot;{query}&quot;</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
  
  // Handle no results state
  if (results.length === 0) {
    return <NoResultsState query={query} />;
  }
  
  // Extract search terms for highlighting
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
  
  return (
    <div className="space-y-4">
      {/* Results header with count and corrected query */}
      <div className="mb-6">
        <h2 className="text-lg font-medium">
          {totalResults.toLocaleString()} {totalResults === 1 ? 'result' : 'results'} for &quot;{correctedQuery || query}&quot;
        </h2>
        
        {correctedQuery && (
          <p className="mt-1 text-sm text-neutral-500">
            Showing results for &quot;{correctedQuery}&quot; instead of &quot;{query}&quot;
          </p>
        )}
      </div>
      
      {/* Results list */}
      <div className="space-y-4">
        {results.map((result) => (
          <ResultItem
            key={`${result.type}-${result.id}`}
            result={result}
            highlightTerms={searchTerms}
            onClick={onResultClick ? () => onResultClick(result) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
