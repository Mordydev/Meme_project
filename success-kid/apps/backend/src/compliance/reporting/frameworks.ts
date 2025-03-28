/**
 * Compliance Frameworks
 * 
 * This module defines compliance frameworks and controls.
 */

/**
 * Compliance control
 */
export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

/**
 * Compliance framework
 */
export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  controls: ComplianceControl[];
  enabled: boolean;
}

/**
 * Get available compliance frameworks
 */
export function getComplianceFrameworks(): ComplianceFramework[] {
  return [
    // GDPR Framework
    {
      id: 'gdpr',
      name: 'General Data Protection Regulation',
      version: '1.0',
      description: 'EU data protection and privacy framework',
      controls: [
        {
          id: 'gdpr-1',
          name: 'Lawful Basis for Processing',
          description: 'Ensure a lawful basis for processing personal data',
          category: 'data_protection',
          requirement: 'Identify and document the lawful basis for all data processing activities',
          severity: 'high',
          recommendation: 'Maintain a register of processing activities with lawful basis for each'
        },
        {
          id: 'gdpr-2',
          name: 'Data Subject Rights',
          description: 'Support data subject rights (access, deletion, portability, etc.)',
          category: 'data_protection',
          requirement: 'Implement mechanisms to fulfill data subject requests within required timeframes',
          severity: 'high',
          recommendation: 'Develop automated systems for handling data subject requests'
        },
        {
          id: 'gdpr-3',
          name: 'Consent Management',
          description: 'Manage and track user consent for processing',
          category: 'data_protection',
          requirement: 'Obtain and manage valid consent for data processing where required',
          severity: 'high',
          recommendation: 'Implement a consent management platform with audit trail'
        },
        {
          id: 'gdpr-4',
          name: 'Data Breach Notification',
          description: 'Process for handling and reporting data breaches',
          category: 'incident_response',
          requirement: 'Report data breaches to authorities within 72 hours',
          severity: 'critical',
          recommendation: 'Develop and test a data breach response plan'
        },
        {
          id: 'gdpr-5',
          name: 'Data Protection by Design',
          description: 'Privacy controls built into systems and processes',
          category: 'data_protection',
          requirement: 'Implement technical and organizational measures to protect personal data',
          severity: 'medium',
          recommendation: 'Conduct data protection impact assessments for high-risk processing'
        }
      ],
      enabled: true
    },
    
    // CCPA Framework
    {
      id: 'ccpa',
      name: 'California Consumer Privacy Act',
      version: '1.0',
      description: 'California data privacy framework',
      controls: [
        {
          id: 'ccpa-1',
          name: 'Notice at Collection',
          description: 'Provide notice of data collection practices',
          category: 'data_protection',
          requirement: 'Provide notice of data collection practices at or before the point of collection',
          severity: 'high',
          recommendation: 'Maintain up-to-date privacy notice with required CCPA elements'
        },
        {
          id: 'ccpa-2',
          name: 'Right to Know',
          description: 'Process for consumers to request information about their data',
          category: 'data_protection',
          requirement: 'Disclose personal information collected, sold, or disclosed to consumers upon request',
          severity: 'high',
          recommendation: 'Implement system for tracking data collection, sales, and disclosures'
        },
        {
          id: 'ccpa-3',
          name: 'Right to Delete',
          description: 'Process for consumers to request deletion',
          category: 'data_protection',
          requirement: 'Delete consumer personal information upon request, subject to exceptions',
          severity: 'high',
          recommendation: 'Implement data deletion mechanism and track exceptions'
        },
        {
          id: 'ccpa-4',
          name: 'Right to Opt-Out',
          description: 'Allow consumers to opt out of data sales',
          category: 'data_protection',
          requirement: 'Provide "Do Not Sell My Personal Information" option if selling personal information',
          severity: 'high',
          recommendation: 'Implement opt-out mechanism and honor preferences'
        },
        {
          id: 'ccpa-5',
          name: 'Service Provider Requirements',
          description: 'Contractual requirements for service providers',
          category: 'third_party',
          requirement: 'Include required provisions in service provider contracts',
          severity: 'medium',
          recommendation: 'Update contracts with service providers to include CCPA provisions'
        }
      ],
      enabled: true
    },
    
    // ISO 27001 Framework (simplified)
    {
      id: 'iso27001',
      name: 'ISO/IEC 27001 Information Security',
      version: '1.0',
      description: 'International standard for information security management',
      controls: [
        {
          id: 'iso-1',
          name: 'Information Security Policy',
          description: 'Establish information security policy',
          category: 'data_protection',
          requirement: 'Documented information security policy approved by management',
          severity: 'high',
          recommendation: 'Develop and maintain a comprehensive information security policy'
        },
        {
          id: 'iso-2',
          name: 'Access Control',
          description: 'Control access to information and systems',
          category: 'access_control',
          requirement: 'Implement access controls based on business and security requirements',
          severity: 'high',
          recommendation: 'Implement role-based access control with principle of least privilege'
        },
        {
          id: 'iso-3',
          name: 'Cryptography',
          description: 'Protect confidentiality and integrity of information',
          category: 'encryption',
          requirement: 'Implement cryptographic controls to protect sensitive information',
          severity: 'high',
          recommendation: 'Use industry-standard encryption for data at rest and in transit'
        },
        {
          id: 'iso-4',
          name: 'Operational Security',
          description: 'Secure operations procedures and protection against malware',
          category: 'vulnerability_management',
          requirement: 'Implement controls to protect against malware and technical vulnerabilities',
          severity: 'critical',
          recommendation: 'Implement vulnerability management program and regular patching'
        },
        {
          id: 'iso-5',
          name: 'Communications Security',
          description: 'Secure network services and information transfer',
          category: 'encryption',
          requirement: 'Protect information in networks and during transfer',
          severity: 'high',
          recommendation: 'Implement network segregation, TLS for data in transit'
        },
        {
          id: 'iso-6',
          name: 'System Acquisition and Development',
          description: 'Security in development and support processes',
          category: 'vulnerability_management',
          requirement: 'Build security into development and change management processes',
          severity: 'medium',
          recommendation: 'Implement secure development practices and security testing'
        },
        {
          id: 'iso-7',
          name: 'Supplier Relationships',
          description: 'Security in supplier relationships',
          category: 'third_party',
          requirement: 'Protect information accessible to suppliers and maintain service delivery',
          severity: 'medium',
          recommendation: 'Implement supplier security assessment and contractual requirements'
        },
        {
          id: 'iso-8',
          name: 'Incident Management',
          description: 'Management of information security incidents',
          category: 'incident_response',
          requirement: 'Establish incident response process to ensure consistent and effective response',
          severity: 'high',
          recommendation: 'Develop and test incident response plan'
        },
        {
          id: 'iso-9',
          name: 'Business Continuity',
          description: 'Information security in business continuity',
          category: 'business_continuity',
          requirement: 'Ensure information security continuity during adverse situations',
          severity: 'high',
          recommendation: 'Develop business continuity plan with regular testing'
        },
        {
          id: 'iso-10',
          name: 'Compliance',
          description: 'Compliance with legal and contractual requirements',
          category: 'data_protection',
          requirement: 'Identify and comply with applicable legislation and contractual requirements',
          severity: 'high',
          recommendation: 'Maintain register of compliance obligations and regular assessments'
        }
      ],
      enabled: true
    },
    
    // OWASP Top 10 Framework
    {
      id: 'owasp',
      name: 'OWASP Top 10',
      version: '2021',
      description: 'Top 10 web application security risks',
      controls: [
        {
          id: 'owasp-1',
          name: 'Broken Access Control',
          description: 'Restrictions on authenticated users are not properly enforced',
          category: 'access_control',
          requirement: 'Implement proper access controls for authenticated users',
          severity: 'critical',
          recommendation: 'Implement role-based access control with proper authorization checks'
        },
        {
          id: 'owasp-2',
          name: 'Cryptographic Failures',
          description: 'Failures related to cryptography leading to data exposure',
          category: 'encryption',
          requirement: 'Protect sensitive data with proper cryptography',
          severity: 'critical',
          recommendation: 'Use strong algorithms, proper key management, and encrypt sensitive data at rest'
        },
        {
          id: 'owasp-3',
          name: 'Injection',
          description: 'User-supplied data is not validated, filtered, or sanitized',
          category: 'vulnerability_management',
          requirement: 'Prevent injection attacks through proper input validation',
          severity: 'critical',
          recommendation: 'Use parameterized queries, input validation, and context-aware escaping'
        },
        {
          id: 'owasp-4',
          name: 'Insecure Design',
          description: 'Security flaws in the design of the application',
          category: 'vulnerability_management',
          requirement: 'Design secure applications from the ground up',
          severity: 'high',
          recommendation: 'Use threat modeling and secure design patterns'
        },
        {
          id: 'owasp-5',
          name: 'Security Misconfiguration',
          description: 'Insecure default configurations or incomplete configurations',
          category: 'vulnerability_management',
          requirement: 'Securely configure all systems and components',
          severity: 'high',
          recommendation: 'Implement secure configuration baseline and regular scanning'
        },
        {
          id: 'owasp-6',
          name: 'Vulnerable Components',
          description: 'Using components with known vulnerabilities',
          category: 'vulnerability_management',
          requirement: 'Keep software and dependencies up to date',
          severity: 'high',
          recommendation: 'Monitor for vulnerabilities in dependencies and update regularly'
        },
        {
          id: 'owasp-7',
          name: 'Authentication Failures',
          description: 'Authentication mechanisms that can be bypassed or exploited',
          category: 'authentication',
          requirement: 'Implement secure authentication mechanisms',
          severity: 'critical',
          recommendation: 'Use multi-factor authentication, secure session management'
        },
        {
          id: 'owasp-8',
          name: 'Software and Data Integrity Failures',
          description: 'Software and data integrity verification issues',
          category: 'vulnerability_management',
          requirement: 'Verify the integrity of software and data',
          severity: 'high',
          recommendation: 'Use digital signatures and secure CI/CD pipeline'
        },
        {
          id: 'owasp-9',
          name: 'Logging and Monitoring Failures',
          description: 'Insufficient logging and monitoring',
          category: 'audit_logging',
          requirement: 'Implement comprehensive logging and monitoring',
          severity: 'high',
          recommendation: 'Log security-relevant events and implement monitoring with alerts'
        },
        {
          id: 'owasp-10',
          name: 'Server-Side Request Forgery',
          description: 'Server makes requests to internal resources based on user input',
          category: 'vulnerability_management',
          requirement: 'Prevent server from making unauthorized requests',
          severity: 'high',
          recommendation: 'Implement allowlists and network segmentation'
        }
      ],
      enabled: true
    }
  ];
}
