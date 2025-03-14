'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchFilters, SearchSortOption, SearchResultType } from '@/types';
import { FilterPanel } from './FilterPanel';
import { DateRangePicker } from './DateRangePicker';
import { cn } from '@/lib/utils';
import { useSavedSearches } from '@/hooks/queries/useSearch';

interface AdvancedSearchFormProps {
  initialParams?: {
    query: string;
    filters?: SearchFilters;
    sort?: SearchSortOption;
  };
  onSearch?: (params: {
    query: string;
    filters: SearchFilters;
    sort: SearchSortOption;
  }) => void;
  className?: string;
}

export function AdvancedSearchForm({
  initialParams,
  onSearch,
  className,
}: AdvancedSearchFormProps) {
  const router = useRouter();
  const { saveSearch } = useSavedSearches();
  
  // Form state
  const [query, setQuery] = useState(initialParams?.query || '');
  const [filters, setFilters] = useState<SearchFilters>(initialParams?.filters || {});
  const [sort, setSort] = useState<SearchSortOption>(initialParams?.sort || 'relevance');
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: Record<string, string> = {};
    if (!query.trim()) {
      errors.query = 'Please enter a search query';
    }
    
    // If there are errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear any previous errors
    setFormErrors({});
    
    // Format the search parameters
    const searchParams = {
      query: query.trim(),
      filters,
      sort,
    };
    
    // If callback is provided, use it
    if (onSearch) {
      onSearch(searchParams);
      return;
    }
    
    // Otherwise, navigate to search results page
    const urlParams = new URLSearchParams();
    urlParams.set('q', query);
    urlParams.set('sort', sort);
    
    // Add filter parameters
    if (filters.types?.length) {
      urlParams.set('types', filters.types.join(','));
    }
    
    if (filters.dateRange?.start) {
      urlParams.set('from', filters.dateRange.start);
    }
    
    if (filters.dateRange?.end) {
      urlParams.set('to', filters.dateRange.end);
    }
    
    if (filters.categories?.length) {
      urlParams.set('categories', filters.categories.join(','));
    }
    
    // Add any other custom filters
    Object.entries(filters).forEach(([key, value]) => {
      if (
        key !== 'types' &&
        key !== 'dateRange' &&
        key !== 'categories' &&
        value !== undefined
      ) {
        urlParams.set(key, String(value));
      }
    });
    
    router.push(`/search?${urlParams.toString()}`);
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters({
      ...filters,
      ...newFilters,
    });
  };
  
  // Handle date range changes
  const handleDateRangeChange = (dateRange: { start?: string; end?: string }) => {
    setFilters({
      ...filters,
      dateRange,
    });
  };
  
  // Handle saving search
  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      setFormErrors({
        ...formErrors,
        saveSearchName: 'Please enter a name for your saved search',
      });
      return;
    }
    
    try {
      await saveSearch.mutateAsync({
        name: saveSearchName,
        query,
        filters,
        sort,
      });
      
      // Clear the save dialog
      setSaveSearchName('');
      setShowSaveDialog(false);
      setFormErrors({});
    } catch (error) {
      console.error('Error saving search:', error);
      setFormErrors({
        ...formErrors,
        saveSearch: 'Failed to save search. Please try again.',
      });
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({});
  };
  
  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && (
      !Array.isArray(value) || value.length > 0
    )
  ).length;
  
  return (
    <div className={cn("space-y-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Query input */}
        <div>
          <label htmlFor="advanced-search-query" className="block text-sm font-medium text-neutral-700 mb-1">
            Search Query
          </label>
          <div className="relative">
            <input
              id="advanced-search-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter keywords to search for..."
              className={cn(
                "block w-full rounded-md border px-3 py-2 placeholder-neutral-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                formErrors.query ? "border-alert focus:border-alert focus:ring-alert/20" : "border-neutral-300"
              )}
            />
            <div className="absolute inset-y-0 left-0 flex pl-3 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-neutral-400 self-center" />
            </div>
          </div>
          {formErrors.query && (
            <p className="mt-1 text-sm text-alert">{formErrors.query}</p>
          )}
        </div>
        
        {/* Result types */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Result Types
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'post', label: 'Posts' },
              { value: 'user', label: 'Users' },
              { value: 'comment', label: 'Comments' },
              { value: 'achievement', label: 'Achievements' },
              { value: 'category', label: 'Categories' },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                className={cn(
                  "px-3 py-1 rounded-full text-sm",
                  filters.types?.includes(type.value as SearchResultType)
                    ? "bg-primary text-white"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                )}
                onClick={() => {
                  const currentTypes = filters.types || [];
                  const newTypes = currentTypes.includes(type.value as SearchResultType)
                    ? currentTypes.filter(t => t !== type.value)
                    : [...currentTypes, type.value as SearchResultType];
                  
                  handleFilterChange({
                    types: newTypes.length > 0 ? newTypes : undefined,
                  });
                }}
                aria-pressed={filters.types?.includes(type.value as SearchResultType)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Date range */}
        <DateRangePicker
          onChange={handleDateRangeChange}
          startDate={filters.dateRange?.start}
          endDate={filters.dateRange?.end}
        />
        
        {/* Additional filters */}
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
        />
        
        {/* Sort options */}
        <div>
          <label htmlFor="advanced-search-sort" className="block text-sm font-medium text-neutral-700 mb-1">
            Sort Results By
          </label>
          <select
            id="advanced-search-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SearchSortOption)}
            className="block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="relevance">Most Relevant</option>
            <option value="date">Newest First</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={resetFilters}
              className="text-neutral-600 hover:text-neutral-900 text-sm font-medium"
              disabled={activeFilterCount === 0}
            >
              Reset Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded-full text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowSaveDialog(true)}
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              Save Search
            </button>
          </div>
          
          <button
            type="submit"
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Search
          </button>
        </div>
      </form>
      
      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Save Search</h3>
            
            <div className="mb-4">
              <label htmlFor="save-search-name" className="block text-sm font-medium text-neutral-700 mb-1">
                Search Name
              </label>
              <input
                id="save-search-name"
                type="text"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="Enter a name for this search"
                className={cn(
                  "block w-full rounded-md border px-3 py-2 placeholder-neutral-400 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
                  formErrors.saveSearchName ? "border-alert focus:border-alert focus:ring-alert/20" : "border-neutral-300"
                )}
              />
              {formErrors.saveSearchName && (
                <p className="mt-1 text-sm text-alert">{formErrors.saveSearchName}</p>
              )}
            </div>
            
            {formErrors.saveSearch && (
              <p className="mb-4 text-sm text-alert">{formErrors.saveSearch}</p>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveSearchName('');
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSearch}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium"
                disabled={saveSearch.isPending}
              >
                {saveSearch.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
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
