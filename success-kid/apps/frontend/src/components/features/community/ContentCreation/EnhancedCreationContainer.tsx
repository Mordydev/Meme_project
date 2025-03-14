'use client';

import React, { useState, useEffect } from 'react';
import { TypeSelector } from './TypeSelector';
import { EnhancedRichTextEditor } from './EnhancedRichTextEditor';
import { MediaUploader } from './MediaUploader';
import { LinkEmbedder, LinkPreview } from './LinkEmbedder';
import { PublishControls } from './PublishControls';
import { PublishPreview } from './PublishPreview';
import { ContentType } from '@/types';
import { useCreatePost } from '@/hooks/queries/useCommunity';
import { useRouter } from 'next/navigation';
import { useDraftManagement } from '@/hooks/useDraftManagement';
import { toast } from '@/components/ui/toast';

interface EnhancedCreationContainerProps {
  initialType?: ContentType;
  categoryId?: string;
  onPublish?: (postId: string) => void;
  onCancel?: () => void;
  draftId?: string;
}

/**
 * Enhanced content creation container with draft management and preview
 */
export function EnhancedCreationContainer({
  initialType = 'text',
  categoryId = '',
  onPublish,
  onCancel,
  draftId,
}: EnhancedCreationContainerProps) {
  const router = useRouter();
  const { mutate: createPost, isLoading: isSubmitting } = useCreatePost();
  
  // Draft management
  const {
    drafts,
    saveDraft,
    deleteDraft,
    loadDraft,
    markDirty,
    isDirty,
    lastSaved,
  } = useDraftManagement({ autoSaveInterval: 10000 });

  // Form state
  const [contentType, setContentType] = useState<ContentType>(initialType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryId);
  const [tags, setTags] = useState<string[]>([]);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  
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
  
  // Load draft if provided or attempt to load from storage
  useEffect(() => {
    if (draftId) {
      const draft = loadDraft(draftId);
      if (draft) {
        setContentType(draft.type);
        setTitle(draft.title);
        setContent(draft.content);
        setMediaUrls(draft.mediaUrls);
        setSelectedCategory(draft.categoryId);
        setTags(draft.tags);
      }
    }
  }, [draftId, loadDraft]);
  
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
    markDirty();
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
        toast({
          title: 'Post published!',
          description: 'Your content has been published successfully.',
          variant: 'success',
        });
        
        // Award notification
        if (response.pointsAwarded) {
          toast({
            title: `+${response.pointsAwarded} Success Points!`,
            description: 'You earned points for your contribution.',
            variant: 'success',
          });
        }
        
        if (onPublish) {
          onPublish(response.post.id);
        } else {
          router.push(`/community/post/${response.post.id}`);
        }
      },
      onError: (error) => {
        toast({
          title: 'Error publishing post',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    });
  };
  
  // Handle saving draft
  const handleSaveDraft = () => {
    const draftId = saveDraft({
      title,
      content,
      type: contentType,
      categoryId: selectedCategory,
      tags,
      mediaUrls,
    });
    
    toast({
      title: 'Draft saved',
      description: 'Your post draft has been saved.',
      variant: 'default',
    });
    
    return draftId;
  };
  
  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    markDirty();
  };
  
  // Show preview before publishing
  const handlePreviewBeforePublish = () => {
    // Save draft first
    handleSaveDraft();
    // Show preview
    setShowPreview(true);
  };
  
  // Render different input based on content type
  const renderContentInput = () => {
    switch (contentType) {
      case 'text':
        return (
          <EnhancedRichTextEditor
            value={content}
            onChange={handleContentChange}
            placeholder="Write your post here..."
            autofocus
            onDraftSave={handleSaveDraft}
          />
        );
        
      case 'image':
        return (
          <div className="space-y-4">
            <EnhancedRichTextEditor
              value={content}
              onChange={handleContentChange}
              placeholder="Add a description for your images..."
              minHeight="100px"
              onDraftSave={handleSaveDraft}
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
            <EnhancedRichTextEditor
              value={content}
              onChange={handleContentChange}
              placeholder="Paste or type a URL and add your thoughts..."
              onDraftSave={handleSaveDraft}
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
            <EnhancedRichTextEditor
              value={content}
              onChange={handleContentChange}
              placeholder="Write your poll question here..."
              onDraftSave={handleSaveDraft}
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
          <EnhancedRichTextEditor
            value={content}
            onChange={handleContentChange}
            onDraftSave={handleSaveDraft}
          />
        );
    }
  };
  
  // Render last saved timestamp
  const renderLastSaved = () => {
    if (!lastSaved) return null;
    
    const timeString = lastSaved.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return (
      <div className="text-xs text-muted-foreground">
        Last saved at {timeString}
      </div>
    );
  };
  
  // Show preview mode
  if (showPreview) {
    return (
      <PublishPreview
        title={title}
        content={content}
        type={contentType}
        categoryName={categoryName || 'General'}
        tags={tags}
        mediaUrls={mediaUrls}
        linkPreview={linkPreview}
        onConfirm={handlePublish}
        onEdit={() => setShowPreview(false)}
      />
    );
  }
  
  // Show edit mode
  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        {/* Auto-save indicator */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Create New Post</h2>
          {isDirty ? (
            <div className="text-xs text-yellow-600 animate-pulse">
              Saving changes...
            </div>
          ) : (
            renderLastSaved()
          )}
        </div>
        
        {/* Header with title input */}
        <div>
          <label htmlFor="title" className="text-sm font-medium">
            Title <span className="text-alert">*</span>
          </label>
          
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
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
          onCategoryChange={(id, name) => {
            setSelectedCategory(id);
            setCategoryName(name);
            markDirty();
          }}
          tags={tags}
          onTagsChange={(newTags) => {
            setTags(newTags);
            markDirty();
          }}
          isSubmitting={isSubmitting}
          onPublish={handlePreviewBeforePublish}
          onSaveDraft={handleSaveDraft}
          canPublish={canPublish}
        />
      </div>
    </div>
  );
}

export default EnhancedCreationContainer;
