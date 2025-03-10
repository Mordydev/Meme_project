/**
 * Battle types for the Wild 'n Out platform
 */

export type BattleType = 'wildStyle' | 'pickUpKillIt' | 'rAndBeef' | 'tournament';

export type BattleStatus = 'draft' | 'scheduled' | 'open' | 'voting' | 'completed';

export interface Battle {
  id: string;
  title: string;
  description: string;
  battleType: BattleType;
  rules: BattleRules;
  status: BattleStatus;
  creatorId: string;
  startTime: Date;
  endTime: Date;
  votingStartTime: Date;
  votingEndTime: Date;
  participantCount: number;
  entryCount: number;
  voteCount: number;
  featured: boolean;
  exampleEntries?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BattleRules {
  prompt: string;
  mediaTypes: string[];
  maxDuration?: number;
  minLength?: number;
  maxLength?: number;
  additionalRules?: string[];
}

export interface BattleEntry {
  id: string;
  battleId: string;
  userId: string;
  content: {
    type: 'text' | 'image' | 'audio' | 'video' | 'mixed';
    body?: string;
    mediaUrl?: string;
    additionalMedia?: string[];
  };
  metadata: {
    deviceInfo?: string;
    creationTime?: number;
    tags?: string[];
  };
  moderation: {
    status: 'pending' | 'approved' | 'rejected';
    reviewerId?: string;
    reviewedAt?: Date;
    reason?: string;
  };
  metrics: {
    viewCount: number;
    voteCount: number;
    commentCount: number;
    shareCount: number;
  };
  rank?: number;
  submissionTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
