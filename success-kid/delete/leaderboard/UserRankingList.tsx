'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { UserRankItem } from './UserRankItem';
import { RankedUser, CurrentUserRank } from '@/types/leaderboard';
import { useReducedMotion } from '@/hooks';

export interface UserRankingListProps {
  rankings: RankedUser[];
  currentUser?: CurrentUserRank;
  currentUserId?: string;
  isLoading?: boolean;
  showPagination?: boolean;
  onPageChange?: (page: number) => void;
  onUserSelect?: (userId: string) => void;
  total?: number;
  limit?: number;
  offset?: number;
  className?: string;
}

export const UserRankingList: React.FC<UserRankingListProps> = ({
  rankings,
  currentUser,
  currentUserId,
  isLoading = false,
  showPagination = true,
  onPageChange,
  onUserSelect,
  total = 0,
  limit = 20,
  offset = 0,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [currentPage, setCurrentPage] = useState(Math.floor(offset / limit) + 1);
  const totalPages = Math.ceil(total / limit);
  
  // Update current page when offset changes
  useEffect(() => {
    setCurrentPage(Math.floor(offset / limit) + 1);
  }, [offset, limit]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    // Ensure page is within bounds
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    onPageChange?.(validPage);
  };
  
  // Handle user selection
  const handleUserSelect = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
  };
  
  // Empty state
  if (!isLoading && rankings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-neutral-400 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8.21 13.89 7 23l2.86-2.41L13 21.7l-1.86-8.14" />
            <path d="M8 6l.74.76A7 7 0 0 1 12 13a7 7 0 0 0 4 2.47" />
            <path d="M17 6l-.74.76A7 7 0 0 0 13 13a7 7 0 0 1-4 2.47" />
            <path d="M10 8c.11-.3.72-.19 1.39.07 1.11.42 1.56 1.39.87 1.87a1.5 1.5 0 0 1-1.87-.87L10 8Z" />
            <path d="M16 15c0 1.66-2.5 3-4 3s-4-1.34-4-3 2.5-2 4-2 4 .34 4 2Z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-700">No rankings available</h3>
        <p className="text-sm text-neutral-500 mt-1">
          Check back soon or be the first to climb the ranks!
        </p>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Rankings list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`page-${currentPage}`}
          initial={!prefersReducedMotion ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          exit={!prefersReducedMotion ? { opacity: 0 } : undefined}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {rankings.map((user) => (
            <UserRankItem
              key={user.userId}
              user={user}
              isCurrentUser={user.userId === currentUserId}
              onSelect={() => handleUserSelect(user.userId)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
      
      {/* Current user's rank if not visible in current page */}
      {currentUser && !rankings.some(user => user.userId === currentUserId) && (
        <div className="mt-4 pt-3 border-t border-neutral-200">
          <div className="text-sm text-neutral-500 mb-2">Your current rank:</div>
          <UserRankItem
            user={{
              rank: currentUser.rank,
              userId: currentUserId || 'current-user',
              username: 'You',
              displayName: 'You',
              level: 0, // This will be updated with actual user level
              score: currentUser.score,
              change: currentUser.change,
            }}
            isCurrentUser={true}
          />
        </div>
      )}
      
      {/* Pagination controls */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-neutral-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
