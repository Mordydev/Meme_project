'use client';

import React, { useState } from 'react';
import { useCreateComment } from '@/hooks/queries/useCommunity';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface CommentEditorProps {
  postId: string;
  parentId?: string;
  onCancel?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

/**
 * Comment creation and editing component
 */
export function CommentEditor({ 
  postId, 
  parentId,
  onCancel,
  onSubmit,
  autoFocus = false,
  placeholder = 'Add a comment...'
}: CommentEditorProps) {
  const { isSignedIn, user } = useAuth();
  const [content, setContent] = useState('');
  const { mutate: createComment, isLoading } = useCreateComment();
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isLoading) return;
    
    createComment({
      postId,
      content: content.trim(),
      parentId,
    }, {
      onSuccess: () => {
        setContent('');
        if (onSubmit) onSubmit();
      }
    });
  };
  
  // Display login prompt if not signed in
  if (!isSignedIn) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <p className="text-center text-sm text-muted-foreground">
          Please{' '}
          <Link href="/sign-in" className="text-primary hover:underline">
            sign in
          </Link>
          {' '}to join the conversation.
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-card">
      {/* User avatar and editor */}
      <div className="flex">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs mr-3 flex-shrink-0">
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt={user.username || 'User'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            user?.username?.substring(0, 2).toUpperCase() || 'U'
          )}
        </div>
        
        <div className="flex-1">
          <textarea
            className="w-full p-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] text-sm"
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus={autoFocus}
            disabled={isLoading}
          />
          
          {/* Comment actions */}
          <div className="flex justify-end mt-3 space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1 text-sm border rounded-md text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              disabled={!content.trim() || isLoading}
            >
              {isLoading ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CommentEditor;
