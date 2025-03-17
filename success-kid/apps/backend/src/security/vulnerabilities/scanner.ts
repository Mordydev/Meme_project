/**
 * Vulnerability Scanner
 * 
 * Scans requests for security vulnerabilities
 */
import { FastifyRequest } from 'fastify';
import { logger } from '../../lib/logger';
import { 
  securityPatterns, 
  SecurityPattern, 
  VulnerabilityType, 
  VulnerabilitySeverity 
} from './patterns';

/**
 * Vulnerability detection result
 */
export interface VulnerabilityDetection {
  patternId: string;
  type: VulnerabilityType;
  severity: VulnerabilitySeverity;
  value: string;
  location: string;
  confidence: number; // 0-1, higher is more confident
}

/**
 * Request scan result
 */
export interface RequestScanResult {
  hasVulnerabilities: boolean;
  detections: VulnerabilityDetection[];
  highestSeverity?: VulnerabilitySeverity;
  riskScore: number; // 0-100, higher is riskier
}

/**
 * Scan a value using security patterns
 * 
 * @param value Value to scan
 * @param patterns Security patterns to check
 * @returns Array of vulnerability detections
 */
function scanValue(
  value: string,
  patterns: SecurityPattern[] = securityPatterns
): VulnerabilityDetection[] {
  const detections: VulnerabilityDetection[] = [];
  
  if (!value || typeof value !== 'string') {
    return detections;
  }
  
  // Check each pattern
  for (const pattern of patterns) {
    if (pattern.regex.test(value)) {
      // Calculate confidence based on false positive rate
      const confidence = 1 - pattern.falsePositiveRate;
      
      detections.push({
        patternId: pattern.id,
        type: pattern.type,
        severity: pattern.severity,
        value,
        location: '',
        confidence
      });
    }
  }
  
  return detections;
}

/**
 * Scan an object recursively for vulnerabilities
 * 
 * @param obj Object to scan
 * @param patterns Security patterns to check
 * @param path Current path in object
 * @returns Array of vulnerability detections
 */
function scanObject(
  obj: any,
  patterns: SecurityPattern[] = securityPatterns,
  path: string = ''
): VulnerabilityDetection[] {
  let detections: VulnerabilityDetection[] = [];
  
  if (obj == null) {
    return detections;
  }
  
  if (typeof obj === 'string') {
    const valueDetections = scanValue(obj, patterns);
    
    // Add path to each detection
    valueDetections.forEach(detection => {
      detection.location = path;
    });
    
    return valueDetections;
  }
  
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      // Scan array elements
      obj.forEach((item, index) => {
        const arrayPath = path ? `${path}[${index}]` : `[${index}]`;
        const itemDetections = scanObject(item, patterns, arrayPath);
        detections = detections.concat(itemDetections);
      });
    } else {
      // Scan object properties
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const propertyPath = path ? `${path}.${key}` : key;
          const propertyDetections = scanObject(obj[key], patterns, propertyPath);
          detections = detections.concat(propertyDetections);
        }
      }
    }
  }
  
  return detections;
}

/**
 * Calculate risk score for vulnerability detections
 * 
 * @param detections Array of vulnerability detections
 * @returns Risk score (0-100)
 */
function calculateRiskScore(detections: VulnerabilityDetection[]): number {
  if (detections.length === 0) {
    return 0;
  }
  
  // Severity weights
  const severityScores = {
    [VulnerabilitySeverity.LOW]: 10,
    [VulnerabilitySeverity.MEDIUM]: 30,
    [VulnerabilitySeverity.HIGH]: 70,
    [VulnerabilitySeverity.CRITICAL]: 100
  };
  
  // Calculate weighted average
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const detection of detections) {
    const severityScore = severityScores[detection.severity];
    const weight = detection.confidence;
    
    totalScore += severityScore * weight;
    totalWeight += weight;
  }
  
  // Calculate average
  const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  
  // Apply multiplier based on number of detections
  const countMultiplier = Math.min(1 + (detections.length - 1) * 0.1, 1.5);
  
  // Calculate final score (capped at 100)
  return Math.min(averageScore * countMultiplier, 100);
}

/**
 * Get highest severity from vulnerability detections
 * 
 * @param detections Array of vulnerability detections
 * @returns Highest severity or undefined if no detections
 */
function getHighestSeverity(
  detections: VulnerabilityDetection[]
): VulnerabilitySeverity | undefined {
  if (detections.length === 0) {
    return undefined;
  }
  
  // Severity rankings
  const severityRanks = {
    [VulnerabilitySeverity.LOW]: 1,
    [VulnerabilitySeverity.MEDIUM]: 2,
    [VulnerabilitySeverity.HIGH]: 3,
    [VulnerabilitySeverity.CRITICAL]: 4
  };
  
  // Find highest severity
  let highestRank = 0;
  let highestSeverity: VulnerabilitySeverity | undefined;
  
  for (const detection of detections) {
    const rank = severityRanks[detection.severity];
    
    if (rank > highestRank) {
      highestRank = rank;
      highestSeverity = detection.severity;
    }
  }
  
  return highestSeverity;
}

/**
 * Scan a request for security vulnerabilities
 * 
 * @param request Fastify request to scan
 * @returns Scan result
 */
export function scanRequest(request: FastifyRequest): RequestScanResult {
  try {
    const detections: VulnerabilityDetection[] = [];
    
    // Scan query parameters
    if (request.query && typeof request.query === 'object') {
      const queryDetections = scanObject(request.query, securityPatterns, 'query');
      detections.push(...queryDetections);
    }
    
    // Scan URL parameters
    if (request.params && typeof request.params === 'object') {
      const paramsDetections = scanObject(request.params, securityPatterns, 'params');
      detections.push(...paramsDetections);
    }
    
    // Scan request body
    if (request.body && typeof request.body === 'object') {
      const bodyDetections = scanObject(request.body, securityPatterns, 'body');
      detections.push(...bodyDetections);
    }
    
    // Scan headers (excluding cookies which may contain legitimate session data)
    const headers = { ...request.headers };
    delete headers.cookie;
    
    const headerDetections = scanObject(headers, securityPatterns, 'headers');
    detections.push(...headerDetections);
    
    // Calculate risk score
    const riskScore = calculateRiskScore(detections);
    
    // Get highest severity
    const highestSeverity = getHighestSeverity(detections);
    
    return {
      hasVulnerabilities: detections.length > 0,
      detections,
      highestSeverity,
      riskScore
    };
  } catch (error) {
    logger.error('Error scanning request for vulnerabilities', { error });
    
    // Return empty result on error
    return {
      hasVulnerabilities: false,
      detections: [],
      riskScore: 0
    };
  }
}
