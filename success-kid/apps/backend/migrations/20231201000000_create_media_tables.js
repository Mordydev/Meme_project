/**
 * Migration: Create Media Tables
 * 
 * Creates tables for media storage, processing, and permissions
 */
exports.up = function(knex) {
  return knex.schema
    // Create media table
    .createTable('media', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('original_name').notNullable();
      table.string('mime_type').notNullable();
      table.bigInteger('size').notNullable();
      table.enum('type', ['image', 'video', 'document', 'audio', 'other']).notNullable();
      table.string('path').notNullable().unique();
      table.string('public_url');
      table.enum('status', ['uploading', 'processing', 'ready', 'failed', 'deleted']).notNullable().defaultTo('uploading');
      table.jsonb('metadata');
      table.jsonb('variants');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('processing_completed_at');
      
      // Add indices
      table.index('user_id');
      table.index('type');
      table.index('status');
      table.index('created_at');
    })
    
    // Create media permissions table
    .createTable('media_permissions', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('media_id').notNullable().references('id').inTable('media').onDelete('CASCADE');
      table.enum('entity_type', ['user', 'role', 'public']).notNullable();
      table.uuid('entity_id');
      table.enum('permission', ['read', 'write', 'delete']).notNullable();
      table.timestamp('expires_at');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.uuid('created_by').notNullable().references('id').inTable('users');
      
      // Add indices
      table.index('media_id');
      table.index(['entity_type', 'entity_id']);
      table.index('expires_at');
      
      // Add constraint for entity_id
      table.check(
        '(entity_type = \'public\' AND entity_id IS NULL) OR (entity_type != \'public\' AND entity_id IS NOT NULL)',
        'entity_id_constraint'
      );
      
      // Add unique constraint
      table.unique(['media_id', 'entity_type', 'entity_id', 'permission']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('media_permissions')
    .dropTableIfExists('media');
};
