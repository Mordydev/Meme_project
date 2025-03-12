/**
 * Configuration Index
 * 
 * This module exports all configuration modules for easy access.
 */

import { env } from './environment';
import databaseConfig from './database';
import redisConfig from './redis';

export {
  env,
  databaseConfig,
  redisConfig,
};

/**
 * Export default configuration object
 */
export default {
  env,
  databaseConfig,
  redisConfig,
};