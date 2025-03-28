'use client';

import React from 'react';

export interface RecentSearchesProps {
  searches: string[];
  onSelect: (search: string) => void;
  onRemove: (search: string) => void;
  onClear: () => void;
}

export function RecentSearches({
  searches,
  onSelect,
  onRemove,
  onClear
}: RecentSearchesProps) {
  if (searches.length === 0) {
    return (
      <div className="p-4 text-center text-neutral-500">
        No recent searches
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-xs font-medium text-neutral-500">
          Recent Searches
        </div>
        {searches.length > 0 && (
          <button
            className="text-xs text-primary hover:underline focus:outline-none focus:underline"
            onClick={onClear}
          >
            Clear All
          </button>
        )}
      </div>
      
      <ul>
        {searches.map((search, index) => (
          <li key={`${search}-${index}`} className="relative">
            <button
              className="flex w-full items-center px-3 py-2 text-left hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
              onClick={() => onSelect(search)}
            >
              <div className="mr-2 text-neutral-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>{search}</span>
            </button>
            
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(search);
              }}
              aria-label={`Remove ${search} from search history`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
