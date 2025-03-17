/**
 * API Contract Verification Engine
 * 
 * Verifies that API contracts are consistent between the frontend and backend.
 */
import Ajv from 'ajv';
import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import { ApiContract, ApiEndpoint, VerificationOptions, VerificationResult, EndpointVerificationResult } from './types';

// Initialize Ajv with appropriate options
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  strictSchema: false
});

/**
 * Load API contract from filesystem
 * 
 * @param contractPath Path to contract file or directory
 * @returns API contract
 */
export async function loadApiContract(contractPath: string): Promise<ApiContract> {
  if (fs.statSync(contractPath).isDirectory()) {
    // Load from directory (multiple files)
    const endpoints: ApiEndpoint[] = [];
    const schemas: Record<string, any> = {};
    const responses: Record<string, any> = {};
    const parameters: Record<string, any> = {};
    
    // Find endpoint definitions
    const endpointFiles = await glob('**/*.endpoint.{json,js,ts}', { cwd: contractPath });
    
    for (const file of endpointFiles) {
      const endpoint = require(path.join(contractPath, file));
      endpoints.push(endpoint);
    }
    
    // Find schema definitions
    const schemaFiles = await glob('**/*.schema.{json,js,ts}', { cwd: contractPath });
    
    for (const file of schemaFiles) {
      const schema = require(path.join(contractPath, file));
      schemas[path.basename(file, path.extname(file)).replace('.schema', '')] = schema;
    }
    
    // Load metadata
    const infoPath = path.join(contractPath, 'info.json');
    const info = fs.existsSync(infoPath) 
      ? JSON.parse(fs.readFileSync(infoPath, 'utf-8'))
      : {
          title: 'Success Kid API',
          version: '1.0.0',
          description: 'Success Kid Community Platform API'
        };
    
    return {
      endpoints,
      components: {
        schemas,
        responses,
        parameters
      },
      info
    };
  } else {
    // Load from single file
    return JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
  }
}

/**
 * Extract OpenAPI schema from backend code
 * 
 * @param backendPath Path to backend source
 * @returns API contract
 */
export async function extractBackendContract(backendPath: string): Promise<ApiContract> {
  // Find routes with OpenAPI annotations
  const routeFiles = await glob('**/*.ts', { 
    cwd: backendPath,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.spec.ts']
  });
  
  const endpoints: ApiEndpoint[] = [];
  const schemas: Record<string, any> = {};
  
  // TODO: Implement extraction of OpenAPI annotations from code
  
  return {
    endpoints,
    components: {
      schemas,
      responses: {},
      parameters: {}
    },
    info: {
      title: 'Extracted API Contract',
      version: '1.0.0',
      description: 'Extracted from backend code'
    }
  };
}

/**
 * Extract API client usage from frontend code
 * 
 * @param frontendPath Path to frontend source
 * @returns API contract usage
 */
export async function extractFrontendUsage(frontendPath: string): Promise<any> {
  // Find files that use apiClient
  const files = await glob('**/*.{ts,tsx}', { 
    cwd: frontendPath,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}']
  });
  
  const apiUsage: Record<string, Set<string>> = {};
  
  // TODO: Implement extraction of API client usage from code
  
  return apiUsage;
}

/**
 * Verify API contract consistency
 * 
 * @param contract API contract to verify
 * @param options Verification options
 * @returns Verification result
 */
