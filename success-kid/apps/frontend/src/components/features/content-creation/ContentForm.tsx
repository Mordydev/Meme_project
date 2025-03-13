'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CategorySelector } from '@/components/features/community/CategorySelector';
import { RichTextEditor } from './RichTextEditor';
import { MediaUpload, MediaFile } from './MediaUpload';
import { TagInput } from './TagInput';
import { ContentFormData, ValidationError, FormMode } from '@/types/content-creation';
import { ContentType } from '@/types/community';
import { useDrafts } from '@/hooks/useDrafts';
import { useCategories } from '@/hooks/useCategories';
import { Save, Eye, Send, ArrowLeft, Link as LinkIcon, BarChart2, X } from 'lucide-react';
import { ContentPreview } from './ContentPreview';

// Mock user ID for testing
const MOCK_USER_ID = 'user_123';

// Mock tag suggestions
const TAG_SUGGESTIONS = [
  'newcomer', 'question', 'idea', 'success', 'crypto', 'help',
  'feedback', 'announcement', 'tutorial', 'meme', 'event'
];

const INITIAL_FORM_DATA: ContentFormData = {
  type: 'text',
  title: '',
  body: '',
  categoryId: '',
  tags: [],
  media: [],
  pollOptions: ['', '']
};

interface ContentFormProps {
  contentType?: ContentType;
  draftId?: string;
}

