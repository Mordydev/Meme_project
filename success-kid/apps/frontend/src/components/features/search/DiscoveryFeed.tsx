'use client';

import React from 'react';
import Link from 'next/link';
import { useDiscoveryFeed, DiscoveryItem } from '@/hooks/search';
import { timeAgo } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

export interface DiscoveryFeedProps {
  interests?: string[];
  excludeIds?: string[];
  limit?: number;
  onItemSelect?: (item: DiscoveryItem) => void;
  className?: string;
}

export function DiscoveryFeed({
  interests = [],
  excludeIds = [],
  limit = 10,
  onItemSelect,
  className = ''
}: DiscoveryFeedProps) {
  const {
    discoveryItems,
    availableInterests,
    isLoading,
    error
  } = useDiscoveryFeed(interests, excludeIds, limit);
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="rounded-md bg-alert/10 p-4 text-alert">
        <p>Error loading discovery feed</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
  
  // Handle empty state
  if (discoveryItems.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-background p-6 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-12 w-12 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        
        <h3 className="mt-4 text-lg font-medium">No recommended content</h3>
        <p className="mt-2 text-neutral-500">
          Follow users, engage with content, or update your interests to receive personalized recommendations
        </p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {discoveryItems.map((item) => (
        <DiscoveryItem
          key={item.id}
          item={item}
          onClick={onItemSelect ? () => onItemSelect(item) : undefined}
        />
      ))}
    </div>
  );
}

interface DiscoveryItemProps {
  item: DiscoveryItem;
  onClick?: () => void;
}

function DiscoveryItem({ item, onClick }: DiscoveryItemProps) {
  // Get indicator text for recommendation reason
  const getReasonIndicator = () => {
    switch (item.reason) {
      case 'trending':
        return (
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Trending
          </span>
        );
      case 'recommended':
        return (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            Recommended
          </span>
        );
      case 'interest':
        return (
          <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Interest Match
          </span>
        );
      case 'popular':
        return (
          <span className="inline-flex items-center rounded-full bg-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
            Popular
          </span>
        );
      default:
        return null;
    }
  };
  
  const ItemContent = () => (
    <>
      <div className="flex items-start">
        {/* Optional thumbnail */}
        {item.thumbnailUrl && (
          <div className="mr-4 h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 space-y-1">
          {/* Title */}
          <h3 className="font-medium">{item.title}</h3>
          
          {/* Author and timestamp */}
          <div className="flex items-center text-sm text-neutral-500">
            <span>{item.author.username}</span>
            <span className="mx-1">•</span>
            <span>{timeAgo(item.createdAt)}</span>
          </div>
          
          {/* Snippet */}
          <p className="text-sm text-neutral-700">{item.snippet}</p>
          
          {/* Reason indicator */}
          <div className="pt-1">{getReasonIndicator()}</div>
        </div>
      </div>
    </>
  );
  
  // Render as link or clickable div based on whether onClick is provided
  if (onClick) {
    return (
      <div
        className="cursor-pointer rounded-md border border-neutral-200 bg-background p-4 transition-colors hover:bg-neutral-50"
        onClick={onClick}
      >
        <ItemContent />
      </div>
    );
  }
  
  return (
    <Link
      href={`/${item.type}/${item.id}`}
      className="block rounded-md border border-neutral-200 bg-background p-4 transition-colors hover:bg-neutral-50"
    >
      <ItemContent />
    </Link>
  );
}
