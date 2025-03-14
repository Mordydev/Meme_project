'use client';

import React, { useState } from 'react';
import { useDiscoveryFeed } from '@/hooks/queries/useSearch';
import { InterestManager } from './InterestManager';
import { DiscoveryItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DiscoveryFeedProps {
  limit?: number;
  showInterests?: boolean;
  className?: string;
}

export function DiscoveryFeed({
  limit = 10,
  showInterests = true,
  className,
}: DiscoveryFeedProps) {
  const [activeInterests, setActiveInterests] = useState<string[]>([]);
  const [excludedItems, setExcludedItems] = useState<string[]>([]);
  
  const { data, isLoading, error, refetch } = useDiscoveryFeed({
    interests: activeInterests.length > 0 ? activeInterests : undefined,
    excludeIds: excludedItems,
    limit,
  });
  
  // Handle interest selection
  const handleInterestChange = (interests: string[]) => {
    setActiveInterests(interests);
  };
  
  // Handle refreshing the feed
  const handleRefresh = () => {
    refetch();
  };
  
  // Handle dismissing an item
  const handleDismissItem = (itemId: string) => {
    setExcludedItems([...excludedItems, itemId]);
  };
  
  // Map reason label to friendly text
  const mapReasonToLabel = (reason: string): string => {
    switch (reason) {
      case 'trending':
        return 'Trending';
      case 'recommended':
        return 'Recommended for you';
      case 'interest':
        return 'Based on your interests';
      case 'popular':
        return 'Popular in the community';
      default:
        return reason;
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-sm text-neutral-500 mt-2">Loading discoveries...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="rounded-full bg-alert/10 w-12 h-12 flex items-center justify-center mx-auto mb-3">
          <AlertIcon className="h-6 w-6 text-alert" />
        </div>
        <h3 className="text-base font-medium mb-1">Unable to load discoveries</h3>
        <p className="text-sm text-neutral-500 mb-4">
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Interest Manager */}
      {showInterests && data?.interests && (
        <InterestManager
          allInterests={data.interests}
          activeInterests={activeInterests}
          onChange={handleInterestChange}
        />
      )}
      
      {/* Discovery Feed */}
      <div className="space-y-6">
        {data?.items && data.items.length > 0 ? (
          data.items
            .filter((item) => !excludedItems.includes(item.id))
            .map((item) => (
              <DiscoveryCard
                key={item.id}
                item={item}
                onDismiss={() => handleDismissItem(item.id)}
              />
            ))
        ) : (
          <div className="text-center py-8">
            <div className="rounded-full bg-neutral-100 w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <CompassIcon className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-base font-medium mb-1">No discoveries found</h3>
            <p className="text-sm text-neutral-500 mb-6">
              {activeInterests.length > 0
                ? "We couldn't find any content matching your interests. Try selecting different interests."
                : "We don't have any discoveries for you right now. Check back later or try selecting some interests."}
            </p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-md text-sm text-neutral-700"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
      
      {/* Refresh Button */}
      {data?.items && data.items.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-md text-sm text-neutral-700"
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
}

// Discovery Card Component
interface DiscoveryCardProps {
  item: DiscoveryItem;
  onDismiss: () => void;
}

function DiscoveryCard({ item, onDismiss }: DiscoveryCardProps) {
  const [showDismiss, setShowDismiss] = useState(false);
  
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
  
  return (
    <div
      className="border rounded-lg p-6 bg-card hover:border-primary/30 transition-colors relative group"
      onMouseEnter={() => setShowDismiss(true)}
      onMouseLeave={() => setShowDismiss(false)}
    >
      {/* Dismiss button */}
      {showDismiss && (
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          aria-label="Dismiss"
        >
          <XIcon className="h-4 w-4 text-neutral-500" />
        </button>
      )}
      
      <Link href={`/${item.type}/${item.id}`} className="block">
        <div className="flex items-start space-x-4">
          {/* Thumbnail if available */}
          {item.thumbnailUrl && (
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-md overflow-hidden bg-neutral-100">
                <img
                  src={item.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {/* Content Type Indicator */}
            <div className="flex items-center">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                {mapContentType(item.type)}
              </span>
              <span className="mx-2 text-neutral-300">•</span>
              <span className="text-xs text-neutral-500">{timeAgo}</span>
            </div>
            
            {/* Title */}
            <h3 className="mt-2 text-lg font-semibold text-neutral-900 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            
            {/* Snippet */}
            <p className="mt-1 text-neutral-600 line-clamp-2">{item.snippet}</p>
            
            {/* Author & Reason */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs">
                  {item.author.avatarUrl ? (
                    <img
                      src={item.author.avatarUrl}
                      alt={item.author.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    item.author.username.substring(0, 2).toUpperCase()
                  )}
                </div>
                <span className="ml-2 text-sm text-neutral-700">
                  {item.author.username}
                </span>
              </div>
              
              <span className="text-xs text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-full">
                {mapReasonToLabel(item.reason)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Map content type to friendly label
function mapContentType(type: string): string {
  switch (type) {
    case 'post':
      return 'Post';
    case 'user':
      return 'User';
    case 'comment':
      return 'Comment';
    case 'achievement':
      return 'Achievement';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

// Icon components
function AlertIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
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
