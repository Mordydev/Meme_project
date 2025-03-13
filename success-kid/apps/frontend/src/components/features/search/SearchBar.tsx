'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchSuggestions } from './SearchSuggestions';
import { RecentSearches } from './RecentSearches';
import { 
  useSearchSuggestions, 
  SearchSuggestion,
  useSearchHistory 
} from '@/hooks/search';

export interface SearchBarProps {
  placeholder?: string;
  initialQuery?: string;
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  showRecentSearches?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  placeholder = 'Search...',
  initialQuery = '',
  onSearch,
  onSuggestionSelect,
  showRecentSearches = true,
  autoFocus = false,
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState<string>(initialQuery);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Get search suggestions based on query
  const { 
    suggestions, 
    topResults, 
    isLoading: suggestionsLoading 
  } = useSearchSuggestions(query);
  
  // Manage search history
  const { 
    searchHistory, 
    addToHistory, 
    removeFromHistory, 
    clearHistory 
  } = useSearchHistory();
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus input if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // Add to search history
    addToHistory(query.trim());
    
    // Call onSearch prop if provided
    if (onSearch) {
      onSearch(query.trim());
    } else {
      // Default behavior: Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    
    // Blur input and close suggestions
    inputRef.current?.blur();
    setIsFocused(false);
  };
  
  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    addToHistory(suggestion.text);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else if (suggestion.url) {
      // Navigate to the URL if provided
      router.push(suggestion.url);
    } else {
      // Otherwise, use the suggestion text as a search query
      setQuery(suggestion.text);
      router.push(`/search?q=${encodeURIComponent(suggestion.text)}`);
    }
    
    // Blur input and close suggestions
    inputRef.current?.blur();
    setIsFocused(false);
  };
  
  return (
    <div ref={searchContainerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex items-center">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="pr-10"
          aria-label="Search"
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="absolute right-1 h-8 w-8 p-0"
          aria-label="Submit search"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </Button>
      </form>
      
      {/* Show suggestions and/or recent searches when input is focused */}
      {isFocused && (
        <div className="absolute left-0 right-0 z-10 mt-1 rounded-md border border-neutral-200 bg-background shadow-lg">
          {/* Show suggestions if there's a query */}
          {query.trim() && (
            <SearchSuggestions
              suggestions={suggestions}
              topResults={topResults}
              isLoading={suggestionsLoading}
              onSelect={handleSuggestionSelect}
              searchQuery={query}
            />
          )}
          
          {/* Show recent searches if enabled and no query, or no suggestions */}
          {showRecentSearches && (!query.trim() || (query.trim() && !suggestions.length && !suggestionsLoading)) && (
            <RecentSearches
              searches={searchHistory}
              onSelect={(search) => {
                setQuery(search);
                handleSuggestionSelect({ text: search, type: 'query' });
              }}
              onRemove={removeFromHistory}
              onClear={clearHistory}
            />
          )}
        </div>
      )}
    </div>
  );
}
