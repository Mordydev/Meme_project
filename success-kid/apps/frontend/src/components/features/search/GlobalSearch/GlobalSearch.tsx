'use client';

import React from 'react';
import { SearchBar } from './SearchBar';
import { SearchProvider, useSearch } from './SearchProvider';
import { SearchSuggestion } from '@/types';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  placeholder?: string;
  showRecentSearches?: boolean;
}

/**
 * Global search component with suggestions
 */
export function GlobalSearch({
  className,
  size = 'md',
  fullWidth = false,
  placeholder = 'Search for anything...',
  showRecentSearches = true,
}: GlobalSearchProps) {
  return (
    <SearchProvider>
      <GlobalSearchInner
        className={className}
        size={size}
        fullWidth={fullWidth}
        placeholder={placeholder}
        showRecentSearches={showRecentSearches}
      />
    </SearchProvider>
  );
}

/**
 * Inner component that uses the search context
 */
function GlobalSearchInner({
  className,
  size,
  fullWidth,
  placeholder,
  showRecentSearches,
}: GlobalSearchProps) {
  const { query, setQuery, executeSearch, searchHistory } = useSearch();
  
  const handleSearch = (searchQuery: string) => {
    executeSearch(searchQuery);
  };
  
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'query') {
      executeSearch(suggestion.text);
    }
  };
  
  return (
    <div className={cn("relative", className)}>
      <SearchBar
        placeholder={placeholder}
        initialQuery={query}
        onSearch={handleSearch}
        onSuggestionSelect={handleSuggestionSelect}
        showRecentSearches={showRecentSearches}
        fullWidth={fullWidth}
        size={size}
      />
    </div>
  );
}

/**
 * Search button that opens a full search modal
 */
export function SearchButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <>
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md h-10 w-10 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100",
          className
        )}
        onClick={() => setIsOpen(true)}
        aria-label="Search"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
      
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[10vh]"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-2xl mx-auto p-4"
            onClick={e => e.stopPropagation()}
          >
            <GlobalSearch 
              size="lg" 
              fullWidth 
              className="w-full"
              placeholder="Search the platform..."
            />
          </div>
        </div>
      )}
    </>
  );
}

// Icon component
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
