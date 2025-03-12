import pino from 'pino';

// Create a logger instance with appropriate log level based on environment
const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
  base: {
    pid: false,
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});
