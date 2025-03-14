'use client';

import React, { useState } from 'react';
import { ContentType } from '@/types';
import { LinkPreview } from './LinkEmbedder';

interface PublishPreviewProps {
  title: string;
  content: string;
  type: ContentType;
  categoryName?: string;
  tags: string[];
  mediaUrls: string[];
  linkPreview?: LinkPreview | null;
  onConfirm: () => void;
  onEdit: () => void;
  viewMode?: 'mobile' | 'desktop' | 'feed';
}

/**
 * Preview component for reviewing content before publishing
 */
export function PublishPreview({
  title,
  content,
  type,
  categoryName = 'Uncategorized',
  tags,
  mediaUrls,
  linkPreview,
  onConfirm,
  onEdit,
  viewMode = 'desktop'
}: PublishPreviewProps) {
  const [activeMode, setActiveMode] = useState<'mobile' | 'desktop' | 'feed'>(viewMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle confirmation with loading state
  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Failed to publish content:', error);
      setIsSubmitting(false);
    }
  };

  // Get current date for preview
  const currentDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Remove HTML tags from content for preview
  const plainContent = content.replace(/<[^>]*>/g, ' ');

  return (
    <div className="bg-card rounded-md overflow-hidden shadow-md">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-bold mb-1">Preview Your Post</h2>
        <p className="text-muted-foreground text-sm">
          Review how your post will appear before publishing
        </p>
      </div>

      {/* View toggle */}
      <div className="flex border-b p-2 bg-muted/40">
        <div className="flex space-x-2 mx-auto">
          <button
            onClick={() => setActiveMode('mobile')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              activeMode === 'mobile' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Mobile
          </button>
          <button
            onClick={() => setActiveMode('desktop')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              activeMode === 'desktop' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setActiveMode('feed')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              activeMode === 'feed' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Feed View
          </button>
        </div>
      </div>

      {/* Preview container */}
      <div 
        className={`
          border-4 border-muted mx-auto my-4 overflow-hidden bg-card
          ${activeMode === 'mobile' ? 'max-w-[375px] h-[600px]' : ''}
          ${activeMode === 'desktop' ? 'max-w-[900px]' : ''}
          ${activeMode === 'feed' ? 'max-w-[600px]' : ''}
        `}
      >
        <div className="p-4 overflow-y-auto" style={{ maxHeight: activeMode === 'mobile' ? '592px' : 'auto' }}>
          {/* Post header */}
          <div className="mb-4">
            <h1 className={`font-bold ${activeMode === 'mobile' ? 'text-xl' : 'text-2xl'}`}>
              {title}
            </h1>
            
            <div className="flex items-center mt-2 space-x-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-primary/10"></div>
                <span className="ml-2">Your Username</span>
              </div>
              <span>•</span>
              <span>{currentDate}</span>
              <span>•</span>
              <span>{categoryName}</span>
            </div>
          </div>
          
          {/* Media content */}
          {type === 'image' && mediaUrls.length > 0 && (
            <div className={`mb-4 ${mediaUrls.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
              {mediaUrls.map((url, index) => (
                <div key={index} className="rounded-md overflow-hidden bg-muted">
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Link preview */}
          {type === 'link' && linkPreview && (
            <div className="mb-4 border rounded-md overflow-hidden">
              <div className="p-3">
                <div className="flex items-center text-xs text-muted-foreground mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  {linkPreview.domain}
                </div>
                
                <h3 className="font-medium text-foreground truncate">
                  {linkPreview.title || 'Link Preview'}
                </h3>
                
                {linkPreview.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {linkPreview.description}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="mb-4">
            {activeMode === 'feed' ? (
              <p className="text-muted-foreground line-clamp-3">{plainContent}</p>
            ) : (
              <div 
                className="prose prose-sm max-w-none" 
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
          </div>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-0.5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Action buttons (in feed view) */}
          {activeMode === 'feed' && (
            <div className="flex space-x-4 text-muted-foreground text-sm">
              <button className="flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904" />
                </svg>
                <span>0</span>
              </button>
              <button className="flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
                <span>0</span>
              </button>
              <button className="flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                <span>Share</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end p-4 border-t space-x-3">
        <button
          onClick={onEdit}
          disabled={isSubmitting}
          className="px-4 py-2 border rounded-md text-muted-foreground hover:text-foreground"
        >
          Go Back & Edit
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 flex items-center"
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isSubmitting ? 'Publishing...' : 'Publish Now'}
        </button>
      </div>
    </div>
  );
}

export default PublishPreview;
