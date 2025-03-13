'use client';

import React, { useState } from 'react';
import { CategoryList } from './CategoryList';
import { useCategories } from '@/hooks/queries/useCommunity';

interface CategoryBrowserProps {
  selectedId?: string;
  onSelect: (id: string) => void;
}

/**
 * Category browsing component with search
 */
export function CategoryBrowser({ selectedId, onSelect }: CategoryBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: categories = [], isLoading, error } = useCategories();
  
  // Filter categories based on search query
  const filteredCategories = searchQuery
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    : categories;
  
  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-muted-foreground">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="search"
          className="pl-10 p-2 block w-full rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading categories...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="py-8 text-center">
          <div className="text-alert mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 mx-auto">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm">Failed to load categories. Please try again.</p>
          <button className="mt-2 text-sm text-primary font-medium hover:underline">
            Retry
          </button>
        </div>
      )}
      
      {/* Categories list */}
      {!isLoading && !error && filteredCategories.length > 0 && (
        <CategoryList 
          categories={filteredCategories}
          selectedId={selectedId}
          onCategorySelect={onSelect}
        />
      )}
      
      {/* Empty search results */}
      {!isLoading && !error && searchQuery && filteredCategories.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No categories found matching "{searchQuery}"
          </p>
          <button 
            className="mt-2 text-sm text-primary font-medium hover:underline"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}

export default CategoryBrowser;
