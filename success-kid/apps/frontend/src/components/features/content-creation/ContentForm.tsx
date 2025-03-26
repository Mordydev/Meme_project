'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategorySelector } from '@/components/features/community/CategorySelector';
import { RichTextEditor } from './RichTextEditor';
import { MediaUpload, MediaFile } from './MediaUpload';
import { TagInput } from './TagInput';
import { RewardsPreview } from './RewardsPreview';
import { ContentFormData, ValidationError, FormMode } from '@/types/content-creation';
import { ContentType } from '@/types/community';
import { useDrafts } from '@/hooks/useDrafts';
import { useCategories } from '@/hooks/useCategories';
import { Save, Eye, Send, ArrowLeft, Link as LinkIcon, BarChart2, X, BookOpen, HelpCircle, Edit } from 'lucide-react';
import { ContentPreview } from './ContentPreview';
import { LinkCreator } from './LinkCreator';
import { PollCreator } from './PollCreator';
import { CommunityGuidelines } from './CommunityGuidelines';
import { ResourcesLibrary } from './ResourcesLibrary';

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
  const [activeTab, setActiveTab] = useState<'editor' | 'resources'>('editor');
  const [isCustomizingLink, setIsCustomizingLink] = useState(false);
  const [linkMetadata, setLinkMetadata] = useState<any>(null);
  const [customLinkTitle, setCustomLinkTitle] = useState('');
  const [customLinkDescription, setCustomLinkDescription] = useState('');
  const [pollDuration, setPollDuration] = useState(7); // Default to 7 days
  
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
        if (draft.type === 'link' && draft.link) {
          // Mock metadata for the link
          setLinkMetadata({
            title: draft.title || 'Link Title',
            description: draft.body || 'Link description',
            imageUrl: draft.media?.[0]?.previewUrl,
            siteName: new URL(draft.link).hostname.replace('www.', ''),
            url: draft.link
          });
          setCustomLinkTitle(draft.title || '');
          setCustomLinkDescription(draft.body || '');
        }
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
    
    // Navigate to the community feed after publishing
    router.push('/community');
  };
  
  const handlePreview = () => {
    if (!validateForm()) return;
    setMode('preview');
  };

  const handleSelectResource = (resource: any) => {
    // Depending on the resource type, update different parts of the form
    setFormData(prev => ({
      ...prev,
      title: resource.title,
      body: resource.content,
      tags: [...prev.tags, ...resource.tags].filter((tag, index, self) => 
        self.indexOf(tag) === index && !prev.tags.includes(tag)
      ).slice(0, 5) // Limit to 5 tags
    }));
    
    // Switch back to editor tab
    setActiveTab('editor');
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
          <LinkCreator
            linkUrl={formData.link || ''}
            onChange={(url) => handleInputChange('link', url)}
            metadata={linkMetadata}
            onMetadataChange={setLinkMetadata}
            error={errors.find(e => e.field === 'link')?.message}
            isCustomized={isCustomizingLink}
            onToggleCustomize={setIsCustomizingLink}
            customTitle={customLinkTitle}
            onCustomTitleChange={(title) => {
              setCustomLinkTitle(title);
              handleInputChange('title', title);
            }}
            customDescription={customLinkDescription}
            onCustomDescriptionChange={(desc) => {
              setCustomLinkDescription(desc);
              handleInputChange('body', desc);
            }}
          />
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
            
            <PollCreator
              options={formData.pollOptions || ['', '']}
              onChange={(options) => handleInputChange('pollOptions', options)}
              duration={pollDuration}
              onDurationChange={setPollDuration}
              errors={errors.filter(e => e.field === 'pollOptions')}
            />
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
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as 'editor' | 'resources')}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="editor" className="flex-1">
            {activeTab === 'editor' ? (
              <span className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Content Editor
              </span>
            ) : (
              "Content Editor"
            )}
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex-1">
            {activeTab === 'resources' ? (
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Resources Library
              </span>
            ) : (
              "Resources Library"
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div>
                <label htmlFor="content-title" className="block text-sm font-medium mb-1">Title</label>
                <Input
                  id="content-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a descriptive title"
                  className="w-full"
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
              
              <CommunityGuidelines formData={formData} />
            </div>
            
            <div className="space-y-6">
              <RewardsPreview formData={formData} />
              
              <div className="bg-gray-50 p-4 rounded-md border">
                <h3 className="font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Content Tips
                </h3>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex items-start gap-1">
                    <span>•</span>
                    <span>Be clear and descriptive in your title to attract more readers</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span>•</span>
                    <span>Add relevant images to increase engagement</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span>•</span>
                    <span>Use tags to help others discover your content</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span>•</span>
                    <span>Preview your post before publishing to ensure it looks great</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="resources">
          <ResourcesLibrary 
            onSelectResource={handleSelectResource}
            currentContentType={formData.type}
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex items-center justify-between pt-6 border-t">
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
