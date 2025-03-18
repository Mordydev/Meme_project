'use client';

import {
  initDatabase,
  storeData,
  getData,
  getAllData,
  deleteData,
  queryByIndex,
  queueOfflineAction,
  STORES
} from './offline-db';

/**
 * Content item type
 */
interface ContentItem {
  id: string;
  type: string;
  title?: string;
  body?: string;
  media?: string[];
  authorId: string;
  authorName: string;
  timestamp: number;
  comments?: number;
  likes?: number;
  // Any other fields
}

/**
 * Post draft type
 */
interface PostDraft {
  localId: string;
  title: string;
  body: string;
  media?: string[];
  timestamp: number;
  status: 'draft' | 'pending' | 'synced' | 'failed';
  serverId?: string;
  error?: string;
}

/**
 * Comment draft type
 */
interface CommentDraft {
  localId: string;
  contentId: string;
  body: string;
  timestamp: number;
  status: 'draft' | 'pending' | 'synced' | 'failed';
  serverId?: string;
  error?: string;
}

/**
 * Queued action type
 */
interface QueuedAction {
  id?: number;
  type: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  attempts?: number;
  error?: string;
}

/**
 * Cache a content item for offline access
 */
export async function cacheContentItem(content: ContentItem): Promise<ContentItem> {
  return storeData<ContentItem>(STORES.CONTENT, {
    ...content,
    timestamp: content.timestamp || Date.now()
  });
}

/**
 * Get a cached content item by ID
 */
export async function getCachedContent(contentId: string): Promise<ContentItem | null> {
  return getData<ContentItem>(STORES.CONTENT, contentId);
}

/**
 * Get all cached content items, optionally filtered by type
 */
export async function getAllCachedContent(type?: string): Promise<ContentItem[]> {
  if (!type) {
    return getAllData<ContentItem>(STORES.CONTENT);
  }
  
  return queryByIndex<ContentItem>(STORES.CONTENT, 'type', type);
}

/**
 * Save a post draft for offline creation
 */
