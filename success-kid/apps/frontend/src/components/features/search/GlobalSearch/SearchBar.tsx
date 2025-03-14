'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchSuggestion } from '@/types';
import { useSearchSuggestions } from '@/hooks/queries/useSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/hooks/useClickOutside';

interface SearchBarProps {
  placeholder?: string;
  initialQuery?: string;
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  showRecentSearches?: boolean;
  fullWidth?: boolean;
  className?: string;
  suggestionsClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SearchBar({
  placeholder = 'Search...',
  initialQuery = '',
  onSearch,
  onSuggestionSelect,
  showRecentSearches = true,
  fullWidth = false,
  className,
  suggestionsClassName,
  size = 'md',
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  
  // Get recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  useEffect(() => {
    // Load recent searches from localStorage
    if (typeof window !== 'undefined' && showRecentSearches) {
      try {
        const storedSearches = localStorage.getItem('recentSearches');
        if (storedSearches) {
          setRecentSearches(JSON.parse(storedSearches));
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, [showRecentSearches]);
  
  // Fetch search suggestions
  const { data: suggestionsData, isLoading } = useSearchSuggestions(query, { limit: 5 });
  const suggestions = suggestionsData?.suggestions || [];
  const topResults = suggestionsData?.topResults || [];
  
  // Add to recent searches
  const addToRecentSearches = (query: string) => {
    if (!showRecentSearches || !query.trim()) return;
    
    const trimmedQuery = query.trim();
    const newRecentSearches = [
      trimmedQuery,
      ...recentSearches.filter(s => s !== trimmedQuery),
    ].slice(0, 5); // Limit to 5 recent searches
    
    setRecentSearches(newRecentSearches);
    
    try {
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  };
  
  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recentSearches');
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };
  
  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    addToRecentSearches(query);
    onSearch(query);
    setIsFocused(false);
  };
  
  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'query') {
      setQuery(suggestion.text);
      addToRecentSearches(suggestion.text);
      onSearch(suggestion.text);
    } else if (suggestion.url) {
      addToRecentSearches(suggestion.text);
      router.push(suggestion.url);
    }
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    
    setIsFocused(false);
  };
  
  // Handle click outside to close suggestions
  useClickOutside(suggestionRef, () => {
    setIsFocused(false);
  }, [inputRef]);
  
  // Handle keyboard navigation of suggestions
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        Math.min(prev + 1, suggestions.length + topResults.length + recentSearches.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      
      // Determine which list and index the active suggestion is in
      let allItems = [...suggestions];
      if (topResults.length > 0) {
        allItems = [...allItems, ...topResults.map(item => ({
          text: item.title,
          type: item.type as any,
          url: item.url,
          id: item.id
        }))];
      }
      if (recentSearches.length > 0) {
        allItems = [...allItems, ...recentSearches.map(query => ({
          text: query,
          type: 'query' as const
        }))];
      }
      
      if (allItems[activeSuggestionIndex]) {
        handleSuggestionSelect(allItems[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };
  
  // Determine if we should show the suggestions panel
  const showSuggestions = isFocused && (
    isLoading || 
    suggestions.length > 0 || 
    topResults.length > 0 || 
    (showRecentSearches && recentSearches.length > 0)
  );
  
  // Size classes
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10',
    lg: 'h-12 text-lg'
  };
  
  return (
    <div 
      className={cn(
        "relative",
        fullWidth ? "w-full" : "w-64 md:w-80",
        className
      )}
      ref={suggestionRef}
    >
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors",
            sizeClasses[size]
          )}
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <SearchIcon className="h-5 w-5 text-neutral-400" />
        </div>
        {query && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <XIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
          </button>
        )}
      </form>
      
      {/* Suggestions Panel */}
      {showSuggestions && (
        <div 
          id="search-suggestions"
          className={cn(
            "absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden",
            suggestionsClassName
          )}
          role="listbox"
        >
          {/* Loading State */}
          {isLoading && query.length >= 2 && (
            <div className="p-4 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-neutral-500 mt-1">Searching...</p>
            </div>
          )}
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="py-2">
              <h3 className="px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Suggestions</h3>
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li key={`suggestion-${index}`}>
                    <button
                      className={cn(
                        "w-full text-left px-4 py-2 hover:bg-neutral-100 flex items-center",
                        activeSuggestionIndex === index ? "bg-neutral-100" : ""
                      )}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      role="option"
                      aria-selected={activeSuggestionIndex === index}
                    >
                      <SearchIcon className="h-4 w-4 text-neutral-400 mr-2 flex-shrink-0" />
                      <span>
                        {suggestion.highlight ? (
                          <>
                            {suggestion.text.substring(0, suggestion.highlight[0])}
                            <span className="font-semibold">
                              {suggestion.text.substring(suggestion.highlight[0], suggestion.highlight[1])}
                            </span>
                            {suggestion.text.substring(suggestion.highlight[1])}
                          </>
                        ) : (
                          suggestion.text
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Top Results */}
          {topResults.length > 0 && (
            <div className="py-2 border-t border-neutral-100">
              <h3 className="px-4 text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Top Results</h3>
              <ul>
                {topResults.map((result, index) => (
                  <li key={`result-${result.id}`}>
                    <button
                      className={cn(
                        "w-full text-left px-4 py-2 hover:bg-neutral-100 flex items-center",
                        activeSuggestionIndex === suggestions.length + index ? "bg-neutral-100" : ""
                      )}
                      onClick={() => router.push(result.url)}
                      role="option"
                      aria-selected={activeSuggestionIndex === suggestions.length + index}
                    >
                      {result.type === 'user' ? (
                        <UserIcon className="h-4 w-4 text-neutral-400 mr-2 flex-shrink-0" />
                      ) : (
                        <DocumentIcon className="h-4 w-4 text-neutral-400 mr-2 flex-shrink-0" />
                      )}
                      <span className="truncate">{result.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recent Searches */}
          {showRecentSearches && recentSearches.length > 0 && !query && (
            <div className="py-2 border-t border-neutral-100">
              <div className="flex items-center justify-between px-4 mb-1">
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Recent Searches</h3>
                <button
                  className="text-xs text-primary hover:text-primary-dark"
                  onClick={clearRecentSearches}
                >
                  Clear
                </button>
              </div>
              <ul>
                {recentSearches.map((recentQuery, index) => (
                  <li key={`recent-${index}`}>
                    <button
                      className={cn(
                        "w-full text-left px-4 py-2 hover:bg-neutral-100 flex items-center",
                        activeSuggestionIndex === suggestions.length + topResults.length + index ? "bg-neutral-100" : ""
                      )}
                      onClick={() => {
                        setQuery(recentQuery);
                        onSearch(recentQuery);
                      }}
                      role="option"
                      aria-selected={activeSuggestionIndex === suggestions.length + topResults.length + index}
                    >
                      <ClockIcon className="h-4 w-4 text-neutral-400 mr-2 flex-shrink-0" />
                      <span className="truncate">{recentQuery}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Empty State */}
          {!isLoading && suggestions.length === 0 && topResults.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center">
              <p className="text-sm text-neutral-500">No results found for "{query}"</p>
              <p className="text-xs text-neutral-400 mt-1">Try different keywords or check spelling</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Icon components
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DocumentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
