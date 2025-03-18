/**
 * Solana Blockchain Provider
 * 
 * Implementation of the blockchain provider interface for Solana.
 */
import { 
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram
} from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { FeeEstimate, IBlockchainProvider, TokenTransferParams, TransactionResponse, TransactionStatus } from '../blockchain-provider-interface';
import { logger } from '../../../../lib/logger';

/**
 * Solana blockchain provider implementation
 */
export class SolanaProvider implements IBlockchainProvider {
  private connection: Connection;
  private keypair: Keypair;
  private tokenPublicKey: PublicKey;
  
  constructor(
    private rpcUrl: string,
    private tokenAddress: string,
    private treasuryPrivateKey: string
  ) {
    // Initialize Solana connection
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // Initialize token public key
    this.tokenPublicKey = new PublicKey(tokenAddress);
    
    // Initialize keypair from private key
    // Note: In production, this would use a secure method to store and access private keys
    try {
      const secretKey = Buffer.from(treasuryPrivateKey, 'base64');
      this.keypair = Keypair.fromSecretKey(secretKey);
      logger.info('Solana provider initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Solana keypair', { error });
      throw new Error('Failed to initialize Solana provider');
    }
  }
  
  /**
   * Get token balance for a wallet address
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const tokenPublicKey = new PublicKey(tokenAddress);
      
      // Find the associated token account
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        { mint: tokenPublicKey }
      );
      
      // If no token account found, return 0
      if (tokenAccounts.value.length === 0) {
        return '0';
      }
      
      // Get balance from the first token account
      const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount.toString();
      
      return balance;
    } catch (error) {
      logger.error('Failed to get token balance', { error, walletAddress, tokenAddress });
      throw new Error('Failed to get token balance');
    }
  }
  
  /**
   * Get Solana network name
   */
  async getNetworkName(): Promise<string> {
    try {
      const genesisHash = await this.connection.getGenesisHash();
      
      // Determine network from genesis hash
      if (genesisHash === '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d') {
        return 'mainnet-beta';
      } else if (genesisHash === 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG') {
        return 'testnet';
      } else if (genesisHash === '4rdJqzjaJzXLYiCAGF7qAqBFeZdpUwnZQJmkWMKrq7ha') {
        return 'devnet';
      } else {
        return 'unknown';
      }
    } catch (error) {
      logger.error('Failed to get network name', { error });
      return 'unknown';
    }
  }
  
