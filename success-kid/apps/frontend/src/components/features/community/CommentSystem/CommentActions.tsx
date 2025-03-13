'use client';

import React from 'react';
import { CommentSort } from '@/types';

interface CommentActionsProps {
  sortOrder: CommentSort;
  onSortChange: (sort: CommentSort) => void;
  commentCount: number;
}

/**
 * Actions and controls for the comments section
 */
export function CommentActions({
  sortOrder,
  onSortChange,
  commentCount
}: CommentActionsProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold">
        Comments ({commentCount})
      </h2>
      
      <div className="flex items-center space-x-2">
        <label htmlFor="comment-sort" className="text-sm text-muted-foreground">
          Sort by:
        </label>
        <select
          id="comment-sort"
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value as CommentSort)}
          className="text-sm border rounded-md py-1 px-2 bg-background"
        >
          <option value="top">Top</option>
          <option value="new">Newest</option>
          <option value="controversial">Controversial</option>
        </select>
      </div>
    </div>
  );
}

export default CommentActions;
