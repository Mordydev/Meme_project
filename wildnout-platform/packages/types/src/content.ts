/**
 * Content types for the Wild 'n Out platform
 */

export interface Content {
  id: string;
  creatorId: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'mixed';
  title: string;
  body?: string;
  mediaUrl?: string;
  battleId?: string; // If content is part of a battle
  status: 'draft' | 'published' | 'moderation' | 'rejected';
  metadata: {
    tags?: string[];
    categories?: string[];
    location?: string;
    deviceInfo?: string;
  };
  metrics: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  parentType: 'content' | 'comment';
  parentId: string;
  creatorId: string;
  body: string;
  status: 'published' | 'moderation' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Reaction {
  id: string;
  targetType: 'content' | 'comment' | 'battle';
  targetId: string;
  userId: string;
  reactionType: string;
  createdAt: Date;
}
