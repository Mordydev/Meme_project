/**
 * Content Factory
 * 
 * Factory for generating content-related instances for testing.
 */
import { v4 as uuidv4 } from 'uuid';
import { createFactory } from './index';
import { userFactory } from './user';

// Define content model for TypeScript support
export interface Content {
  id: string;
  userId: string;
  type: 'text' | 'image' | 'link' | 'poll';
  contentText: string;
  mediaUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'deleted' | 'flagged';
}

// Create content factory with default values
export const contentFactory = createFactory<Content>({
  id: () => uuidv4(),
  userId: () => uuidv4(),
  type: () => {
    const types: ('text' | 'image' | 'link' | 'poll')[] = ['text', 'image', 'link', 'poll'];
    return types[Math.floor(Math.random() * types.length)];
  },
  contentText: () => `This is test content #${Math.floor(Math.random() * 1000)}`,
  mediaUrls: () => [],
  createdAt: () => new Date(),
  updatedAt: () => new Date(),
  status: 'active'
});

// Define comment model for TypeScript support
export interface Comment {
  id: string;
  contentId: string;
  userId: string;
  commentText: string;
  createdAt: Date;
  parentId?: string;
}

// Create comment factory with default values
export const commentFactory = createFactory<Comment>({
  id: () => uuidv4(),
  contentId: () => uuidv4(),
  userId: () => uuidv4(),
  commentText: () => `This is a test comment #${Math.floor(Math.random() * 1000)}`,
  createdAt: () => new Date()
});

// Associate content with user
export const userContentFactory = contentFactory.association('user', userFactory);

// Export factories with specific content types
export const textContentFactory = createFactory<Content>({
  ...contentFactory.create(),
  type: 'text',
  contentText: () => `This is test text content #${Math.floor(Math.random() * 1000)}`,
  mediaUrls: []
});

export const imageContentFactory = createFactory<Content>({
  ...contentFactory.create(),
  type: 'image',
  contentText: () => `Check out this image! #${Math.floor(Math.random() * 1000)}`,
  mediaUrls: () => [`https://picsum.photos/seed/${Math.random()}/500/300`]
});

export const linkContentFactory = createFactory<Content>({
  ...contentFactory.create(),
  type: 'link',
  contentText: () => `Check out this link! #${Math.floor(Math.random() * 1000)}`,
  mediaUrls: () => [`https://example.com/article/${Math.floor(Math.random() * 1000)}`]
});

export default {
  contentFactory,
  commentFactory,
  userContentFactory,
  textContentFactory,
  imageContentFactory,
  linkContentFactory
};
