'use client';

import React, { useState, useEffect } from 'react';

interface LinkEmbedderProps {
  url: string;
  onPreview?: (preview: LinkPreview | null) => void;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain: string;
}

/**
 * Component for previewing links
 * 
 * Note: This is a simplified preview. In a real implementation, 
 * you would use a server API to fetch link metadata securely.
 */
export function LinkEmbedder({ url, onPreview }: LinkEmbedderProps) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!url) {
      setPreview(null);
      onPreview?.(null);
      return;
    }
    
    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      setError('Invalid URL format');
      setPreview(null);
      onPreview?.(null);
      return;
    }
    
    // Extract domain
    const domain = parsedUrl.hostname.replace('www.', '');
    
    // For this example, we'll simulate fetching metadata
    // In a real app, you would make an API call to your backend
    // to securely fetch page metadata
    setIsLoading(true);
    setError(null);
    
    // Simulate API call delay
    setTimeout(() => {
      // Simplified preview generation (mocked)
      const mockPreview: LinkPreview = {
        url,
        title: `Page from ${domain}`,
        description: 'Link description would appear here when fetched from a real API',
        image: undefined, // Would be a real image URL from metadata
        domain,
      };
      
      setPreview(mockPreview);
      onPreview?.(mockPreview);
      setIsLoading(false);
    }, 1000);
    
  }, [url, onPreview]);
  
  if (!url) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="border rounded-md p-4 animate-pulse bg-muted">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="border rounded-md p-4 bg-alert/10 text-alert">
        {error}
      </div>
    );
  }
  
  if (!preview) {
    return null;
  }
  
  return (
    <div className="border rounded-md overflow-hidden">
      <a 
        href={preview.url} 
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-muted/50 transition-colors"
      >
        <div className="p-4">
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            {preview.domain}
          </div>
          
          <h3 className="font-medium text-foreground truncate">
            {preview.title || 'Untitled Page'}
          </h3>
          
          {preview.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {preview.description}
            </p>
          )}
          
          <div className="text-xs text-primary mt-2">
            Visit link ↗
          </div>
        </div>
      </a>
    </div>
  );
}

export default LinkEmbedder;
