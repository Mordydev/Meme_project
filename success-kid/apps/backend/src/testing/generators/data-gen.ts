/**
 * Data Generator
 * 
 * A comprehensive system for generating test data at scale.
 */
import { v4 as uuidv4 } from 'uuid';

// Import factories
import { 
  userFactory, 
  profileFactory, 
  User 
} from '../factories/user';
import { 
  pointsTransactionFactory, 
  PointsTransaction 
} from '../factories/points';
import { 
  contentFactory, 
  commentFactory,
  Content,
  Comment
} from '../factories/content';
import {
  walletConnectionFactory,
  transactionFactory,
  WalletConnection,
  Transaction
} from '../factories/wallet';

// Define configuration interfaces
export interface DataSetConfig {
  users?: number;
  pointsTransactions?: number;
  content?: number;
  comments?: number;
  walletConnections?: number;
  transactions?: number;
  seed?: number;
}

export interface DataSet {
  users: User[];
  profiles: any[];
  pointsTransactions: PointsTransaction[];
  content: Content[];
  comments: Comment[];
  walletConnections: WalletConnection[];
  transactions: Transaction[];
}

/**
 * Data Generator class for creating test datasets
 */
export class DataGenerator {
  private seed: number;
  
  /**
   * Create a new DataGenerator
   * 
   * @param seed Seed value for random number generation
   */
  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 1000000);
    this.initializeRandom();
  }
  
  /**
   * Set the random seed value
   * 
   * @param value New seed value
   */
  public setSeed(value: number): void {
    this.seed = value;
    this.initializeRandom();
  }
  
  /**
   * Initialize the random number generator with the current seed
   */
  private initializeRandom(): void {
    // Simple seedable RNG implementation
    // In a real implementation, you would use a more robust library
    Math.random = (): number => {
      const x = Math.sin(this.seed++) * 10000;
      return x - Math.floor(x);
    };
  }
  
  /**
   * Generate a user with optional overrides
   * 
   * @param overrides Custom properties to override defaults
   * @returns Generated user
   */
  public generateUser(overrides?: Partial<User>): User {
    return userFactory.create(overrides);
  }
  
  /**
   * Generate a points transaction with optional overrides
   * 
   * @param overrides Custom properties to override defaults
   * @returns Generated points transaction
   */
  public generatePointsTransaction(overrides?: Partial<PointsTransaction>): PointsTransaction {
    return pointsTransactionFactory.create(overrides);
  }
  
  /**
   * Generate content with optional overrides
   * 
   * @param overrides Custom properties to override defaults
   * @returns Generated content
   */
  public generateContent(overrides?: Partial<Content>): Content {
    return contentFactory.create(overrides);
  }
  
  /**
   * Generate a complete dataset according to configuration
   * 
   * @param config Dataset configuration
   * @returns The generated dataset
   */
  public async generateDataSet(config: DataSetConfig = {}): Promise<DataSet> {
    // Set seed if provided
    if (config.seed !== undefined) {
      this.setSeed(config.seed);
    }
    
    const result: DataSet = {
      users: [],
      profiles: [],
      pointsTransactions: [],
      content: [],
      comments: [],
      walletConnections: [],
      transactions: []
    };
    
    // Generate users and profiles
    if (config.users) {
      result.users = userFactory.createMany(config.users);
      
      // Generate profiles for users
      result.profiles = result.users.map(user => 
        profileFactory.create({ userId: user.id })
      );
    }
    
    // Generate points transactions
    if (config.pointsTransactions && result.users.length > 0) {
      // Distribute transactions among users
      result.pointsTransactions = [];
      for (let i = 0; i < config.pointsTransactions; i++) {
        const userId = result.users[Math.floor(Math.random() * result.users.length)].id;
        result.pointsTransactions.push(
          pointsTransactionFactory.create({ userId })
        );
      }
    }
    
    // Generate content
    if (config.content && result.users.length > 0) {
      // Distribute content among users
      result.content = [];
      for (let i = 0; i < config.content; i++) {
        const userId = result.users[Math.floor(Math.random() * result.users.length)].id;
        result.content.push(
          contentFactory.create({ userId })
        );
      }
    }
    
    // Generate comments
    if (config.comments && result.content.length > 0 && result.users.length > 0) {
      // Distribute comments among content and users
      result.comments = [];
      for (let i = 0; i < config.comments; i++) {
        const contentId = result.content[Math.floor(Math.random() * result.content.length)].id;
        const userId = result.users[Math.floor(Math.random() * result.users.length)].id;
        result.comments.push(
          commentFactory.create({ contentId, userId })
        );
      }
    }
    
    // Generate wallet connections
    if (config.walletConnections && result.users.length > 0) {
      // Connect wallets for a subset of users
      const selectedUsers = result.users.slice(0, Math.min(config.walletConnections, result.users.length));
      result.walletConnections = selectedUsers.map(user => 
        walletConnectionFactory.create({ userId: user.id })
      );
    }
    
    // Generate transactions
    if (config.transactions && result.walletConnections.length > 0) {
      // Create transactions for wallet addresses
      result.transactions = [];
      for (let i = 0; i < config.transactions; i++) {
        const walletConnection = result.walletConnections[Math.floor(Math.random() * result.walletConnections.length)];
        result.transactions.push(
          transactionFactory.create({
            fromAddress: i % 2 === 0 ? walletConnection.walletAddress : undefined,
            toAddress: i % 2 === 1 ? walletConnection.walletAddress : undefined
          })
        );
      }
    }
    
    return result;
  }
  
  /**
   * Seed a database with generated data
   * 
   * @param db Database connection
   * @param config Dataset configuration
   * @returns Summary of inserted records
   */
  public async seedDatabase(db: any, config: DataSetConfig = {}): Promise<Record<string, number>> {
    // Generate data
    const data = await this.generateDataSet(config);
    
    // Insert data into database
    const summary: Record<string, number> = {};
    
    if (data.users.length > 0) {
      await db.insertMany('users', data.users);
      summary.users = data.users.length;
    }
    
    if (data.profiles.length > 0) {
      await db.insertMany('profiles', data.profiles);
      summary.profiles = data.profiles.length;
    }
    
    if (data.pointsTransactions.length > 0) {
      await db.insertMany('user_points', data.pointsTransactions);
      summary.pointsTransactions = data.pointsTransactions.length;
    }
    
    if (data.content.length > 0) {
      await db.insertMany('content', data.content);
      summary.content = data.content.length;
    }
    
    if (data.comments.length > 0) {
      await db.insertMany('comments', data.comments);
      summary.comments = data.comments.length;
    }
    
    if (data.walletConnections.length > 0) {
      await db.insertMany('wallet_connections', data.walletConnections);
      summary.walletConnections = data.walletConnections.length;
    }
    
    if (data.transactions.length > 0) {
      await db.insertMany('transactions', data.transactions);
      summary.transactions = data.transactions.length;
    }
    
    return summary;
  }
}

// Export a singleton instance for convenience
const dataGenerator = new DataGenerator();
export default dataGenerator;