  /**
   * Transfer tokens from treasury to a recipient
   */
  async transferTokens(params: TokenTransferParams): Promise<TransactionResponse> {
    try {
      const fromPublicKey = new PublicKey(params.fromAddress);
      const toPublicKey = new PublicKey(params.toAddress);
      const tokenPublicKey = new PublicKey(params.tokenAddress);
      
      // Create token instance
      const token = new Token(
        this.connection,
        tokenPublicKey,
        TOKEN_PROGRAM_ID,
        this.keypair
      );
      
      // Get source token account
      const fromTokenAccount = await token.getOrCreateAssociatedAccountInfo(
        fromPublicKey
      );
      
      // Get destination token account, create if it doesn't exist
      const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(
        toPublicKey
      );
      
      // Parse amount
      const amount = parseFloat(params.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid token amount');
      }
      
      // Convert to token decimals
      const tokenInfo = await token.getMintInfo();
      const decimalAmount = amount * Math.pow(10, tokenInfo.decimals);
      
      // Create transfer instruction
      const transferInstruction = Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        fromTokenAccount.address,
        toTokenAccount.address,
        fromPublicKey,
        [],
        decimalAmount
      );
      
      // Create transaction
      const transaction = new Transaction().add(transferInstruction);
      
      // Set recent blockhash and fee payer
      transaction.recentBlockhash = (
        await this.connection.getRecentBlockhash('max')
      ).blockhash;
      transaction.feePayer = fromPublicKey;
      
      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair],
        { commitment: 'confirmed' }
      );
      
      logger.info('Token transfer successful', { signature, amount, recipient: params.toAddress });
      
      return {
        txHash: signature
      };
    } catch (error) {
      logger.error('Failed to transfer tokens', { error, params });
      throw new Error(`Failed to transfer tokens: ${error.message}`);
    }
  }
  
  /**
   * Get transaction details
   */
  async getTransaction(txHash: string): Promise<TransactionStatus | null> {
    try {
      // Get transaction details
      const txInfo = await this.connection.getTransaction(txHash, {
        commitment: 'confirmed'
      });
      
      // If transaction not found, return null
      if (!txInfo) {
        return null;
      }
      
      // Parse transaction details
      const confirmed = txInfo.meta !== null;
      const timestamp = txInfo.blockTime 
        ? new Date(txInfo.blockTime * 1000) 
        : undefined;
      
      // Get sender and recipient
      let fromAddress: string | undefined;
      let toAddress: string | undefined;
      let amount: number | undefined;
      
      // Check if it's a token transfer
      if (txInfo.meta?.logMessages?.some(log => log.includes('Transfer'))) {
        // This is a simplification - in production would need more robust parsing
        if (txInfo.transaction.message.accountKeys.length >= 2) {
          fromAddress = txInfo.transaction.message.accountKeys[0].toString();
          toAddress = txInfo.transaction.message.accountKeys[1].toString();
          
          // Parse amount from logs (simplified)
          // In production, would need more robust parsing
          amount = txInfo.meta.postTokenBalances && txInfo.meta.preTokenBalances
            ? (txInfo.meta.postTokenBalances[0]?.uiTokenAmount.uiAmount ?? 0) -
              (txInfo.meta.preTokenBalances[0]?.uiTokenAmount.uiAmount ?? 0)
            : undefined;
        }
      }
      
      return {
        confirmed,
        confirmations: txInfo.confirmations,
        fromAddress,
        toAddress,
        amount: Math.abs(amount || 0), // Absolute value since transfer shows as negative for sender
        blockNumber: txInfo.slot,
        timestamp,
        gasUsed: txInfo.meta?.fee ? txInfo.meta.fee / LAMPORTS_PER_SOL : undefined
      };
    } catch (error) {
      logger.error('Failed to get transaction', { error, txHash });
      throw new Error('Failed to get transaction');
    }
  }
  
  /**
   * Estimate transaction fee
   */
  async estimateFee(): Promise<FeeEstimate> {
    try {
      // Get recent prioritization fees for estimation
      const feeCalculator = await this.connection.getRecentPrioritizationFees();
      
      // Calculate average, max, and min fees
      const fees = feeCalculator.map(fee => fee.prioritizationFee);
      const averageFee = fees.reduce((sum, fee) => sum + fee, 0) / fees.length;
      const maxFee = Math.max(...fees);
      const minFee = Math.min(...fees);
      
      // Convert to SOL units
      const averageFeeInSol = (averageFee / LAMPORTS_PER_SOL).toFixed(9);
      const fastFeeInSol = (maxFee / LAMPORTS_PER_SOL).toFixed(9);
      const slowFeeInSol = (minFee / LAMPORTS_PER_SOL).toFixed(9);
      
      return {
        fee: averageFeeInSol,
        fastFee: fastFeeInSol,
        averageFee: averageFeeInSol,
        slowFee: slowFeeInSol,
        currency: 'SOL',
        estimatedTimeInSeconds: 60 // Estimated confirmation time (1 minute)
      };
    } catch (error) {
      logger.error('Failed to estimate fees', { error });
      
      // Return default values on error
      return {
        fee: '0.000005',
        currency: 'SOL',
        estimatedTimeInSeconds: 60
      };
    }
  }
  
  /**
   * Check if the provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check by getting the version
      const version = await this.connection.getVersion();
      return !!version;
    } catch (error) {
      logger.error('Solana provider is unavailable', { error, url: this.rpcUrl });
      return false;
    }
  }
}