export async function savePostDraft(draft: PostDraft): Promise<PostDraft> {
  // Generate a local ID if not provided
  if (!draft.localId) {
    draft.localId = `draft_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  
  return storeData<PostDraft>(STORES.POSTS, {
    ...draft,
    timestamp: draft.timestamp || Date.now(),
    status: draft.status || 'draft'
  });
}

/**
 * Get all post drafts
 */
export async function getAllPostDrafts(): Promise<PostDraft[]> {
  return getAllData<PostDraft>(STORES.POSTS);
}

/**
 * Get draft posts by status
 */
export async function getDraftsByStatus(status: string): Promise<PostDraft[]> {
  return queryByIndex<PostDraft>(STORES.POSTS, 'status', status);
}

/**
 * Save a comment draft for offline creation
 */
export async function saveCommentDraft(draft: CommentDraft): Promise<CommentDraft> {
  // Generate a local ID if not provided
  if (!draft.localId) {
    draft.localId = `comment_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
  
  return storeData<CommentDraft>(STORES.COMMENTS, {
    ...draft,
    timestamp: draft.timestamp || Date.now(),
    status: draft.status || 'draft'
  });
}

/**
 * Get comment drafts by content ID
 */
export async function getCommentDraftsByContentId(contentId: string): Promise<CommentDraft[]> {
  return queryByIndex<CommentDraft>(STORES.COMMENTS, 'contentId', contentId);
}

/**
 * Queue an offline action to be processed when online
 */
export async function queueAction(type: string, payload: any): Promise<number> {
  const action: QueuedAction = {
    type,
    payload,
    timestamp: Date.now(),
    status: 'pending',
    attempts: 0
  };
  
  return queueOfflineAction(action);
}

/**
 * Get all queued actions by status
 */
export async function getQueuedActionsByStatus(status: string): Promise<QueuedAction[]> {
  return queryByIndex<QueuedAction>(STORES.QUEUED_ACTIONS, 'status', status);
}

/**
 * Update a queued action's status
 */
export async function updateActionStatus(
  actionId: number, 
  status: 'pending' | 'processing' | 'failed' | 'completed',
  error?: string
): Promise<void> {
  const action = await getData<QueuedAction>(STORES.QUEUED_ACTIONS, actionId);
  
  if (!action) {
    throw new Error(`Action with ID ${actionId} not found`);
  }
  
  return storeData<QueuedAction>(STORES.QUEUED_ACTIONS, {
    ...action,
    status,
    error,
    attempts: status === 'failed' ? (action.attempts || 0) + 1 : action.attempts
  });
}

/**
 * Monitor online status and process queued actions when online
 */
export function setupOfflineSync(processingCallback?: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op for SSR
  }
  
  const handleOnline = async () => {
    console.log('Device is online. Processing queued actions...');
    
    if (processingCallback) {
      processingCallback();
    }
    
    // Trigger sync via Service Worker if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await registration.sync.register('sync-posts');
        await registration.sync.register('sync-interactions');
      } catch (error) {
        console.error('Background sync registration error:', error);
        // Fall back to manual processing
        processQueuedActions();
      }
    } else {
      // No SyncManager support, process manually
      processQueuedActions();
    }
  };
  
  // Process actions when we come online
  window.addEventListener('online', handleOnline);
  
  // If we're already online when this is called, process any pending actions
  if (navigator.onLine) {
    setTimeout(handleOnline, 1000); // Small delay to ensure DB is initialized
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * Process any queued actions manually
 */
async function processQueuedActions(): Promise<void> {
  try {
    // Get all pending actions
    const pendingActions = await getQueuedActionsByStatus('pending');
    
    // Process each action in sequence
    for (const action of pendingActions) {
      if (!action.id) continue;
      
      // Mark action as processing
      await updateActionStatus(action.id, 'processing');
      
      try {
        // Process based on action type
        switch (action.type) {
          case 'create_post':
            await processCreatePostAction(action);
            break;
          case 'create_comment':
            await processCreateCommentAction(action);
            break;
          case 'like_content':
            await processLikeContentAction(action);
            break;
          // Add more action types as needed
          default:
            console.warn(`Unknown action type: ${action.type}`);
            await updateActionStatus(action.id, 'failed', 'Unknown action type');
        }
      } catch (error) {
        console.error(`Error processing action ${action.id}:`, error);
        await updateActionStatus(action.id, 'failed', error.message);
      }
    }
    
    console.log(`Processed ${pendingActions.length} queued actions`);
  } catch (error) {
    console.error('Error processing queued actions:', error);
  }
}

/**
 * Process a create post action
 */
async function processCreatePostAction(action: QueuedAction): Promise<void> {
  if (!action.id) return;
  
  try {
    // Extract draft post data
    const { localId } = action.payload;
    
    // Get the draft post
    const draft = await getData<PostDraft>(STORES.POSTS, localId);
    
    if (!draft) {
      throw new Error(`Draft post with ID ${localId} not found`);
    }
    
    // Call the API to create the post
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: draft.title,
        body: draft.body,
        media: draft.media
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.statusText}`);
    }
    
    const createdPost = await response.json();
    
    // Update the draft with the server ID and status
    await storeData<PostDraft>(STORES.POSTS, {
      ...draft,
      serverId: createdPost.id,
      status: 'synced'
    });
    
    // Mark action as completed
    await updateActionStatus(action.id, 'completed');
  } catch (error) {
    // Mark action as failed
    await updateActionStatus(action.id, 'failed', error.message);
    
    // Re-throw the error
    throw error;
  }
}

/**
 * Process a create comment action
 */
async function processCreateCommentAction(action: QueuedAction): Promise<void> {
  if (!action.id) return;
  
  try {
    // Extract draft comment data
    const { localId } = action.payload;
    
    // Get the draft comment
    const draft = await getData<CommentDraft>(STORES.COMMENTS, localId);
    
    if (!draft) {
      throw new Error(`Draft comment with ID ${localId} not found`);
    }
    
    // Call the API to create the comment
    const response = await fetch(`/api/content/${draft.contentId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body: draft.body
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create comment: ${response.statusText}`);
    }
    
    const createdComment = await response.json();
    
    // Update the draft with the server ID and status
    await storeData<CommentDraft>(STORES.COMMENTS, {
      ...draft,
      serverId: createdComment.id,
      status: 'synced'
    });
    
    // Mark action as completed
    await updateActionStatus(action.id, 'completed');
  } catch (error) {
    // Mark action as failed
    await updateActionStatus(action.id, 'failed', error.message);
    
    // Re-throw the error
    throw error;
  }
}

/**
 * Process a like content action
 */
async function processLikeContentAction(action: QueuedAction): Promise<void> {
  if (!action.id) return;
  
  try {
    // Extract like data
    const { contentId, like } = action.payload;
    
    // Call the API to like/unlike the content
    const response = await fetch(`/api/content/${contentId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        like
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to ${like ? 'like' : 'unlike'} content: ${response.statusText}`);
    }
    
    // Mark action as completed
    await updateActionStatus(action.id, 'completed');
  } catch (error) {
    // Mark action as failed
    await updateActionStatus(action.id, 'failed', error.message);
    
    // Re-throw the error
    throw error;
  }
}
