'use client';

import { useSearchParams } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { GlobalSearch, ResultsContainer, AdvancedSearchForm, SavedSearches } from '@/components/features/search';
import { SearchFilters, SearchSortOption } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const typesParam = searchParams.get('types');
  const sortParam = searchParams.get('sort') as SearchSortOption | null;
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  
  // Construct filters from URL params
  const initialFilters: SearchFilters = {};
  
  if (typesParam) {
    initialFilters.types = typesParam.split(',') as any[];
  }
  
  if (fromDate || toDate) {
    initialFilters.dateRange = {
      start: fromDate || undefined,
      end: toDate || undefined,
    };
  }
  
  // Additional filter params
  const exactMatch = searchParams.get('exactMatch');
  const includeComments = searchParams.get('includeComments');
  
  if (exactMatch) {
    initialFilters.exactMatch = exactMatch === 'true';
  }
  
  if (includeComments) {
    initialFilters.includeComments = includeComments === 'true';
  }
  
  // Handle additional custom parameters
  searchParams.forEach((value, key) => {
    if (
      !['q', 'types', 'sort', 'from', 'to', 'exactMatch', 'includeComments'].includes(key) &&
      value
    ) {
      initialFilters[key] = value;
    }
  });
  
  // Which tab to show (results, advanced, saved)
  const showTab = query ? 'results' : 'advanced';
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Search"
        description="Find content, users, and more across the platform"
      />
      
      <div className="max-w-4xl mx-auto">
        <GlobalSearch
          placeholder="Search for anything..."
          fullWidth
          size="lg"
          className="mb-8"
        />
        
        <Tabs defaultValue={showTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Search</TabsTrigger>
            <TabsTrigger value="saved">Saved Searches</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results">
            {query ? (
              <ResultsContainer
                query={query}
                initialFilters={initialFilters}
                initialSort={sortParam || 'relevance'}
              />
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
                  <SearchIcon className="h-8 w-8 text-neutral-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Search for something</h2>
                <p className="text-neutral-600 mb-6">
                  Enter a search term to find content across the platform
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="advanced">
            <AdvancedSearchForm
              initialParams={{
                query,
                filters: initialFilters,
                sort: sortParam || 'relevance',
              }}
            />
          </TabsContent>
          
          <TabsContent value="saved">
            <SavedSearches />
          </TabsContent>
        </Tabs>
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
