/**
 * Points System Tester
 * 
 * A tool for generating test data and validating the points system implementation.
 * This can be run in development to test various aspects of the points economy.
 */
import { v4 as uuidv4 } from 'uuid';
import { PointsService } from '../../services/points/points-service';
import { UserPointsRepository } from '../../repositories/user-points/user-points-repository';
import { AnomalyDetectionService } from '../../services/points/anomaly-detection-service';
import { logger } from '../../lib/logger';
import { PointsSource } from '../../models/user-points';
import { pointsRules } from '../../config/points-rules-config';

/**
 * Test options
 */
interface TestOptions {
  userCount?: number;
  daysToSimulate?: number;
  activitiesPerDay?: number;
  includeExploitation?: boolean;
  redemptionRate?: number; // 0-1, percentage of eligible users who redeem
  printStats?: boolean;
}

/**
 * Test user
 */
interface TestUser {
  id: string;
  createdAt: Date;
  walletConnected: boolean;
  walletAddress?: string;
}

/**
 * Activity type
 */
interface SimulatedActivity {
  userId: string;
  source: PointsSource;
  amount: number;
  timestamp: Date;
  success?: boolean;
  reason?: string;
}

/**
 * Points System Tester
 */
export class PointsSystemTester {
  private users: TestUser[] = [];
  private activities: SimulatedActivity[] = [];
  private redemptions: any[] = [];
  private exploitAttempts: SimulatedActivity[] = [];
  
  constructor(
    private pointsService: PointsService,
    private userPointsRepository: UserPointsRepository,
    private anomalyDetectionService: AnomalyDetectionService
  ) {}
  
  /**
   * Run a test simulation
   * 
   * @param options - Test options
   */
  async runTest(options: TestOptions = {}): Promise<void> {
    const {
      userCount = 100,
      daysToSimulate = 7,
      activitiesPerDay = 1000,
      includeExploitation = true,
      redemptionRate = 0.2,
      printStats = true
    } = options;
    
    logger.info('Starting points system test', { options });
    
    // Generate test users
    this.generateUsers(userCount);
    
    // Simulate days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToSimulate);
    
    for (let day = 0; day < daysToSimulate; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);
      
      await this.simulateDay(currentDate, activitiesPerDay);
      
      // Every other day, simulate some redemptions
      if (day % 2 === 0) {
        await this.simulateRedemptions(currentDate, redemptionRate);
      }
      
      // On specific days, simulate exploitation attempts
      if (includeExploitation && (day === 2 || day === 5)) {
        await this.simulateExploitation(currentDate);
      }
      
      logger.info(`Completed simulation for day ${day + 1}`, {
        date: currentDate.toISOString(),
        activities: this.activities.filter(a => 
          a.timestamp.toDateString() === currentDate.toDateString()
        ).length
      });
    }
    
    // Print statistics
    if (printStats) {
      await this.printTestResults();
    }
    
