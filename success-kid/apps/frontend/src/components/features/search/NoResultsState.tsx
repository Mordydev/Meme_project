'use client';

import React from 'react';
import { DEFAULT_SEARCH_SHORTCUTS } from './SearchShortcuts';
import { useRouter } from 'next/navigation';

export interface NoResultsStateProps {
  query: string;
}

export function NoResultsState({ query }: NoResultsStateProps) {
  const router = useRouter();
  
  // Suggested searches based on the query
  const getSuggestedSearches = (query: string) => {
    // This is a simple implementation that could be enhanced with more sophisticated suggestions
    const trimmedQuery = query.trim().toLowerCase();
    
    // If query is very short, return default shortcuts
    if (trimmedQuery.length < 3) {
      return DEFAULT_SEARCH_SHORTCUTS.map(shortcut => ({
        text: shortcut.query,
        description: `Search for ${shortcut.name.toLowerCase()}`
      }));
    }
    
    // Generate some variations of the search
    return [
      { text: `"${trimmedQuery}"`, description: 'Try an exact phrase match' },
      { text: `${trimmedQuery} guide`, description: 'Look for guides' },
      { text: `${trimmedQuery} tips`, description: 'Find tips and advice' },
      ...DEFAULT_SEARCH_SHORTCUTS.slice(0, 2).map(shortcut => ({
        text: `${trimmedQuery} ${shortcut.name.toLowerCase()}`,
        description: `Find ${shortcut.name.toLowerCase()} related to your search`
      }))
    ];
  };
  
  const suggestedSearches = getSuggestedSearches(query);
  
  return (
    <div className="rounded-lg border border-neutral-200 bg-background p-6 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto h-12 w-12 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      
      <h3 className="mt-4 text-lg font-medium">No results found for &quot;{query}&quot;</h3>
      <p className="mt-2 text-neutral-500">
        Try adjusting your search or browse through these suggestions
      </p>
      
      {/* Search tips */}
      <div className="mt-6 rounded-md bg-neutral-50 p-4 text-left">
        <h4 className="font-medium">Search Tips</h4>
        <ul className="mt-2 space-y-2 text-sm text-neutral-700">
          <li>• Check for typos or try alternative spellings</li>
          <li>• Use more general terms</li>
          <li>• Try using fewer keywords</li>
          <li>• Explore categories using search filters</li>
        </ul>
      </div>
      
      {/* Suggested searches */}
      <div className="mt-6 text-left">
        <h4 className="font-medium">Try These Searches</h4>
        <ul className="mt-2 space-y-2">
          {suggestedSearches.map((suggestion, index) => (
            <li key={index}>
              <button
                className="inline-flex items-center text-sm text-primary hover:underline"
                onClick={() => router.push(`/search?q=${encodeURIComponent(suggestion.text)}`)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-4 w-4"
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
                {suggestion.text}
                {suggestion.description && (
                  <span className="ml-2 text-neutral-500">
                    — {suggestion.description}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
