/**
 * Points System Test Runner
 * 
 * This script initializes the necessary services and runs the points system tester.
 * It's designed to validate the entire points economy in a testing environment.
 * 
 * Usage:
 * npx ts-node -r tsconfig-paths/register src/scripts/run-points-system-test.ts
 */
import { PointsSystemTester } from '../testing/tools/points-system-tester';
import { PointsService } from '../services/points/points-service';
import { UserPointsRepository } from '../repositories/user-points/user-points-repository';
import { WalletConnectionRepository } from '../repositories/wallet-connection-repository';
import { RedemptionRepository } from '../repositories/redemption-repository';
import { AnomalyDetectionService } from '../services/points/anomaly-detection-service';
import { TokenTransferService } from '../services/blockchain/token-transfer-service';
import { db } from '../lib/db';
import { logger } from '../lib/logger';

// Set up test mode logging
logger.level = 'info';

async function runTest() {
  console.log('Initializing repositories and services...');
  
  try {
    // Initialize repositories
    const userPointsRepository = new UserPointsRepository(db);
    const walletConnectionRepository = new WalletConnectionRepository(db);
    const redemptionRepository = new RedemptionRepository(db);
    
    // Initialize blockchain service (mock for testing)
    const tokenTransferService = new TokenTransferService({
      network: 'testnet',
      providerUrl: 'https://api.testnet.example.com',
      privateKey: 'mock_private_key_for_testing',
      tokenAddress: 'mock_token_address'
    });
    
    // Initialize points service
    const pointsService = new PointsService(
      userPointsRepository,
      walletConnectionRepository,
      redemptionRepository,
      tokenTransferService,
      undefined, // Use default config
      db
    );
    
    // Initialize anomaly detection service
    const anomalyDetectionService = new AnomalyDetectionService(userPointsRepository);
    
    // Create tester
    const tester = new PointsSystemTester(
      pointsService,
      userPointsRepository,
      anomalyDetectionService
    );
    
    // Run test with options
    console.log('Starting points system test...');
    await tester.runTest({
      userCount: 50, // Number of test users
      daysToSimulate: 7, // Simulate a week of activity
      activitiesPerDay: 500, // Activities per day
      includeExploitation: true, // Test exploitation attempts
      printStats: true // Print final statistics
    });
    
    console.log('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running points system test:', error);
    process.exit(1);
  }
}

// Run the test
runTest();
