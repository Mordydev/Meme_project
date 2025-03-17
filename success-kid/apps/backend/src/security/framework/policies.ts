/**
 * Security Policies
 * 
 * Default security policies for the Success Kid Community Platform
 */
import { SecurityPolicy } from './types';
import { 
  headerSecurity,
  inputValidation,
  contentSecurityCheck,
  authenticationCheck,
  xssProtection,
  sqlInjectionProtection,
  rateLimit
} from '../middleware';

/**
 * Default security policies
 */
export const defaultPolicies: SecurityPolicy[] = [
  // API security policy (applies to all API routes)
  {
    id: 'api-security',
    name: 'API Security',
    description: 'Security policy for all API routes',
    middleware: [
      headerSecurity,
      inputValidation,
      xssProtection
    ],
    pathPatterns: ['^/api/.*'],
    priority: 100,
    enabled: true
  },
  
  // Authentication routes security policy
  {
    id: 'auth-routes-security',
    name: 'Authentication Routes Security',
    description: 'Enhanced security for authentication routes',
    middleware: [
      headerSecurity,
      inputValidation,
      rateLimit({ 
        points: 10, 
        duration: 60,
        keyPrefix: 'ratelimit:auth:'
      }),
      xssProtection,
      sqlInjectionProtection
    ],
    pathPatterns: ['^/api/v1/auth/.*'],
    priority: 200,
    enabled: true
  },
  
  // User data security policy
  {
    id: 'user-data-security',
    name: 'User Data Security',
    description: 'Security policy for user data routes',
    middleware: [
      headerSecurity,
      authenticationCheck,
      inputValidation,
      contentSecurityCheck,
      xssProtection,
      sqlInjectionProtection
    ],
    pathPatterns: [
      '^/api/v1/users/.*',
      '^/api/v1/profiles/.*'
    ],
    priority: 150,
    enabled: true
  },
  
  // Payment related security policy
  {
    id: 'payment-security',
    name: 'Payment Security',
    description: 'Enhanced security for payment and wallet routes',
    middleware: [
      headerSecurity,
      authenticationCheck,
      inputValidation,
      rateLimit({ 
        points: 10, 
        duration: 300,
        keyPrefix: 'ratelimit:payment:'
      }),
      xssProtection,
      sqlInjectionProtection
    ],
    pathPatterns: [
      '^/api/v1/payments/.*',
      '^/api/v1/wallet/.*',
      '^/api/v1/points/redeem.*'
    ],
    priority: 300,
    enabled: true
  },
  
  // Admin routes security policy
  {
    id: 'admin-security',
    name: 'Admin Security',
    description: 'Enhanced security for admin routes',
    middleware: [
      headerSecurity,
      authenticationCheck,
      inputValidation,
      rateLimit({ 
        points: 100, 
        duration: 3600,
        keyPrefix: 'ratelimit:admin:'
      }),
      xssProtection,
      sqlInjectionProtection
    ],
    pathPatterns: ['^/api/v1/admin/.*'],
    priority: 400,
    enabled: true
  },
  
  // Public routes basic security policy
  {
    id: 'public-security',
    name: 'Public Routes Security',
    description: 'Basic security for public routes',
    middleware: [
      headerSecurity,
      rateLimit({ 
        points: 100, 
        duration: 60,
        keyPrefix: 'ratelimit:public:'
      }),
      inputValidation,
      xssProtection
    ],
    pathPatterns: [
      '^/api/v1/public/.*',
      '^/api/v1/content/.*'
    ],
    excludePatterns: ['^/api/v1/content/create.*'],
    priority: 50,
    enabled: true
  }
];

/**
 * Create a custom security policy
 * 
 * @param policy Partial security policy
 * @returns Complete security policy
 */
export function createPolicy(policy: Partial<SecurityPolicy>): SecurityPolicy {
  return {
    id: policy.id || `custom-${Date.now()}`,
    name: policy.name || 'Custom Policy',
    description: policy.description || 'Custom security policy',
    middleware: policy.middleware || [],
    pathPatterns: policy.pathPatterns || [],
    excludePatterns: policy.excludePatterns,
    priority: policy.priority || 100,
    enabled: policy.enabled !== undefined ? policy.enabled : true
  };
}
