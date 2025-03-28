#!/usr/bin/env node

/**
 * Run Migrations Script
 * 
 * This script runs database migrations from the command line.
 * Usage: node run-migrations.js [--rollback]
 */
require('dotenv').config();
const path = require('path');
const { execSync } = require('child_process');

// Determine if we're rolling back or applying migrations
const isRollback = process.argv.includes('--rollback');

// Command to compile TypeScript
const tscCommand = 'npx tsc';

// Build the project first
console.log('Building project...');
try {
  execSync(tscCommand, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to build project:', error.message);
  process.exit(1);
}

// Path to the compiled migrations script
const scriptPath = path.join(__dirname, '..', '..', '..', 'dist', 'src', 'database', 'scripts', 'migrations-runner.js');

// Execute the migrations
console.log(`${isRollback ? 'Rolling back' : 'Running'} migrations...`);
try {
  execSync(`node ${scriptPath} ${isRollback ? '--rollback' : ''}`, { stdio: 'inherit' });
} catch (error) {
  console.error(`Failed to ${isRollback ? 'rollback' : 'run'} migrations:`, error.message);
  process.exit(1);
}

console.log(`Migrations ${isRollback ? 'rollback' : 'execution'} completed successfully.`);
