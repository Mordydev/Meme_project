/**
 * Type definitions for API contract verification
 */

/**
 * API endpoint definition
 */
export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  version: string;
  description: string;
  auth: boolean;
  requestSchema?: any;
  responseSchema: any;
  queryParams?: any;
  pathParams?: string[];
  rateLimit?: {
    max: number;
    window: string;
  };
  deprecated?: boolean;
  tags: string[];
}

/**
 * API contract mapping
 */
export interface ApiContract {
  endpoints: ApiEndpoint[];
  components: {
    schemas: Record<string, any>;
    responses: Record<string, any>;
    parameters: Record<string, any>;
  };
  info: {
    title: string;
    version: string;
    description: string;
  };
}

/**
 * Verification result for a single endpoint
 */
export interface EndpointVerificationResult {
  endpoint: ApiEndpoint;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Contract verification options
 */
export interface VerificationOptions {
  ignoreDeprecated?: boolean;
  verbose?: boolean;
  checkFrontendImplementation?: boolean;
  checkBackendImplementation?: boolean;
}

/**
 * Contract verification result
 */
export interface VerificationResult {
  valid: boolean;
  endpoints: EndpointVerificationResult[];
  totalErrors: number;
  totalWarnings: number;
}

/**
 * Generator options
 */
export interface GeneratorOptions {
  outputDir: string;
  includeDeprecated?: boolean;
  format?: 'ts' | 'js' | 'json';
  generateClients?: boolean;
}
