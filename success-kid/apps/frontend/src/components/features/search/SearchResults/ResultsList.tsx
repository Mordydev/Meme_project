'use client';

import React from 'react';
import { SearchResult } from '@/types';
import { ResultItem } from './ResultItem';
import { formatDistanceToNow } from 'date-fns';
import { useSearchAnalytics } from '@/hooks/queries/useSearch';

interface ResultsListProps {
  results: SearchResult[];
  query: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ResultsList({
  results,
  query,
  page,
  totalPages,
  onPageChange,
}: ResultsListProps) {
  const { trackResultClick } = useSearchAnalytics();
  
  // Extract terms to highlight from query
  const highlightTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2);
  
  const handleResultClick = (result: SearchResult, index: number) => {
    trackResultClick(query, result.id, index);
  };
  
  return (
    <div className="space-y-8">
      {/* Results */}
      <div className="divide-y divide-neutral-200">
        {results.map((result, index) => (
          <div key={`${result.type}-${result.id}`} className="py-4">
            <ResultItem
              result={result}
              highlightTerms={highlightTerms}
              onClick={() => handleResultClick(result, index)}
            />
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex items-center gap-1" aria-label="Pagination">
            {/* Previous page button */}
            <button
              className="px-3 py-1 rounded-md border border-neutral-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic to show pages around current page
              let pageNumber: number;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (page <= 3) {
                pageNumber = i + 1;
              } else if (page >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNumber}
                  className={`w-8 h-8 rounded-md text-sm flex items-center justify-center ${
                    pageNumber === page
                      ? 'bg-primary text-white'
                      : 'border border-neutral-200 hover:bg-neutral-50'
                  }`}
                  onClick={() => onPageChange(pageNumber)}
                  aria-current={pageNumber === page ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            {/* Next page button */}
            <button
              className="px-3 py-1 rounded-md border border-neutral-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

// Icon components
function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
