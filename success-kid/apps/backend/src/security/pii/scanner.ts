/**
 * PII Scanner
 * 
 * Detects PII (Personally Identifiable Information) in data
 */
import { logger } from '../../lib/logger';
import { 
  PiiType, 
  PiiSensitivity, 
  PiiHandlingPolicy, 
  PiiScanResult,
  PiiDetection 
} from './types';

// PII detection patterns
const PII_PATTERNS = {
  [PiiType.EMAIL]: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  [PiiType.PHONE]: /\b(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/,
  [PiiType.CREDIT_CARD]: /\b(?:\d{4}[- ]?){3}\d{4}\b/,
  [PiiType.SSN]: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/,
  [PiiType.IP_ADDRESS]: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  [PiiType.DATE_OF_BIRTH]: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/,
  [PiiType.NAME]: /\b([A-Z][a-z]+(?: [A-Z][a-z]+)+)\b/,
  [PiiType.ADDRESS]: /\b\d+\s+[A-Za-z\s]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Place|Pl|Terrace|Ter)\b/i,
  [PiiType.API_KEY]: /\b(?:[A-Za-z0-9_-]{20,})\b/
};

// Default sensitivity map
const DEFAULT_SENSITIVITY = {
  [PiiType.EMAIL]: PiiSensitivity.MEDIUM,
  [PiiType.PHONE]: PiiSensitivity.MEDIUM,
  [PiiType.CREDIT_CARD]: PiiSensitivity.HIGH,
  [PiiType.SSN]: PiiSensitivity.HIGH,
  [PiiType.IP_ADDRESS]: PiiSensitivity.MEDIUM,
  [PiiType.DATE_OF_BIRTH]: PiiSensitivity.MEDIUM,
  [PiiType.NAME]: PiiSensitivity.MEDIUM,
  [PiiType.ADDRESS]: PiiSensitivity.MEDIUM,
  [PiiType.USERNAME]: PiiSensitivity.LOW,
  [PiiType.PASSWORD]: PiiSensitivity.HIGH,
  [PiiType.API_KEY]: PiiSensitivity.HIGH,
  [PiiType.ID_NUMBER]: PiiSensitivity.HIGH,
  [PiiType.CUSTOM]: PiiSensitivity.MEDIUM
};

// Default handling policy map
const DEFAULT_HANDLING_POLICY = {
  [PiiType.EMAIL]: PiiHandlingPolicy.MASK,
  [PiiType.PHONE]: PiiHandlingPolicy.MASK,
  [PiiType.CREDIT_CARD]: PiiHandlingPolicy.ENCRYPT,
  [PiiType.SSN]: PiiHandlingPolicy.ENCRYPT,
  [PiiType.IP_ADDRESS]: PiiHandlingPolicy.MASK,
  [PiiType.DATE_OF_BIRTH]: PiiHandlingPolicy.MASK,
  [PiiType.NAME]: PiiHandlingPolicy.MASK,
  [PiiType.ADDRESS]: PiiHandlingPolicy.MASK,
  [PiiType.USERNAME]: PiiHandlingPolicy.ALLOW,
  [PiiType.PASSWORD]: PiiHandlingPolicy.HASH,
  [PiiType.API_KEY]: PiiHandlingPolicy.REDACT,
  [PiiType.ID_NUMBER]: PiiHandlingPolicy.ENCRYPT,
  [PiiType.CUSTOM]: PiiHandlingPolicy.MASK
};

/**
 * Scan for PII in data
 * 
 * @param data Data to scan for PII
 * @returns PII scan result
 */
export function scanForPii(data: any): PiiScanResult {
  try {
    const detections: PiiDetection[] = [];
    const recommendations: Record<string, PiiHandlingPolicy> = {};
    
    // Recursively scan data
    scanObject(data, '', detections, recommendations);
    
    // Determine data subject rights based on detections
    const dataSubjectRights = determineDataSubjectRights(detections);
    
    return {
      containsPii: detections.length > 0,
      detections,
      recommendations,
      dataSubjectRights
    };
  } catch (error) {
    logger.error('Error scanning for PII', { error });
    
    return {
      containsPii: false,
      detections: [],
      recommendations: {}
    };
  }
}

/**
 * Determine data subject rights based on PII detections
 * 
 * @param detections PII detections
 * @returns Applicable data subject rights
 */
