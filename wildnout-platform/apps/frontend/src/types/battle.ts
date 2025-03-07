/**
 * Represents a battle in the Wild 'n Out platform
 */
export interface Battle {
  id: string;
  title: string;
  description: string;
  battleType: 'wildStyle' | 'pickUpKillIt' | 'rAndBeef' | 'tournament';
  creatorId: string;
  status: 'scheduled' | 'active' | 'voting' | 'completed';
  startTime: string;
  endTime: string;
  votingStartTime: string;
  votingEndTime: string;
  participantCount: number;
  entryCount: number;
  voteCount: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a participant in a battle
 */
export interface BattleParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  submissionTime: string;
}

/**
 * Represents an entry in a battle
 */
export interface BattleEntry {
  id: string;
  battleId: string;
  userId: string;
  creatorName: string;
  creatorAvatar?: string;
  content: {
    type: 'text' | 'image' | 'audio' | 'video' | 'mixed';
    body?: string;
    mediaUrl?: string;
    additionalMedia?: string[];
  };
  voteCount: number;
  rank?: number;
  submissionTime: string;
}

/**
 * Battle creation parameters
 */
export interface CreateBattleParams {
  title: string;
  description: string;
  battleType: Battle['battleType'];
  startTime?: string;
  endTime: string;
  rules?: {
    maxParticipants?: number;
    submissionTimeLimit?: number;
    mediaTypes?: string[];
  };
}

/**
 * Battle entry submission parameters
 */
export interface SubmitBattleEntryParams {
  battleId: string;
  content: {
    type: BattleEntry['content']['type'];
    body?: string;
    mediaUrl?: string;
    additionalMedia?: string[];
  };
}

/**
 * Battle vote parameters
 */
export interface VoteBattleEntryParams {
  battleId: string;
  entryId: string;
}
