/**
 * Default security configuration
 * 
 * This file defines the default security configuration for the application.
 */

import { SecurityConfig } from '../types';

/**
 * Default security configuration values
 */
export const defaultSecurityConfig: SecurityConfig = {
  contentSecurityPolicy: {
    enabled: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  cors: {
    enabled: true,
    origin: ['http://localhost:3000', 'https://success-kid.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  },
  rateLimiting: {
    enabled: true,
    defaultLimit: 100,
    defaultWindow: '1 minute'
  },
  csrf: {
    enabled: true,
    cookie: {
      key: 'csrf-token',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
  },
  headers: {
    enabled: true,
    hidePoweredBy: true,
    noSniff: true,
    xssProtection: true,
    frameOptions: 'DENY',
    hsts: {
      enabled: true,
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true
    }
  },
  encryption: {
    defaultAlgorithm: 'aes-256-gcm',
    keyRotationDays: 90
  },
  pii: {
    autoDetection: true,
    masking: {
      enabled: true,
      replaceChar: '*'
    }
  }
};
