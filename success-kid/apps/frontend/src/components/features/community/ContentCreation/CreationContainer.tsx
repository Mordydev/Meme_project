'use client';

import React, { useState, useEffect } from 'react';
import { TypeSelector } from './TypeSelector';
import { RichTextEditor } from './RichTextEditor';
import { MediaUploader } from './MediaUploader';
import { LinkEmbedder, LinkPreview } from './LinkEmbedder';
import { PublishControls } from './PublishControls';
import { ContentType } from '@/types';
import { useCreatePost } from '@/hooks/queries/useCommunity';
import { useRouter } from 'next/navigation';

interface CreationContainerProps {
  initialType?: ContentType;
  categoryId?: string;
  onPublish?: (postId: string) => void;
  onCancel?: () => void;
}

/**
 * Main container for content creation
 */
export function CreationContainer({ 
  initialType = 'text',
  categoryId = '',
  onPublish,
  onCancel
}: CreationContainerProps) {
  const router = useRouter();
  const { mutate: createPost, isLoading: isSubmitting } = useCreatePost();
  
  // Form state
  const [contentType, setContentType] = useState<ContentType>(initialType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryId);
  const [tags, setTags] = useState<string[]>([]);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Extract URL from content for link type
  const extractUrl = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };
  
  // Determine if form can be submitted
  const canPublish = !!title && 
    (contentType !== 'link' || !!linkPreview) && 
    (contentType !== 'image' || mediaUrls.length > 0) && 
    !!selectedCategory;
  
  // For link type, extract URL from content
  useEffect(() => {
    if (contentType === 'link') {
      const url = extractUrl(content);
      if (url) {
        // The URL will be handled by the LinkEmbedder component
      }
    }
  }, [content, contentType]);
  
  // Handle content type change
  const handleTypeChange = (type: ContentType) => {
    setContentType(type);
    setErrors({});
  };
  
  // Handle form submission
  const handlePublish = async () => {
    // Validate form fields
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!selectedCategory) {
      newErrors.category = 'Category is required';
    }
    
    if (contentType === 'image' && mediaUrls.length === 0) {
      newErrors.media = 'Please upload at least one image';
    }
    
    if (contentType === 'link' && !linkPreview) {
      newErrors.link = 'Please enter a valid URL';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Create post data
    const postData = {
      title: title.trim(),
      content: content.trim(),
      type: contentType,
      categoryId: selectedCategory,
      tags,
      mediaUrls: contentType === 'image' ? mediaUrls : undefined,
    };
    
    // Submit post
    createPost(postData, {
      onSuccess: (response) => {
        // Handle successful creation
        if (onPublish) {
          onPublish(response.post.id);
        } else {
          router.push(`/community/post/${response.post.id}`);
        }
      },
    });
  };
  
  // Handle saving draft
  const handleSaveDraft = () => {
    // In a real implementation, this would save the post as a draft
    // For this example, we'll just log it
    console.log('Saving draft:', {
      title,
      content,
      type: contentType,
      categoryId: selectedCategory,
      tags,
      mediaUrls,
    });
    
    // Show a toast notification or similar feedback
    alert('Draft saved successfully');
  };
  
  // Render different input based on content type
  const renderContentInput = () => {
    switch (contentType) {
      case 'text':
        return (
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your post here..."
          />
        );
        
      case 'image':
        return (
          <div className="space-y-4">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Add a description for your images..."
              minHeight="100px"
            />
            
            <MediaUploader
              onUpload={setMediaUrls}
              currentFiles={mediaUrls}
              onError={(error) => setErrors({ ...errors, media: error })}
            />
            
            {errors.media && (
              <p className="text-sm text-alert mt-1">{errors.media}</p>
            )}
          </div>
        );
        
      case 'link':
        // For links, we first need the URL
        const url = extractUrl(content) || '';
        
        return (
          <div className="space-y-4">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Paste or type a URL and add your thoughts..."
            />
            
            {url && (
              <LinkEmbedder 
                url={url} 
                onPreview={setLinkPreview}
              />
            )}
            
            {errors.link && (
              <p className="text-sm text-alert mt-1">{errors.link}</p>
            )}
          </div>
        );
        
      case 'poll':
        return (
          <div className="space-y-4">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write your poll question here..."
            />
            
            <div className="p-4 bg-muted rounded-md">
              <p className="text-muted-foreground text-sm italic">
                Poll creation is coming soon! This feature is under development.
              </p>
            </div>
          </div>
        );
        
      default:
        return (
          <RichTextEditor
            value={content}
            onChange={setContent}
          />
        );
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        {/* Header with title input */}
        <div>
          <label htmlFor="title" className="text-sm font-medium">
            Title <span className="text-alert">*</span>
          </label>
          
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title"
            className="w-full p-2 mt-1 text-lg font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={100}
          />
          
          {errors.title && (
            <p className="text-sm text-alert mt-1">{errors.title}</p>
          )}
          
          {/* Character count */}
          <p className="text-xs text-muted-foreground mt-1">
            {title.length}/100 characters
          </p>
        </div>
        
        {/* Content type selector */}
        <TypeSelector 
          selectedType={contentType} 
          onTypeChange={handleTypeChange} 
        />
        
        {/* Content input based on type */}
        {renderContentInput()}
        
        {/* Publishing controls */}
        <PublishControls
          categoryId={selectedCategory}
          onCategoryChange={setSelectedCategory}
          tags={tags}
          onTagsChange={setTags}
          isSubmitting={isSubmitting}
          onPublish={handlePublish}
          onSaveDraft={handleSaveDraft}
          canPublish={canPublish}
        />
      </div>
    </div>
  );
}

export default CreationContainer;
