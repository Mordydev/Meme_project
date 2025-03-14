'use client';

import React, { useState } from 'react';
import { SearchFilters, SearchSortOption, SearchResultType } from '@/types';
import { cn } from '@/lib/utils';

interface ResultsHeaderProps {
  query: string;
  totalResults: number;
  onFilterChange: (filters: SearchFilters) => void;
  onSortChange: (sort: SearchSortOption) => void;
  activeFilters: SearchFilters;
  activeSort: SearchSortOption;
  isLoading: boolean;
  correctedQuery?: string;
}

export function ResultsHeader({
  query,
  totalResults,
  onFilterChange,
  onSortChange,
  activeFilters,
  activeSort,
  isLoading,
  correctedQuery,
}: ResultsHeaderProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Available result types
  const resultTypes: { value: SearchResultType; label: string }[] = [
    { value: 'post', label: 'Posts' },
    { value: 'user', label: 'Users' },
    { value: 'comment', label: 'Comments' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'category', label: 'Categories' },
  ];
  
  // Available sort options
  const sortOptions: { value: SearchSortOption; label: string }[] = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'date', label: 'Newest First' },
    { value: 'popularity', label: 'Most Popular' },
  ];
  
  // Handle type filter change
  const handleTypeChange = (type: SearchResultType) => {
    const currentTypes = activeFilters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    onFilterChange({
      ...activeFilters,
      types: newTypes.length > 0 ? newTypes : undefined,
    });
  };
  
  // Clear all filters
  const clearFilters = () => {
    onFilterChange({});
  };
  
  // Count active filters
  const activeFilterCount = Object.values(activeFilters).filter(value => value !== undefined).length;
  
  return (
    <div className="space-y-4">
      {/* Search metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          {!isLoading && (
            <h2 className="text-lg font-medium">
              {totalResults.toLocaleString()} results for "{query}"
            </h2>
          )}
          
          {/* Corrected query suggestion */}
          {correctedQuery && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing results for "{correctedQuery}". 
              <button 
                className="text-primary ml-1 hover:underline"
                onClick={() => onFilterChange({ ...activeFilters, exactMatch: true })}
              >
                Search for exact "{query}" instead
              </button>
            </p>
          )}
        </div>
        
        {/* Sort and filter controls for mobile */}
        <div className="flex gap-2 sm:hidden">
          <button
            className={cn(
              "px-3 py-1.5 rounded-md border text-sm flex items-center gap-1",
              filtersOpen ? "bg-primary/10 border-primary/30" : "bg-white border-neutral-200"
            )}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <FilterIcon className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          <select
            className="px-3 py-1.5 rounded-md border border-neutral-200 text-sm appearance-none bg-white pr-8"
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value as SearchSortOption)}
            style={{ backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Desktop filters and sorting */}
      <div className="hidden sm:flex sm:flex-wrap gap-4 items-center">
        <div className="flex flex-wrap gap-2 mr-4">
          {resultTypes.map(type => (
            <button
              key={type.value}
              className={cn(
                "px-3 py-1 rounded-full text-sm",
                activeFilters.types?.includes(type.value)
                  ? "bg-primary text-white"
                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              )}
              onClick={() => handleTypeChange(type.value)}
              aria-pressed={activeFilters.types?.includes(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-neutral-500">Sort by:</span>
          <select
            className="px-3 py-1.5 rounded-md border border-neutral-200 text-sm appearance-none bg-white pr-8"
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value as SearchSortOption)}
            style={{ backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Mobile filters panel */}
      {filtersOpen && (
        <div className="sm:hidden border rounded-md p-4 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Filters</h3>
            {activeFilterCount > 0 && (
              <button 
                className="text-sm text-primary hover:underline"
                onClick={clearFilters}
              >
                Clear all filters
              </button>
            )}
          </div>
          
          <h4 className="text-sm font-medium mb-2">Result type</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {resultTypes.map(type => (
              <button
                key={type.value}
                className={cn(
                  "px-3 py-1 rounded-full text-sm",
                  activeFilters.types?.includes(type.value)
                    ? "bg-primary text-white"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                )}
                onClick={() => handleTypeChange(type.value)}
                aria-pressed={activeFilters.types?.includes(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>
          
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-primary text-white rounded-md text-sm"
              onClick={() => setFiltersOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon component
function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  );
}
