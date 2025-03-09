import { FastifyInstance   
  /**
   * Get entries with user voting history for personalized battle experience
   */
  async getEntriesWithUserVotes(
    battleId: string,
    userId: string,
    limit = 50,
    cursor?: string
  ): Promise<{
    entries: (EntryModel & { hasVoted: boolean })[];
    hasMore: boolean;
    cursor?: string;
  }> {
    try {
      // Get entries for the battle
      const { entries, hasMore, cursor: nextCursor } = 
        await this.getEntriesByBattle(battleId, limit, cursor);
      
      if (!entries.length) {
        return { entries: [], hasMore: false };
      }
      
      // Get user votes for these entries
      const entryIds = entries.map(entry => entry.id);
      const { data: userVotes, error } = await this.db
        .from('battle_votes')
        .select('entryId')
        .eq('voterId', userId)
        .in('entryId', entryIds);
      
      if (error) {
        this.logger.error(error, 'Failed to fetch user votes');
        throw new Error('Failed to fetch user votes');
      }
      
      // Create a set of entry IDs that the user has voted for
      const votedEntryIds = new Set(userVotes.map(vote => vote.entryId));
      
      // Add hasVoted flag to each entry
      const entriesWithVotes = entries.map(entry => ({
        ...entry,
        hasVoted: votedEntryIds.has(entry.id)
      }));
      
      return {
        entries: entriesWithVotes,
        hasMore,
        cursor: nextCursor
      };
    } catch (error) {
      this.logger.error(error, `Failed to get entries with user votes for battle ${battleId}`);
      throw new Error(`Failed to get entries with user votes`);
    }
  }
  
  /**
   * Count user entries for a battle to enforce submission limits
   */
  async countUserEntriesForBattle(userId: string, battleId: string, transaction?: any): Promise<number> {
    try {
      const db = transaction || this.db;
      
      const { count, error } = await db
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('battleId', battleId);
      
      if (error) {
        this.logger.error(error, `Failed to count user entries for battle ${battleId}`);
        throw new Error(`Failed to count user entries`);
      }
      
      return count || 0;
    } catch (error) {
      this.logger.error(error, `Error counting user entries for battle ${battleId}`);
      throw new Error(`Error counting user entries`);
    }
  }
} from 'fastify';
import { BaseRepository } from './core/base-repository';
import { NotFoundError } from '../lib/errors';

/**
 * Battle entry model interface
 */