function determineDataSubjectRights(detections: PiiDetection[]): string[] {
  const rights: string[] = [];
  
  if (detections.length > 0) {
    // Basic rights for any PII
    rights.push('access', 'rectification', 'erasure');
    
    // Check for high-sensitivity PII
    const hasHighSensitivityPii = detections.some(
      detection => detection.sensitivity === PiiSensitivity.HIGH
    );
    
    if (hasHighSensitivityPii) {
      rights.push('restriction', 'dataPortability', 'objectToProcessing');
    }
  }
  
  return rights;
}

/**
 * Recursively scan object for PII
 * 
 * @param obj Object to scan
 * @param path Current path in object
 * @param detections Array to populate with detections
 * @param recommendations Object to populate with recommendations
 */
function scanObject(
  obj: any,
  path: string,
  detections: PiiDetection[],
  recommendations: Record<string, PiiHandlingPolicy>
): void {
  // Skip null/undefined
  if (obj == null) return;
  
  // Handle different types
  if (typeof obj === 'string') {
    scanString(obj, path, detections, recommendations);
    return;
  }
  
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      // Scan array elements
      obj.forEach((item, index) => {
        scanObject(item, path ? `${path}[${index}]` : `[${index}]`, detections, recommendations);
      });
    } else {
      // Scan object properties
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          scanObject(obj[key], path ? `${path}.${key}` : key, detections, recommendations);
        }
      }
    }
  }
}

/**
 * Scan string for PII
 * 
 * @param value String to scan
 * @param path Path to string in object
 * @param detections Array to populate with detections
 * @param recommendations Object to populate with recommendations
 */
function scanString(
  value: string,
  path: string,
  detections: PiiDetection[],
  recommendations: Record<string, PiiHandlingPolicy>
): void {
  // Skip empty strings
  if (!value) return;
  
  // Known PII field names (case insensitive)
  const knownPiiFields = {
    email: PiiType.EMAIL,
    mail: PiiType.EMAIL,
    phone: PiiType.PHONE,
    mobile: PiiType.PHONE,
    telephone: PiiType.PHONE,
    cell: PiiType.PHONE,
    ssn: PiiType.SSN,
    'social security': PiiType.SSN,
    'credit card': PiiType.CREDIT_CARD,
    'card number': PiiType.CREDIT_CARD,
    'cc number': PiiType.CREDIT_CARD,
    address: PiiType.ADDRESS,
    'street address': PiiType.ADDRESS,
    'date of birth': PiiType.DATE_OF_BIRTH,
    dob: PiiType.DATE_OF_BIRTH,
    'birth date': PiiType.DATE_OF_BIRTH,
    birthday: PiiType.DATE_OF_BIRTH,
    'full name': PiiType.NAME,
    name: PiiType.NAME,
    'first name': PiiType.NAME,
    'last name': PiiType.NAME,
    'api key': PiiType.API_KEY,
    'api-key': PiiType.API_KEY,
    apikey: PiiType.API_KEY,
    username: PiiType.USERNAME,
    password: PiiType.PASSWORD,
    'ip address': PiiType.IP_ADDRESS
  };
  
  // Check if field name indicates PII
  const fieldName = path.split('.').pop()?.toLowerCase() || '';
  const fieldNameWithoutIndex = fieldName.replace(/\[\d+\]$/, '');
  
  // Field name suggests specific PII type
  if (knownPiiFields[fieldNameWithoutIndex]) {
    const type = knownPiiFields[fieldNameWithoutIndex];
    
    // Check if content matches expected pattern
    if (!PII_PATTERNS[type] || PII_PATTERNS[type].test(value)) {
      // Add detection
      detections.push({
        field: path,
        value,
        type,
        sensitivity: DEFAULT_SENSITIVITY[type] || PiiSensitivity.MEDIUM,
        confidence: 0.9, // High confidence due to field name match
        handlingRecommendation: DEFAULT_HANDLING_POLICY[type] || PiiHandlingPolicy.MASK
      });
      
      // Add recommendation
      recommendations[path] = DEFAULT_HANDLING_POLICY[type] || PiiHandlingPolicy.MASK;
      
      return;
    }
  }
  
  // Check for PII patterns regardless of field name
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(value)) {
      // Add detection
      detections.push({
        field: path,
        value,
        type: type as PiiType,
        sensitivity: DEFAULT_SENSITIVITY[type] || PiiSensitivity.MEDIUM,
        confidence: 0.7, // Medium confidence due to pattern match only
        handlingRecommendation: DEFAULT_HANDLING_POLICY[type] || PiiHandlingPolicy.MASK
      });
      
      // Add recommendation
      recommendations[path] = DEFAULT_HANDLING_POLICY[type] || PiiHandlingPolicy.MASK;
      
      // One detection is enough for a field
      return;
    }
  }
}
