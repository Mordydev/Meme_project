/**
 * Blockchain Provider Factory
 * 
 * Creates and manages blockchain providers with failover capability.
 */
import { logger } from '../../../lib/logger';
import { IBlockchainProvider } from './blockchain-provider-interface';
import { SolanaProvider } from './solana-provider';

/**
 * Factory class for blockchain providers with failover support
 */
export class BlockchainProviderFactory {
  private providers: IBlockchainProvider[] = [];
  private currentProviderIndex = 0;
  private lastFailure: number | null = null;
  private failureCounters: Map<number, number> = new Map();
  private readonly failoverThreshold = 3; // Number of failures before switching providers
  private readonly failureWindow = 60000; // 1 minute failover window
  
  constructor(
    private providerUrls: string[],
    private tokenAddress: string,
    private treasuryPrivateKey: string
  ) {
    if (!providerUrls || providerUrls.length === 0) {
      throw new Error('At least one provider URL must be specified');
    }
    
    // Initialize providers
    this.initializeProviders();
  }
  
  /**
   * Initialize blockchain providers
   */
  private initializeProviders(): void {
    // Create a provider for each URL
    this.providers = this.providerUrls.map(url => 
      new SolanaProvider(url, this.tokenAddress, this.treasuryPrivateKey)
    );
    
    logger.info(`Initialized ${this.providers.length} blockchain providers`);
  }
  
  /**
   * Get the current active blockchain provider
   */
  getProvider(): IBlockchainProvider {
    // Reset failure counts if enough time has passed
    this.resetFailureCountersIfNeeded();
    
    return this.providers[this.currentProviderIndex];
  }
  
  /**
   * Report a provider failure to trigger potential failover
   */
  reportFailure(): IBlockchainProvider {
    const now = Date.now();
    this.lastFailure = now;
    
    // Increment failure counter for current provider
    const currentCount = this.failureCounters.get(this.currentProviderIndex) || 0;
    this.failureCounters.set(this.currentProviderIndex, currentCount + 1);
    
    // Switch provider if failure threshold is reached
    if (currentCount + 1 >= this.failoverThreshold) {
      this.switchToNextProvider();
    }
    
    return this.getProvider();
  }
  
  /**
   * Switch to the next available provider
   */
  private switchToNextProvider(): void {
    const oldProvider = this.currentProviderIndex;
    
    // Move to next provider (with wrap-around)
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
    
    // Reset failure counter for the new provider
    this.failureCounters.set(this.currentProviderIndex, 0);
    
    logger.info(`Switched blockchain provider from ${oldProvider} to ${this.currentProviderIndex}`);
  }
  
  /**
   * Reset failure counters if the failure window has elapsed
   */
  private resetFailureCountersIfNeeded(): void {
    if (!this.lastFailure) return;
    
    const now = Date.now();
    if (now - this.lastFailure > this.failureWindow) {
      this.failureCounters.clear();
      this.lastFailure = null;
      logger.debug('Reset blockchain provider failure counters');
    }
  }
}
