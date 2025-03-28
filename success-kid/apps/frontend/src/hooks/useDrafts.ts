'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContentFormData, DraftItem, SaveStatus } from '@/types/content-creation';
import { apiClient } from '@/lib/api/api-client';

// Mock implementation for drafts
const STORAGE_KEY = 'SUCCESS_KID_CONTENT_DRAFTS';

export function useDrafts(userId: string) {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  
  // Load drafts from local storage (mock implementation)
  const loadDrafts = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      setIsLoading(true);
      // In a real implementation, we would fetch from the API
      // For now, we'll use localStorage as a mock
      const storedDrafts = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (storedDrafts) {
        setDrafts(JSON.parse(storedDrafts));
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);
  
  // Save drafts to local storage (mock implementation)
  const saveDraftsToStorage = useCallback((updatedDrafts: DraftItem[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Failed to save drafts to storage:', error);
    }
  }, [userId]);
  
  // Generate a preview from content data
  const generatePreview = (data: ContentFormData): string => {
    let preview = '';
    
    if (data.type === 'text' || data.type === 'poll') {
      // Extract plain text from HTML content (simplified)
      const div = document.createElement('div');
      div.innerHTML = data.body;
      preview = div.textContent || div.innerText || '';
      preview = preview.substring(0, 150) + (preview.length > 150 ? '...' : '');
    } else if (data.type === 'link') {
      preview = data.link || '';
    } else if (data.type === 'image') {
      preview = 'Image post';
    }
    
    return preview || 'Draft post';
  };
  
  // Save a draft
  const saveDraft = useCallback(async (data: ContentFormData): Promise<string> => {
    try {
      setSaveStatus('saving');
      
      // In a real implementation, we'd call the API
      // For now, we'll simulate a save by updating local storage
      const now = new Date().toISOString();
      const draftId = data.id || `draft_${Date.now()}`;
      
      const preview = generatePreview(data);
      
      // Find thumbnail if available
      let thumbnailUrl: string | undefined = undefined;
      if (data.media.length > 0) {
        const firstImage = data.media.find(m => m.file.type.startsWith('image/'));
        if (firstImage) {
          thumbnailUrl = firstImage.previewUrl;
        }
      }
      
      const draftItem: DraftItem = {
        id: draftId,
        type: data.type,
        title: data.title || 'Untitled',
        preview,
        thumbnailUrl,
        updatedAt: now,
        createdAt: now
      };
      
      // Store metadata in drafts list
      const existingIndex = drafts.findIndex(d => d.id === draftId);
      let newDrafts: DraftItem[];
      
      if (existingIndex >= 0) {
        // Update existing draft
        newDrafts = [...drafts];
        newDrafts[existingIndex] = {
          ...draftItem,
          createdAt: drafts[existingIndex].createdAt
        };
      } else {
        // Add new draft
        newDrafts = [draftItem, ...drafts];
      }
      
      setDrafts(newDrafts);
      saveDraftsToStorage(newDrafts);
      
      // Store full content data
      localStorage.setItem(`${STORAGE_KEY}_${draftId}`, JSON.stringify(data));
      setActiveId(draftId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaveStatus('saved');
      return draftId;
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSaveStatus('error');
      throw error;
    }
  }, [drafts, saveDraftsToStorage]);
  
  // Get a draft by ID
  const getDraft = useCallback((id: string): ContentFormData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const storedDraft = localStorage.getItem(`${STORAGE_KEY}_${id}`);
      if (storedDraft) {
        return JSON.parse(storedDraft);
      }
    } catch (error) {
      console.error('Failed to get draft:', error);
    }
    
    return null;
  }, []);
  
  // Delete a draft
  const deleteDraft = useCallback(async (id: string) => {
    try {
      // In a real implementation, we'd call the API
      // For now, we'll simulate by updating local storage
      const newDrafts = drafts.filter(draft => draft.id !== id);
      setDrafts(newDrafts);
      saveDraftsToStorage(newDrafts);
      
      // Remove the full content data
      localStorage.removeItem(`${STORAGE_KEY}_${id}`);
      
      if (activeId === id) {
        setActiveId(null);
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return true;
    } catch (error) {
      console.error('Failed to delete draft:', error);
      return false;
    }
  }, [drafts, activeId, saveDraftsToStorage]);
  
  return {
    drafts,
    saveDraft,
    getDraft,
    deleteDraft,
    isLoading,
    activeId,
    saveStatus
  };
}