export function ContentForm({ contentType = 'text', draftId }: ContentFormProps) {
  const [formData, setFormData] = useState<ContentFormData>({
    ...INITIAL_FORM_DATA,
    type: contentType
  });
  const [mode, setMode] = useState<FormMode>('create');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [formTouched, setFormTouched] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { drafts, saveDraft, getDraft, saveStatus } = useDrafts(MOCK_USER_ID);
  const { rootCategories, getCategoryById, isLoading: categoriesLoading } = useCategories();
  
  // Load initial category from query params
  useEffect(() => {
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      setFormData(prev => ({ ...prev, categoryId }));
    }
  }, [searchParams]);
  
  // Load draft if draftId is provided
  useEffect(() => {
    if (draftId) {
      const draft = getDraft(draftId);
      if (draft) {
        setFormData(draft);
      }
    }
  }, [draftId, getDraft]);
  
  // Auto-save functionality
  useEffect(() => {
    if (!formTouched) return;
    
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set a new timer to save the draft after 2 seconds of inactivity
    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveDraft();
    }, 2000);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, formTouched]);
  
  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = [];
    
    if (!formData.title.trim()) {
      newErrors.push({ field: 'title', message: 'Title is required' });
    } else if (formData.title.length > 100) {
      newErrors.push({ field: 'title', message: 'Title must be 100 characters or less' });
    }
    
    if (!formData.categoryId) {
      newErrors.push({ field: 'categoryId', message: 'Category is required' });
    }
    
    if (formData.type === 'text' && !formData.body.trim()) {
      newErrors.push({ field: 'body', message: 'Content is required' });
    }
    
    if (formData.type === 'image' && formData.media.length === 0) {
      newErrors.push({ field: 'media', message: 'At least one image is required' });
    }
    
    if (formData.type === 'link' && !formData.link) {
      newErrors.push({ field: 'link', message: 'Link is required' });
    }
    
    if (formData.type === 'poll') {
      if (!formData.pollOptions || formData.pollOptions.length < 2) {
        newErrors.push({ field: 'pollOptions', message: 'At least two poll options are required' });
      } else {
        const validOptions = formData.pollOptions.filter(option => option.trim());
        if (validOptions.length < 2) {
          newErrors.push({ field: 'pollOptions', message: 'At least two non-empty poll options are required' });
        }
      }
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };
  
  const handleInputChange = (field: keyof ContentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormTouched(true);
  };
  
  const handleSaveDraft = async () => {
    try {
      await saveDraft(formData);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };
  
  const handlePublish = () => {
    if (!validateForm()) return;
    
    // In a real implementation, we would call the API to publish the content
    console.log('Publishing content:', formData);
    
    // Navigate to success page or content view
    router.push('/community');
  };
  
  const handlePreview = () => {
    if (!validateForm()) return;
    setMode('preview');
  };
  
  const renderFormByType = () => {
    switch (formData.type) {
      case 'text':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="content-body" className="block text-sm font-medium mb-1">Content</label>
              <RichTextEditor
                value={formData.body}
                onChange={(value) => handleInputChange('body', value)}
                minHeight="300px"
              />
              {errors.find(e => e.field === 'body') && (
                <p className="text-red-500 text-sm mt-1">{errors.find(e => e.field === 'body')?.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Media (Optional)</label>
              <MediaUpload
                files={formData.media}
                onChange={(files) => handleInputChange('media', files)}
                maxFiles={5}
              />
            </div>
          </div>
        );
        
      case 'image':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Images</label>
              <MediaUpload
                files={formData.media}
                onChange={(files) => handleInputChange('media', files)}
                maxFiles={10}
              />
              {errors.find(e => e.field === 'media') && (
                <p className="text-red-500 text-sm mt-1">{errors.find(e => e.field === 'media')?.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="content-body" className="block text-sm font-medium mb-1">Caption (Optional)</label>
              <RichTextEditor
                value={formData.body}
                onChange={(value) => handleInputChange('body', value)}
                minHeight="150px"
              />
            </div>
          </div>
        );
        
      case 'link':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="content-link" className="block text-sm font-medium mb-1">Link URL</label>
              <div className="flex">
                <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="content-link"
                  type="url"
                  value={formData.link || ''}
                  onChange={(e) => handleInputChange('link', e.target.value)}
                  placeholder="https://example.com"
                  className="flex-grow rounded-r-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              {errors.find(e => e.field === 'link') && (
                <p className="text-red-500 text-sm mt-1">{errors.find(e => e.field === 'link')?.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="content-body" className="block text-sm font-medium mb-1">Your Thoughts (Optional)</label>
              <RichTextEditor
                value={formData.body}
                onChange={(value) => handleInputChange('body', value)}
                minHeight="150px"
              />
            </div>
          </div>
        );
        
      case 'poll':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="content-body" className="block text-sm font-medium mb-1">Poll Description (Optional)</label>
              <RichTextEditor
                value={formData.body}
                onChange={(value) => handleInputChange('body', value)}
                minHeight="150px"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Poll Options</label>
              <div className="space-y-2">
                {formData.pollOptions?.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(formData.pollOptions || [])];
                        newOptions[index] = e.target.value;
                        handleInputChange('pollOptions', newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="flex-grow rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    
                    {index > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newOptions = [...(formData.pollOptions || [])];
                          newOptions.splice(index, 1);
                          handleInputChange('pollOptions', newOptions);
                        }}
                        aria-label="Remove option"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {errors.find(e => e.field === 'pollOptions') && (
                  <p className="text-red-500 text-sm">
                    {errors.find(e => e.field === 'pollOptions')?.message}
                  </p>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => {
                    handleInputChange('pollOptions', [
                      ...(formData.pollOptions || []),
                      ''
                    ]);
                  }}
                >
                  + Add Another Option
                </Button>
              </div>
            </div>
          </div>
        );
        
      default:
        return <p>Unknown content type</p>;
    }
  };
  
  const renderPreview = () => {
    return (
      <ContentPreview
        content={formData}
        onEdit={() => setMode('create')}
        onPublish={handlePublish}
        categoryName={getCategoryById(formData.categoryId)?.name}
      />
    );
  };
  
  if (mode === 'preview') {
    return renderPreview();
  }
  
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="content-title" className="block text-sm font-medium mb-1">Title</label>
        <input
          id="content-title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter a descriptive title"
          className="w-full rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-primary-200"
          maxLength={100}
        />
        {errors.find(e => e.field === 'title') && (
          <p className="text-red-500 text-sm mt-1">{errors.find(e => e.field === 'title')?.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <CategorySelector
          categories={rootCategories}
          selectedCategoryId={formData.categoryId}
          onSelect={(id) => handleInputChange('categoryId', id)}
          loading={categoriesLoading}
        />
        {errors.find(e => e.field === 'categoryId') && (
          <p className="text-red-500 text-sm mt-1">{errors.find(e => e.field === 'categoryId')?.message}</p>
        )}
      </div>
      
      {renderFormByType()}
      
      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <TagInput
          tags={formData.tags}
          onChange={(tags) => handleInputChange('tags', tags)}
          maxTags={5}
          suggestions={TAG_SUGGESTIONS}
        />
      </div>
      
      <div className="flex items-center justify-between pt-6">
        <div className="text-sm text-gray-500">
          {saveStatus === 'saving' && 'Saving draft...'}
          {saveStatus === 'saved' && 'Draft saved'}
          {saveStatus === 'error' && 'Error saving draft'}
        </div>
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saveStatus === 'saving'}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          
          <Button
            type="button"
            onClick={handlePublish}
          >
            <Send className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
