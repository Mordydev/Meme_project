'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContentType } from '@/types';

export interface ContentDraft {
  id: string;
  title: string;
  content: string;
  type: ContentType;
  categoryId: string;
  tags: string[];
  mediaUrls: string[];
  lastUpdated: string;
  previewText?: string;
}

export interface DraftManagerOptions {
  autoSaveInterval?: number; // milliseconds
  maxDrafts?: number;
}

/**
 * Hook for managing content drafts
 */
export function useDraftManagement(options: DraftManagerOptions = {}) {
  const {
    autoSaveInterval = 30000, // Default: save every 30 seconds
    maxDrafts = 20, // Default: store up to 20 drafts
  } = options;
  
  // State
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // Load drafts from storage on mount
  useEffect(() => {
    try {
      const storedDrafts = localStorage.getItem('content_drafts');
      if (storedDrafts) {
        const parsedDrafts: ContentDraft[] = JSON.parse(storedDrafts);
        setDrafts(parsedDrafts);
      }
    } catch (error) {
      console.error('Failed to load drafts from storage:', error);
    }
  }, []);
  
  // Save drafts to storage when they change
  useEffect(() => {
    try {
      localStorage.setItem('content_drafts', JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to save drafts to storage:', error);
    }
  }, [drafts]);
  
  // Auto-save current draft if dirty
  useEffect(() => {
    if (!isDirty || !currentDraftId) return;
    
    const autoSaveTimer = setTimeout(() => {
      // This will trigger the save callback in the dependency array
      setIsDirty(false);
      setLastSaved(new Date());
    }, autoSaveInterval);
    
    return () => clearTimeout(autoSaveTimer);
  }, [isDirty, currentDraftId, autoSaveInterval]);
  
  /**
   * Save a draft to storage
   */
  const saveDraft = useCallback((draft: Omit<ContentDraft, 'id' | 'lastUpdated' | 'previewText'>) => {
    const now = new Date();
    const previewText = draft.content.replace(/<[^>]*>/g, '').slice(0, 100); // Strip HTML and limit length
    
    let newDraft: ContentDraft;
    let updatedDrafts: ContentDraft[];
    
    if (currentDraftId) {
      // Update existing draft
      newDraft = {
        ...draft,
        id: currentDraftId,
        lastUpdated: now.toISOString(),
        previewText,
      };
      
      updatedDrafts = drafts.map(d => 
        d.id === currentDraftId ? newDraft : d
      );
    } else {
      // Create new draft
      newDraft = {
        ...draft,
        id: `draft_${Date.now()}`,
        lastUpdated: now.toISOString(),
        previewText,
      };
      
      // Add new draft at the beginning, maintain max drafts limit
      updatedDrafts = [newDraft, ...drafts].slice(0, maxDrafts);
    }
    
    setDrafts(updatedDrafts);
    setCurrentDraftId(newDraft.id);
    setLastSaved(now);
    setIsDirty(false);
    
    return newDraft.id;
  }, [currentDraftId, drafts, maxDrafts]);
  
  /**
   * Mark current draft as dirty (needs saving)
   */
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);
  
  /**
   * Delete a draft from storage
   */
  const deleteDraft = useCallback((id: string) => {
    const updatedDrafts = drafts.filter(draft => draft.id !== id);
    setDrafts(updatedDrafts);
    
    if (currentDraftId === id) {
      setCurrentDraftId(null);
    }
  }, [drafts, currentDraftId]);
  
  /**
   * Load a draft by ID
   */
  const loadDraft = useCallback((id: string) => {
    const draft = drafts.find(d => d.id === id);
    if (draft) {
      setCurrentDraftId(id);
      return draft;
    }
    return null;
  }, [drafts]);
  
  /**
   * Get the current active draft
   */
  const getCurrentDraft = useCallback(() => {
    if (!currentDraftId) return null;
    return drafts.find(d => d.id === currentDraftId) || null;
  }, [drafts, currentDraftId]);
  
  return {
    drafts,
    currentDraftId,
    lastSaved,
    isDirty,
    saveDraft,
    markDirty,
    deleteDraft,
    loadDraft,
    getCurrentDraft,
  };
}

export default useDraftManagement;
