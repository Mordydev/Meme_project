'use client';

import React from 'react';
import Link from 'next/link';
import { SearchResult } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ResultItemProps {
  result: SearchResult;
  highlightTerms?: string[];
  onClick?: () => void;
}

/**
 * Polymorphic search result item that renders different layouts based on result type
 */
export function ResultItem({
  result,
  highlightTerms = [],
  onClick,
}: ResultItemProps) {
  const { 
    type, 
    title, 
    snippet, 
    url, 
    author, 
    highlightRanges, 
    metadata 
  } = result;
  
  // Format the date
  const timeAgo = metadata.createdAt 
    ? formatDistanceToNow(new Date(metadata.createdAt), { addSuffix: true })
    : '';
  
  // Highlight the snippet based on highlight ranges
  const highlightedSnippet = getHighlightedText(snippet, highlightRanges);
  
  // Render different layouts based on result type
  let resultContent;
  
  switch (type) {
    case 'user':
      resultContent = (
        <div className="flex items-center">
          {/* User avatar */}
          <div className="flex-shrink-0 mr-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
              {author?.avatarUrl ? (
                <img 
                  src={author.avatarUrl} 
                  alt={author.username} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </div>
          </div>
          
          {/* User info */}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-medium text-neutral-900 truncate">
              {title || author?.username}
            </h3>
            {highlightedSnippet && (
              <p className="mt-1 text-sm text-neutral-600">
                {highlightedSnippet}
              </p>
            )}
          </div>
        </div>
      );
      break;
    
    case 'post':
      resultContent = (
        <div>
          {/* Post title */}
          <h3 className="text-lg font-medium text-neutral-900">
            {title}
          </h3>
          
          {/* Author & metadata */}
          <div className="mt-1 flex items-center text-sm text-neutral-500">
            {author && (
              <>
                <span>By {author.username}</span>
                <span className="mx-2">&middot;</span>
              </>
            )}
            <span>{timeAgo}</span>
          </div>
          
          {/* Snippet */}
          {highlightedSnippet && (
            <p className="mt-2 text-neutral-600">
              {highlightedSnippet}
            </p>
          )}
          
          {/* Matched terms */}
          {metadata.matches && metadata.matches.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {metadata.matches.map(match => (
                <span 
                  key={match} 
                  className="inline-flex text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full"
                >
                  {match}
                </span>
              ))}
            </div>
          )}
        </div>
      );
      break;
    
    case 'comment':
      resultContent = (
        <div>
          <div className="flex items-center text-sm text-neutral-500 mb-2">
            <span>Comment by {author?.username || 'Anonymous'}</span>
            <span className="mx-2">&middot;</span>
            <span>{timeAgo}</span>
          </div>
          
          {/* Snippet */}
          {highlightedSnippet && (
            <p className="text-neutral-600">
              {highlightedSnippet}
            </p>
          )}
          
          {/* Parent post reference */}
          {title && (
            <p className="mt-2 text-sm text-neutral-500">
              On post: <span className="font-medium">{title}</span>
            </p>
          )}
        </div>
      );
      break;
    
    case 'achievement':
      resultContent = (
        <div className="flex items-start">
          {/* Achievement icon */}
          <div className="flex-shrink-0 mr-4">
            <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
              <TrophyIcon className="h-5 w-5" />
            </div>
          </div>
          
          {/* Achievement info */}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-medium text-neutral-900">
              {title}
            </h3>
            {highlightedSnippet && (
              <p className="mt-1 text-neutral-600">
                {highlightedSnippet}
              </p>
            )}
          </div>
        </div>
      );
      break;
    
    case 'category':
      resultContent = (
        <div className="flex items-start">
          {/* Category icon */}
          <div className="flex-shrink-0 mr-4">
            <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">
              <FolderIcon className="h-5 w-5" />
            </div>
          </div>
          
          {/* Category info */}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-medium text-neutral-900">
              {title}
            </h3>
            {highlightedSnippet && (
              <p className="mt-1 text-neutral-600">
                {highlightedSnippet}
              </p>
            )}
          </div>
        </div>
      );
      break;
    
    default:
      resultContent = (
        <div>
          <h3 className="text-lg font-medium text-neutral-900">
            {title}
          </h3>
          {highlightedSnippet && (
            <p className="mt-1 text-neutral-600">
              {highlightedSnippet}
            </p>
          )}
        </div>
      );
  }
  
  return (
    <Link 
      href={url} 
      className="block hover:bg-neutral-50 -mx-4 px-4 py-2 rounded-lg transition-colors"
      onClick={onClick}
    >
      {resultContent}
    </Link>
  );
}

// Helper function to highlight text based on highlight ranges
function getHighlightedText(text: string, ranges: Array<{start: number, end: number}>) {
  if (!ranges.length) return text;
  
  // Sort ranges by start position
  const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);
  
  // Check for overlapping ranges and merge them
  const mergedRanges = sortedRanges.reduce<Array<{start: number, end: number}>>((acc, range) => {
    if (acc.length === 0) return [range];
    
    const lastRange = acc[acc.length - 1];
    if (range.start <= lastRange.end) {
      // Ranges overlap, merge them
      lastRange.end = Math.max(lastRange.end, range.end);
      return acc;
    }
    
    // Ranges don't overlap, add the new range
    return [...acc, range];
  }, []);
  
  // Build highlighted text
  let result = [];
  let lastEnd = 0;
  
  for (const range of mergedRanges) {
    // Add text before highlight
    if (range.start > lastEnd) {
      result.push(text.substring(lastEnd, range.start));
    }
    
    // Add highlighted text
    result.push(
      <span key={`highlight-${range.start}`} className="bg-primary/20 font-medium">
        {text.substring(range.start, range.end)}
      </span>
    );
    
    lastEnd = range.end;
  }
  
  // Add any remaining text
  if (lastEnd < text.length) {
    result.push(text.substring(lastEnd));
  }
  
  return result;
}

// Icon components
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function FolderIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}
