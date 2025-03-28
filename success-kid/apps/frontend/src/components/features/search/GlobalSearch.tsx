'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from './SearchBar';
import { SearchShortcuts, DEFAULT_SEARCH_SHORTCUTS } from './SearchShortcuts';
import { SearchSuggestion } from '@/hooks/search';

// Search context
interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  executeSearch: (query: string) => void;
  isSearching: boolean;
}

const SearchContext = createContext<SearchContextType>({
  query: '',
  setQuery: () => {},
  executeSearch: () => {},
  isSearching: false
});

export const useSearchContext = () => useContext(SearchContext);

export interface GlobalSearchProps {
  initialQuery?: string;
  showShortcuts?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function GlobalSearch({
  initialQuery = '',
  showShortcuts = true,
  autoFocus = false,
  className = ''
}: GlobalSearchProps) {
  const [query, setQuery] = useState<string>(initialQuery);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const router = useRouter();
  
  // Execute search (navigate to search page)
  const executeSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearching(false);
  };
  
  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.url) {
      router.push(suggestion.url);
    } else {
      setQuery(suggestion.text);
      executeSearch(suggestion.text);
    }
  };
  
  // Handle shortcut selection
  const handleShortcutSelect = (shortcut: { name: string; query: string }) => {
    setQuery(shortcut.query);
    executeSearch(shortcut.query);
  };
  
  // Context value
  const contextValue: SearchContextType = {
    query,
    setQuery,
    executeSearch,
    isSearching
  };
  
  return (
    <SearchContext.Provider value={contextValue}>
      <div className={className}>
        <SearchBar
          initialQuery={query}
          onSearch={executeSearch}
          onSuggestionSelect={handleSuggestionSelect}
          placeholder="Search for content, users, and more..."
          autoFocus={autoFocus}
          className="w-full"
        />
        
        {showShortcuts && (
          <div className="mt-2">
            <SearchShortcuts
              shortcuts={DEFAULT_SEARCH_SHORTCUTS}
              onSelect={handleShortcutSelect}
            />
          </div>
        )}
      </div>
    </SearchContext.Provider>
  );
}
