/**
 * Wallet Module
 * 
 * This module provides wallet integration, including connection, verification,
 * balance retrieval, and transaction history.
 */
import { Pool } from 'pg';
import { WalletRepository } from '../repositories/wallet-repository';
import { WalletConnectionService } from './connection/service';
import { WalletVerificationService } from './verification/service';
import { WalletBalanceService } from './balance/service';
import { WalletTransactionService } from './transactions/service';
import { WalletConnectionController } from './connection/controller';
import { WalletVerificationController } from './verification/controller';
import { WalletBalanceController } from './balance/controller';
import { WalletTransactionController } from './transactions/controller';

/**
 * Wallet module configuration
 */
export interface WalletModuleConfig {
  db: Pool;
}

/**
 * Wallet module class
 */
export class WalletModule {
  public readonly connectionService: WalletConnectionService;
  public readonly verificationService: WalletVerificationService;
  public readonly balanceService: WalletBalanceService;
  public readonly transactionService: WalletTransactionService;
  
  public readonly connectionController: WalletConnectionController;
  public readonly verificationController: WalletVerificationController;
  public readonly balanceController: WalletBalanceController;
  public readonly transactionController: WalletTransactionController;
  
  /**
   * Create wallet module
   * 
   * @param config Wallet module configuration
   */
  constructor(private readonly config: WalletModuleConfig) {
    // Create repository
    const walletRepository = new WalletRepository(config.db);
    
    // Create services
    this.connectionService = new WalletConnectionService(walletRepository);
    this.verificationService = new WalletVerificationService(walletRepository);
    this.balanceService = new WalletBalanceService(walletRepository);
    this.transactionService = new WalletTransactionService(walletRepository);
    
    // Create controllers
    this.connectionController = new WalletConnectionController(this.connectionService);
    this.verificationController = new WalletVerificationController(this.verificationService);
    this.balanceController = new WalletBalanceController(this.balanceService);
    this.transactionController = new WalletTransactionController(this.transactionService);
  }
}

// Store singleton instance
let walletModule: WalletModule | null = null;

/**
 * Initialize wallet module
 * 
 * @param config Wallet module configuration
 * @returns Wallet module
 */
export function initializeWalletModule(config: WalletModuleConfig): WalletModule {
  walletModule = new WalletModule(config);
  return walletModule;
}

/**
 * Get wallet module
 * 
 * @returns Wallet module or null if not initialized
 */
export function getWalletModule(): WalletModule | null {
  return walletModule;
}

/**
 * Export wallet types
 */
export * from './connection/service';
export * from './verification/service';
export * from './balance/service';
export * from './transactions/service';
