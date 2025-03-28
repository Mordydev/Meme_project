/**
 * Redis configuration
 */
import { env } from './environment';

export const redisConfig = {
  // Connection string from environment
  url: env.REDIS_URL,
  
  // Connection options
  options: {
    // Maximum number of retries per request
    maxRetriesPerRequest: 3,
    
    // Check if server is ready when connecting
    enableReadyCheck: true,
    
    // Better error stack in development
    showFriendlyErrorStack: env.NODE_ENV !== 'production',
    
    // Reconnect strategy
    retryStrategy(times: number) {
      // Maximum retry time of 30 seconds
      const maxRetryTime = 30000;
      
      // Exponential backoff with a maximum delay
      const delay = Math.min(
        Math.pow(2, times) * 100,
        maxRetryTime
      );
      
      return delay;
    },
    
    // In production, enable TLS if the URL uses redis://
    tls: env.NODE_ENV === 'production' && env.REDIS_URL.startsWith('redis://') 
      ? { rejectUnauthorized: false }
      : undefined,
  },
  
  // Set key prefix for shared Redis instances
  keyPrefix: 'sk:',
};

export default redisConfig;