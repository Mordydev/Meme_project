'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { cn } from '@/lib/utils';
import { ThumbsUp, MessageSquare, Share, Clock, RefreshCcw } from 'lucide-react';

interface ActivityFeedProps {
  className?: string;
}

/**
 * ActivityFeed - Displays personalized, relevant content with engagement options
 * Implements infinite scrolling and real-time updates
 */
export function ActivityFeed({ className }: ActivityFeedProps) {
  const prefersReducedMotion = useReducedMotion();
  const feedEndRef = useRef<HTMLDivElement>(null);
  
  // Use the activity feed hook with default parameters for dashboard view
  const {
    items,
    isLoading,
    error,
    hasMore,
    hasNewItems,
    newItems,
    loadMore,
    handleInteraction,
    applyNewItems
  } = useActivityFeed({
    feedType: 'dashboard',
    initialFilters: {
      types: ['all'],
      sort: 'recent',
      viewMode: 'compact'
    }
  });
  
  // Format timestamp to relative time
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Implement infinite scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Load more items when user scrolls to within 200px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 200 && !isLoading && hasMore) {
      loadMore();
    }
  };
  
  // Format content preview with length limit
  const formatContent = (content: string, limit = 150) => {
    if (content.length <= limit) return content;
    return content.substring(0, limit) + '...';
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };
  
  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className={cn("space-y-4 animate-pulse", className)}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 h-24 rounded-lg"></div>
        ))}
      </div>
    );
  }
  
  // Error state
  if (error && items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-4 text-center", className)}>
        <div className="text-alert-500 mb-2">
          <RefreshCcw className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Couldn't load activity feed
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
          There was a problem loading the latest activity
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }
  
  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-6 text-center", className)}>
        <MessageSquare className="w-8 h-8 mb-2 text-primary-300 dark:text-primary-700" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Recent Activity</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
          Follow more users or explore content to see community activity
        </p>
        <a 
          href="/community" 
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          Explore Community
        </a>
      </div>
    );
  }
  
  return (
    <div 
      className={cn("relative space-y-4 overflow-y-auto pr-1", className)}
      onScroll={handleScroll}
    >
      {/* New items notification */}
      {hasNewItems && (
        <div className="sticky top-0 z-10 flex justify-center py-2">
          <button
            onClick={applyNewItems}
            className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-medium
              hover:bg-primary-600 transition-colors shadow-md flex items-center"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Show {newItems.length} new {newItems.length === 1 ? 'item' : 'items'}
          </button>
        </div>
      )}
      
      {/* Activity feed items */}
      <motion.div
        className="space-y-4"
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
      >
        {items.map((item) => (
          <motion.div
            key={item.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg p-4 hover:shadow-sm transition-shadow duration-200"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            {/* Author info */}
            <div className="flex items-center mb-3">
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 
                flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.author.avatarUrl ? (
                  <img 
                    src={item.author.avatarUrl} 
                    alt={item.author.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-primary-700 dark:text-primary-300 font-medium">
                    {item.author.displayName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="ml-3 flex-grow">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.author.displayName}
                  </span>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimeAgo(item.createdAt)}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  @{item.author.username}
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="mb-3">
              {item.type === 'post' && (
                <div>
                  {item.title && (
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </h4>
                  )}
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {formatContent(item.content)}
                  </p>
                </div>
              )}
              
              {item.type === 'media' && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {item.title}
                  </h4>
                  <div className="relative bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden mb-2"
                    style={{ paddingBottom: `${(1 / (item.aspectRatio || 16/9)) * 100}%` }}>
                    <img 
                      src={item.mediaUrl} 
                      alt={item.caption || item.title}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                  </div>
                  {item.caption && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {formatContent(item.caption, 100)}
                    </p>
                  )}
                </div>
              )}
              
              {item.type === 'link' && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {item.title}
                  </h4>
                  <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                    {item.previewImage && (
                      <div className="w-20 h-20 flex-shrink-0">
                        <img 
                          src={item.previewImage} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {item.domain}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {formatContent(item.description || '', 100)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {item.type === 'achievement' && (
                <div className="bg-secondary-50 dark:bg-secondary-900/20 rounded-md p-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 mr-3">
                      <img 
                        src={item.achievementIcon} 
                        alt={item.achievementName}
                        className="w-full h-full"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Unlocked Achievement: {item.achievementName}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {item.achievementDescription}
                      </p>
                      <div className="text-sm font-medium text-accent-600 dark:text-accent-400 mt-1">
                        +{item.pointsAwarded} Success Points
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Engagement actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleInteraction(item.id, 'vote', 'up')}
                  className={cn(
                    "flex items-center text-xs",
                    item.userInteractions?.voted === 'up'
                      ? "text-primary-600 dark:text-primary-400 font-medium"
                      : "text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  )}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  <span>{item.interactions.votes}</span>
                </button>
                
                <button
                  onClick={() => handleInteraction(item.id, 'comment')}
                  className="flex items-center text-xs text-gray-500 dark:text-gray-400
                    hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span>{item.interactions.comments}</span>
                </button>
                
                <button
                  onClick={() => handleInteraction(item.id, 'share')}
                  className="flex items-center text-xs text-gray-500 dark:text-gray-400
                    hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <Share className="w-4 h-4 mr-1" />
                  <span>{item.interactions.shares}</span>
                </button>
              </div>
              
              {/* View details link */}
              <a
                href={`/community/post/${item.id}`}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                View Details
              </a>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Loading indicator at the bottom */}
      {isLoading && items.length > 0 && (
        <div className="py-4 flex justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {/* End of feed marker */}
      {!hasMore && !isLoading && (
        <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          You've reached the end of the feed
        </div>
      )}
      
      {/* Invisible div for intersection observer */}
      <div ref={feedEndRef} className="h-4"></div>
    </div>
  );
}
