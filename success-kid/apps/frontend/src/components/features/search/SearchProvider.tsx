'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSearchResults, useSearchFilters, SearchFilters, SearchResult } from '@/hooks/search';
import { useSearchHistory } from '@/hooks/search';
import searchAnalytics from '@/lib/search-analytics';

// Define the context type
interface SearchContextType {
  // Search query and state
  query: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
  
  // Search results
  results: SearchResult[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  correctedQuery?: string;
  
  // Pagination
  setPage: (page: number) => void;
  
  // Filters
  filterDefinitions: Array<any>;
  activeFilters: SearchFilters;
  setActiveFilters: (filters: SearchFilters) => void;
  updateFilter: (filterId: string, value: any) => void;
  removeFilter: (filterId: string) => void;
  resetFilters: () => void;
  
  // Sorting
  sortBy: string;
  setSortBy: (sort: string) => void;
  
  // Search execution
  executeSearch: (query?: string, filters?: SearchFilters, page?: number, sort?: string) => void;
  
  // History
  searchHistory: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
}

// Create the context with default values
const SearchContext = createContext<SearchContextType>({
  query: '',
  setQuery: () => {},
  isSearching: false,
  
  results: [],
  totalResults: 0,
  currentPage: 1,
  totalPages: 0,
  
  setPage: () => {},
  
  filterDefinitions: [],
  activeFilters: {},
  setActiveFilters: () => {},
  updateFilter: () => {},
  removeFilter: () => {},
  resetFilters: () => {},
  
  sortBy: 'relevance',
  setSortBy: () => {},
  
  executeSearch: () => {},
  
  searchHistory: [],
  addToHistory: () => {},
  clearHistory: () => {},
});

// Export the context hook
export const useSearch = () => useContext(SearchContext);

export interface SearchProviderProps {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  initialPage?: number;
  initialSort?: string;
  children: React.ReactNode;
}

export function SearchProvider({
  initialQuery = '',
  initialFilters = {},
  initialPage = 1,
  initialSort = 'relevance',
  children
}: SearchProviderProps) {
  // Router and URL parameters
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Search state
  const [query, setQuery] = useState<string>(initialQuery);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  
  // Get search history
  const { searchHistory, addToHistory, clearHistory } = useSearchHistory();
  
  // Get filters
  const {
    filterDefinitions,
    activeFilters,
    updateFilter,
    removeFilter,
    resetFilters
  } = useSearchFilters();
  
  // Apply initial filters
  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      Object.entries(initialFilters).forEach(([key, value]) => {
        updateFilter(key, value);
      });
    }
  }, []);
  
  // Set active filters directly
  const setActiveFilters = useCallback((filters: SearchFilters) => {
    // Reset all filters first
    resetFilters();
    
    // Then set the new filters
    Object.entries(filters).forEach(([key, value]) => {
      updateFilter(key, value);
    });
  }, [resetFilters, updateFilter]);
  
  // Get search results
  const {
    results,
    totalResults,
    currentPage,
    totalPages,
    correctedQuery,
    isLoading,
    error,
    setPage
  } = useSearchResults(query, activeFilters, sortBy, initialPage);
  
  // Update search parameters in URL
  const updateSearchParams = useCallback((
    searchQuery: string,
    filters: SearchFilters,
    page: number,
    sort: string
  ) => {
    const params = new URLSearchParams();
    
    // Add query
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    
    // Add page if not the first page
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    // Add sort if not the default
    if (sort !== 'relevance') {
      params.set('sort', sort);
    }
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          params.append(`filter[${key}][]`, v);
        });
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue !== undefined) {
            params.append(`filter[${key}][${subKey}]`, String(subValue));
          }
        });
      } else {
        params.append(`filter[${key}]`, String(value));
      }
    });
    
    // Update the URL without navigating
    const newUrl = `${pathname}?${params.toString()}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  }, [pathname]);
  
  // Execute search with optional parameters
  const executeSearch = useCallback((
    searchQuery?: string,
    filters?: SearchFilters,
    page?: number,
    sort?: string
  ) => {
    const newQuery = searchQuery !== undefined ? searchQuery : query;
    const newFilters = filters !== undefined ? filters : activeFilters;
    const newPage = page !== undefined ? page : 1; // Reset to first page on new search
    const newSort = sort !== undefined ? sort : sortBy;
    
    if (!newQuery.trim()) return;
    
    setIsSearching(true);
    
    // Track the search query
    searchAnalytics.trackQuery(newQuery, 0, newFilters);
    
    // Add to search history
    addToHistory(newQuery);
    
    // Update state
    setQuery(newQuery);
    if (filters) setActiveFilters(newFilters);
    if (sort) setSortBy(newSort);
    
    // Update URL parameters
    updateSearchParams(newQuery, newFilters, newPage, newSort);
    
    // The actual search results will be handled by the useSearchResults hook
    setIsSearching(false);
  }, [
    query,
    activeFilters,
    sortBy,
    addToHistory,
    setActiveFilters,
    updateSearchParams
  ]);
  
  // Track search result clicks
  const handleResultClick = useCallback((result: SearchResult, position: number) => {
    searchAnalytics.trackResultClick(query, result, position);
  }, [query]);
  
  // Track pagination
  useEffect(() => {
    if (initialPage !== currentPage && query) {
      searchAnalytics.trackPagination(query, initialPage, currentPage);
      updateSearchParams(query, activeFilters, currentPage, sortBy);
    }
  }, [currentPage, initialPage, query, activeFilters, sortBy, updateSearchParams]);
  
  // Track filter changes
  useEffect(() => {
    if (
      JSON.stringify(initialFilters) !== JSON.stringify(activeFilters) && 
      query && 
      Object.keys(initialFilters).length > 0
    ) {
      searchAnalytics.trackFilterChange(query, initialFilters, activeFilters);
      updateSearchParams(query, activeFilters, currentPage, sortBy);
    }
  }, [
    activeFilters, 
    initialFilters, 
    query, 
    currentPage, 
    sortBy, 
    updateSearchParams
  ]);
  
  // Track sort changes
  useEffect(() => {
    if (initialSort !== sortBy && query) {
      updateSearchParams(query, activeFilters, currentPage, sortBy);
    }
  }, [sortBy, initialSort, query, activeFilters, currentPage, updateSearchParams]);
  
  // Sync with URL parameters
  useEffect(() => {
    const queryParam = searchParams.get('q');
    const pageParam = searchParams.get('page');
    const sortParam = searchParams.get('sort');
    
    let shouldExecuteSearch = false;
    
    // Update query if different
    if (queryParam && queryParam !== query) {
      setQuery(queryParam);
      shouldExecuteSearch = true;
    }
    
    // Update page if different
    if (pageParam && Number(pageParam) !== currentPage) {
      setPage(Number(pageParam));
    }
    
    // Update sort if different
    if (sortParam && sortParam !== sortBy) {
      setSortBy(sortParam);
      shouldExecuteSearch = true;
    }
    
    // Extract filter parameters
    const newFilters: SearchFilters = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter[') && key.endsWith(']')) {
        const filterName = key.slice(7, -1);
        newFilters[filterName] = value;
      }
    });
    
    // If filters are different, update them
    if (Object.keys(newFilters).length > 0 && JSON.stringify(newFilters) !== JSON.stringify(activeFilters)) {
      setActiveFilters(newFilters);
      shouldExecuteSearch = true;
    }
    
    // Execute search if needed
    if (shouldExecuteSearch && queryParam) {
      executeSearch(queryParam, newFilters, Number(pageParam) || 1, sortParam || 'relevance');
    }
  }, [searchParams]);
  
  // Context value
  const contextValue: SearchContextType = {
    query,
    setQuery,
    isSearching,
    
    results,
    totalResults,
    currentPage,
    totalPages,
    correctedQuery,
    
    setPage,
    
    filterDefinitions,
    activeFilters,
    setActiveFilters,
    updateFilter,
    removeFilter,
    resetFilters,
    
    sortBy,
    setSortBy,
    
    executeSearch,
    
    searchHistory,
    addToHistory,
    clearHistory,
  };
  
  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}
