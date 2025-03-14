'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentType } from '@/types';

export interface DraftContent {
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

interface DraftManagerProps {
  children: React.ReactNode;
  onLoadDraft?: (draft: DraftContent) => void;
}

/**
 * DraftManager component to handle draft saving and management
 */
export function DraftManager({ children, onLoadDraft }: DraftManagerProps) {
  const [drafts, setDrafts] = useState<DraftContent[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const router = useRouter();

  // Load drafts on mount
  useEffect(() => {
    const storedDrafts = localStorage.getItem('content_drafts');
    if (storedDrafts) {
      try {
        const parsedDrafts = JSON.parse(storedDrafts);
        setDrafts(parsedDrafts);
      } catch (error) {
        console.error('Failed to parse stored drafts:', error);
      }
    }
  }, []);

  // Save draft to local storage
  const saveDraft = (draft: Omit<DraftContent, 'id' | 'lastUpdated'>) => {
    const newDraft: DraftContent = {
      ...draft,
      id: `draft_${Date.now()}`, // Generate unique ID
      lastUpdated: new Date().toISOString(),
      previewText: draft.content.replace(/<[^>]*>/g, '').slice(0, 100), // Strip HTML and limit length
    };

    const updatedDrafts = [newDraft, ...drafts.filter(d => d.id !== newDraft.id)];
    setDrafts(updatedDrafts);
    localStorage.setItem('content_drafts', JSON.stringify(updatedDrafts));
    
    return newDraft.id;
  };

  // Delete a draft
  const deleteDraft = (id: string) => {
    const updatedDrafts = drafts.filter(draft => draft.id !== id);
    setDrafts(updatedDrafts);
    localStorage.setItem('content_drafts', JSON.stringify(updatedDrafts));
  };

  // Load a draft
  const loadDraft = (id: string) => {
    const draft = drafts.find(d => d.id === id);
    if (draft && onLoadDraft) {
      onLoadDraft(draft);
      setShowDrafts(false);
    }
  };

  // Navigate to create page with new draft
  const createNewDraft = () => {
    router.push('/community/create');
    setShowDrafts(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Draft selection dialog */}
      {showDrafts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Your Drafts</h2>
              <button 
                onClick={() => setShowDrafts(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {drafts.length > 0 ? (
                <div className="space-y-3">
                  {drafts.map(draft => (
                    <div key={draft.id} className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg truncate">{draft.title || "Untitled draft"}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {draft.previewText || "No content"}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <span className="capitalize">{draft.type}</span>
                            <span className="mx-2">•</span>
                            <span>Last edited {formatDate(draft.lastUpdated)}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => loadDraft(draft.id)}
                            className="text-primary hover:text-primary/80 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            className="text-alert hover:text-alert/80 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">You don't have any drafts yet.</p>
                </div>
              )}
            </div>
            
            <div className="border-t p-4 flex justify-between">
              <button
                onClick={createNewDraft}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Create New Post
              </button>
              <button
                onClick={() => setShowDrafts(false)}
                className="px-4 py-2 border rounded-md text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Provider context */}
      <div className="draft-manager-context">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              // @ts-ignore - We're adding props dynamically
              draftManager: {
                saveDraft,
                deleteDraft,
                loadDraft,
                drafts,
                showDrafts: () => setShowDrafts(true),
              }
            });
          }
          return child;
        })}
      </div>
    </div>
  );
}

export default DraftManager;
