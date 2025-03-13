'use client';

import React, { useState } from 'react';
import { CategorySelector } from '../CategorySystem/CategorySelector';

interface PublishControlsProps {
  categoryId: string;
  onCategoryChange: (categoryId: string) => void;
  onTagsChange: (tags: string[]) => void;
  tags: string[];
  isSubmitting: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
  canPublish: boolean;
}

/**
 * Component containing publishing options and controls
 */
export function PublishControls({ 
  categoryId,
  onCategoryChange,
  onTagsChange,
  tags,
  isSubmitting,
  onPublish,
  onSaveDraft,
  canPublish = false,
}: PublishControlsProps) {
  const [tagInput, setTagInput] = useState('');
  
  // Handle adding tags
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag) return;
    
    // Remove any special characters and spaces
    const cleanTag = trimmedTag.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').toLowerCase();
    
    // Don't add if already exists or exceeds limit
    if (tags.includes(cleanTag) || tags.length >= 5) return;
    
    onTagsChange([...tags, cleanTag]);
    setTagInput('');
  };
  
  // Handle removing tags
  const handleRemoveTag = (tag: string) => {
    onTagsChange(tags.filter(t => t !== tag));
  };
  
  // Handle keyboard events for tag input
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Category selector */}
      <CategorySelector
        selectedCategoryId={categoryId}
        onCategorySelect={onCategoryChange}
        label="Category"
        required={true}
      />
      
      {/* Tags input */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center">
          Tags
          <span className="text-muted-foreground ml-2 text-xs">
            (Optional, max 5)
          </span>
        </label>
        
        <div className="flex items-center">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="flex-1 p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Add tags (press Enter to add)"
            maxLength={20}
            disabled={tags.length >= 5}
          />
          
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || tags.length >= 5}
            className="ml-2 px-3 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            Add
          </button>
        </div>
        
        {/* Tag list */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map(tag => (
              <div key={tag} className="inline-flex items-center bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm">
                #{tag}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="px-4 py-2 border rounded-md text-muted-foreground hover:text-foreground"
        >
          Save Draft
        </button>
        
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isSubmitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        >
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}

export default PublishControls;
