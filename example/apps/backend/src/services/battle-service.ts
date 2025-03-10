import { BattleRepository, BattleModel } from '../repositories/battle-repository';
import { EntryRepository, EntryModel, VoteModel } from '../repositories/entry-repository';
import { EventEmitter, EventType } from '../lib/events';
import { NotFoundError, ValidationError, ForbiddenError, AppError } from '../lib/errors';
import { TransactionManager } from '../lib/transaction';

/**
 * Type for battle status transitions
 */
type BattleStatusTransition = {
  from: BattleModel['status'][];
  to: BattleModel['status'];
  isValid: (battle: BattleModel) => boolean;
  executeTransition: (battle: BattleModel) => Promise<void>;
};

/**
 * Service for managing battle operations
 */
export class BattleService {
  private transactionManager: TransactionManager;
  
  // Define allowed status transitions with clear state machine pattern
  private readonly statusTransitions: BattleStatusTransition[] = [
    {
      from: ['draft'],
      to: 'scheduled',
      isValid: (battle) => {
        const now = new Date();
        return battle.startTime > now;
      }

  /**
   * Validate media URL format
   */
  private isValidMediaUrl(url: string): boolean {
    // Basic URL validation
    try {
      const parsedUrl = new URL(url);
      
      // Must be HTTPS
      if (parsedUrl.protocol !== 'https:') {
        return false;
      }
      
      // Check for allowed domains
      return (
        parsedUrl.hostname.endsWith('storage.wildnout.io') ||
        parsedUrl.hostname.endsWith('cdn.wildnout.io') ||
        parsedUrl.hostname.endsWith('media.wildnout.io')
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Validate image URL
   */
  private isValidImageUrl(url: string): boolean {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return validExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  /**
   * Validate audio URL
   */
  private isValidAudioUrl(url: string): boolean {
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
    return validExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  /**
   * Validate video URL
   */
  private isValidVideoUrl(url: string): boolean {
    const validExtensions = ['.mp4', '.webm', '.mov'];
    return validExtensions.some(ext => url.toLowerCase().endsWith(ext));
  }

  /**
   * Schedule a battle for future publishing
   */
  async scheduleBattle(battleId: string, scheduledTime: Date): Promise<BattleModel> {
    return this.transactionManager.execute(async (transaction) => {
      // Get current battle state
      const battle = await this.battleRepository.findById(battleId);
      
      if (!battle) {
        throw new NotFoundError('Battle', battleId);
      }
      
      // Validate battle is in draft status
      if (battle.status !== 'draft') {
        throw new ValidationError('Only battles in draft status can be scheduled');
      }
      
      // Validate scheduled time is in the future
      const now = new Date();
      if (scheduledTime <= now) {
        throw new ValidationError('Scheduled time must be in the future');
      }
      
      // Update battle
      const updatedBattle = await this.battleRepository.update(battleId, {
        status: 'scheduled',
        startTime: scheduledTime,
        updatedAt: now
      });
      
      // Emit event
      await this.eventEmitter.emit(EventType.BATTLE_UPDATED, {
        battleId,
        updatedFields: ['status', 'startTime'],
        timestamp: now.toISOString()
      });
      
      return updatedBattle;
    });
  };

  /**
   * Feature flag a battle to be highlighted in discovery
   */
  async featureBattle(battleId: string, featured: boolean): Promise<BattleModel> {
    // Validate battle exists
    const battle = await this.getBattleById(battleId);
    
    // Update battle featured flag
    const updatedBattle = await this.battleRepository.update(
      battleId, 
      { featured, updatedAt: new Date() }
    );
    
    // Emit event for update
    await this.eventEmitter.emit(EventType.BATTLE_UPDATED, {
      battleId, 
      updatedFields: ['featured'],
      timestamp: new Date().toISOString()
    });
    
    return updatedBattle;
  }

  /**
   * Get detailed battle analytics
   */
  async getBattleAnalytics(battleId: string): Promise<{
    participationRate: number;
    averageVotesPerEntry: number;
    topEntries: EntryModel[];
    userEngagement: {
      submissionsByHour: Record<number, number>;
      votesByHour: Record<number, number>;
    };
    demographics?: {
      returning: number;
      new: number;
    };
  }> {
    // Verify battle exists
    const battle = await this.getBattleById(battleId);
    
    // Get all entries
    const { entries } = await this.entryRepository.getEntriesByBattle(battleId, 100);
    
    // Calculate metrics
    const totalVotes = entries.reduce((sum, entry) => sum + (entry.metrics?.voteCount || 0), 0);
    const averageVotesPerEntry = entries.length > 0 ? totalVotes / entries.length : 0;
    
    // Get top entries by votes
    const topEntries = [...entries]
      .sort((a, b) => (b.metrics?.voteCount || 0) - (a.metrics?.voteCount || 0))
      .slice(0, 5);
    
    // Group submissions by hour of day
    const submissionsByHour: Record<number, number> = {};
    const votesByHour: Record<number, number> = {};
    
    // Initialize hours
    for (let hour = 0; hour < 24; hour++) {
      submissionsByHour[hour] = 0;
      votesByHour[hour] = 0;
    }
    
    // Count submissions by hour
    entries.forEach(entry => {
      const submissionHour = new Date(entry.submissionTime).getHours();
      submissionsByHour[submissionHour] = (submissionsByHour[submissionHour] || 0) + 1;
    });
    
    // For votes by hour, we'd need to fetch vote data with timestamps
    // This is a simplified version
    
    return {
      participationRate: battle.participantCount,
      averageVotesPerEntry,
      topEntries,
      userEngagement: {
        submissionsByHour,
        votesByHour
      },
      demographics: {
        returning: Math.floor(battle.participantCount * 0.7), // Placeholder
        new: Math.floor(battle.participantCount * 0.3) // Placeholder
      }
    };
  },
      executeTransition: async () => {
        // No special actions needed when moving to scheduled
      }
    },
    {
      from: ['draft', 'scheduled'],
      to: 'open',
      isValid: (battle) => {
        const now = new Date();
        return now >= battle.startTime && now < battle.endTime;
      },
      executeTransition: async (battle) => {
        await this.eventEmitter.emit(EventType.BATTLE_UPDATED, {
          battleId: battle.id,
          updatedFields: ['status'],
          timestamp: new Date().toISOString()
        });
      }
    },
    {
      from: ['open'],
      to: 'voting',
      isValid: (battle) => {
        const now = new Date();
        return now >= battle.endTime && now < battle.votingEndTime;
      },
      executeTransition: async (battle) => {
        await this.eventEmitter.emit(EventType.BATTLE_VOTING_STARTED, {
          battleId: battle.id,
          timestamp: new Date().toISOString()
        });
      }
    },
    {
      from: ['voting'],
      to: 'completed',
      isValid: (battle) => {
        const now = new Date();
        return now >= battle.votingEndTime;
      },
      executeTransition: async (battle) => {
        // Calculate final results
        await this.calculateAndPublishResults(battle.id);
      }
    }
  ];

  constructor(
    private battleRepository: BattleRepository,
    private entryRepository: EntryRepository,
    private eventEmitter: EventEmitter
  ) {
    // Initialize transaction manager
    this.transactionManager = new TransactionManager(
      this.battleRepository['db'],
      this.battleRepository['logger']
    );
  }

  /**
   * Register event handlers for this service
   */
  registerEventHandlers(): void {
    // Process status transitions when voting period starts
    this.eventEmitter.on(EventType.BATTLE_VOTING_STARTED, async (data) => {
      try {
        // No need to recalculate results here, will happen at completion
        this.battleRepository['logger'].info(
          { battleId: data.battleId },
          'Battle voting period started'
        );
      } catch (error) {
        // Log but don't rethrow to prevent event handler failures
        this.battleRepository['logger'].error(
          { error, battleId: data.battleId },
          'Error handling battle voting started event'
        );
      }
    });
    
    // Process battle completion when voting period ends
    this.eventEmitter.on(EventType.BATTLE_COMPLETED, async (data) => {
      try {
        this.battleRepository['logger'].info(
          { battleId: data.battleId, winnerId: data.winnerId },
          'Battle completed'
        );
        
        // Emit achievement progress for winner and participants
        if (data.winnerId) {
          await this.eventEmitter.emit(EventType.ACHIEVEMENT_PROGRESS, {
            userId: data.winnerId,
            achievementId: 'battle-winner',
            progress: 1,
            timestamp: data.timestamp
          });
        }
      } catch (error) {
        this.battleRepository['logger'].error(
          { error, battleId: data.battleId },
          'Error handling battle completed event'
        );
      }
    });
  }

  /**
   * Get all battles with pagination
   */
  async getAllBattles(
    status?: BattleModel['status'],
    limit = 20,
    cursor?: string
  ): Promise<{
    battles: BattleModel[];
    hasMore: boolean;
    cursor?: string;
  }> {
    if (status) {
      return this.battleRepository.getBattlesByStatus(status, limit, cursor);
    }
    
    const result = await this.battleRepository.findManyWithPagination(
      {},
      { limit, cursor, cursorField: 'id' }
    );
    
    return {
      battles: result.data,
      hasMore: result.hasMore,
      cursor: result.cursor
    };
  }

  /**
   * Get a single battle by ID
   */
  async getBattleById(battleId: string): Promise<BattleModel> {
    const battle = await this.battleRepository.getBattleWithDetails(battleId);
    
    if (!battle) {
      throw new NotFoundError('battle', battleId);
    }
    
    return battle;
  }

  /**
   * Create a new battle
   */
  async createBattle(creatorId: string, battleData: {
    title: string;
    description: string;
    battleType: BattleModel['battleType'];
    rules: BattleModel['rules'];
    startTime: Date;
    endTime: Date;
    votingEndTime: Date;
    maxEntriesPerUser?: number;
  }): Promise<BattleModel> {
    return this.transactionManager.execute(async (transaction) => {
      // Validate time constraints
      const now = new Date();
      const startTime = new Date(battleData.startTime);
      const endTime = new Date(battleData.endTime);
      const votingStartTime = endTime; // Voting starts when submission ends
      const votingEndTime = new Date(battleData.votingEndTime);
      
      if (startTime < now) {
        throw new ValidationError('Battle start time must be in the future');
      }
      
      if (endTime <= startTime) {
        throw new ValidationError('Battle end time must be after start time');
      }
      
      if (votingEndTime <= endTime) {
        throw new ValidationError('Voting end time must be after battle end time');
      }
      
      // Create the battle
      const battle = await this.battleRepository.create({
        title: battleData.title,
        description: battleData.description,
        battleType: battleData.battleType,
        rules: battleData.rules,
        status: startTime <= now ? 'open' : 'scheduled',
        creatorId,
        startTime,
        endTime,
        votingStartTime,
        votingEndTime,
        participantCount: 0,
        entryCount: 0,
        voteCount: 0,
        featured: false,
        exampleEntries: [],
        maxEntriesPerUser: battleData.maxEntriesPerUser || 1
      });
      
      // Emit event
      await this.eventEmitter.emit(EventType.BATTLE_CREATED, {
        battleId: battle.id,
        creatorId: battle.creatorId,
        battleType: battle.battleType,
        timestamp: new Date().toISOString()
      });
      
      return battle;
    });
  }

  /**
   * Update battle status with validation
   */
  async updateBattleStatus(battleId: string, status: BattleModel['status'], userId?: string): Promise<BattleModel> {
    return this.transactionManager.execute(async (transaction) => {
      // Get current battle state
      const battle = await this.battleRepository.findById(battleId);
      
      if (!battle) {
        throw new NotFoundError('Battle', battleId);
      }
      
      // Validate permission if userId provided
      if (userId && battle.creatorId !== userId) {
        throw new ForbiddenError('Only the battle creator can update its status');
      }
      
      // Validate state transition
      this.validateStatusTransition(battle.status, status, battle);
      
      // Perform status-specific operations
      await this.executeStatusTransitionLogic(battle, status);
      
      // Update battle status
      const updatedBattle = await this.battleRepository.update(
        battleId, 
        { status, updatedAt: new Date() }
      );
      
      // Emit event for status change
      await this.eventEmitter.emit(EventType.BATTLE_UPDATED, {
        battleId, 
        updatedFields: ['status'],
        timestamp: new Date().toISOString()
      });
      
      return updatedBattle;
    });
  }

  /**
   * Submit an entry to a battle
   */
  async submitEntry(
    battleId: string,
    userId: string,
    entryData: {
      content: EntryModel['content'];
      metadata?: EntryModel['metadata'];
    }
  ): Promise<EntryModel> {
    return this.transactionManager.execute(async (transaction) => {
      // Validate battle exists and is open
      const battle = await this.getBattleById(battleId);
      
      if (battle.status !== 'open') {
        throw new ValidationError(`Battle is not open for submissions (status: ${battle.status})`);
      }
      
      // Check if user has already submitted max entries
      const userEntryCount = await this.entryRepository.count({ 
        userId, 
        battleId 
      });
      
      const maxEntries = battle.maxEntriesPerUser || 1;
      
      if (userEntryCount >= maxEntries) {
        throw new ValidationError(
          `Maximum entries per user (${maxEntries}) exceeded for this battle`
        );
      }
      
      // Validate content against battle rules
      this.validateEntryContent(entryData.content, battle.rules);
      
      // Create the entry
      const entry = await this.entryRepository.create({
        battleId,
        userId,
        content: entryData.content,
        metadata: entryData.metadata || {
          tags: []
        },
        moderation: {
          status: 'pending', // All entries start as pending
        },
        metrics: {
          viewCount: 0,
          voteCount: 0,
          commentCount: 0,
          shareCount: 0
        },
        submissionTime: new Date()
      });
      
      // Update battle participation counts
      await this.battleRepository.updateParticipationCounts(battleId, {
        participantCount: battle.participantCount + 1,
        entryCount: battle.entryCount + 1
      });
      
      // Emit event
      await this.eventEmitter.emit(EventType.BATTLE_ENTRY_SUBMITTED, {
        battleId,
        entryId: entry.id,
        userId,
        timestamp: new Date().toISOString()
      });
      
      // Update user achievement progress
      await this.eventEmitter.emit(EventType.ACHIEVEMENT_PROGRESS, {
        userId,
        achievementId: 'battle-participant',
        progress: 1,
        timestamp: new Date().toISOString()
      });
      
      return entry;
    });
  }

  /**
   * Get entries for a battle
   */
  async getBattleEntries(
    battleId: string,
    limit = 50,
    cursor?: string
  ): Promise<{
    entries: EntryModel[];
    hasMore: boolean;
    cursor?: string;
  }> {
    // Verify battle exists
    const battle = await this.getBattleById(battleId);
    
    // Get entries
    return this.entryRepository.getEntriesByBattle(battleId, limit, cursor);
  }

  /**
   * Vote for a battle entry
   */
  async voteForEntry(entryId: string, voterId: string): Promise<void> {
    return this.transactionManager.execute(async (transaction) => {
      // Get entry to verify it exists and get battle ID
      const entry = await this.entryRepository.getEntryWithDetails(entryId);
      
      if (!entry) {
        throw new NotFoundError('entry', entryId);
      }
      
      // Verify battle is in voting phase
      const battle = await this.getBattleById(entry.battleId);
      
      if (battle.status !== 'voting') {
        throw new ValidationError(`Battle is not in voting phase (status: ${battle.status})`);
      }
      
      // Prevent voting for own entry
      if (entry.userId === voterId) {
        throw new ValidationError('You cannot vote for your own entry');
      }
      
      // Submit the vote
      await this.entryRepository.voteForEntry(entryId, voterId, battle.id);
      
      // Update user achievement progress for voting
      await this.eventEmitter.emit(EventType.ACHIEVEMENT_PROGRESS, {
        userId: voterId,
        achievementId: 'battle-voter',
        progress: 1,
        timestamp: new Date().toISOString()
      });
      
      // Create notification for the entry creator about receiving a vote
      await this.eventEmitter.emit(EventType.NOTIFICATION_CREATED, {
        notificationId: `vote-${entryId}-${voterId}-${Date.now()}`,
        userId: entry.userId,
        type: 'vote_received',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Get battle results
   */
  async getBattleResults(battleId: string): Promise<{
    battle: BattleModel;
    entries: EntryModel[];
    hasEnded: boolean;
  }> {
    // Verify battle exists
    const battle = await this.getBattleById(battleId);
    
    // Get all entries with rankings
    const { entries } = await this.entryRepository.getEntriesByBattle(battleId, 100);
    
    // Sort by rank if voting has ended
    const hasEnded = battle.status === 'completed';
    const sortedEntries = hasEnded
      ? entries.sort((a, b) => (a.rank || 999) - (b.rank || 999))
      : entries;
    
    return {
      battle,
      entries: sortedEntries,
      hasEnded
    };
  }

  /**
   * Process battles that need status updates
   * This would be called by a scheduled job
   */
  async processBattleStatusUpdates(): Promise<{
    updated: number;
    battles: {
      id: string;
      title: string;
      oldStatus: BattleModel['status'];
      newStatus: BattleModel['status'];
    }[];
  }> {
    // Get battles needing updates
    const battlesForUpdate = await this.battleRepository.getBattlesForStatusUpdate();
    
    if (!battlesForUpdate.length) {
      return { updated: 0, battles: [] };
    }
    
    const updates = [];
    const now = new Date();
    
    // Process each battle
    for (const battle of battlesForUpdate) {
      let newStatus: BattleModel['status'] = battle.status;
      
      // Determine new status based on times
      if (battle.status === 'scheduled' && battle.startTime <= now) {
        newStatus = 'open';
      } else if (battle.status === 'open' && battle.endTime <= now) {
        newStatus = 'voting';
      } else if (battle.status === 'voting' && battle.votingEndTime <= now) {
        newStatus = 'completed';
      }
      
      // If status changed, update it
      if (newStatus !== battle.status) {
        const oldStatus = battle.status;
        await this.updateBattleStatus(battle.id, newStatus);
        
        updates.push({
          id: battle.id,
          title: battle.title,
          oldStatus,
          newStatus
        });
      }
    }
    
    return {
      updated: updates.length,
      battles: updates
    };
  }

  /**
   * Calculate and publish battle results with enhanced ranking and tie-breaking
   */
  private async calculateAndPublishResults(battleId: string): Promise<void> {
    return this.transactionManager.execute(async (transaction) => {
      // Calculate results with proper transaction handling
      const entries = await this.entryRepository.calculateBattleResults(battleId);
      
      // Get winner if exists
      const winner = entries.length > 0 ? entries.find(entry => entry.rank === 1) : null;
      
      // Create notifications for all participants
      for (const entry of entries) {
        // Specific notification for the winner
        if (entry.rank === 1) {
          await this.eventEmitter.emit(EventType.NOTIFICATION_CREATED, {
            notificationId: `winner-${entry.battleId}-${entry.userId}-${Date.now()}`,
            userId: entry.userId,
            type: 'battle_won',
            timestamp: new Date().toISOString()
          });
          
          // Update achievements for winner
          await this.eventEmitter.emit(EventType.ACHIEVEMENT_PROGRESS, {
            userId: entry.userId,
            achievementId: 'battle-winner',
            progress: 1,
            timestamp: new Date().toISOString()
          });
        } else if (entry.rank && entry.rank <= 3) {
          // Top 3 finishers get recognition
          await this.eventEmitter.emit(EventType.NOTIFICATION_CREATED, {
            notificationId: `top3-${entry.battleId}-${entry.userId}-${Date.now()}`,
            userId: entry.userId,
            type: 'battle_top3',
            timestamp: new Date().toISOString()
          });
          
          // Update achievements for top performers
          await this.eventEmitter.emit(EventType.ACHIEVEMENT_PROGRESS, {
            userId: entry.userId,
            achievementId: 'battle-top-performer',
            progress: 1,
            timestamp: new Date().toISOString()
          });
        } else {
          // General participation recognition
          await this.eventEmitter.emit(EventType.NOTIFICATION_CREATED, {
            notificationId: `results-${entry.battleId}-${entry.userId}-${Date.now()}`,
            userId: entry.userId,
            type: 'battle_results',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Emit battle completed event with winner
      if (winner) {
        await this.eventEmitter.emit(EventType.BATTLE_COMPLETED, {
          battleId,
          winnerId: winner.userId,
          timestamp: new Date().toISOString()
        });
      } else {
        // Even if no winner (edge case with no entries), still mark battle as completed
        await this.eventEmitter.emit(EventType.BATTLE_COMPLETED, {
          battleId,
          timestamp: new Date().toISOString()
        });
      }
      
      // Update battle status to completed
      await this.battleRepository.update(battleId, {
        status: 'completed',
        updatedAt: new Date(),
        resultsCalculatedAt: new Date()
      });
      
      // Log successful results calculation
      this.battleRepository['logger'].info(
        { battleId, winnerUserId: winner?.userId, entriesProcessed: entries.length },
        'Battle results calculated and published successfully'
      );
    });
  }

  /**
   * Validate status transition with enhanced state machine pattern
   * Checks all possible edge cases for battle status transitions
   */
  private validateStatusTransition(
    currentStatus: BattleModel['status'],
    newStatus: BattleModel['status'],
    battle: BattleModel
  ): void {
    // Find matching transition
    const transition = this.statusTransitions.find(t => 
      t.from.includes(currentStatus) && t.to === newStatus
    );
    
    // If no valid transition path exists
    if (!transition) {
      throw new ValidationError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
        { 
          currentStatus, 
          newStatus, 
          allowedTransitions: this.statusTransitions
            .filter(t => t.from.includes(currentStatus))
            .map(t => t.to),
          battleId: battle.id
        }
      );
    }
    
    // Additional time-based validation based on current time
    const now = new Date();
    
    // Check if transition is valid for this battle
    if (!transition.isValid(battle)) {
      // Provide specific error messages for different failure reasons
      if (newStatus === 'open' && battle.startTime > now) {
        throw new ValidationError(
          `Cannot start battle before its scheduled start time`,
          { 
            currentStatus,
            newStatus,
            startTime: battle.startTime,
            currentTime: now
          }
        );
      }
      
      if (newStatus === 'open' && battle.endTime < now) {
        throw new ValidationError(
          `Cannot open battle after its end time has passed`,
          { 
            currentStatus,
            newStatus,
            endTime: battle.endTime,
            currentTime: now
          }
        );
      }
      
      if (newStatus === 'voting' && battle.endTime > now) {
        throw new ValidationError(
          `Cannot transition to voting phase before the submission period has ended`,
          { 
            currentStatus,
            newStatus,
            endTime: battle.endTime,
            currentTime: now
          }
        );
      }
      
      if (newStatus === 'voting' && battle.votingEndTime < now) {
        throw new ValidationError(
          `Cannot transition to voting phase after the voting end time has passed`,
          { 
            currentStatus,
            newStatus,
            votingEndTime: battle.votingEndTime,
            currentTime: now
          }
        );
      }
      
      if (newStatus === 'completed' && battle.votingEndTime > now) {
        throw new ValidationError(
          `Cannot complete battle before its voting period has ended`,
          { 
            currentStatus,
            newStatus,
            votingEndTime: battle.votingEndTime,
            currentTime: now
          }
        );
      }
      
      // General fallback error if no specific case matched
      throw new ValidationError(
        `Cannot transition to '${newStatus}' at this time`,
        { 
          currentStatus, 
          newStatus, 
          battleTimes: {
            startTime: battle.startTime,
            endTime: battle.endTime,
            votingEndTime: battle.votingEndTime
          },
          currentTime: now,
          battleId: battle.id
        }
      );
    }
    
    // Additional validation logic for specific transitions
    if (newStatus === 'voting') {
      // Check if the battle has any entries
      if (battle.entryCount === 0) {
        // Log warning but allow transition
        this.battleRepository['logger'].warn(
          { battleId: battle.id, status: newStatus },
          'Transitioning battle to voting phase with zero entries'
        );
      }
    }
    
    if (newStatus === 'completed') {
      // Check if the battle has any votes
      if (battle.voteCount === 0 && battle.entryCount > 0) {
        // Log warning but allow transition
        this.battleRepository['logger'].warn(
          { battleId: battle.id, status: newStatus },
          'Completing battle with zero votes despite having entries'
        );
      }
    }
  }

  /**
   * Execute logic for status transition with comprehensive handling
   * Performs all necessary operations when a battle changes status
   */
  private async executeStatusTransitionLogic(
    battle: BattleModel, 
    newStatus: BattleModel['status']
  ): Promise<void> {
    const transition = this.statusTransitions.find(t => 
      t.from.includes(battle.status) && t.to === newStatus
    );
    
    if (!transition) {
      // This should never happen if validateStatusTransition runs first
      throw new AppError(
        'invalid_state_transition',
        `No transition found from ${battle.status} to ${newStatus}`,
        500,
        { battleId: battle.id }
      );
    }
    
    try {
      // Execute transition logic from the transition definition
      await transition.executeTransition(battle);
      
      // Perform additional operations based on the new status
      switch (newStatus) {
        case 'scheduled':
          // Notify creator about successful scheduling
          await this.eventEmitter.emit(EventType.NOTIFICATION_CREATED, {
            notificationId: `battle-scheduled-${battle.id}-${Date.now()}`,
            userId: battle.creatorId,
            type: 'battle_scheduled',
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'open':
          // Notify followers or interested users about new battle opening
          // (This would require a separate service to identify interested users)
          await this.eventEmitter.emit(EventType.BATTLE_UPDATED, {
            battleId: battle.id,
            updatedFields: ['status'],
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'voting':
          // Notify participants that voting has started
          const entries = await this.entryRepository.findMany({ battleId: battle.id });
          
          // Notify all participants individually
          for (const entry of entries) {
            await this.eventEmitter.emit(EventType.NOTIFICATION_CREATED, {
              notificationId: `voting-started-${battle.id}-${entry.userId}-${Date.now()}`,
              userId: entry.userId,
              type: 'battle_voting_started',
              timestamp: new Date().toISOString()
            });
          }
          
          // Also notify battle creator
          await this.eventEmitter.emit(EventType.NOTIFICATION_CREATED, {
            notificationId: `voting-started-creator-${battle.id}-${Date.now()}`,
            userId: battle.creatorId,
            type: 'battle_voting_started_creator',
            timestamp: new Date().toISOString()
          });
          
          // Emit global event for voting start
          await this.eventEmitter.emit(EventType.BATTLE_VOTING_STARTED, {
            battleId: battle.id,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'completed':
          // Calculate and publish results
          // This will trigger various notifications and events
          await this.calculateAndPublishResults(battle.id);
          break;
          
        default:
          // Log the transition for any other states
          this.battleRepository['logger'].info(
            { battleId: battle.id, fromStatus: battle.status, toStatus: newStatus },
            'Battle status transitioned'
          );
      }
      
      // Log successful transition
      this.battleRepository['logger'].info(
        { battleId: battle.id, fromStatus: battle.status, toStatus: newStatus },
        'Battle status transition logic executed successfully'
      );
    } catch (error) {
      // Log error but don't prevent the transition
      this.battleRepository['logger'].error(
        { error, battleId: battle.id, fromStatus: battle.status, toStatus: newStatus },
        'Error executing battle status transition logic'
      );
      
      // Re-throw if this is a critical error that should prevent the transition
      if (error instanceof AppError && error.statusCode >= 500) {
        throw error;
      }
    }
  }

  /**
   * Validate entry content against battle rules with comprehensive checks
   */
  private validateEntryContent(
    content: EntryModel['content'],
    rules: BattleModel['rules']
  ): void {
    // Check content type is provided
    if (!content.type) {
      throw new ValidationError('Content type is required');
    }

    // Check content type against allowed types
    if (rules.mediaTypes && !rules.mediaTypes.includes(content.type)) {
      throw new ValidationError(`Content type "${content.type}" is not allowed for this battle`, {
        allowedTypes: rules.mediaTypes
      });
    }
    
    // Check content body for text entries
    if (content.type === 'text') {
      if (!content.body || content.body.trim() === '') {
        throw new ValidationError('Text content body is required for text entries');
      }
      
      const length = content.body.length;
      
      if (rules.minLength && length < rules.minLength) {
        throw new ValidationError(`Content is too short (minimum ${rules.minLength} characters)`);
      }
      
      if (rules.maxLength && length > rules.maxLength) {
        throw new ValidationError(`Content is too long (maximum ${rules.maxLength} characters)`);
      }
      
      // Check for prohibited content patterns
      const prohibitedPatterns = [
        /(<script.*?>.*?<\/script>)/i,  // Prevent script injection
        /(javascript:)/i                // Prevent javascript: URLs
      ];
      
      for (const pattern of prohibitedPatterns) {
        if (pattern.test(content.body)) {
          throw new ValidationError('Content contains prohibited patterns');
        }
      }
    }
    
    // Check media content with enhanced validation
    if (['image', 'audio', 'video', 'mixed'].includes(content.type)) {
      // Require at least one media item for media-type content
      if (!content.mediaUrl && (!content.additionalMedia || content.additionalMedia.length === 0)) {
        throw new ValidationError(`Media URL is required for content type "${content.type}"`);
      }
      
      // Check media duration for time-based media (audio/video)
      if (['audio', 'video'].includes(content.type) && rules.maxDuration) {
        if (!content.metadata?.duration) {
          throw new ValidationError(`Duration metadata is required for ${content.type} content`);
        }
        
        if (content.metadata.duration > rules.maxDuration) {
          throw new ValidationError(
            `Media duration exceeds maximum (${rules.maxDuration} seconds)`
          );
        }
      }

      // Validate primary media URL
      if (content.mediaUrl) {
        if (!this.isValidMediaUrl(content.mediaUrl)) {
          throw new ValidationError('Invalid media URL format', {
            mediaUrl: content.mediaUrl,
            reason: 'URL must be HTTPS and from an allowed domain'
          });
        }
        
        // Validate file extensions (basic check)
        if (content.type === 'image' && !this.isValidImageUrl(content.mediaUrl)) {
          throw new ValidationError('Invalid image format', {
            allowedFormats: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
          });
        }
        
        if (content.type === 'audio' && !this.isValidAudioUrl(content.mediaUrl)) {
          throw new ValidationError('Invalid audio format', {
            allowedFormats: ['.mp3', '.wav', '.ogg', '.m4a']
          });
        }
        
        if (content.type === 'video' && !this.isValidVideoUrl(content.mediaUrl)) {
          throw new ValidationError('Invalid video format', {
            allowedFormats: ['.mp4', '.webm', '.mov']
          });
        }
      }

      // Check additional media if present
      if (content.additionalMedia && content.additionalMedia.length > 0) {
        // Check if too many media items
        if (content.additionalMedia.length > 5) {
          throw new ValidationError('Maximum of 5 additional media items allowed');
        }
        
        // Validate each additional media URL
        for (const mediaUrl of content.additionalMedia) {
          if (!this.isValidMediaUrl(mediaUrl)) {
            throw new ValidationError('Invalid additional media URL format', {
              mediaUrl,
              reason: 'URL must be HTTPS and from an allowed domain'
            });
          }
        }
      }
    }
    
    // Check that content adheres to the battle prompt
    if (rules.prompt && content.metadata?.tags) {
      // Ensure at least one tag relates to the prompt (basic check)
      const promptKeywords = rules.prompt
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3); // Only consider significant words
      
      const contentTags = content.metadata.tags.map(tag => tag.toLowerCase());
      
      if (promptKeywords.length > 0 && !promptKeywords.some(keyword => 
        contentTags.some(tag => tag.includes(keyword))
      )) {
        // This is a soft warning rather than a rejection
        this.battleRepository['logger'].warn(
          { contentTags, promptKeywords },
          'Content tags don\'t seem to match the prompt keywords'
        );
      }
    }
  }
}
