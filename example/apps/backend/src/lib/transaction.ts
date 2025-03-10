import { FastifyInstance } from 'fastify';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Transaction callback function type
 */
type TransactionCallback<T> = (transaction: SupabaseClient) => Promise<T>;

/**
 * TransactionManager handles database transactions
 */
export class TransactionManager {
  constructor(private fastify: FastifyInstance) {}

  /**
   * Execute a function within a transaction
   * Handles begin, commit, and rollback automatically
   * 
   * @param callback Function to execute within transaction
   * @returns Result of the callback function
   */
  async execute<T>(callback: TransactionCallback<T>): Promise<T> {
    const client = this.fastify.supabase;
    
    try {
      // Begin transaction
      await client.rpc('begin_transaction');
      
      // Execute the callback
      const result = await callback(client);
      
      // Commit transaction
      await client.rpc('commit_transaction');
      
      return result;
    } catch (error) {
      // Rollback transaction on error
      await client.rpc('rollback_transaction');
      throw error;
    }
  }
}
