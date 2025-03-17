/**
 * Security Vulnerability Patterns
 * 
 * Defines patterns for detecting common security vulnerabilities
 */

/**
 * Vulnerability type enum
 */
export enum VulnerabilityType {
  SQL_INJECTION = 'sql_injection',
  XSS = 'xss',
  COMMAND_INJECTION = 'command_injection',
  PATH_TRAVERSAL = 'path_traversal',
  OPEN_REDIRECT = 'open_redirect',
  SERVER_SIDE_TEMPLATE_INJECTION = 'ssti',
  XML_EXTERNAL_ENTITY = 'xxe',
  INSECURE_DESERIALIZATION = 'insecure_deserialization'
}

/**
 * Vulnerability severity enum
 */
export enum VulnerabilitySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Security pattern interface
 */
export interface SecurityPattern {
  id: string;
  type: VulnerabilityType;
  severity: VulnerabilitySeverity;
  description: string;
  regex: RegExp;
  falsePositiveRate: number; // 0-1 probability estimate
}

/**
 * Collection of security patterns for vulnerability detection
 */
export const securityPatterns: SecurityPattern[] = [
  // SQL Injection Patterns
  {
    id: 'sql-injection-1',
    type: VulnerabilityType.SQL_INJECTION,
    severity: VulnerabilitySeverity.HIGH,
    description: 'Basic SQL injection pattern',
    regex: /('|"|;|--|\/\*|\*\/|=|--(space)|(%3B)|(%))+/i,
    falsePositiveRate: 0.2
  },
  {
    id: 'sql-injection-2',
    type: VulnerabilityType.SQL_INJECTION,
    severity: VulnerabilitySeverity.HIGH,
    description: 'SQL injection keywords',
    regex: /\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|EXECUTE|TRUNCATE|DECLARE)\b/i,
    falsePositiveRate: 0.4 // Higher false positive rate
  },
  {
    id: 'sql-injection-3',
    type: VulnerabilityType.SQL_INJECTION,
    severity: VulnerabilitySeverity.CRITICAL,
    description: 'Union-based SQL injection',
    regex: /UNION\s+(ALL\s+)?SELECT/i,
    falsePositiveRate: 0.1
  },
  {
    id: 'sql-injection-4',
    type: VulnerabilityType.SQL_INJECTION,
    severity: VulnerabilitySeverity.HIGH,
    description: 'Boolean-based SQL injection',
    regex: /\bOR\b\s+\d+\s*=\s*\d+/i,
    falsePositiveRate: 0.3
  },
  
  // XSS Patterns
  {
    id: 'xss-1',
    type: VulnerabilityType.XSS,
    severity: VulnerabilitySeverity.HIGH,
    description: 'Basic script tag',
    regex: /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    falsePositiveRate: 0.1
  },
  {
    id: 'xss-2',
    type: VulnerabilityType.XSS,
    severity: VulnerabilitySeverity.MEDIUM,
    description: 'Event handlers',
    regex: /\bon\w+\s*=\s*["']?/i,
    falsePositiveRate: 0.2
  },
  {
    id: 'xss-3',
    type: VulnerabilityType.XSS,
    severity: VulnerabilitySeverity.HIGH,
    description: 'JavaScript URI',
    regex: /\b(javascript|data|vbscript):/i,
    falsePositiveRate: 0.2
  },
  {
    id: 'xss-4',
    type: VulnerabilityType.XSS,
    severity: VulnerabilitySeverity.MEDIUM,
    description: 'HTML tags with potential for XSS',
    regex: /<(iframe|object|embed|base|form|input|button|textarea|select|option)/i,
    falsePositiveRate: 0.3
  },
  
  // Command Injection Patterns
  {
    id: 'command-injection-1',
    type: VulnerabilityType.COMMAND_INJECTION,
    severity: VulnerabilitySeverity.CRITICAL,
    description: 'Basic shell command operators',
    regex: /[;&|`]|\$\(|\|\|/,
    falsePositiveRate: 0.2
  },
  {
    id: 'command-injection-2',
    type: VulnerabilityType.COMMAND_INJECTION,
    severity: VulnerabilitySeverity.HIGH,
    description: 'Shell command sequences',
    regex: /\b(cat|ls|pwd|id|whoami|echo|rm|mv|cp|curl|wget)/i,
    falsePositiveRate: 0.5 // High false positive rate
  },
  
  // Path Traversal Patterns
  {
    id: 'path-traversal-1',
    type: VulnerabilityType.PATH_TRAVERSAL,
    severity: VulnerabilitySeverity.HIGH,
    description: 'Directory traversal sequences',
    regex: /\.\.\/|\.\.\\|%2e%2e%2f|%252e%252e%252f/i,
    falsePositiveRate: 0.1
  },
  {
    id: 'path-traversal-2',
    type: VulnerabilityType.PATH_TRAVERSAL,
    severity: VulnerabilitySeverity.MEDIUM,
    description: 'Absolute path references',
    regex: /^\/etc\/|^\/var\/|^C:\\Windows\\|^\/bin\/|^\/tmp\//i,
    falsePositiveRate: 0.3
  },
  
  // Open Redirect Patterns
  {
    id: 'open-redirect-1',
    type: VulnerabilityType.OPEN_REDIRECT,
    severity: VulnerabilitySeverity.MEDIUM,
    description: 'URL redirection to external domain',
    regex: /(?:url|redirect|link|goto|return_to)=.*(https?:\/\/|\/\/)/i,
    falsePositiveRate: 0.2
  },
  
  // Server-Side Template Injection
  {
    id: 'ssti-1',
    type: VulnerabilityType.SERVER_SIDE_TEMPLATE_INJECTION,
    severity: VulnerabilitySeverity.HIGH,
    description: 'Common template injection patterns',
    regex: /\{\{\s*[\d\w]\s*\}\}|\{\%\s*[\d\w]\s*\%\}|\$\{\s*[\d\w]\s*\}/,
    falsePositiveRate: 0.3
  },
  
  // XXE Patterns
  {
    id: 'xxe-1',
    type: VulnerabilityType.XML_EXTERNAL_ENTITY,
    severity: VulnerabilitySeverity.HIGH,
    description: 'XXE attack pattern',
    regex: /<!DOCTYPE[^>]*?SYSTEM[^>]*?>|<!ENTITY\s+\S+\s+SYSTEM/i,
    falsePositiveRate: 0.1
  },
  
  // Insecure Deserialization
  {
    id: 'deserialization-1',
    type: VulnerabilityType.INSECURE_DESERIALIZATION,
    severity: VulnerabilitySeverity.HIGH,
    description: 'Serialized object patterns',
    regex: /O:[0-9]+:"[^"]+":[0-9]+:\{|rO0ABXNy/i, // PHP and Java serialization
    falsePositiveRate: 0.1
  }
];

/**
 * Get patterns by vulnerability type
 * 
 * @param type Vulnerability type
 * @returns Patterns matching the specified type
 */
export function getPatternsByType(type: VulnerabilityType): SecurityPattern[] {
  return securityPatterns.filter(pattern => pattern.type === type);
}

/**
 * Get patterns by minimum severity
 * 
 * @param severity Minimum severity level
 * @returns Patterns with severity at or above the specified level
 */
export function getPatternsBySeverity(severity: VulnerabilitySeverity): SecurityPattern[] {
  const severityLevels = {
    [VulnerabilitySeverity.LOW]: 1,
    [VulnerabilitySeverity.MEDIUM]: 2,
    [VulnerabilitySeverity.HIGH]: 3,
    [VulnerabilitySeverity.CRITICAL]: 4
  };
  
  const minimumLevel = severityLevels[severity];
  
  return securityPatterns.filter(
    pattern => severityLevels[pattern.severity] >= minimumLevel
  );
}
