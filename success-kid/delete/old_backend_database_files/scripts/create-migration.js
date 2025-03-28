#!/usr/bin/env node

/**
 * Create Migration Script
 * 
 * This script generates a new migration file with a sequential ID and boilerplate code.
 * Usage: node create-migration.js migration_name
 */
const fs = require('fs');
const path = require('path');

// Get migration name from command line arguments
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Error: Migration name is required');
  console.error('Usage: node create-migration.js migration_name');
  process.exit(1);
}

// Convert migration name to snake_case
const snakeCaseName = migrationName
  .replace(/([A-Z])/g, '_$1')
  .replace(/\s+/g, '_')
  .replace(/^_/, '')
  .toLowerCase();

// Get migrations directory
const migrationsDir = path.join(__dirname, '..', 'migrations');

// Get all existing migration files
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.match(/^\d{3}_.*\.ts$/))
  .sort();

// Determine next migration ID
let nextId = 1;
if (migrationFiles.length > 0) {
  const lastFile = migrationFiles[migrationFiles.length - 1];
  const lastId = parseInt(lastFile.split('_')[0], 10);
  nextId = lastId + 1;
}

// Format ID with leading zeros
const paddedId = String(nextId).padStart(3, '0');

// Create the migration file name
const fileName = `${paddedId}_${snakeCaseName}.ts`;
const filePath = path.join(migrationsDir, fileName);

// Create migration file content
const migrationContent = `/**
 * Migration: ${migrationName}
 */
import { PoolClient } from 'pg';
import { Migration } from './index';

export const ${toCamelCase(snakeCaseName)}: Migration = {
  id: '${paddedId}',
  name: '${snakeCaseName}',
  up: async (client: PoolClient) => {
    // Implementation for applying the migration
    await client.query(\`
      -- Add your SQL here
    \`);
  },
  down: async (client: PoolClient) => {
    // Implementation for reverting the migration
    await client.query(\`
      -- Add your reversion SQL here
    \`);
  }
};
`;

// Write the migration file
fs.writeFileSync(filePath, migrationContent);

console.log(`Created migration file: ${filePath}`);

// Don't forget to add the migration to the index.ts file
console.log(`
Remember to add your migration to the index.ts file:

import { ${toCamelCase(snakeCaseName)} } from './${paddedId}_${snakeCaseName}';

// Add to migrations array
export const migrations: Migration[] = [
  // existing migrations...
  ${toCamelCase(snakeCaseName)}
];
`);

// Helper function to convert snake_case to camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
