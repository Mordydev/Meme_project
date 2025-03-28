'use client';

import React from 'react';
import { SearchSuggestion, TopResult } from '@/hooks/search';

export interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  topResults?: TopResult[];
  isLoading: boolean;
  onSelect: (suggestion: SearchSuggestion) => void;
  searchQuery: string;
}

export function SearchSuggestions({
  suggestions,
  topResults = [],
  isLoading,
  onSelect,
  searchQuery
}: SearchSuggestionsProps) {
  if (isLoading) {
    return (
      <div className="p-2">
        <div className="flex animate-pulse flex-col space-y-2 p-2">
          <div className="h-4 w-3/4 rounded bg-neutral-200"></div>
          <div className="h-4 w-1/2 rounded bg-neutral-200"></div>
          <div className="h-4 w-2/3 rounded bg-neutral-200"></div>
        </div>
      </div>
    );
  }
  
  if (suggestions.length === 0 && topResults.length === 0) {
    return (
      <div className="p-4 text-center text-neutral-500">
        No suggestions found for &quot;{searchQuery}&quot;
      </div>
    );
  }
  
  return (
    <div className="max-h-80 overflow-y-auto">
      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <div>
          <div className="px-3 py-2 text-xs font-medium text-neutral-500">
            Suggestions
          </div>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.text}-${index}`}>
                <button
                  className="flex w-full items-center px-3 py-2 text-left hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
                  onClick={() => onSelect(suggestion)}
                >
                  <div className="mr-2 text-neutral-500">
                    {suggestion.type === 'query' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                    {suggestion.type === 'user' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {suggestion.type === 'content' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    )}
                  </div>
                  
                  <span>
                    {suggestion.highlight ? (
                      <>
                        {suggestion.text.substring(0, suggestion.highlight[0])}
                        <strong className="font-medium text-primary">
                          {suggestion.text.substring(suggestion.highlight[0], suggestion.highlight[1])}
                        </strong>
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
      
      {/* Top Results Section */}
      {topResults.length > 0 && (
        <div>
          <div className="px-3 py-2 text-xs font-medium text-neutral-500">
            Top Results
          </div>
          <ul>
            {topResults.map((result) => (
              <li key={result.id}>
                <button
                  className="flex w-full items-center px-3 py-2 text-left hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
                  onClick={() => onSelect({ text: result.title, type: 'content', url: result.url })}
                >
                  <div className="mr-2 text-neutral-500">
                    {result.type === 'user' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {result.type === 'post' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    )}
                    {result.type === 'achievement' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {result.type === 'comment' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    )}
                  </div>
                  <span>{result.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
