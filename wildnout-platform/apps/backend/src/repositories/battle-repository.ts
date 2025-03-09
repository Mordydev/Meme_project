import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';
import { NotFoundError } from '../lib/errors';

/**
 * Battle model interface
 */
export interface BattleModel {
  id: string;
  title: string;
  description: string;
  battleType: 'wildStyle' | 'pickUpKillIt' | 'rAndBeef' | 'tournament';
  rules: {
    prompt: string;
    mediaTypes: string[];
    maxDuration?: number;
    minLength?: number;
    maxLength?: number;
    additionalRules?: string[];
  };
  status: 'draft' | 'scheduled' | 'open' | 'voting' | 'completed';
  creatorId: string;
  startTime: Date;
  endTime: Date;
  votingStartTime: Date;
  votingEndTime: Date;
  participantCount: number;
  entryCount: number;
  voteCount: number;
  featured: boolean;
  exampleEntries: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository for handling Battle data
 */
export class BattleRepository extends BaseRepository<BattleModel> {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'battles');
  }

  /**
   * Get battles by status
   */
  async getBattlesByStatus(status: BattleModel['status'], limit = 20, cursor?: string): Promise<{
    battles: BattleModel[];
    hasMore: boolean;
    cursor?: string;
  }> {
    const result = await this.findManyWithPagination(
      { status },
      { limit, cursor, cursorField: 'id' }
    );
    
    return {
      battles: result.data,
      hasMore: result.hasMore,
      cursor: result.cursor
    };
  }

  /**
   * Get featured battles
   */
  async getFeaturedBattles(limit = 5): Promise<BattleModel[]> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('featured', true)
      .eq('status', 'open')
      .order('startTime', { ascending: false })
      .limit(limit);
    
    if (error) {
      this.logger.error(error, 'Failed to get featured battles');
      throw new Error('Failed to get featured battles');
    }
    
    return data;
  }

  /**
   * Get battles by creator
   */
  async getBattlesByCreator(creatorId: string, limit = 20, cursor?: string): Promise<{
    battles: BattleModel[];
    hasMore: boolean;
    cursor?: string;
  }> {
    const result = await this.findManyWithPagination(
      { creatorId },
      { limit, cursor, cursorField: 'id' }
    );
    
    return {
      battles: result.data,
      hasMore: result.hasMore,
      cursor: result.cursor
    };
  }

  /**
   * Get battle with detailed info including participation counts
   */
  async getBattleWithDetails(battleId: string): Promise<BattleModel> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        creator:user_profiles!creatorId(id, username, displayName, imageUrl)
      `)
      .eq('id', battleId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('battle', battleId);
      }
      
      this.logger.error(error, `Failed to get battle with ID ${battleId}`);
      throw new Error(`Failed to get battle with ID ${battleId}`);
    }
    
    return data;
  }

  /**
   * Update battle participation counts
   */
  async updateParticipationCounts(battleId: string, updates: {
    participantCount?: number;
    entryCount?: number;
    voteCount?: number;
  }): Promise<BattleModel> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update(updates)
      .eq('id', battleId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('battle', battleId);
      }
      
      this.logger.error(error, `Failed to update battle counts for ID ${battleId}`);
      throw new Error(`Failed to update battle counts for ID ${battleId}`);
    }
    
    return data;
  }

  /**
   * Update battle status
   */
  async updateBattleStatus(battleId: string, status: BattleModel['status']): Promise<BattleModel> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({
        status,
        updatedAt: new Date()
      })
      .eq('id', battleId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('battle', battleId);
      }
      
      this.logger.error(error, `Failed to update battle status for ID ${battleId}`);
      throw new Error(`Failed to update battle status for ID ${battleId}`);
    }
    
    return data;
  }

  /**
   * Get active battles that need status updates
   * (e.g., scheduled battles that should be opened, 
   * open battles that should move to voting, etc.)
   */
  async getBattlesForStatusUpdate(): Promise<BattleModel[]> {
    const now = new Date();
    
    // Find scheduled battles that should be open
    const { data: scheduledToOpen, error: error1 } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('status', 'scheduled')
      .lt('startTime', now)
      .gt('endTime', now);
    
    if (error1) {
      this.logger.error(error1, 'Failed to query scheduled battles');
      throw new Error('Failed to query scheduled battles');
    }
    
    // Find open battles that should move to voting
    const { data: openToVoting, error: error2 } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('status', 'open')
      .lt('endTime', now)
      .gt('votingEndTime', now);
    
    if (error2) {
      this.logger.error(error2, 'Failed to query open battles');
      throw new Error('Failed to query open battles');
    }
    
    // Find voting battles that should be completed
    const { data: votingToCompleted, error: error3 } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('status', 'voting')
      .lt('votingEndTime', now);
    
    if (error3) {
      this.logger.error(error3, 'Failed to query voting battles');
      throw new Error('Failed to query voting battles');
    }
    
    return [
      ...scheduledToOpen,
      ...openToVoting,
      ...votingToCompleted
    ];
  }
}
