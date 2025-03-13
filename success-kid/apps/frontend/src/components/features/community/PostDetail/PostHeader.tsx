'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '@/types';

interface PostHeaderProps {
  post: Post;
}

/**
 * Header component for post detail page
 */
export function PostHeader({ post }: PostHeaderProps) {
  const { title, author, createdAt, categoryId } = post;
  
  // Format the date
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  return (
    <div className="mb-6">
      {/* Navigation path */}
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <Link href="/community" className="hover:text-foreground">
          Community
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/community/category/${categoryId}`} className="hover:text-foreground">
          {categoryId}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Post</span>
      </div>
      
      {/* Title */}
      <h1 className="text-2xl font-bold mb-4 md:text-3xl">{title}</h1>
      
      {/* Author info */}
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
          {author.avatarUrl ? (
            <img 
              src={author.avatarUrl} 
              alt={author.username}
              className="h-full w-full rounded-full object-cover" 
            />
          ) : (
            <span className="font-medium">
              {author.username.substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        
        <div>
          <div className="font-medium">
            {author.displayName || author.username}
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            <span>{timeAgo}</span>
            {author.role && (
              <>
                <span className="mx-1.5">•</span>
                <span>{author.role}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostHeader;
