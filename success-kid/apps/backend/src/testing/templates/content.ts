/**
 * Content Templates
 * 
 * Pre-defined content templates for common test scenarios.
 */
import { contentFactory, Content } from '../factories/content';

/**
 * Template for a text post
 */
export const textPostTemplate: Partial<Content> = {
  type: 'text',
  contentText: 'This is a sample text post for testing purposes.',
  mediaUrls: [],
  status: 'active'
};

/**
 * Template for an image post
 */
export const imagePostTemplate: Partial<Content> = {
  type: 'image',
  contentText: 'Check out this awesome image!',
  mediaUrls: ['https://picsum.photos/seed/1/800/600'],
  status: 'active'
};

/**
 * Template for a link post
 */
export const linkPostTemplate: Partial<Content> = {
  type: 'link',
  contentText: 'Interesting article about blockchain technology.',
  mediaUrls: ['https://example.com/blockchain-article'],
  status: 'active'
};

/**
 * Template for a poll post
 */
export const pollPostTemplate: Partial<Content> = {
  type: 'poll',
  contentText: 'What feature would you like to see next?',
  mediaUrls: [],
  status: 'active'
};

/**
 * Template for a trending post
 */
export const trendingPostTemplate: Partial<Content> = {
  type: 'text',
  contentText: 'This is a trending post with lots of engagement!',
  mediaUrls: [],
  status: 'active'
};

/**
 * Template for a flagged post
 */
export const flaggedPostTemplate: Partial<Content> = {
  type: 'text',
  contentText: 'This post has been flagged for review.',
  mediaUrls: [],
  status: 'flagged'
};

/**
 * Template for a deleted post
 */
export const deletedPostTemplate: Partial<Content> = {
  type: 'text',
  contentText: 'This post has been deleted.',
  mediaUrls: [],
  status: 'deleted'
};

/**
 * Create content from a template
 * 
 * @param template Content template to use
 * @param overrides Additional properties to override
 * @returns The created content
 */
export function createContentFromTemplate(
  template: Partial<Content>,
  overrides: Partial<Content> = {}
): Content {
  return contentFactory.create({
    ...template,
    ...overrides
  });
}

// Default export for convenient imports
export default {
  textPostTemplate,
  imagePostTemplate,
  linkPostTemplate,
  pollPostTemplate,
  trendingPostTemplate,
  flaggedPostTemplate,
  deletedPostTemplate,
  createContentFromTemplate
};
