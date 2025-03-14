'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentType } from '@/types';

interface DraftItem {
  id: string;
  title: string;
  type: ContentType;
  previewText?: string;
  lastUpdated: string;
}

/**
 * Page for viewing and managing content drafts
 */
export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  
  // Load drafts on mount
  useEffect(() => {
    try {
      const storedDrafts = localStorage.getItem('content_drafts');
      if (storedDrafts) {
        const parsedDrafts = JSON.parse(storedDrafts);
        setDrafts(parsedDrafts);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit'
      });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Handle draft selection
  const toggleDraftSelection = (id: string) => {
    if (selectedDrafts.includes(id)) {
      setSelectedDrafts(selectedDrafts.filter(draftId => draftId !== id));
    } else {
      setSelectedDrafts([...selectedDrafts, id]);
    }
  };
  
  // Handle edit draft action
  const editDraft = (id: string) => {
    router.push(`/community/create?draft=${id}`);
  };
  
  // Handle delete draft(s) action
  const deleteDrafts = (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length > 1 ? 'these drafts' : 'this draft'}?`)) {
      return;
    }
    
    const updatedDrafts = drafts.filter(draft => !ids.includes(draft.id));
    setDrafts(updatedDrafts);
    localStorage.setItem('content_drafts', JSON.stringify(updatedDrafts));
    setSelectedDrafts([]);
  };
  
  // Get content type label
  const getContentTypeLabel = (type: ContentType) => {
    const labels: Record<ContentType, string> = {
      text: 'Text post',
      image: 'Image post',
      link: 'Link share',
      poll: 'Poll'
    };
    return labels[type] || 'Post';
  };
  
  // Create new post
  const createNewPost = () => {
    router.push('/community/create');
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedDrafts.length === drafts.length) {
      setSelectedDrafts([]);
    } else {
      setSelectedDrafts(drafts.map(draft => draft.id));
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Drafts</h1>
        
        <div className="flex space-x-3">
          <button
            onClick={createNewPost}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Post
          </button>
        </div>
      </div>
      
      {drafts.length > 0 ? (
        <>
          {/* Actions bar */}
          <div className="bg-muted/50 px-4 py-2 rounded-md mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedDrafts.length === drafts.length && drafts.length > 0}
                onChange={handleSelectAll}
                className="rounded cursor-pointer"
              />
              <label htmlFor="select-all" className="text-sm">
                {selectedDrafts.length === 0 ? (
                  'Select all'
                ) : (
                  `Selected ${selectedDrafts.length} of ${drafts.length}`
                )}
              </label>
            </div>
            
            {selectedDrafts.length > 0 && (
              <button
                onClick={() => deleteDrafts(selectedDrafts)}
                className="text-alert hover:text-alert/80 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Delete Selected
              </button>
            )}
          </div>
          
          {/* Drafts list */}
          <div className="space-y-3">
            {drafts.map(draft => (
              <div 
                key={draft.id} 
                className={`border rounded-md overflow-hidden ${
                  selectedDrafts.includes(draft.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                } transition-colors`}
              >
                <div className="flex p-4">
                  <div className="mr-3 mt-0.5">
                    <input
                      type="checkbox"
                      checked={selectedDrafts.includes(draft.id)}
                      onChange={() => toggleDraftSelection(draft.id)}
                      className="rounded cursor-pointer h-5 w-5"
                    />
                  </div>
                  
                  <div className="flex-1" onClick={() => editDraft(draft.id)} style={{ cursor: 'pointer' }}>
                    <h3 className="font-medium text-lg">
                      {draft.title || "Untitled draft"}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {draft.previewText || "No content preview available"}
                    </p>
                    
                    <div className="flex items-center mt-2 text-xs text-muted-foreground space-x-2">
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {getContentTypeLabel(draft.type)}
                      </span>
                      <span>•</span>
                      <span>Edited {formatDate(draft.lastUpdated)}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col gap-2 justify-center">
                    <button
                      onClick={() => editDraft(draft.id)}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      Continue Editing
                    </button>
                    <button
                      onClick={() => deleteDrafts([draft.id])}
                      className="text-alert hover:text-alert/80 text-sm"
                    >
                      Delete Draft
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-muted/30 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          
          <h2 className="text-xl font-medium mb-2">No drafts yet</h2>
          <p className="text-muted-foreground mb-6">
            Your post drafts will appear here for easy access and editing.
          </p>
          
          <button
            onClick={createNewPost}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Create Your First Post
          </button>
        </div>
      )}
    </div>
  );
}
