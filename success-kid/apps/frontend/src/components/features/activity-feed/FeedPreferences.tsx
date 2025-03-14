'use client';

import React, { useState } from 'react';
import { useFeedPreferences, useUpdateFeedPreferences } from '@/hooks/queries/useActivityFeed';
import { FeedPreferences as FeedPreferencesType } from './types';

interface FeedPreferencesProps {
  onClose?: () => void;
}

/**
 * Component for managing feed personalization preferences
 */
export function FeedPreferences({ onClose }: FeedPreferencesProps) {
  const { data: currentPreferences, isLoading } = useFeedPreferences();
  const { mutate: updatePreferences, isLoading: isSaving } = useUpdateFeedPreferences();
  
  // Local state for form
  const [preferences, setPreferences] = useState<Partial<FeedPreferencesType>>({
    interests: [],
    followedUsers: [],
    contentTypes: ['all'],
    viewMode: 'standard'
  });
  
  // Update local state when data loads
  React.useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences);
    }
  }, [currentPreferences]);
  
  // Interest options
  const interestOptions = [
    { id: 'community', label: 'Community' },
    { id: 'tokens', label: 'Tokens & Trading' },
    { id: 'development', label: 'Platform Development' },
    { id: 'memes', label: 'Memes & Fun' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'market', label: 'Market Updates' },
    { id: 'tutorials', label: 'Tutorials & Learning' }
  ];
  
  // Content type options
  const contentTypeOptions = [
    { id: 'all', label: 'All Content Types' },
    { id: 'post', label: 'Text Posts' },
    { id: 'media', label: 'Images & Videos' },
    { id: 'activity', label: 'User Activities' },
    { id: 'achievement', label: 'Achievements' }
  ];
  
  // Handle interest toggle
  const handleInterestToggle = (interestId: string) => {
    setPreferences(prev => {
      const current = prev.interests || [];
      const updated = current.includes(interestId)
        ? current.filter(id => id !== interestId)
        : [...current, interestId];
      
      return {
        ...prev,
        interests: updated
      };
    });
  };
  
  // Handle content type toggle
  const handleContentTypeToggle = (typeId: string) => {
    setPreferences(prev => {
      // If selecting 'all', clear other selections
      if (typeId === 'all') {
        return {
          ...prev,
          contentTypes: ['all']
        };
      }
      
      // Otherwise update selection, removing 'all' if present
      const current = prev.contentTypes || [];
      const withoutAll = current.filter(id => id !== 'all');
      const updated = withoutAll.includes(typeId)
        ? withoutAll.filter(id => id !== typeId)
        : [...withoutAll, typeId];
      
      // If nothing selected, default back to 'all'
      return {
        ...prev,
        contentTypes: updated.length > 0 ? updated : ['all']
      };
    });
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode: 'standard' | 'compact') => {
    setPreferences(prev => ({
      ...prev,
      viewMode: mode
    }));
  };
  
  // Handle save
  const handleSave = () => {
    updatePreferences(preferences, {
      onSuccess: () => {
        if (onClose) onClose();
      }
    });
  };
  
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-2">
      <div>
        <h3 className="text-lg font-medium mb-2">Feed Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Customize your feed to see content that matters most to you.
        </p>
      </div>
      
      {/* Interests Section */}
      <div>
        <h4 className="font-medium mb-2">Topics of Interest</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {interestOptions.map(interest => (
            <label 
              key={interest.id}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={preferences.interests?.includes(interest.id) || false}
                onChange={() => handleInterestToggle(interest.id)}
                className="rounded text-primary focus:ring-primary"
              />
              <span>{interest.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Content Types Section */}
      <div>
        <h4 className="font-medium mb-2">Content Types</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {contentTypeOptions.map(type => (
            <label
              key={type.id}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={preferences.contentTypes?.includes(type.id) || false}
                onChange={() => handleContentTypeToggle(type.id)}
                className="rounded text-primary focus:ring-primary"
                disabled={type.id === 'all' && preferences.contentTypes?.length === 1}
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* View Mode Section */}
      <div>
        <h4 className="font-medium mb-2">Display Mode</h4>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="viewMode"
              checked={preferences.viewMode === 'standard'}
              onChange={() => handleViewModeChange('standard')}
              className="text-primary focus:ring-primary"
            />
            <span>Standard View</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="viewMode"
              checked={preferences.viewMode === 'compact'}
              onChange={() => handleViewModeChange('compact')}
              className="text-primary focus:ring-primary"
            />
            <span>Compact View</span>
          </label>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-muted/50"
            disabled={isSaving}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
}

export default FeedPreferences;
