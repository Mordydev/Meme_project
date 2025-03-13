'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchProvider } from '@/components/features/search/SearchProvider';
import { SearchBar } from '@/components/features/search/SearchBar';
import { SearchResults } from '@/components/features/search/SearchResults';
import { FilterPanel } from '@/components/features/search/FilterPanel';
import { useSearch } from '@/components/features/search/SearchProvider';
import { SearchShortcuts } from '@/components/features/search/SearchShortcuts';
import { DEFAULT_SEARCH_SHORTCUTS } from '@/components/features/search/SearchShortcuts';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import { SearchFilters } from '@/hooks/search';

function SearchPageContent() {
  const {
    query,
    results,
    totalResults,
    currentPage,
    totalPages,
    correctedQuery,
    isSearching,
    
    setPage,
    
    filterDefinitions,
    activeFilters,
    setActiveFilters,
    
    sortBy,
    setSortBy,
    
    executeSearch
  } = useSearch();
  
  // Handle sorting change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    executeSearch(undefined, undefined, 1, e.target.value);
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handle shortcut selection
  const handleShortcutSelect = (shortcut: { name: string; query: string }) => {
    executeSearch(shortcut.query);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <SearchBar
          initialQuery={query}
          onSearch={(searchQuery) => executeSearch(searchQuery)}
          placeholder="Search for content, users, and more..."
          className="max-w-2xl mx-auto"
        />
        
        {/* Search shortcuts */}
        <div className="mt-2 flex justify-center">
          <SearchShortcuts
            shortcuts={DEFAULT_SEARCH_SHORTCUTS}
            onSelect={handleShortcutSelect}
          />
        </div>
      </div>
      
      {query ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Left sidebar - filters */}
          <div className="md:col-span-1">
            <FilterPanel
              filterDefinitions={filterDefinitions}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
            />
            
            {/* Advanced search link */}
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => window.location.href = '/search/advanced'}
              >
                Advanced Search
              </Button>
            </div>
          </div>
          
          {/* Main content - search results */}
          <div className="md:col-span-3">
            {/* Results header */}
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-bold">
                {isSearching ? 'Searching...' : 
                  results.length === 0 ? 'No results' : 
                    `${totalResults.toLocaleString()} result${totalResults !== 1 ? 's' : ''}`}
              </h1>
              
              {/* Sort options */}
              {results.length > 0 && (
                <div className="flex items-center">
                  <label htmlFor="sort-options" className="mr-2 text-sm">
                    Sort by:
                  </label>
                  <select
                    id="sort-options"
                    className="rounded border border-neutral-200 bg-background p-1 text-sm"
                    value={sortBy}
                    onChange={handleSortChange}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date_desc">Newest</option>
                    <option value="date_asc">Oldest</option>
                    <option value="popularity">Popularity</option>
                  </select>
                </div>
              )}
            </div>
            
            {/* Search results */}
            {isSearching ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner size="md" />
              </div>
            ) : (
              <SearchResults
                results={results}
                totalResults={totalResults}
                query={query}
                correctedQuery={correctedQuery}
                isLoading={isSearching}
              />
            )}
            
            {/* Pagination */}
            {results.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {/* Page numbers - show limited pages for better UX */}
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    let pageNum;
                    
                    // Always show first page, last page, current page, and 1 page before/after current
                    if (totalPages <= 5) {
                      pageNum = index + 1;
                    } else if (currentPage <= 3) {
                      pageNum = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + index;
                    } else {
                      pageNum = currentPage - 2 + index;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'primary' : 'outline'}
                        className="w-10"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-16 text-center">
          <h2 className="mb-4 text-xl font-bold">Enter a search term to begin</h2>
          <p className="mx-auto max-w-md text-neutral-500">
            Search for posts, users, comments, and achievements across the Success Kid Community
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const sort = searchParams.get('sort') || 'relevance';
  
  // Parse filters from URL parameters
  const filters: SearchFilters = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter[') && key.endsWith(']')) {
      const filterName = key.slice(7, -1);
      filters[filterName] = value;
    }
  });
  
  return (
    <SearchProvider
      initialQuery={query}
      initialFilters={filters}
      initialPage={page}
      initialSort={sort}
    >
      <SearchPageContent />
    </SearchProvider>
  );
}
