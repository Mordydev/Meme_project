/**
 * Migration: Create Redemptions Tables
 * 
 * Creates tables for managing point-to-token redemptions.
 */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions = {
  id: { type: 'uuid', primaryKey: true, notNull: true, default: 'uuid_generate_v4()' },
  userId: { type: 'uuid', notNull: true },
  createdAt: { type: 'timestamp', notNull: true, default: 'NOW()' },
  updatedAt: { type: 'timestamp', notNull: true, default: 'NOW()' },
};

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create redemptions table
  pgm.createTable('redemptions', {
    id: shorthands.id,
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    points_amount: { type: 'numeric', notNull: true },
    token_amount: { type: 'numeric', notNull: true },
    wallet_address: { type: 'text', notNull: true },
    status: { 
      type: 'text', 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'processing', 'pending_confirmation', 'completed', 'failed', 'cancelled')"
    },
    transaction_hash: { type: 'text', notNull: false },
    created_at: shorthands.createdAt,
    processed_at: { type: 'timestamp', notNull: false },
    completed_at: { type: 'timestamp', notNull: false },
    error: { type: 'text', notNull: false },
    reference_id: { type: 'text', notNull: false },
    metadata: { type: 'jsonb', notNull: false, default: '{}' },
    updated_at: shorthands.updatedAt,
  });

  // Create redemption_transactions table
  pgm.createTable('redemption_transactions', {
    id: shorthands.id,
    redemption_id: { 
      type: 'uuid', 
      notNull: true, 
      references: 'redemptions(id)', 
      onDelete: 'CASCADE' 
    },
    transaction_hash: { type: 'text', notNull: false },
    status: {
      type: 'text',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'processing', 'completed', 'failed')"
    },
    attempts: { type: 'integer', notNull: true, default: 0 },
    last_attempt: { type: 'timestamp', notNull: false },
    created_at: shorthands.createdAt,
    completed_at: { type: 'timestamp', notNull: false },
    error: { type: 'text', notNull: false },
    updated_at: shorthands.updatedAt,
  });

  // Create indexes
  pgm.createIndex('redemptions', 'user_id');
  pgm.createIndex('redemptions', 'wallet_address');
  pgm.createIndex('redemptions', 'status');
  pgm.createIndex('redemptions', 'created_at');
  pgm.createIndex('redemptions', 'transaction_hash');
  pgm.createIndex('redemption_transactions', 'redemption_id');
  pgm.createIndex('redemption_transactions', 'status');
  pgm.createIndex('redemption_transactions', 'transaction_hash');

  // Add trigger to update the updated_at timestamp on both tables
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
    },
    `
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('redemptions', 'update_updated_at_trigger', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'update_updated_at_column',
  });

  pgm.createTrigger('redemption_transactions', 'update_updated_at_trigger', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'update_updated_at_column',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop triggers
  pgm.dropTrigger('redemptions', 'update_updated_at_trigger');
  pgm.dropTrigger('redemption_transactions', 'update_updated_at_trigger');
  
  // Drop function
  pgm.dropFunction('update_updated_at_column', []);
  
  // Drop tables
  pgm.dropTable('redemption_transactions');
  pgm.dropTable('redemptions');
}
