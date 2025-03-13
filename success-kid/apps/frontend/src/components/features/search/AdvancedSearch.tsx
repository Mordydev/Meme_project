'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FilterPanel } from './FilterPanel';
import { useSearchFilters, SearchFilters } from '@/hooks/search';

export interface AdvancedSearchProps {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  className?: string;
}

export function AdvancedSearch({
  initialQuery = '',
  initialFilters = {},
  className = ''
}: AdvancedSearchProps) {
  const [query, setQuery] = useState<string>(initialQuery);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const router = useRouter();
  
  // Get filter definitions and manage active filters
  const {
    filterDefinitions,
    activeFilters,
    isLoading: filtersLoading,
    updateFilter,
    removeFilter,
    resetFilters
  } = useSearchFilters();
  
  // Initialize active filters with any provided initial filters
  React.useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      Object.entries(initialFilters).forEach(([key, value]) => {
        updateFilter(key, value);
      });
    }
  }, [initialFilters]);
  
  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // Build query parameters
    const params = new URLSearchParams({
      q: query.trim(),
      sort: sortBy
    });
    
    // Add filters to query parameters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          params.append(`filter[${key}][]`, v);
        });
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue !== undefined) {
            params.append(`filter[${key}][${subKey}]`, String(subValue));
          }
        });
      } else {
        params.append(`filter[${key}]`, String(value));
      }
    });
    
    // Navigate to search results page
    router.push(`/search?${params.toString()}`);
  };
  
  return (
    <div className={className}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Advanced Search</h1>
        <p className="mt-2 text-neutral-500">
          Refine your search with advanced filters and options
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left column: Search form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search query */}
            <div className="space-y-2">
              <label
                htmlFor="search-query"
                className="block text-sm font-medium"
              >
                Search Query
              </label>
              <Input
                id="search-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter keywords, phrases, or specific terms"
                className="w-full"
              />
              <p className="text-xs text-neutral-500">
                Use quotes for exact phrases, e.g., &quot;success kid&quot;
              </p>
            </div>
            
            {/* Sort options */}
            <div className="space-y-2">
              <label
                htmlFor="sort-by"
                className="block text-sm font-medium"
              >
                Sort Results By
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-md border border-neutral-200 p-2"
              >
                <option value="relevance">Relevance</option>
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
            
            {/* Content type filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Content Type
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {['post', 'user', 'comment', 'achievement'].map((type) => {
                  const isSelected = Array.isArray(activeFilters.types)
                    ? activeFilters.types.includes(type)
                    : false;
                  
                  return (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`type-${type}`}
                        checked={isSelected}
                        onChange={() => {
                          const currentTypes = Array.isArray(activeFilters.types)
                            ? [...activeFilters.types]
                            : [];
                          
                          const newTypes = isSelected
                            ? currentTypes.filter((t) => t !== type)
                            : [...currentTypes, type];
                          
                          updateFilter('types', newTypes);
                        }}
                        className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="ml-2 text-sm capitalize"
                      >
                        {type}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Submit button */}
            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full">
                Search
              </Button>
            </div>
          </form>
        </div>
        
        {/* Right column: Filters */}
        <div>
          <FilterPanel
            filterDefinitions={filterDefinitions}
            activeFilters={activeFilters}
            onFilterChange={(filters) => {
              // Update all filters at once
              Object.entries(filters).forEach(([key, value]) => {
                updateFilter(key, value);
              });
              
              // Remove any filters that are not in the new set
              Object.keys(activeFilters).forEach((key) => {
                if (!(key in filters)) {
                  removeFilter(key);
                }
              });
            }}
            loading={filtersLoading}
          />
        </div>
      </div>
    </div>
  );
}
