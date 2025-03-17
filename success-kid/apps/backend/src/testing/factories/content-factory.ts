/**
 * Content Factory
 * 
 * Provides functions for creating test content data
 */
import { v4 as uuid } from 'uuid';

// Content types
export type ContentType = 'text' | 'image' | 'link' | 'poll';

// Content status
export type ContentStatus = 'active' | 'deleted' | 'flagged';

/**
 * Content creation parameters
 */
export interface CreateContentParams {
  id?: string;
  userId: string;
  type?: ContentType;
  title?: string;
  content?: string;
  mediaUrls?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  status?: ContentStatus;
}

/**
 * Create a test content item
 */
export function createContent(params: CreateContentParams): any {
  const id = params.id || uuid();
  const type = params.type || 'text';
  
  // Generate default content based on type
  let defaultContent = '';
  let defaultTitle = '';
  let defaultMediaUrls: string[] = [];
  
  switch (type) {
    case 'text':
      defaultTitle = 'Test Text Post';
      defaultContent = 'This is a test text post content. It contains some text for testing purposes.';
      break;
    case 'image':
      defaultTitle = 'Test Image Post';
      defaultContent = 'Check out this test image!';
      defaultMediaUrls = [`https://placekitten.com/500/300?image=${id}`];
      break;
    case 'link':
      defaultTitle = 'Test Link Post';
      defaultContent = 'https://example.com';
      break;
    case 'poll':
      defaultTitle = 'Test Poll Post';
      defaultContent = JSON.stringify({
        question: 'What is your favorite test option?',
        options: [
          { id: uuid(), text: 'Option A' },
          { id: uuid(), text: 'Option B' },
          { id: uuid(), text: 'Option C' },
        ],
      });
      break;
  }
  
  const now = new Date();
  
  return {
    id,
    user_id: params.userId,
    type,
    title: params.title || defaultTitle,
    content: params.content || defaultContent,
    media_urls: params.mediaUrls || defaultMediaUrls,
    created_at: params.createdAt || now,
    updated_at: params.updatedAt || now,
    status: params.status || 'active',
  };
}

/**
 * Create multiple content items
 */
export function createContentItems(count: number, baseParams: CreateContentParams): any[] {
  const items = [];
  
  for (let i = 0; i < count; i++) {
    // Cycle through content types
    const contentTypes: ContentType[] = ['text', 'image', 'link', 'poll'];
    const type = contentTypes[i % contentTypes.length];
    
    items.push(createContent({
      ...baseParams,
      type,
      createdAt: new Date(Date.now() - i * 3600000), // Spread out over time
    }));
  }
  
  return items;
}

/**
 * Create a comment on content
 */
export interface CreateCommentParams {
  id?: string;
  contentId: string;
  userId: string;
  text: string;
  createdAt?: Date;
  parentId?: string;
}

/**
 * Create a test comment
 */
export function createComment(params: CreateCommentParams): any {
  return {
    id: params.id || uuid(),
    content_id: params.contentId,
    user_id: params.userId,
    text: params.text,
    created_at: params.createdAt || new Date(),
    parent_id: params.parentId || null,
  };
}

/**
 * Create multiple comments
 */
export function createComments(count: number, baseParams: Omit<CreateCommentParams, 'text'>): any[] {
  const comments = [];
  
  for (let i = 0; i < count; i++) {
    comments.push(createComment({
      ...baseParams,
      text: `Test comment #${i + 1}`,
      createdAt: new Date(Date.now() - i * 120000), // 2 minutes apart
    }));
  }
  
  return comments;
}
