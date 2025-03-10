import pino from 'pino';
import { config } from '../config';

/**
 * Application logger
 * Configured based on environment (pretty printing in development)
 */
export const logger = pino({
  level: config.logger.level,
  ...(config.logger.prettyPrint ? {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    },
  } : {}),
});

/**
 * Create a child logger with a specific component context
 */
export function createLogger(component: string) {
  return logger.child({ component });
}
