/**
 * Content Fixtures
 * 
 * Provides standard test data for content
 */
import { v4 as uuid } from 'uuid';
import { testUsers } from './users';

// Test content items
export const testContent = {
  /**
   * Text post
   */
  textPost: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    type: 'text',
    title: 'My First Post',
    content: 'This is my first post on the platform! Excited to be part of the community.',
    media_urls: [],
    created_at: new Date('2023-06-10T15:20:00.000Z'),
    updated_at: new Date('2023-06-10T15:20:00.000Z'),
    status: 'active',
  },
  
  /**
   * Image post
   */
  imagePost: {
    id: uuid(),
    user_id: testUsers.highLevelUser.id,
    type: 'image',
    title: 'Check out this meme',
    content: 'Found this hilarious Success Kid meme!',
    media_urls: ['https://placekitten.com/500/300'],
    created_at: new Date('2023-06-12T11:15:00.000Z'),
    updated_at: new Date('2023-06-12T11:15:00.000Z'),
    status: 'active',
  },
  
  /**
   * Link post
   */
  linkPost: {
    id: uuid(),
    user_id: testUsers.adminUser.id,
    type: 'link',
    title: 'Interesting article about crypto',
    content: 'https://example.com/crypto-article',
    media_urls: [],
    created_at: new Date('2023-06-08T09:30:00.000Z'),
    updated_at: new Date('2023-06-08T09:30:00.000Z'),
    status: 'active',
  },
  
  /**
   * Poll post
   */
  pollPost: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    type: 'poll',
    title: 'What feature do you want next?',
    content: JSON.stringify({
      question: 'What feature would you like to see next?',
      options: [
        { id: uuid(), text: 'More achievements' },
        { id: uuid(), text: 'Improved wallet integration' },
        { id: uuid(), text: 'Better leaderboards' },
        { id: uuid(), text: 'More points opportunities' },
      ],
      end_date: new Date('2023-07-15T23:59:59.000Z'),
    }),
    media_urls: [],
    created_at: new Date('2023-06-15T16:45:00.000Z'),
    updated_at: new Date('2023-06-15T16:45:00.000Z'),
    status: 'active',
  },
  
  /**
   * Deleted post
   */
  deletedPost: {
    id: uuid(),
    user_id: testUsers.standardUser.id,
    type: 'text',
    title: 'Post to be deleted',
    content: 'This post will be deleted.',
    media_urls: [],
    created_at: new Date('2023-06-05T14:10:00.000Z'),
    updated_at: new Date('2023-06-05T14:30:00.000Z'),
    status: 'deleted',
  },
};

// Test comments
export const testComments = {
  /**
   * Standard comment
   */
  standardComment: {
    id: uuid(),
    content_id: testContent.textPost.id,
    user_id: testUsers.highLevelUser.id,
    text: 'Great first post! Welcome to the community.',
    created_at: new Date('2023-06-10T15:35:00.000Z'),
    parent_id: null,
  },
  
  /**
   * Admin comment
   */
  adminComment: {
    id: uuid(),
    content_id: testContent.textPost.id,
    user_id: testUsers.adminUser.id,
    text: 'Welcome to the platform! Let me know if you need any help.',
    created_at: new Date('2023-06-10T16:05:00.000Z'),
    parent_id: null,
  },
  
  /**
   * Reply comment
   */
  replyComment: {
    id: uuid(),
    content_id: testContent.textPost.id,
    user_id: testUsers.standardUser.id,
    text: 'Thanks for the warm welcome!',
    created_at: new Date('2023-06-10T16:20:00.000Z'),
    parent_id: null, // This would reference standardComment.id in a real implementation
  },
};

// Content for each user
export const userContent = {
  // Standard user content
  [testUsers.standardUser.id]: [
    testContent.textPost,
    testContent.pollPost,
    testContent.deletedPost,
  ],
  
  // Admin user content
  [testUsers.adminUser.id]: [
    testContent.linkPost,
  ],
  
  // High-level user content
  [testUsers.highLevelUser.id]: [
    testContent.imagePost,
  ],
};

// Comments for each content
export const contentComments = {
  // Comments on text post
  [testContent.textPost.id]: [
    testComments.standardComment,
    testComments.adminComment,
    testComments.replyComment,
  ],
  
  // Comments on image post
  [testContent.imagePost.id]: [
    {
      id: uuid(),
      content_id: testContent.imagePost.id,
      user_id: testUsers.standardUser.id,
      text: 'This is hilarious! 😂',
      created_at: new Date('2023-06-12T11:30:00.000Z'),
      parent_id: null,
    },
  ],
  
  // Comments on link post
  [testContent.linkPost.id]: [
    {
      id: uuid(),
      content_id: testContent.linkPost.id,
      user_id: testUsers.highLevelUser.id,
      text: 'Great article, thanks for sharing!',
      created_at: new Date('2023-06-08T10:15:00.000Z'),
      parent_id: null,
    },
  ],
};

/**
 * Get content feed items
 */
export function getContentFeed(limit: number = 10): any[] {
  // Combine all active content
  const allContent = Object.values(testContent)
    .filter(content => content.status === 'active')
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, limit);
  
  // Enhance with user info
  return allContent.map(content => {
    const user = Object.values(testUsers).find(u => u.id === content.user_id);
    const comments = contentComments[content.id] || [];
    
    return {
      ...content,
      user: {
        id: user?.id,
        display_name: user?.display_name || 'Unknown User',
        profile_image: user?.profile_image || '',
        level: user?.level || 1,
      },
      comment_count: comments.length,
    };
  });
}

/**
 * Get comments for a content item
 */
export function getCommentsForContent(contentId: string): any[] {
  return contentComments[contentId] || [];
}

/**
 * Get content for a user
 */
export function getContentForUser(userId: string): any[] {
  return userContent[userId] || [];
}
