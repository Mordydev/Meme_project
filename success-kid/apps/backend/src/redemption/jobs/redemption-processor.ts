/**
 * Redemption Processor
 * 
 * Background job processor for redemption requests.
 */
import Queue from 'bull';
import { TransactionService } from '../transactions/transaction-service';
import { RedemptionRepository } from '../../repositories/redemption-repository';
import { logger } from '../../lib/logger';

/**
 * Redemption processor for handling background processing of redemptions
 */
export class RedemptionProcessor {
  private queue: Queue.Queue;
  
  /**
   * Create a new RedemptionProcessor
   * 
   * @param transactionService Transaction service for processing redemptions
   * @param redemptionRepository Redemption repository
   * @param redisUrl Redis URL for queue
   */
  constructor(
    private transactionService: TransactionService,
    private redemptionRepository: RedemptionRepository,
    redisUrl: string
  ) {
    // Initialize the queue
    this.queue = new Queue('redemption-processing', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000 // 30 seconds
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });
    
    // Set up processors
    this.queue.process('process-redemption', 5, this.processRedemption.bind(this));
    this.queue.process('retry-failed', 3, this.retryFailed.bind(this));
    this.queue.process('check-pending', 2, this.checkPending.bind(this));
    
    // Handle events
    this.queue.on('completed', (job) => {
      logger.info('Redemption job completed', { jobId: job.id, type: job.name });
    });
    
    this.queue.on('failed', (job, error) => {
      logger.error('Redemption job failed', { jobId: job.id, type: job.name, error });
    });
    
    // Schedule recurring jobs
    this.scheduleRecurringJobs();
  }

  /**
   * Queue a redemption for processing
   * 
   * @param redemptionId Redemption ID
   * @returns Job ID
   */
  async queueRedemption(redemptionId: string): Promise<string> {
    const job = await this.queue.add('process-redemption', { redemptionId }, {
      priority: 10 // Higher priority
    });
    
    logger.info('Redemption queued for processing', { redemptionId, jobId: job.id });
    
    return job.id;
  }

  /**
   * Process a redemption
   * 
   * @param job Job data
   * @returns Processing result
   */
  private async processRedemption(job: Queue.Job): Promise<any> {
    const { redemptionId } = job.data;
    
    logger.info('Processing redemption', { redemptionId, jobId: job.id });
    
    try {
      // Get the redemption
      const redemption = await this.redemptionRepository.findById(redemptionId);
      
      if (!redemption) {
        logger.error('Redemption not found', { redemptionId });
        throw new Error('Redemption not found');
      }
      
      // Create a transaction record if none exists
      let transactionId: string;
      
      try {
        // In a real implementation, we would check if a transaction record already exists
        // For simplicity, we'll create a new one each time
        const transaction = await this.redemptionRepository.createRedemptionTransaction(redemptionId);
        transactionId = transaction.id;
      } catch (error) {
        logger.error('Error creating transaction record', { redemptionId, error });
        throw error;
      }
      
      // Process the transaction
      const result = await this.transactionService.processTransaction(transactionId);
      
      return result;
    } catch (error) {
      logger.error('Error processing redemption', { redemptionId, jobId: job.id, error });
      throw error;
    }
  }

  /**
   * Retry failed transactions
   * 
   * @param job Job data
   * @returns Processing results
   */
  private async retryFailed(job: Queue.Job): Promise<any> {
    const { limit = 10 } = job.data;
    
    logger.info('Checking for failed transactions to retry', { limit, jobId: job.id });
    
    try {
      // Find transactions that need retry
      const transactions = await this.redemptionRepository.findTransactionsForRetry(3, limit);
      
      logger.info(`Found ${transactions.length} failed transactions to retry`);
      
      const results = [];
      
      // Process each transaction
      for (const transaction of transactions) {
        try {
          const result = await this.transactionService.retryTransaction(transaction.id);
          results.push({
            transactionId: transaction.id,
            result
          });
        } catch (error) {
          logger.error('Error retrying transaction', { transactionId: transaction.id, error });
          results.push({
            transactionId: transaction.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      return { processed: results.length, results };
    } catch (error) {
      logger.error('Error processing retry job', { jobId: job.id, error });
      throw error;
    }
  }

  /**
   * Check pending transactions
   * 
   * @param job Job data
   * @returns Processing results
   */
  private async checkPending(job: Queue.Job): Promise<any> {
    const { limit = 20 } = job.data;
    
    logger.info('Checking pending transactions', { limit, jobId: job.id });
    
    try {
      // Find pending transactions
      const transactions = await this.redemptionRepository.findPendingTransactions(limit);
      
      logger.info(`Found ${transactions.length} pending transactions`);
      
      const results = [];
      
      // Process each transaction
      for (const transaction of transactions) {
        try {
          const result = await this.transactionService.processTransaction(transaction.id);
          results.push({
            transactionId: transaction.id,
            result
          });
        } catch (error) {
          logger.error('Error processing pending transaction', { transactionId: transaction.id, error });
          results.push({
            transactionId: transaction.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      return { processed: results.length, results };
    } catch (error) {
      logger.error('Error checking pending transactions', { jobId: job.id, error });
      throw error;
    }
  }

  /**
   * Schedule recurring jobs
   */
  private scheduleRecurringJobs(): void {
    // Check for pending transactions every 5 minutes
    this.queue.add('check-pending', { limit: 20 }, {
      repeat: {
        every: 5 * 60 * 1000 // 5 minutes
      }
    });
    
    // Retry failed transactions every 15 minutes
    this.queue.add('retry-failed', { limit: 10 }, {
      repeat: {
        every: 15 * 60 * 1000 // 15 minutes
      }
    });
    
    logger.info('Scheduled recurring redemption jobs');
  }

  /**
   * Clean up old jobs
   */
  async cleanUpOldJobs(): Promise<void> {
    try {
      // Clean completed jobs older than 1 day
      await this.queue.clean(24 * 60 * 60 * 1000, 'completed');
      
      // Clean failed jobs older than 7 days
      await this.queue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
      
      logger.info('Cleaned up old redemption jobs');
    } catch (error) {
      logger.error('Error cleaning up old jobs', { error });
    }
  }
}
