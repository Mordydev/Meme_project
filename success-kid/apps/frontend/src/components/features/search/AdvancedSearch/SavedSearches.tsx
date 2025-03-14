'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSavedSearches } from '@/hooks/queries/useSearch';
import { SavedSearch, SearchFilters, SearchSortOption } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SavedSearchesProps {
  onSelect?: (search: SavedSearch) => void;
  className?: string;
}

export function SavedSearches({
  onSelect,
  className,
}: SavedSearchesProps) {
  const router = useRouter();
  const { data: savedSearches, isLoading, deleteSearch } = useSavedSearches();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Handle selecting a saved search
  const handleSelectSearch = (search: SavedSearch) => {
    if (onSelect) {
      onSelect(search);
      return;
    }
    
    // Navigate to search results page with the saved search parameters
    const urlParams = new URLSearchParams();
    urlParams.set('q', search.query);
    urlParams.set('sort', search.sort);
    
    // Add filter parameters
    if (search.filters.types?.length) {
      urlParams.set('types', search.filters.types.join(','));
    }
    
    if (search.filters.dateRange?.start) {
      urlParams.set('from', search.filters.dateRange.start);
    }
    
    if (search.filters.dateRange?.end) {
      urlParams.set('to', search.filters.dateRange.end);
    }
    
    // Add any other custom filters
    Object.entries(search.filters).forEach(([key, value]) => {
      if (
        key !== 'types' &&
        key !== 'dateRange' &&
        value !== undefined
      ) {
        urlParams.set(key, String(value));
      }
    });
    
    router.push(`/search?${urlParams.toString()}`);
  };
  
  // Handle deleting a saved search
  const handleDeleteSearch = async (id: string) => {
    try {
      await deleteSearch.mutateAsync(id);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  };
  
  // Format the search filters for display
  const formatFilters = (filters: SearchFilters): string => {
    const parts = [];
    
    if (filters.types?.length) {
      parts.push(`Types: ${filters.types.join(', ')}`);
    }
    
    if (filters.dateRange?.start || filters.dateRange?.end) {
      const dateRange = [
        filters.dateRange.start || 'any',
        filters.dateRange.end || 'any',
      ].join(' to ');
      parts.push(`Date: ${dateRange}`);
    }
    
    // Add additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (
        key !== 'types' &&
        key !== 'dateRange' &&
        value !== undefined
      ) {
        parts.push(`${key}: ${value}`);
      }
    });
    
    return parts.join(' • ');
  };
  
  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-sm text-neutral-500 mt-1">Loading saved searches...</p>
      </div>
    );
  }
  
  if (!savedSearches || savedSearches.length === 0) {
    return (
      <div className={cn("text-center py-10", className)}>
        <div className="rounded-full bg-neutral-100 w-12 h-12 flex items-center justify-center mx-auto mb-3">
          <SearchIcon className="h-6 w-6 text-neutral-400" />
        </div>
        <h3 className="text-base font-medium mb-1">No saved searches</h3>
        <p className="text-sm text-neutral-500">
          Save your searches to quickly access them later
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-medium">Saved Searches</h3>
      
      <div className="divide-y divide-neutral-200">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="py-4 group cursor-pointer hover:bg-neutral-50 -mx-4 px-4 rounded-lg transition-colors"
          >
            <div className="flex justify-between items-start">
              <div
                className="flex-1 min-w-0"
                onClick={() => handleSelectSearch(search)}
              >
                <h4 className="font-medium truncate group-hover:text-primary">
                  {search.name}
                </h4>
                
                <p className="text-sm text-neutral-700 mt-1">
                  <span className="font-medium">{search.query}</span>
                  {' '}
                  <span className="text-neutral-500">
                    {formatFilters(search.filters)}
                  </span>
                </p>
                
                <p className="text-xs text-neutral-500 mt-2">
                  Saved {formatDistanceToNow(new Date(search.createdAt), { addSuffix: true })}
                  {' • '}
                  Sort: {
                    search.sort === 'relevance' ? 'Most Relevant' : 
                    search.sort === 'date' ? 'Newest First' : 
                    'Most Popular'
                  }
                </p>
              </div>
              
              <div className="flex items-center ml-4">
                {confirmDelete === search.id ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSearch(search.id)}
                      className="text-alert hover:text-alert-dark"
                      disabled={deleteSearch.isPending}
                    >
                      {deleteSearch.isPending ? (
                        <div className="animate-spin h-4 w-4 border-2 border-alert border-t-transparent rounded-full"></div>
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(search.id)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-alert"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
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

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
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