export interface EntryModel {
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

/**
 * Vote model interface
 */
export interface VoteModel {
  id: string;
  entryId: string;
  battleId: string;
  voterId: string;
  createdAt: Date;
}

/**
 * Repository for handling Battle Entries
 */
export class EntryRepository extends BaseRepository<EntryModel> {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'battle_entries');
  }

  /**
   * Get entries for a battle
   */
  async getEntriesByBattle(battleId: string, limit = 50, cursor?: string): Promise<{
    entries: EntryModel[];
    hasMore: boolean;
    cursor?: string;
  }> {
    const result = await this.findManyWithPagination(
      { battleId, 'moderation.status': 'approved' },
      { limit, cursor, cursorField: 'id' }
    );
    
    return {
      entries: result.data,
      hasMore: result.hasMore,
      cursor: result.cursor
    };
  }

  /**
   * Get entries by a specific user
   */
  async getEntriesByUser(userId: string, limit = 20, cursor?: string): Promise<{
    entries: EntryModel[];
    hasMore: boolean;
    cursor?: string;
  }> {
    const result = await this.findManyWithPagination(
      { userId },
      { limit, cursor, cursorField: 'id' }
    );
    
    return {
      entries: result.data,
      hasMore: result.hasMore,
      cursor: result.cursor
    };
  }

  /**
   * Get entry with user and battle details including comprehensive metadata
   */
  async getEntryWithDetails(entryId: string): Promise<EntryModel & {
    user: {
      id: string;
      username: string;
      displayName: string;
      imageUrl: string;
      badges?: string[];
    };
    battle: {
      id: string;
      title: string;
      battleType: string;
      status: string;
      rules: Record<string, any>;
    };
    votes?: {
      count: number;
      recentVoters: {
        id: string;
        username: string;
        displayName: string;
      }[];
    };
  }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        user:user_profiles!userId(id, username, displayName, imageUrl),
        battle:battles!battleId(id, title, battleType, status)
      `)
      .eq('id', entryId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('entry', entryId);
      }
      
      this.logger.error(error, `Failed to get entry with ID ${entryId}`);
      throw new Error(`Failed to get entry with ID ${entryId}`);
    }
    
    return data;
  }

  /**
   * Check if a user has already submitted to a battle
   */
  async hasUserSubmittedToBattle(userId: string, battleId: string): Promise<boolean> {
    const count = await this.count({ userId, battleId });
    return count > 0;
  }

  /**
   * Vote for an entry with transaction safety and rate limiting
   */
  async voteForEntry(entryId: string, voterId: string, battleId: string): Promise<void> {
    // Run everything in a transaction for data consistency
    await this.transaction(async (tx) => {
      // First check if already voted
      const { data: existingVote, error: checkError } = await tx
        .from('battle_votes')
        .select('id')
        .eq('entryId', entryId)
        .eq('voterId', voterId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        this.logger.error(checkError, 'Failed to check existing vote');
        throw new Error('Failed to check existing vote');
      }
      
      // If already voted, we're done
      if (existingVote) {
        return;
      }
      
      // Check for rate limiting (prevent vote spam)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const { count, error: countError } = await tx
        .from('battle_votes')
        .select('id', { count: 'exact', head: true })
        .eq('voterId', voterId)
        .eq('battleId', battleId)
        .gte('createdAt', fiveMinutesAgo.toISOString());
      
      if (countError) {
        this.logger.error(countError, 'Failed to check vote rate limit');
        throw new Error('Failed to check vote rate limit');
      }
      
      // Rate limit: max 20 votes per 5 minutes per battle
      if (count && count >= 20) {
        throw new AppError(
          'rate_limit_exceeded',
          'You are voting too quickly. Please wait a moment before voting again.',
          429
        );
      }
      
      // Create new vote record with additional analytics data
      const { error: insertError } = await tx
        .from('battle_votes')
        .insert({
          entryId,
          battleId,
          voterId,
          createdAt: new Date(),
          metadata: {
            voterIp: request?.ip || null,
            userAgent: request?.headers?.['user-agent'] || null,
            referrer: request?.headers?.referer || null
          }
        });
      
      if (insertError) {
        this.logger.error(insertError, 'Failed to create vote record');
        throw new Error('Failed to create vote record');
      }
      
      // Update vote count on entry with proper concurrency handling
      const { error: updateError } = await tx
        .from(this.tableName)
        .update({
          'metrics.voteCount': this.db.rpc('increment_vote_count', { entry_id: entryId }),
          updatedAt: new Date()
        })
        .eq('id', entryId);
      
      if (updateError) {
        this.logger.error(updateError, `Failed to update vote count for entry ${entryId}`);
        throw new Error(`Failed to update vote count for entry ${entryId}`);
      }
      
      // Update vote count on battle
      const { error: battleUpdateError } = await tx
        .from('battles')
        .update({
          voteCount: this.db.rpc('increment_battle_vote_count', { battle_id: battleId }),
          updatedAt: new Date()
        })
        .eq('id', battleId);
      
      if (battleUpdateError) {
        this.logger.error(battleUpdateError, `Failed to update vote count for battle ${battleId}`);
        throw new Error(`Failed to update vote count for battle ${battleId}`);
      }
    });
  }

  /**
   * Get votes for an entry
   */
  async getVotesForEntry(entryId: string): Promise<VoteModel[]> {
    const { data, error } = await this.db
      .from('battle_votes')
      .select('*')
      .eq('entryId', entryId);
    
    if (error) {
      this.logger.error(error, `Failed to get votes for entry ${entryId}`);
      throw new Error(`Failed to get votes for entry ${entryId}`);
    }
    
    return data;
  }

  /**
   * Calculate battle results and update entry rankings with enhanced tie-breaking
   */
  async calculateBattleResults(battleId: string): Promise<EntryModel[]> {
    try {
      // Get all entries for this battle with creator details for tie-breaking
      const { data: entries, error } = await this.db
        .from(this.tableName)
        .select(`
          *,
          creator:user_profiles!userId(id, username, createdAt, achievementCount)
        `)
        .eq('battleId', battleId)
        .eq('moderation.status', 'approved');
      
      if (error) {
        this.logger.error(error, `Failed to get entries for battle ${battleId}`);
        throw new Error(`Failed to get entries for battle ${battleId}`);
      }
      
      // No entries, nothing to do
      if (!entries || entries.length === 0) {
        return [];
      }
      
      // Sort entries by vote count with tie-breaking logic
      const sortedEntries = [...entries].sort((a, b) => {
        // Primary sort: vote count (descending)
        const voteComparison = (b.metrics?.voteCount || 0) - (a.metrics?.voteCount || 0);
        
        // If votes are equal, apply tie-breakers
        if (voteComparison === 0) {
          // Tie-breaker 1: Submission time (earlier submission wins)
          const timeComparison = new Date(a.submissionTime).getTime() - 
                               new Date(b.submissionTime).getTime();
          
          if (timeComparison !== 0) {
            return timeComparison;
          }
          
          // Tie-breaker 2: Creator achievement count (more achievements wins)
          const achievementComparison = (b.creator?.achievementCount || 0) - 
                                      (a.creator?.achievementCount || 0);
          
          if (achievementComparison !== 0) {
            return achievementComparison;
          }
          
          // Last resort tie-breaker: alphabetical by entry ID
          return a.id.localeCompare(b.id);
        }
        
        return voteComparison;
      });
      
      // Assign ranks with handling for ties
      const rankedEntries: { id: string; rank: number; tiedWith?: string[] }[] = [];
      let currentRank = 1;
      let currentVoteCount = -1;
      let tiedEntries: string[] = [];
      
      sortedEntries.forEach((entry, index) => {
        const voteCount = entry.metrics?.voteCount || 0;
        
        // Check if this entry has the same votes as the previous one
        if (index > 0 && voteCount === currentVoteCount) {
          // It's a tie - use same rank
          tiedEntries.push(entry.id);
          rankedEntries.push({
            id: entry.id,
            rank: currentRank,
            tiedWith: [...tiedEntries]
          });
        } else {
          // New rank
          currentRank = index + 1;
          currentVoteCount = voteCount;
          tiedEntries = [entry.id];
          rankedEntries.push({
            id: entry.id,
            rank: currentRank
          });
        }
      });
      
      // Use transaction to update all entries
      await this.transaction(async (tx) => {
        for (const entry of rankedEntries) {
          await tx
            .from(this.tableName)
            .update({ 
              rank: entry.rank,
              tiedWith: entry.tiedWith || null,
              updatedAt: new Date()
            })
            .eq('id', entry.id);
        }
        
        // Also update battle to mark results as calculated
        await tx
          .from('battles')
          .update({ 
            resultsCalculatedAt: new Date(),
            updatedAt: new Date()
          })
          .eq('id', battleId);
      });
      
      // Return updated entries
      const { data: updatedEntries, error: fetchError } = await this.db
        .from(this.tableName)
        .select(`
          *,
          creator:user_profiles!userId(id, username, displayName, imageUrl)
        `)
        .eq('battleId', battleId)
        .order('rank', { ascending: true });
      
      if (fetchError) {
        this.logger.error(fetchError, `Failed to fetch updated entries for battle ${battleId}`);
        throw new Error(`Failed to fetch updated entries for battle ${battleId}`);
      }
      
      // Log results for analytics and monitoring
      this.logger.info({
        battleId,
        entryCount: updatedEntries.length,
        winner: updatedEntries[0]?.id,
        resultsCalculatedAt: new Date().toISOString()
      }, 'Battle results calculated successfully');
      
      return updatedEntries;
    } catch (error) {
      this.logger.error(error, `Failed to calculate results for battle ${battleId}`);
      throw new Error(`Failed to calculate results for battle ${battleId}`);
    }
  }

  /**
   * Moderate an entry
   */
  async moderateEntry(
    entryId: string, 
    status: 'approved' | 'rejected', 
    reviewerId: string, 
    reason?: string
  ): Promise<EntryModel> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({
        moderation: {
          status,
          reviewerId,
          reviewedAt: new Date(),
          reason
        },
        updatedAt: new Date()
      })
      .eq('id', entryId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('entry', entryId);
      }
      
      this.logger.error(error, `Failed to moderate entry ${entryId}`);
      throw new Error(`Failed to moderate entry ${entryId}`);
    }
    
    return data;
  }
}
