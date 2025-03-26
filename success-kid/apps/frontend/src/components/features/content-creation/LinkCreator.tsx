'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RichTextEditor } from './RichTextEditor';
import { 
  Link, 
  Globe, 
  ExternalLink, 
  Image as ImageIcon, 
  Edit, 
  Loader2, 
  AlertTriangle, 
  CheckCircle 
} from 'lucide-react';

interface LinkMetadata {
  title: string;
  description: string;
  imageUrl?: string;
  siteName?: string;
  url: string;
}

interface LinkCreatorProps {
  linkUrl: string;
  onChange: (url: string) => void;
  metadata?: LinkMetadata | null;
  onMetadataChange?: (metadata: LinkMetadata | null) => void;
  error?: string;
  isCustomized?: boolean;
  onToggleCustomize?: (isCustomizing: boolean) => void;
  customTitle?: string;
  onCustomTitleChange?: (title: string) => void;
  customDescription?: string;
  onCustomDescriptionChange?: (description: string) => void;
}

export function LinkCreator({ 
  linkUrl, 
  onChange, 
  metadata, 
  onMetadataChange,
  error,
  isCustomized = false,
  onToggleCustomize,
  customTitle = '',
  onCustomTitleChange,
  customDescription = '',
  onCustomDescriptionChange
}: LinkCreatorProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [tempUrl, setTempUrl] = useState(linkUrl);
  
  // Mock function to fetch link metadata
  const fetchMetadata = async () => {
    if (!tempUrl.trim()) return;
    
    try {
      setIsFetching(true);
      
      // Validate URL format
      try {
        new URL(tempUrl);
      } catch (e) {
        // Try adding https:// if not present
        if (!tempUrl.startsWith('http')) {
          try {
            new URL(`https://${tempUrl}`);
            setTempUrl(`https://${tempUrl}`);
          } catch (e) {
            throw new Error('Invalid URL format');
          }
        } else {
          throw new Error('Invalid URL format');
        }
      }
      
      // In a real implementation, this would be an API call
      // For now, we'll just simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set URL with the validated URL
      onChange(tempUrl);
      
      // Mock metadata
      const mockMetadata: LinkMetadata = {
        title: "Example Article Title",
        description: "This is a sample description for the link that would normally be extracted from the page's meta tags.",
        imageUrl: "https://via.placeholder.com/600x400",
        siteName: new URL(tempUrl).hostname.replace('www.', ''),
        url: tempUrl
      };
      
      if (onMetadataChange) {
        onMetadataChange(mockMetadata);
      }
      
      if (onCustomTitleChange) {
        onCustomTitleChange(mockMetadata.title);
      }
      
      if (onCustomDescriptionChange) {
        onCustomDescriptionChange(mockMetadata.description);
      }
    } catch (err) {
      if (onMetadataChange) {
        onMetadataChange(null);
      }
    } finally {
      setIsFetching(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="link-url" className="block text-sm font-medium">Link URL</label>
        <div className="relative flex items-center">
          <div className="absolute left-0 pl-3 flex items-center pointer-events-none">
            <Link className="h-4 w-4 text-gray-500" />
          </div>
          <Input
            id="link-url"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            className="pl-10"
            placeholder="https://example.com"
          />
          <Button
            type="button"
            onClick={fetchMetadata}
            className="ml-2"
            disabled={isFetching || !tempUrl.trim()}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Globe className="h-4 w-4 mr-2" />
            )}
            {metadata ? 'Refresh' : 'Fetch'}
          </Button>
        </div>
        {error && (
          <p className="text-red-500 text-sm flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
      
      {metadata && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {metadata.imageUrl && (
                <div className="sm:w-1/3 h-40 sm:h-auto overflow-hidden">
                  <img 
                    src={metadata.imageUrl} 
                    alt={metadata.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className={`p-4 flex flex-col ${metadata.imageUrl ? 'sm:w-2/3' : 'w-full'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">
                      {isCustomized ? customTitle : metadata.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {isCustomized ? customDescription : metadata.description}
                    </p>
                  </div>
                  {onToggleCustomize && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleCustomize(!isCustomized)}
                      className="text-gray-500"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-auto flex items-center text-xs text-gray-500">
                  <Globe className="h-3 w-3 mr-1" />
                  <span>{metadata.siteName || new URL(metadata.url).hostname}</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </div>
              </div>
            </div>
          </Card>
          
          {isCustomized && onToggleCustomize && (
            <div className="space-y-4 p-4 border rounded-md bg-gray-50">
              <div>
                <label htmlFor="custom-title" className="block text-sm font-medium mb-1">
                  Custom Title
                </label>
                <Input
                  id="custom-title"
                  value={customTitle}
                  onChange={(e) => onCustomTitleChange?.(e.target.value)}
                  placeholder="Enter custom title"
                />
              </div>
              
              <div>
                <label htmlFor="custom-description" className="block text-sm font-medium mb-1">
                  Custom Description
                </label>
                <Input
                  id="custom-description"
                  value={customDescription}
                  onChange={(e) => onCustomDescriptionChange?.(e.target.value)}
                  placeholder="Enter custom description"
                />
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onCustomTitleChange) onCustomTitleChange(metadata.title);
                    if (onCustomDescriptionChange) onCustomDescriptionChange(metadata.description);
                  }}
                >
                  Reset to Original
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleCustomize(false)}
                >
                  Done Editing
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Your Thoughts (Optional)
        </label>
        <RichTextEditor
          value={''} // This would be connected to formData.body in actual implementation
          onChange={() => {}} // This would be hooked up to form handler
          placeholder="Add your thoughts about this link..."
          minHeight="150px"
        />
        <p className="text-xs text-gray-500 mt-1">
          Adding your perspective makes the post more valuable to the community
        </p>
      </div>
    </div>
  );
}
