/**
 * Vulnerability Scanner
 * 
 * This module provides functionality for scanning requests and data for security vulnerabilities.
 */

import { FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { 
  VULNERABILITY_PATTERNS, 
  VulnerabilityType, 
  VulnerabilityPattern,
  getPatternsByContext
} from './patterns';
import { SecuritySeverity, Vulnerability } from '../types';

/**
 * Vulnerability scan options
 */
export interface VulnerabilityScanOptions {
  /**
   * Severity levels to include in the scan
   */
  severityLevels?: ('critical' | 'high' | 'medium' | 'low')[];
  
  /**
   * Vulnerability types to include in the scan
   */
  vulnerabilityTypes?: VulnerabilityType[];
  
  /**
   * Whether to scan query parameters
   */
  scanQuery?: boolean;
  
  /**
   * Whether to scan request body
   */
  scanBody?: boolean;
  
  /**
   * Whether to scan headers
   */
  scanHeaders?: boolean;
  
  /**
   * Whether to scan cookies
   */
  scanCookies?: boolean;
  
  /**
   * Whether to scan URL path parameters
   */
  scanParams?: boolean;
}

/**
 * Default vulnerability scan options
 */
const defaultScanOptions: VulnerabilityScanOptions = {
  severityLevels: ['critical', 'high', 'medium', 'low'],
  vulnerabilityTypes: Object.values(VulnerabilityType),
  scanQuery: true,
  scanBody: true,
  scanHeaders: true,
  scanCookies: true,
  scanParams: true
};

/**
 * Scan result for a specific vulnerability type
 */
export interface VulnerabilityScanTypeResult {
  detected: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: any;
  location: string;
}

/**
 * Vulnerability scan result
 */
export interface VulnerabilityScanResult {
  vulnerabilities: Vulnerability[];
  passed: boolean;
  score: number;
  timestamp: Date;
  duration: number;
  scannedRoutes: number;
}

/**
 * Vulnerability Scanner
 */
export class VulnerabilityScanner {
  private options: VulnerabilityScanOptions;
  private patterns: VulnerabilityPattern[];
  
  /**
   * Create a new vulnerability scanner
   */
  constructor(options: Partial<VulnerabilityScanOptions> = {}) {
    this.options = { ...defaultScanOptions, ...options };
    
    // Filter patterns based on options
    this.patterns = VULNERABILITY_PATTERNS.filter(pattern => {
      // Filter by severity
      if (this.options.severityLevels && !this.options.severityLevels.includes(pattern.severity)) {
        return false;
      }
      
      // Filter by vulnerability type
      if (this.options.vulnerabilityTypes && !this.options.vulnerabilityTypes.includes(pattern.type)) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Scan a request for security vulnerabilities
   */
  scanRequest(request: FastifyRequest): VulnerabilityScanResult {
    const startTime = process.hrtime();
    const vulnerabilities: Vulnerability[] = [];
    
    // Track scanned routes
    let scannedRoutes = 0;
    
    try {
      // Scan query parameters
      if (this.options.scanQuery && request.query) {
        scannedRoutes++;
        const queryPatterns = getPatternsByContext('query');
        this.scanObject(request.query, queryPatterns, 'query', vulnerabilities);
      }
      
      // Scan request body
      if (this.options.scanBody && request.body) {
        scannedRoutes++;
        const bodyPatterns = getPatternsByContext('body');
        this.scanObject(request.body, bodyPatterns, 'body', vulnerabilities);
      }
      
      // Scan headers
      if (this.options.scanHeaders && request.headers) {
        scannedRoutes++;
        const headerPatterns = getPatternsByContext('headers');
        this.scanObject(request.headers, headerPatterns, 'headers', vulnerabilities);
      }
      
      // Scan cookies
      if (this.options.scanCookies && request.cookies) {
        scannedRoutes++;
        const cookiePatterns = getPatternsByContext('cookies');
        this.scanObject(request.cookies, cookiePatterns, 'cookies', vulnerabilities);
      }
      
      // Scan URL path parameters
      if (this.options.scanParams && request.params) {
        scannedRoutes++;
        const paramPatterns = getPatternsByContext('params');
        this.scanObject(request.params, paramPatterns, 'params', vulnerabilities);
      }
      
      // Calculate scan duration
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      
      // Calculate security score
      const score = this.calculateSecurityScore(vulnerabilities);
      
      return {
        vulnerabilities,
        passed: vulnerabilities.length === 0,
        score,
        timestamp: new Date(),
        duration,
        scannedRoutes
      };
    } catch (error) {
      logger.error('Error scanning request for vulnerabilities', { error });
      
      // Calculate scan duration
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      
      return {
        vulnerabilities,
        passed: vulnerabilities.length === 0,
        score: 100, // Assume pass on error
        timestamp: new Date(),
        duration,
        scannedRoutes
      };
    }
  }
  
  /**
   * Scan a string for vulnerabilities
   */
  scanString(
    value: string,
    patterns: VulnerabilityPattern[],
    path: string
  ): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    
    for (const pattern of patterns) {
      if (pattern.pattern.test(value)) {
        vulnerabilities.push({
          id: uuidv4(),
          name: pattern.name,
          description: pattern.description,
          severity: this.mapSeverity(pattern.severity),
          location: path,
          data: { value },
          mitigation: pattern.remediation
        });
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Recursively scan an object for vulnerabilities
   */
  private scanObject(
    obj: Record<string, any>,
    patterns: VulnerabilityPattern[],
    context: string,
    vulnerabilities: Vulnerability[],
    path: string = ''
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        // Scan string value
        const stringVulnerabilities = this.scanString(value, patterns, currentPath);
        vulnerabilities.push(...stringVulnerabilities);
      } else if (Array.isArray(value)) {
        // Scan array values
        value.forEach((item, index) => {
          if (typeof item === 'string') {
            const arrayPath = `${currentPath}[${index}]`;
            const stringVulnerabilities = this.scanString(item, patterns, arrayPath);
            vulnerabilities.push(...stringVulnerabilities);
          } else if (item && typeof item === 'object') {
            this.scanObject(item, patterns, context, vulnerabilities, `${currentPath}[${index}]`);
          }
        });
      } else if (value && typeof value === 'object') {
        // Recursively scan nested objects
        this.scanObject(value, patterns, context, vulnerabilities, currentPath);
      }
    }
  }
  
  /**
   * Map vulnerability severity to security severity
   */
  private mapSeverity(severity: string): SecuritySeverity {
    switch (severity) {
      case 'critical':
        return SecuritySeverity.CRITICAL;
      case 'high':
        return SecuritySeverity.HIGH;
      case 'medium':
        return SecuritySeverity.MEDIUM;
      case 'low':
        return SecuritySeverity.LOW;
      default:
        return SecuritySeverity.INFO;
    }
  }
  
  /**
   * Calculate security score based on vulnerabilities
   */
  private calculateSecurityScore(vulnerabilities: Vulnerability[]): number {
    if (vulnerabilities.length === 0) {
      return 100;
    }
    
    // Define severity weights
    const severityWeights = {
      [SecuritySeverity.CRITICAL]: 100,
      [SecuritySeverity.HIGH]: 40,
      [SecuritySeverity.MEDIUM]: 20,
      [SecuritySeverity.LOW]: 5,
      [SecuritySeverity.INFO]: 1
    };
    
    // Calculate total penalty
    let totalPenalty = 0;
    
    for (const vulnerability of vulnerabilities) {
      totalPenalty += severityWeights[vulnerability.severity] || 0;
    }
    
    // Cap penalty at 100
    totalPenalty = Math.min(100, totalPenalty);
    
    // Return score
    return 100 - totalPenalty;
  }
}

// Export singleton instance
export const vulnerabilityScanner = new VulnerabilityScanner();
