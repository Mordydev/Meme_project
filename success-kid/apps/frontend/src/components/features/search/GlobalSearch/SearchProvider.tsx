'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SearchSuggestion } from '@/types';

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  searchHistory: string[];
  clearHistory: () => void;
  executeSearch: (query: string) => void;
  isSearching: boolean;
}

const SearchContext = createContext<SearchContextType | null>(null);

interface SearchProviderProps {
  children: ReactNode;
  defaultQuery?: string;
}

export function SearchProvider({ children, defaultQuery = '' }: SearchProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Initialize with URL query param or default
  const [query, setQuery] = useState<string>(
    searchParams.get('q') || defaultQuery
  );
  
  // Search history state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Loading state
  const [isSearching, setIsSearching] = useState(false);
  
  // Load search history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedHistory = localStorage.getItem('searchHistory');
        if (storedHistory) {
          setSearchHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }
  }, []);
  
  // Save search history to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    }
  }, [searchHistory]);
  
  // Execute search function
  const executeSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Add to search history
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      setSearchHistory(prev => {
        const newHistory = [
          trimmedQuery,
          ...prev.filter(item => item !== trimmedQuery)
        ].slice(0, 10); // Keep only 10 most recent searches
        return newHistory;
      });
    }
    
    // Set loading state
    setIsSearching(true);
    
    // Navigate to search results page
    if (pathname !== '/search') {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', trimmedQuery);
      router.push(`/search?${params.toString()}`);
    }
    
    // Clear loading state after navigation
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };
  
  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('searchHistory');
      } catch (error) {
        console.error('Error clearing search history:', error);
      }
    }
  };
  
  const contextValue: SearchContextType = {
    query,
    setQuery,
    searchHistory,
    clearHistory,
    executeSearch,
    isSearching
  };
  
  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
