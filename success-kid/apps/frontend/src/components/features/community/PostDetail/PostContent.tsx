'use client';

import React, { useState } from 'react';
import { Post } from '@/types';

interface PostContentProps {
  post: Post;
  isExpanded?: boolean;
}

/**
 * Component to display post content with formatting and media
 */
export function PostContent({ post, isExpanded = true }: PostContentProps) {
  const { content, type, mediaUrls = [] } = post;
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  
  // Handle content based on post type
  switch (type) {
    case 'text':
      return (
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          {parseContent(content)}
        </div>
      );
      
    case 'image':
      return (
        <div>
          {/* Text content */}
          {content && (
            <div className="prose prose-zinc dark:prose-invert max-w-none mb-4">
              {parseContent(content)}
            </div>
          )}
          
          {/* Images */}
          <div className={`grid gap-4 ${mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {mediaUrls.map((url, index) => (
              <div key={index} className="relative">
                <img 
                  src={url} 
                  alt={`Image ${index + 1}`}
                  className="rounded-lg max-h-[600px] w-full object-cover cursor-pointer"
                  onClick={() => setExpandedImage(url)}
                />
              </div>
            ))}
          </div>
          
          {/* Image modal */}
          {expandedImage && (
            <div 
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
              onClick={() => setExpandedImage(null)}
            >
              <div className="max-w-7xl max-h-screen p-4">
                <img 
                  src={expandedImage} 
                  alt="Expanded post image"
                  className="max-h-[90vh] max-w-full object-contain"
                />
                <button 
                  className="absolute top-4 right-4 text-white p-2"
                  onClick={() => setExpandedImage(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      );
      
    case 'link':
      // Extract the first URL from content or mediaUrls
      const linkUrl = mediaUrls[0] || extractUrl(content);
      
      return (
        <div>
          {/* Text content */}
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-4">
            {parseContent(content)}
          </div>
          
          {/* Link preview */}
          {linkUrl && (
            <a 
              href={linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center">
                <div className="w-5 h-5 mr-2 text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-primary font-medium truncate">{linkUrl}</span>
              </div>
              
              <div className="mt-2 text-sm text-muted-foreground">
                Click to open in a new tab
              </div>
            </a>
          )}
        </div>
      );
      
    case 'poll':
      // Poll content would be implemented here
      return (
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          {parseContent(content)}
          <div className="mt-4 bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground italic">Poll implementation coming soon...</p>
          </div>
        </div>
      );
      
    default:
      return (
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          {parseContent(content)}
        </div>
      );
  }
}

// Helper to parse content with basic formatting
function parseContent(content: string) {
  if (!content) return null;
  
  // Split into paragraphs
  return content.split('\n\n').map((paragraph, i) => {
    // Handle blank lines
    if (paragraph.trim() === '') return <br key={i} />;
    
    // Handle line breaks within paragraphs
    const lines = paragraph.split('\n').map((line, j) => {
      return j === 0 ? line : [<br key={`${i}-${j}`} />, line];
    });
    
    return <p key={i}>{lines}</p>;
  });
}

// Helper to extract URL from text
function extractUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

export default PostContent;