    logger.info('Points system test completed', {
      users: this.users.length,
      activities: this.activities.length,
      redemptions: this.redemptions.length,
      exploitAttempts: this.exploitAttempts.length
    });
  }
  
  /**
   * Generate test users
   * 
   * @param count - Number of users to generate
   */
  private generateUsers(count: number): void {
    for (let i = 0; i < count; i++) {
      const createdAtOffset = Math.floor(Math.random() * 90); // 0-90 days ago
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - createdAtOffset);
      
      // 70% of users have connected wallets
      const walletConnected = Math.random() < 0.7;
      
      this.users.push({
        id: `test-${uuidv4()}`,
        createdAt,
        walletConnected,
        walletAddress: walletConnected ? `0x${uuidv4().replace(/-/g, '')}` : undefined
      });
    }
    
    logger.info('Generated test users', { count });
  }
  
  /**
   * Simulate a day of activity
   * 
   * @param date - Date to simulate
   * @param count - Number of activities to simulate
   */
  private async simulateDay(date: Date, count: number): Promise<void> {
    const activities: SimulatedActivity[] = [];
    
    // Generate random activities
    for (let i = 0; i < count; i++) {
      // Pick a random user
      const user = this.users[Math.floor(Math.random() * this.users.length)];
      
      // Pick a random source (weighted)
      const source = this.getWeightedRandomSource();
      
      // Get base amount from rules
      const amount = pointsRules[source].points;
      
      // Create activity with random time during the day
      const timestamp = new Date(date);
      timestamp.setHours(Math.floor(Math.random() * 24));
      timestamp.setMinutes(Math.floor(Math.random() * 60));
      
      activities.push({
        userId: user.id,
        source,
        amount,
        timestamp
      });
    }
    
    // Sort by timestamp
    activities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Process activities
    for (const activity of activities) {
      try {
        // Process activity
        const result = await this.pointsService.awardPoints(
          activity.userId,
          activity.amount,
          activity.source,
          {
            referenceId: uuidv4(),
            description: `Test activity: ${activity.source}`
          }
        );
        
        // Record result
        activity.success = result.success;
        activity.reason = result.reason;
        
        this.activities.push(activity);
      } catch (error) {
        logger.error('Error processing test activity', { error, activity });
      }
    }
  }
  
  /**
   * Simulate redemptions
   * 
   * @param date - Date to simulate
   * @param rate - Percentage of eligible users who will attempt redemption
   */
  private async simulateRedemptions(date: Date, rate: number): Promise<void> {
    // Get all users with wallet connected
    const eligibleUsers = this.users.filter(u => u.walletConnected);
    
    // Calculate how many will redeem
    const redeemCount = Math.floor(eligibleUsers.length * rate);
    
    // Randomize
    const shuffled = [...eligibleUsers].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, redeemCount);
    
    // Process redemptions
    for (const user of selectedUsers) {
      try {
        // Get user balance
        const balance = await this.userPointsRepository.getUserPointsBalance(user.id);
        
        // Only redeem if they have at least 1000 points
        if (balance >= 1000) {
          // Redeem a random amount (between min and their balance)
          const amount = Math.min(
            balance,
            1000 + Math.floor(Math.random() * 9000) // 1000-10000
          );
          
          // Round to nearest 100
          const roundedAmount = Math.floor(amount / 100) * 100;
          
          // Create redemption with random time during the day
          const timestamp = new Date(date);
          timestamp.setHours(Math.floor(Math.random() * 24));
          timestamp.setMinutes(Math.floor(Math.random() * 60));
          
          // Request redemption
          const result = await this.pointsService.requestRedemption(
            user.id,
            roundedAmount,
            user.walletAddress
          );
          
          // Record result
          if (result.success) {
            this.redemptions.push({
              userId: user.id,
              amount: roundedAmount,
              redemptionId: result.redemptionId,
              timestamp,
              status: result.status
            });
          }
        }
      } catch (error) {
        logger.error('Error simulating redemption', { error, userId: user.id });
      }
    }
    
    logger.info('Simulated redemptions', {
      date: date.toISOString(),
      attempted: selectedUsers.length,
      completed: this.redemptions.length
    });
  }
  
  /**
   * Simulate exploitation attempts
   * 
   * @param date - Date to simulate
   */
  private async simulateExploitation(date: Date): Promise<void> {
    // Select 5 random users for exploitation attempts
    const shuffled = [...this.users].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, 5);
    
    // Types of exploitation to simulate
    const exploits = [
      this.simulateRapidFiring.bind(this),
      this.simulateAbnormalActivity.bind(this),
      this.simulateExcessiveRedemption.bind(this)
    ];
    
    // Run each exploit type for different users
    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      const exploit = exploits[i % exploits.length];
      
      await exploit(user, date);
    }
  }
  
  /**
   * Simulate rapid-firing of activities
   */
  private async simulateRapidFiring(user: TestUser, date: Date): Promise<void> {
    const source = 'content_creation';
    const baseAmount = pointsRules[source].points;
    const activities: SimulatedActivity[] = [];
    
    // Create 20 activities in quick succession (1 second apart)
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(date);
      timestamp.setHours(12); // Noon
      timestamp.setMinutes(0);
      timestamp.setSeconds(i); // 1 second apart
      
      activities.push({
        userId: user.id,
        source,
        amount: baseAmount,
        timestamp
      });
    }
    
    // Process activities
    for (const activity of activities) {
      try {
        // Check if anomalous
        const anomalyResult = await this.anomalyDetectionService.detectAnomaly({
          userId: activity.userId,
          source: activity.source,
          amount: activity.amount
        });
        
        // Process activity
        const result = await this.pointsService.awardPoints(
          activity.userId,
          activity.amount,
          activity.source,
          {
            referenceId: uuidv4(),
            description: `Exploit test: rapid firing`
          }
        );
        
        // Record result
        activity.success = result.success;
        activity.reason = result.reason;
        
        this.exploitAttempts.push(activity);
      } catch (error) {
        logger.error('Error processing exploit activity', { error, activity });
      }
    }
    
    logger.info('Simulated rapid firing exploit', {
      userId: user.id,
      attempts: activities.length,
      successes: activities.filter(a => a.success).length
    });
  }
  
  /**
   * Simulate abnormal activity patterns
   */
  private async simulateAbnormalActivity(user: TestUser, date: Date): Promise<void> {
    // Attempt to earn an abnormally high amount from a single source
    const source = 'comment';
    const baseAmount = pointsRules[source].points;
    const activities: SimulatedActivity[] = [];
    
    // Create 50 comment activities (well beyond normal limit)
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(date);
      timestamp.setHours(Math.floor(Math.random() * 24));
      timestamp.setMinutes(Math.floor(Math.random() * 60));
      
      activities.push({
        userId: user.id,
        source,
        amount: baseAmount,
        timestamp
      });
    }
    
    // Sort by timestamp
    activities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Process activities
    for (const activity of activities) {
      try {
        // Process activity
        const result = await this.pointsService.awardPoints(
          activity.userId,
          activity.amount,
          activity.source,
          {
            referenceId: uuidv4(),
            description: `Exploit test: abnormal activity`
          }
        );
        
        // Record result
        activity.success = result.success;
        activity.reason = result.reason;
        
        this.exploitAttempts.push(activity);
      } catch (error) {
        logger.error('Error processing exploit activity', { error, activity });
      }
    }
    
    logger.info('Simulated abnormal activity exploit', {
      userId: user.id,
      attempts: activities.length,
      successes: activities.filter(a => a.success).length
    });
  }
  
  /**
   * Simulate excessive redemption attempts
   */
  private async simulateExcessiveRedemption(user: TestUser, date: Date): Promise<void> {
    if (!user.walletConnected) {
      logger.info('Skipping excessive redemption test for user without wallet', {
        userId: user.id
      });
      return;
    }
    
    try {
      // Get user balance
      const balance = await this.userPointsRepository.getUserPointsBalance(user.id);
      
      // If user has some points, try to redeem more than they have
      if (balance > 0) {
        const amount = balance * 2; // Try to redeem twice their balance
        
        // Try to redeem
        const result = await this.pointsService.requestRedemption(
          user.id,
          amount,
          user.walletAddress
        );
        
        logger.info('Simulated excessive redemption exploit', {
          userId: user.id,
          balance,
          attemptedAmount: amount,
          success: result.success,
          reason: result.reason
        });
      }
      
      // Try multiple redemptions in quick succession
      const validAmount = Math.min(1000, balance);
      
      if (validAmount >= 1000) {
        const results = [];
        
        // Try 5 redemptions quickly
        for (let i = 0; i < 5; i++) {
          const result = await this.pointsService.requestRedemption(
            user.id,
            validAmount,
            user.walletAddress
          );
          
          results.push(result);
        }
        
        logger.info('Simulated multiple redemption exploit', {
          userId: user.id,
          attempts: 5,
          successes: results.filter(r => r.success).length
        });
      }
    } catch (error) {
      logger.error('Error simulating excessive redemption', { error, userId: user.id });
    }
  }
  
  /**
   * Get a weighted random source for more realistic distribution
   */
  private getWeightedRandomSource(): PointsSource {
    // Define weights for different sources
    const weights: Record<PointsSource, number> = {
      content_creation: 15,
      comment: 30,
      upvote_received: 20,
      daily_login: 20,
      achievement: 2,
      referral: 1,
      profile_completion: 2,
      wallet_connection: 1,
      streak_bonus: 5,
      transfer_in: 1,
      transfer_out: 1,
      redemption: 1,
      special_event: 1,
      admin_adjustment: 0
    };
    
    // Calculate total weight
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    
    // Generate random value
    let random = Math.random() * totalWeight;
    
    // Find the source that corresponds to the random value
    for (const [source, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return source as PointsSource;
      }
    }
    
    // Default fallback
    return 'comment';
  }
  
  /**
   * Print test results
   */
  private async printTestResults(): Promise<void> {
    // Calculate overall stats
    const totalActivities = this.activities.length;
    const successfulActivities = this.activities.filter(a => a.success).length;
    const failedActivities = totalActivities - successfulActivities;
    
    const totalExploits = this.exploitAttempts.length;
    const blockedExploits = this.exploitAttempts.filter(a => !a.success).length;
    const exploitBlockRate = totalExploits > 0 ? (blockedExploits / totalExploits) * 100 : 0;
    
    const totalRedemptions = this.redemptions.length;
    
    // Get source distribution
    const sourceDistribution: Record<PointsSource, number> = {} as any;
    
    this.activities.forEach(activity => {
      if (activity.success) {
        sourceDistribution[activity.source] = (sourceDistribution[activity.source] || 0) + 1;
      }
    });
    
    // Sort by frequency
    const sortedSources = Object.entries(sourceDistribution)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([source, count]) => ({
        source,
        count,
        percentage: (count / successfulActivities) * 100
      }));
    
    // Print results
    console.log('\n========= POINTS SYSTEM TEST RESULTS =========');
    console.log(`Total users: ${this.users.length}`);
    console.log(`Total activities: ${totalActivities}`);
    console.log(`Successful activities: ${successfulActivities} (${(successfulActivities / totalActivities * 100).toFixed(2)}%)`);
    console.log(`Failed activities: ${failedActivities} (${(failedActivities / totalActivities * 100).toFixed(2)}%)`);
    console.log(`Redemptions: ${totalRedemptions}`);
    console.log('\nExploit Attempts:');
    console.log(`Total exploit attempts: ${totalExploits}`);
    console.log(`Blocked exploits: ${blockedExploits} (${exploitBlockRate.toFixed(2)}%)`);
    console.log('\nActivity Distribution:');
    
    sortedSources.forEach(({ source, count, percentage }) => {
      console.log(`- ${source}: ${count} (${percentage.toFixed(2)}%)`);
    });
    
    console.log('\n=============================================');
  }
}
