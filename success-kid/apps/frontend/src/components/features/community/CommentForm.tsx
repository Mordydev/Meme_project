'use client';

import React, { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { NewComment } from '@/types/community';

interface CommentFormProps {
  onSubmit: (comment: NewComment) => Promise<void>;
  parentId?: string;
  placeholder?: string;
  initialValue?: string;
  autoFocus?: boolean;
  className?: string;
}

export function CommentForm({
  onSubmit,
  parentId,
  placeholder = 'Add a comment...',
  initialValue = '',
  autoFocus = false,
  className = '',
}: CommentFormProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!comment.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit({
        text: comment.trim(),
        parentId: parentId || null,
      });
      
      // Reset form on success
      setComment('');
    } catch (err) {
      setError('Failed to submit comment. Please try again.');
      console.error('Comment submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      <Avatar
        src={user?.imageUrl}
        alt={user?.username || 'User'}
        className="h-10 w-10 rounded-full flex-shrink-0 mt-1"
      />
      <div className="flex-1">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={placeholder}
              className="w-full min-h-[80px] p-3 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none resize-y"
              autoFocus={autoFocus}
              disabled={isSubmitting}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setComment('')}
              disabled={!comment.trim() || isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!comment.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Comment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
