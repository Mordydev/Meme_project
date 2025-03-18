/**
 * Optimistic Content Component
 * 
 * Demonstrates real-time content creation with optimistic updates
 * for an interactive user experience.
 */
'use client';

import React, { useState } from 'react';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';
import { useWebSocketContext } from '@/components/providers/WebSocketProvider';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Content item interface
 */
interface ContentItem {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  status?: 'pending' | 'success' | 'error';
}

/**
 * Feed state interface
 */
interface FeedState {
  items: ContentItem[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
}

/**
 * Optimistic Content component
 */
export function OptimisticContent() {
  const { user } = useAuth();
  const { connected } = useWebSocketContext();
  const [newContent, setNewContent] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Optimistic updates for the feed
  const {
    state: feed,
    status: feedStatus,
    applyUpdate,
    failedUpdates,
    retryUpdate,
    discardUpdate
  } = useOptimisticUpdate<FeedState>({
    initialState: {
      items: [],
      isLoading: false,
      hasMore: true,
      error: null
    },
    // Custom rollback function for feed items
    rollbackUpdate: (state, update) => {
      // If the update added items, remove them
      if ('items' in update && Array.isArray(update.items)) {
        const newItems = state.items.filter(item => 
          !update.items.some((updatedItem: ContentItem) => updatedItem.id === item.id)
        );
        return { ...state, items: newItems };
      }
      return state;
    }
  });
  
  /**
   * Submit new content with optimistic update
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newContent.trim()) {
      return;
    }
    
    // Clear previous errors
    setSubmitError(null);
    
    // Create temporary ID
    const tempId = `temp-${Date.now()}`;
    
    // Create temporary content item
    const tempItem: ContentItem = {
      id: tempId,
      text: newContent,
      authorId: user?.id || 'unknown',
      authorName: user?.name || 'Anonymous',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Apply optimistic update
    const result = await applyUpdate(
      { items: [tempItem, ...feed.items] },
      async (update) => {
        try {
          // Actually submit the content to the API
          const response = await fetch('/api/content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: newContent
            })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create content');
          }
          
          // Get the real content item
          const realItem = await response.json();
          
          // Replace the temporary item with the real one
          const updatedItems = feed.items.map(item => 
            item.id === tempId ? { ...realItem, status: 'success' } : item
          );
          
          return { items: updatedItems };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setSubmitError(errorMessage);
          throw error;
        }
      }
    );
    
    // Clear input on success
    if (result.applied) {
      setNewContent('');
    }
  };
  
  /**
   * Retry failed content submission
   */
  const handleRetry = async (updateId: string) => {
    await retryUpdate(updateId, async (update) => {
      try {
        // Extract the content item from the update
        const failedItem = update.items?.[0];
        
        if (!failedItem) {
          throw new Error('No content to retry');
        }
        
        // Submit the content again
        const response = await fetch('/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: failedItem.text
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create content');
        }
        
        // Get the real content item
        const realItem = await response.json();
        
        // Replace the temporary item with the real one
        const updatedItems = feed.items.map(item => 
          item.id === failedItem.id ? { ...realItem, status: 'success' } : item
        );
        
        return { items: updatedItems };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSubmitError(errorMessage);
        throw error;
      }
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 p-6 rounded-lg border border-blue-100 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Create Content</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full bg-white"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-500">
                {connected ? 'Real-time updates active' : 'Offline mode'}
              </span>
            </div>
            
            <Button 
              type="submit" 
              disabled={!newContent.trim() || feedStatus === 'pending'}
            >
              {feedStatus === 'pending' && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Post
            </Button>
          </div>
          
          {submitError && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        </form>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Feed</h3>
        
        {feed.items.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8">
            No content yet. Be the first to post!
          </p>
        ) : (
          feed.items.map((item) => (
            <Card key={item.id} className={`p-4 ${item.status === 'pending' ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{item.authorName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                
                {item.status === 'pending' && (
                  <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded flex items-center">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Sending...
                  </div>
                )}
                
                {item.status === 'error' && (
                  <div className="flex items-center space-x-2">
                    <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Failed
                    </div>
                    
                    <button
                      onClick={() => {
                        // Find the failed update
                        const failedUpdate = failedUpdates.find(u => 
                          u.update.items?.some((i: ContentItem) => i.id === item.id)
                        );
                        
                        if (failedUpdate) {
                          handleRetry(failedUpdate.id);
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Retry
                    </button>
                    
                    <button
                      onClick={() => {
                        // Find the failed update
                        const failedUpdate = failedUpdates.find(u => 
                          u.update.items?.some((i: ContentItem) => i.id === item.id)
                        );
                        
                        if (failedUpdate) {
                          discardUpdate(failedUpdate.id);
                        }
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Discard
                    </button>
                  </div>
                )}
                
                {item.status === 'success' && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Sent
                  </div>
                )}
              </div>
              
              <p className="mt-2">{item.text}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
