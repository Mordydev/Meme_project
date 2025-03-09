import { FastifyInstance } from 'fastify';
import { Job } from 'bullmq';
import { JobType } from './job-types';

/**
 * Creates job processors for each job type
 * @param fastify Fastify instance
 * @returns Object mapping job types to processor functions
 */
export function createJobProcessors(fastify: FastifyInstance) {
  const logger = fastify.log.child({ service: 'job-processors' });
  const metricsService = fastify.metrics;
  
  /**
   * Process content job
   */
  async function processContent(job: Job) {
    const { contentId, options } = job.data;
    logger.info({ contentId, options }, 'Processing content');
    
    try {
      // Get dependencies
      const contentService = fastify.contentService;
      
      // 1. Retrieve the content
      const content = await contentService.getContentById(contentId);
      if (!content) {
        throw new Error(`Content not found: ${contentId}`);
      }
      
      // 2. Process content based on type
      switch (content.type) {
        case 'image':
          await processImageContent(content, options);
          break;
        case 'text':
          await processTextContent(content, options);
          break;
        case 'audio':
          await processAudioContent(content, options);
          break;
        default:
          logger.warn({ contentId, type: content.type }, 'Unsupported content type');
      }
      
      // 3. Mark content as processed
      await contentService.updateContent(contentId, {
        processingStatus: 'completed',
        updatedAt: new Date()
      });
      
      // 4. Track metrics
      metricsService.increment('content.processed', 1);
      metricsService.increment(`content.processed.${content.type}`, 1);
      
      return { status: 'success', contentId };
    } catch (error) {
      logger.error({ error, contentId }, 'Content processing failed');
      metricsService.increment('content.processing.error', 1);
      throw error;
    }
  }
  
  /**
   * Process image content
   */
  async function processImageContent(content: any, options: any) {
    // Image-specific processing
    logger.info({ contentId: content.id }, 'Processing image content');
    
    // Simulated processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }
  
  /**
   * Process text content
   */
  async function processTextContent(content: any, options: any) {
    // Text-specific processing
    logger.info({ contentId: content.id }, 'Processing text content');
    
    // Simulated processing
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return true;
  }
  
  /**
   * Process audio content
   */
  async function processAudioContent(content: any, options: any) {
    // Audio-specific processing
    logger.info({ contentId: content.id }, 'Processing audio content');
    
    // Simulated processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }
  
  /**
   * Update battle state job
   */
  async function updateBattleState(job: Job) {
    const { battleId } = job.data;
    logger.info({ battleId }, 'Updating battle state');
    
    try {
      // Get dependencies
      const battleService = fastify.battleService;
      
      // 1. Get current battle
      const battle = await battleService.getBattleById(battleId);
      if (!battle) {
        throw new Error(`Battle not found: ${battleId}`);
      }
      
      // 2. Determine if state transition is needed
      const now = new Date();
      let newStatus = battle.status;
      
      if (battle.status === 'scheduled' && now >= battle.startTime) {
        newStatus = 'open';
      } else if (battle.status === 'open' && now >= battle.endTime) {
        newStatus = 'voting';
      } else if (battle.status === 'voting' && now >= battle.votingEndTime) {
        newStatus = 'completed';
      }
      
      // 3. If state change needed, update battle
      if (newStatus !== battle.status) {
        logger.info({ battleId, from: battle.status, to: newStatus }, 'Battle state transition');
        
        await battleService.updateBattle(battleId, {
          status: newStatus,
          updatedAt: now
        });
        
        // 4. Additional actions for specific transitions
        if (newStatus === 'completed') {
          // Schedule results calculation
          await fastify.jobQueue.addJob(JobType.CALCULATE_BATTLE_RESULTS, { battleId }, {
            priority: 'high'
          });
        }
        
        // 5. Track state transition metrics
        metricsService.increment('battle.state_transition', 1);
        metricsService.increment(`battle.transition.${battle.status}_to_${newStatus}`, 1);
      }
      
      return { status: 'success', battleId, stateChanged: newStatus !== battle.status };
    } catch (error) {
      logger.error({ error, battleId }, 'Battle state update failed');
      metricsService.increment('battle.state_update.error', 1);
      throw error;
    }
  }
  
  /**
   * Calculate battle results job
   */
  async function calculateBattleResults(job: Job) {
    const { battleId } = job.data;
    logger.info({ battleId }, 'Calculating battle results');
    
    try {
      // Get dependencies
      const battleService = fastify.battleService;
      const notificationService = fastify.notificationService;
      
      // 1. Get battle
      const battle = await battleService.getBattleById(battleId);
      if (!battle) {
        throw new Error(`Battle not found: ${battleId}`);
      }
      
      if (battle.status !== 'completed') {
        logger.warn({ battleId, status: battle.status }, 'Battle not in completed state for results calculation');
        return { status: 'skipped', reason: 'incorrect_state' };
      }
      
      // 2. Calculate results
      const results = await battleService.calculateResults(battleId);
      
      // 3. Save results
      await battleService.saveBattleResults(battleId, results);
      
      // 4. Process rewards
      await fastify.jobQueue.addJob(JobType.PROCESS_BATTLE_REWARDS, {
        battleId,
        results
      });
      
      // 5. Send notifications
      await notificationService.sendBattleResultsNotifications(battleId, results);
      
      // 6. Track metrics
      metricsService.increment('battle.results_calculated', 1);
      metricsService.gauge('battle.participant_count', results.participantCount);
      
      return { status: 'success', battleId, participantCount: results.participantCount };
    } catch (error) {
      logger.error({ error, battleId }, 'Battle results calculation failed');
      metricsService.increment('battle.results_calculation.error', 1);
      throw error;
    }
  }
  
  /**
   * Send notification job
   */
  async function sendNotification(job: Job) {
    const { userId, type, data } = job.data;
    logger.info({ userId, type }, 'Sending notification');
    
    try {
      // Get dependencies
      const notificationService = fastify.notificationService;
      
      // Send notification
      await notificationService.sendNotification(userId, type, data);
      
      // Track metrics
      metricsService.increment('notification.sent', 1);
      metricsService.increment(`notification.type.${type}`, 1);
      
      return { status: 'success', userId, type };
    } catch (error) {
      logger.error({ error, userId, type }, 'Notification sending failed');
      metricsService.increment('notification.error', 1);
      throw error;
    }
  }
  
  /**
   * Verify token holdings job
   */
  async function verifyTokenHoldings(job: Job) {
    const { userId, walletAddress } = job.data;
    logger.info({ userId, walletAddress }, 'Verifying token holdings');
    
    try {
      // Get dependencies
      const walletService = fastify.walletService;
      const userService = fastify.userService;
      
      // 1. Verify holdings
      const holdingsData = await walletService.getTokenHoldings(walletAddress);
      
      // 2. Update user record
      await userService.updateTokenHoldings(userId, holdingsData);
      
      // 3. Set holder tier based on holdings
      const tier = determineHolderTier(holdingsData.amount);
      await userService.updateHolderTier(userId, tier);
      
      // 4. Check for tier change and send notification if needed
      const user = await userService.getUserById(userId);
      if (user && user.holderTier !== tier) {
        await fastify.jobQueue.addJob(JobType.SEND_NOTIFICATION, {
          userId,
          type: 'holder_tier_changed',
          data: { previousTier: user.holderTier, newTier: tier }
        });
      }
      
      // 5. Track metrics
      metricsService.histogram('token.holdings.amount', holdingsData.amount);
      metricsService.increment(`token.tier.${tier}`, 1);
      
      return { status: 'success', userId, holdings: holdingsData, tier };
    } catch (error) {
      logger.error({ error, userId, walletAddress }, 'Token holdings verification failed');
      metricsService.increment('token.holdings_verification.error', 1);
      throw error;
    }
  }
  
  /**
   * Determine holder tier based on token amount
   */
  function determineHolderTier(amount: number): string {
    if (amount >= 100000) return 'platinum';
    if (amount >= 10000) return 'gold';
    if (amount >= 1000) return 'silver';
    if (amount >= 100) return 'bronze';
    return 'basic';
  }
  
  // Map job types to processors
  return {
    [JobType.PROCESS_CONTENT]: processContent,
    [JobType.UPDATE_BATTLE_STATE]: updateBattleState,
    [JobType.CALCULATE_BATTLE_RESULTS]: calculateBattleResults,
    [JobType.SEND_NOTIFICATION]: sendNotification,
    [JobType.VERIFY_TOKEN_HOLDINGS]: verifyTokenHoldings
  };
}