export function verifyApiContract(
  contract: ApiContract,
  options: VerificationOptions = {}
): VerificationResult {
  const results: EndpointVerificationResult[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  
  // Process each endpoint
  for (const endpoint of contract.endpoints) {
    // Skip deprecated endpoints if configured
    if (options.ignoreDeprecated && endpoint.deprecated) {
      continue;
    }
    
    const result: EndpointVerificationResult = {
      endpoint,
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Verify path parameters match in path and pathParams
    if (endpoint.path) {
      const pathParamsInPath = (endpoint.path.match(/\{([^}]+)\}/g) || [])
        .map(param => param.substring(1, param.length - 1));
      
      const pathParamsInDef = endpoint.pathParams || [];
      
      // Check if all path parameters in path are defined
      for (const param of pathParamsInPath) {
        if (!pathParamsInDef.includes(param)) {
          result.errors.push(`Path parameter {${param}} in path not defined in pathParams`);
          result.valid = false;
        }
      }
      
      // Check if all defined path parameters are used in path
      for (const param of pathParamsInDef) {
        if (!pathParamsInPath.includes(param)) {
          result.errors.push(`Path parameter "${param}" defined but not used in path`);
          result.valid = false;
        }
      }
    }
    
    // Verify request schema is valid JSON Schema (if provided)
    if (endpoint.requestSchema) {
      try {
        ajv.compile(endpoint.requestSchema);
      } catch (error) {
        result.errors.push(`Invalid request schema: ${error.message}`);
        result.valid = false;
      }
    }
    
    // Verify response schema is valid JSON Schema
    if (endpoint.responseSchema) {
      try {
        ajv.compile(endpoint.responseSchema);
      } catch (error) {
        result.errors.push(`Invalid response schema: ${error.message}`);
        result.valid = false;
      }
    } else {
      result.errors.push('Missing response schema');
      result.valid = false;
    }
    
    // Verify rate limit is reasonable
    if (endpoint.rateLimit && endpoint.rateLimit.max < 1) {
      result.errors.push('Rate limit must be at least 1');
      result.valid = false;
    }
    
    // Add warnings for best practices
    if (!endpoint.description || endpoint.description.length < 10) {
      result.warnings.push('Missing or insufficient endpoint description');
    }
    
    if (!endpoint.tags || endpoint.tags.length === 0) {
      result.warnings.push('No tags specified for endpoint');
    }
    
    if (endpoint.auth === undefined) {
      result.warnings.push('Authentication requirement not specified');
    }
    
    // Add to totals
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
    
    // Add to results
    results.push(result);
  }
  
  return {
    valid: totalErrors === 0,
    endpoints: results,
    totalErrors,
    totalWarnings
  };
}

/**
 * Verify schema compatibility
 * 
 * @param schema1 First schema
 * @param schema2 Second schema
 * @returns true if schemas are compatible
 */
export function verifySchemaCompatibility(schema1: any, schema2: any): boolean {
  // TODO: Implement schema compatibility verification
  return true;
}

/**
 * Format verification result for display
 * 
 * @param result Verification result
 * @param options Verification options
 * @returns Formatted result string
 */
export function formatVerificationResult(
  result: VerificationResult,
  options: VerificationOptions = {}
): string {
  const lines: string[] = [];
  
  lines.push(`API Contract Verification Result: ${result.valid ? 'VALID' : 'INVALID'}`);
  lines.push(`${result.endpoints.length} endpoints checked, ${result.totalErrors} errors, ${result.totalWarnings} warnings`);
  lines.push('');
  
  // Group endpoints by validity
  const invalidEndpoints = result.endpoints.filter(e => !e.valid);
  const validEndpointsWithWarnings = result.endpoints.filter(e => e.valid && e.warnings.length > 0);
  const validEndpoints = result.endpoints.filter(e => e.valid && e.warnings.length === 0);
  
  // Show invalid endpoints
  if (invalidEndpoints.length > 0) {
    lines.push('Invalid Endpoints:');
    
    for (const endpoint of invalidEndpoints) {
      lines.push(`  ${endpoint.endpoint.method} ${endpoint.endpoint.path} (${endpoint.endpoint.version})`);
      
      for (const error of endpoint.errors) {
        lines.push(`    - Error: ${error}`);
      }
      
      for (const warning of endpoint.warnings) {
        lines.push(`    - Warning: ${warning}`);
      }
      
      lines.push('');
    }
  }
  
  // Show valid endpoints with warnings
  if (validEndpointsWithWarnings.length > 0) {
    lines.push('Valid Endpoints with Warnings:');
    
    for (const endpoint of validEndpointsWithWarnings) {
      lines.push(`  ${endpoint.endpoint.method} ${endpoint.endpoint.path} (${endpoint.endpoint.version})`);
      
      for (const warning of endpoint.warnings) {
        lines.push(`    - Warning: ${warning}`);
      }
      
      lines.push('');
    }
  }
  
  // Show all valid endpoints in verbose mode
  if (options.verbose && validEndpoints.length > 0) {
    lines.push('Valid Endpoints:');
    
    for (const endpoint of validEndpoints) {
      lines.push(`  ${endpoint.endpoint.method} ${endpoint.endpoint.path} (${endpoint.endpoint.version})`);
      lines.push('');
    }
  }
  
  return lines.join('\n');
}
