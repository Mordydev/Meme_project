'use client';

import React from 'react';
import Link from 'next/link';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface RelatedContentProps {
  posts: Post[];
  categoryId?: string;
  currentPostId: string;
}

/**
 * Component to display related posts
 */
export function RelatedContent({ posts, categoryId, currentPostId }: RelatedContentProps) {
  // Filter out current post and limit to 3 posts
  const filteredPosts = posts
    .filter(post => post.id !== currentPostId)
    .slice(0, 3);
  
  if (filteredPosts.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-10">
      <h3 className="text-lg font-medium mb-4">Related Posts</h3>
      
      <div className="space-y-4">
        {filteredPosts.map(post => (
          <Link
            key={post.id}
            href={`/community/post/${post.id}`}
            className="block border rounded-lg p-4 hover:border-primary transition-colors"
          >
            <div className="flex items-start">
              {/* Author avatar */}
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs mr-3 flex-shrink-0">
                {post.author.avatarUrl ? (
                  <img 
                    src={post.author.avatarUrl} 
                    alt={post.author.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  post.author.username.substring(0, 2).toUpperCase()
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h4 className="font-medium text-foreground line-clamp-1">{post.title}</h4>
                
                {/* Meta info */}
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span>{post.author.displayName || post.author.username}</span>
                  <span className="mx-1.5">•</span>
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                </div>
                
                {/* Preview */}
                {post.preview && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {post.preview}
                  </p>
                )}
                
                {/* Stats */}
                <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mr-1">
                      <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
                    </svg>
                    {post.voteCount}
                  </span>
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mr-1">
                      <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 45.46 45.46 0 003.551-.414c1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A45.448 45.448 0 0010 2z" clipRule="evenodd" />
                    </svg>
                    {post.commentCount}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* View more link */}
      {categoryId && (
        <Link 
          href={`/community/category/${categoryId}`}
          className="block text-center text-primary hover:underline font-medium mt-4"
        >
          View more in this category
        </Link>
      )}
    </div>
  );
}

export default RelatedContent;
