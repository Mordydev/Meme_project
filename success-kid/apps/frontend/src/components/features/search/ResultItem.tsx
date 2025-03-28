'use client';

import React from 'react';
import Link from 'next/link';
import { SearchResult } from '@/hooks/search';
import { timeAgo } from '@/lib/utils';

export interface ResultItemProps {
  result: SearchResult;
  highlightTerms?: string[];
  onClick?: () => void;
}

export function ResultItem({
  result,
  highlightTerms = [],
  onClick
}: ResultItemProps) {
  // Function to highlight search terms in text
  const highlightText = (text: string) => {
    if (!highlightTerms.length || !text) return text;
    
    let highlighted = text;
    const lowerText = text.toLowerCase();
    
    // Sort terms by length (longest first) to avoid highlighting inside already highlighted terms
    const sortedTerms = [...highlightTerms].sort((a, b) => b.length - a.length);
    
    // Build an array of segments (highlighted and non-highlighted)
    const segments: {text: string, highlight: boolean}[] = [{text, highlight: false}];
    
    for (const term of sortedTerms) {
      const newSegments: {text: string, highlight: boolean}[] = [];
      
      for (const segment of segments) {
        // Skip already highlighted segments
        if (segment.highlight) {
          newSegments.push(segment);
          continue;
        }
        
        const lowerSegment = segment.text.toLowerCase();
        let lastIndex = 0;
        let index = lowerSegment.indexOf(term);
        
        // Split the segment around each occurrence of the term
        while (index !== -1) {
          // Add the text before the term
          if (index > lastIndex) {
            newSegments.push({
              text: segment.text.substring(lastIndex, index),
              highlight: false
            });
          }
          
          // Add the term as highlighted
          newSegments.push({
            text: segment.text.substring(index, index + term.length),
            highlight: true
          });
          
          lastIndex = index + term.length;
          index = lowerSegment.indexOf(term, lastIndex);
        }
        
        // Add any remaining text
        if (lastIndex < segment.text.length) {
          newSegments.push({
            text: segment.text.substring(lastIndex),
            highlight: false
          });
        }
      }
      
      segments.length = 0;
      segments.push(...newSegments);
    }
    
    // Convert segments to JSX
    return (
      <>
        {segments.map((segment, i) => (
          segment.highlight ? (
            <mark key={i} className="bg-yellow-100 px-0.5">
              {segment.text}
            </mark>
          ) : segment.text
        ))}
      </>
    );
  };
  
  // Determine result icon based on type
  const getResultIcon = () => {
    switch (result.type) {
      case 'user':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'post':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'comment':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
      case 'achievement':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };
  
  // Format the result as a clickable item
  const ResultContent = () => (
    <div className="flex items-start">
      {/* Result icon */}
      <div className="mr-3 mt-1 text-neutral-500">
        {getResultIcon()}
      </div>
      
      {/* Result content */}
      <div className="flex-1">
        {/* Title with link */}
        <h3 className="font-medium">
          {highlightText(result.title || `${result.type.charAt(0).toUpperCase() + result.type.slice(1)}`)}
        </h3>
        
        {/* Author info if available */}
        {result.author && (
          <div className="mt-1 text-sm text-neutral-500">
            by {result.author.username} • {timeAgo(result.metadata.createdAt)}
          </div>
        )}
        
        {/* Snippet with highlighted terms */}
        <p className="mt-1 text-sm text-neutral-700">
          {highlightText(result.snippet)}
        </p>
        
        {/* Metadata */}
        <div className="mt-2 flex items-center space-x-2 text-xs text-neutral-500">
          <span className="rounded-full bg-neutral-100 px-2 py-1">
            {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
          </span>
          
          {result.metadata.matches && result.metadata.matches.length > 0 && (
            <span className="rounded-full bg-neutral-100 px-2 py-1">
              Matches: {result.metadata.matches.slice(0, 3).join(', ')}
              {result.metadata.matches.length > 3 && '...'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
  
  // Render as link or clickable div based on whether onClick is provided
  if (onClick) {
    return (
      <div
        className="cursor-pointer rounded-md border border-neutral-200 bg-background p-4 transition-colors hover:bg-neutral-50"
        onClick={onClick}
      >
        <ResultContent />
      </div>
    );
  }
  
  return (
    <Link
      href={result.url}
      className="block rounded-md border border-neutral-200 bg-background p-4 transition-colors hover:bg-neutral-50"
    >
      <ResultContent />
    </Link>
  );
}
