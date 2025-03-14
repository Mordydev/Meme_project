'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface NoResultsStateProps {
  query: string;
}

export function NoResultsState({ query }: NoResultsStateProps) {
  const router = useRouter();
  
  const suggestedSearches = [
    'success',
    'points',
    'rewards',
    'achievements',
    'community'
  ];
  
  const handleSuggestedSearch = (suggestedQuery: string) => {
    router.push(`/search?q=${encodeURIComponent(suggestedQuery)}`);
  };
  
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
        <SearchIcon className="h-8 w-8 text-neutral-400" />
      </div>
      
      <h2 className="text-xl font-semibold mb-2">No results found</h2>
      <p className="text-neutral-600 mb-6">
        We couldn't find any results for "{query}"
      </p>
      
      <div className="max-w-md mx-auto">
        <h3 className="text-sm font-medium text-neutral-500 mb-3">Suggestions:</h3>
        <ul className="text-sm text-neutral-600 space-y-2">
          <li>• Make sure all words are spelled correctly</li>
          <li>• Try different keywords</li>
          <li>• Try more general keywords</li>
          <li>• Try fewer keywords</li>
        </ul>
        
        <div className="mt-8">
          <h3 className="text-sm font-medium text-neutral-500 mb-3">Popular searches:</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedSearches.map(suggestion => (
              <button
                key={suggestion}
                className="px-3 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm transition-colors"
                onClick={() => handleSuggestedSearch(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
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
