import { eq } from 'drizzle-orm';
import { BaseRepository, QueryOptions } from './base-repository'; // Import base class and options
import { walletConnections, WalletConnection, NewWalletConnection } from '../database/schema/wallets'; // Import schema and types
import { db } from '../database'; // Import db instance
import { logger } from '../lib/logger'; // Standard logger import

// Define the specific entity type for the repository
type WalletConnectionEntity = WalletConnection;

export class WalletConnectionRepository extends BaseRepository<WalletConnectionEntity, typeof walletConnections, NewWalletConnection> {
  constructor() {
    // Pass the table schema, primary key column, and optional column mapping
    super(
        walletConnections,
        walletConnections.id, // Primary key column
        { // Optional mapping for sorting/filtering
            userId: walletConnections.userId,
            walletAddress: walletConnections.walletAddress,
            isVerified: walletConnections.isVerified,
            connectedAt: walletConnections.connectedAt,
            lastVerifiedAt: walletConnections.lastVerifiedAt
        }
    );
  }

  /**
   * Finds a wallet connection by the wallet address.
   * @param address The wallet address to search for.
   * @returns The WalletConnection entity if found, otherwise null.
   */
  async findByAddress(address: string): Promise<WalletConnectionEntity | null> {
    try {
      const result = await db
        .select()
        .from(this.table)
        .where(eq(walletConnections.walletAddress, address))
        .limit(1);

      return result.length > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error) {
      this.logError('findByAddress', error, { address });
      throw this.wrapError('Failed to find wallet connection by address', error);
    }
  }

  /**
   * Finds all wallet connections for a specific user.
   * @param userId The ID of the user.
   * @param options Optional query options.
   * @returns An array of WalletConnection entities.
   */
  async findByUserId(userId: string, options: QueryOptions<WalletConnectionEntity> = {}): Promise<WalletConnectionEntity[]> {
     return this.findMany({
         ...options,
         filter: { ...options.filter, userId: userId }
     });
  }

  /**
   * Implements the abstract mapToEntity method from BaseRepository.
   * Maps a raw database record object to the WalletConnectionEntity type.
   * @param record The raw database record.
   * @returns The mapped WalletConnectionEntity.
   */
  protected mapToEntity(record: Record<string, any>): WalletConnectionEntity {
    return {
      id: record.id,
      userId: record.userId,
      walletAddress: record.walletAddress,
      isVerified: record.isVerified,
      connectedAt: record.connectedAt,
      lastVerifiedAt: record.lastVerifiedAt
    };
  }
}

// Export a singleton instance
export const walletConnectionRepository = new WalletConnectionRepository();
