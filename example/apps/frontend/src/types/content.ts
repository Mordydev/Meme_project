/**
 * Represents content created on the Wild 'n Out platform
 */
export interface Content {
  id: string;
  userId: string;
  creatorName: string;
  creatorAvatar?: string;
  title: string;
  type: ContentType;
  body?: string;
  mediaUrl?: string;
  additionalMedia?: string[];
  tags?: string[];
  contextType: 'battle' | 'community';
  battleId?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'moderation' | 'rejected';
}

/**
 * Content types supported by the platform
 */
export type ContentType = 'text' | 'image' | 'audio' | 'video' | 'mixed';

/**
 * Content data for creation/editing
 */
export interface ContentData {
  title?: string;
  type?: ContentType;
  body?: string;
  mediaUrl?: string;
  additionalMedia?: string[];
  tags?: string[];
  contextType?: 'battle' | 'community';
  battleId?: string;
  status?: 'draft' | 'published';
}

/**
 * Content metadata for publishing
 */
export interface ContentMetadata {
  title?: string;
  tags?: string[];
  contextType?: 'battle' | 'community';
  battleId?: string;
}

/**
 * Battle-specific rules for content
 */
export interface BattleRules {
  mediaTypes?: ContentType[];
  minLength?: number;
  maxLength?: number;
  submissionTimeLimit?: number;
  maxEntries?: number;
}

/**
 * Draft content for local storage
 */
export interface ContentDraft extends ContentData {
  draftId: string;
  lastEdited: string;
}
