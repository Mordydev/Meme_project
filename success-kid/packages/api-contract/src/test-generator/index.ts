/**
 * API Contract Test Generator
 * 
 * Generates tests to verify API contracts between frontend and backend.
 */
import { ApiContract, ApiEndpoint } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test generation options
 */
export interface TestGeneratorOptions {
  /**
   * Output directory for generated tests
   */
  outputDir: string;
  
  /**
   * Base URL for API tests
   */
  baseUrl?: string;
  
  /**
   * Include deprecated endpoints
   */
  includeDeprecated?: boolean;
  
  /**
   * Test framework to use
   */
  testFramework?: 'jest' | 'mocha';
  
  /**
   * Include performance tests
   */
  includePerformance?: boolean;
  
  /**
   * Include security tests
   */
  includeSecurity?: boolean;
}

/**
 * Generate endpoint tests from API contract
 * 
 * @param contract API contract
 * @param options Test generator options
 */
export async function generateEndpointTests(
  contract: ApiContract,
  options: TestGeneratorOptions
): Promise<void> {
  const outputDir = options.outputDir;
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Group endpoints by tag for organization
  const endpointsByTag = groupEndpointsByTag(contract.endpoints);
  
  // Generate test files for each tag
  for (const [tag, endpoints] of Object.entries(endpointsByTag)) {
    // Skip empty groups
    if (endpoints.length === 0) continue;
    
    // Skip deprecated endpoints if configured
    const filteredEndpoints = options.includeDeprecated 
      ? endpoints 
      : endpoints.filter(e => !e.deprecated);
    
    if (filteredEndpoints.length === 0) continue;
    
    const testFilePath = path.join(outputDir, `${kebabCase(tag)}.test.ts`);
    const testFileContent = generateTestFileForEndpoints(tag, filteredEndpoints, options);
    
    fs.writeFileSync(testFilePath, testFileContent);
  }
  
  // Generate test entry point
  const indexPath = path.join(outputDir, 'index.ts');
  const indexContent = `/**
 * Generated API Contract Tests
 * 
 * This file is auto-generated. Do not modify it directly.
 */
export * from './test-utils';
`;
  
  fs.writeFileSync(indexPath, indexContent);
  
  // Generate test utilities
  const utilsPath = path.join(outputDir, 'test-utils.ts');
  const utilsContent = generateTestUtils(options);
  
  fs.writeFileSync(utilsPath, utilsContent);
}

/**
 * Group endpoints by tag
 * 
 * @param endpoints API endpoints
 * @returns Endpoints grouped by tag
 */
function groupEndpointsByTag(endpoints: ApiEndpoint[]): Record<string, ApiEndpoint[]> {
  const result: Record<string, ApiEndpoint[]> = {};
  
  for (const endpoint of endpoints) {
    // Use first tag or default to 'general'
    const tag = (endpoint.tags && endpoint.tags.length > 0) ? endpoint.tags[0] : 'general';
    
    if (!result[tag]) {
      result[tag] = [];
    }
    
    result[tag].push(endpoint);
  }
  
  return result;
}

/**
 * Generate test file for endpoints
 * 
 * @param tag Tag name
 * @param endpoints Endpoints for this tag
 * @param options Test generator options
 * @returns Generated test file content
 */
function generateTestFileForEndpoints(
  tag: string,
  endpoints: ApiEndpoint[],
  options: TestGeneratorOptions
): string {
  const lines: string[] = [
    `/**`,
    ` * API Contract Tests - ${tag}`,
    ` * `,
    ` * Generated from API contract. Do not modify directly.`,
    ` */`,
    `import { apiTestClient, validateResponse, setupAuthToken } from './test-utils';`,
    ``
  ];
  
  const framework = options.testFramework || 'jest';
  
  if (framework === 'jest') {
    lines.push(`describe('${tag} API endpoints', () => {`);
    
    // Add beforeAll for auth setup if any endpoints require auth
    if (endpoints.some(e => e.auth)) {
      lines.push(`  beforeAll(async () => {`);
      lines.push(`    await setupAuthToken();`);
      lines.push(`  });`);
      lines.push(``);
    }
    
    // Generate tests for each endpoint
    for (const endpoint of endpoints) {
      lines.push(generateJestTestForEndpoint(endpoint, options));
    }
    
    lines.push(`});`);
  } else if (framework === 'mocha') {
    lines.push(`describe('${tag} API endpoints', function() {`);
    
    // Add before for auth setup if any endpoints require auth
    if (endpoints.some(e => e.auth)) {
      lines.push(`  before(async function() {`);
      lines.push(`    await setupAuthToken();`);
      lines.push(`  });`);
      lines.push(``);
    }
    
    // Generate tests for each endpoint
    for (const endpoint of endpoints) {
      lines.push(generateMochaTestForEndpoint(endpoint, options));
    }
    
    lines.push(`});`);
  }
  
  return lines.join('\n');
}

/**
 * Generate Jest test for an endpoint
 * 
 * @param endpoint API endpoint
 * @param options Test generator options
 * @returns Generated test
 */
function generateJestTestForEndpoint(
  endpoint: ApiEndpoint,
  options: TestGeneratorOptions
): string {
  const lines: string[] = [
    `  describe('${endpoint.method} ${endpoint.path}', () => {`,
    `    // ${endpoint.description}`
  ];
  
  // Mark deprecated endpoints
  if (endpoint.deprecated) {
    lines.push(`    // [DEPRECATED]`);
  }
  
  // Basic functionality test
  lines.push(``);
  lines.push(`    it('should respond with correct structure', async () => {`);
  
  // Generate test setup
  const params = generateTestParams(endpoint);
  const requestCode = generateRequestCode(endpoint, params);
  
  lines.push(requestCode);
  lines.push(``);
  lines.push(`      // Validate response against schema`);
  lines.push(`      expect(response.status).toBe(200);`);
  lines.push(`      validateResponse(response.data, '${getSchemaRef(endpoint.path, endpoint.method)}');`);
  lines.push(`    });`);
  
  // Add error handling test
  lines.push(``);
  lines.push(`    it('should handle errors properly', async () => {`);
  lines.push(`      // TODO: Add error testing for this endpoint`);
  lines.push(`      // For example: invalid parameters, unauthenticated/unauthorized access, etc.`);
  lines.push(`    });`);
  
  // Add security test if enabled
  if (options.includeSecurity && endpoint.auth) {
    lines.push(``);
    lines.push(`    it('should require authentication', async () => {`);
    lines.push(`      try {`);
    lines.push(`        // Attempt request without auth token`);
    lines.push(`        const client = apiTestClient.createUnauthenticatedClient();`);
    
    const requestLine = requestCode.split('\n')[1].replace('apiTestClient', 'client');
    lines.push(`        ${requestLine}`);
    lines.push(`        fail('Request should fail without authentication');`);
    lines.push(`      } catch (error) {`);
    lines.push(`        expect(error.status).toBe(401);`);
    lines.push(`      }`);
    lines.push(`    });`);
  }
  
  // Add performance test if enabled
  if (options.includePerformance) {
    lines.push(``);
    lines.push(`    it('should respond within performance SLA', async () => {`);
    lines.push(`      const startTime = performance.now();`);
    
    lines.push(requestCode);
    
    lines.push(`      const endTime = performance.now();`);
    lines.push(`      const responseTime = endTime - startTime;`);
    lines.push(`      `);
    lines.push(`      // API responses should be <200ms`);
    lines.push(`      expect(responseTime).toBeLessThan(200);`);
    lines.push(`    });`);
  }
  
  lines.push(`  });`);
  
  return lines.join('\n');
}

/**
 * Generate Mocha test for an endpoint
 * 
 * @param endpoint API endpoint
 * @param options Test generator options
 * @returns Generated test
 */
function generateMochaTestForEndpoint(
  endpoint: ApiEndpoint,
  options: TestGeneratorOptions
): string {
  // Similar to Jest function but adapted for Mocha
  // Implementation omitted for brevity
  return `  // Mocha test implementation not provided\n`;
}

/**
 * Generate test parameters for an endpoint
 * 
 * @param endpoint API endpoint
 * @returns Parameter generating code
 */
function generateTestParams(endpoint: ApiEndpoint): string {
  const lines: string[] = [];
  
  // Generate path parameters
  if (endpoint.pathParams && endpoint.pathParams.length > 0) {
    for (const param of endpoint.pathParams) {
      lines.push(`const ${param} = 'SAMPLE_${param.toUpperCase()}'; // TODO: Replace with valid test data`);
    }
  }
  
  // Generate query parameters
  if (endpoint.queryParams) {
    lines.push(`const queryParams = {`);
    for (const [key, schema] of Object.entries(endpoint.queryParams.properties || {})) {
      lines.push(`  ${key}: 'SAMPLE_${key.toUpperCase()}', // TODO: Replace with valid test data`);
    }
    lines.push(`};`);
  }
  
  // Generate request body
  if (endpoint.requestSchema) {
    lines.push(`const requestData = {`);
    lines.push(`  // TODO: Replace with valid test data`);
    lines.push(`  // Generated from schema: ${JSON.stringify(endpoint.requestSchema)}`);
    lines.push(`};`);
  }
  
  return lines.join('\n');
}

/**
 * Generate request code for an endpoint
 * 
 * @param endpoint API endpoint
 * @param params Parameters code
 * @returns Request code
 */
function generateRequestCode(endpoint: ApiEndpoint, params: string): string {
  const lines: string[] = [];
  
  if (params) {
    lines.push(params);
    lines.push('');
  }
  
  let url = endpoint.path;
  
  // Replace path parameters
  if (endpoint.pathParams && endpoint.pathParams.length > 0) {
    for (const param of endpoint.pathParams) {
      url = url.replace(`{${param}}`, `\${${param}}`);
    }
    url = '`' + url + '`';
  } else {
    url = `'${url}'`;
  }
  
  lines.push(`      const response = await apiTestClient.${endpoint.method.toLowerCase()}(`);
  lines.push(`        ${url},`);
  
  if (endpoint.requestSchema) {
    lines.push(`        requestData,`);
  }
  
  if (endpoint.queryParams) {
    lines.push(`        { params: queryParams }`);
  }
  
  lines.push(`      );`);
  
  return lines.join('\n');
}

/**
 * Get schema reference for endpoint
 * 
 * @param path Endpoint path
 * @param method HTTP method
 * @returns Schema reference
 */
function getSchemaRef(path: string, method: string): string {
  // Remove path parameters
  const basePath = path.replace(/\/{[^}]+}/g, '/{id}');
  
  // Convert to schema ref format
  return `${method.toLowerCase()}-${basePath.replace(/\//g, '-').replace(/^-/, '')}`;
}

/**
 * Generate test utilities
 * 
 * @param options Test generator options
 * @returns Test utilities code
 */
function generateTestUtils(options: TestGeneratorOptions): string {
  return `/**
 * API Contract Test Utilities
 * 
 * Shared utilities for API contract tests.
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Ajv from 'ajv';
import { schemas } from './schemas';

// Initialize JSON Schema validator
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  strictSchema: false
});

// Compile all schemas
const validators = Object.entries(schemas).reduce((acc, [name, schema]) => {
  acc[name] = ajv.compile(schema);
  return acc;
}, {} as Record<string, any>);

// Base URL for API tests
const BASE_URL = '${options.baseUrl || 'http://localhost:3000/api'}';

// Authentication token for tests
let authToken: string | null = null;

/**
 * Set up authentication token for tests
 */
export async function setupAuthToken(): Promise<void> {
  // TODO: Implement authentication for tests
  // This could be:
  // 1. Using a test user with credentials
  // 2. Getting a token from auth service directly
  // 3. Using a mock token for tests
  
  authToken = 'TEST_AUTH_TOKEN'; // Replace with actual auth logic
}

/**
 * API test client
 */
class ApiTestClient {
  private axios: AxiosInstance;
  
  constructor(config: AxiosRequestConfig = {}) {
    this.axios = axios.create({
      baseURL: BASE_URL,
      validateStatus: () => true, // Don't throw on non-2xx responses for testing
      ...config
    });
    
    // Add auth token to requests if available
    this.axios.interceptors.request.use(config => {
      if (authToken && config.headers) {
        config.headers.Authorization = \`Bearer \${authToken}\`;
      }
      return config;
    });
  }
  
  /**
   * Create unauthenticated client for testing
   */
  createUnauthenticatedClient(): ApiTestClient {
    return new ApiTestClient({ baseURL: BASE_URL });
  }
  
  /**
   * Make GET request
   */
  async get(url: string, config?: AxiosRequestConfig) {
    return this.axios.get(url, config);
  }
  
  /**
   * Make POST request
   */
  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axios.post(url, data, config);
  }
  
  /**
   * Make PUT request
   */
  async put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axios.put(url, data, config);
  }
  
  /**
   * Make DELETE request
   */
  async delete(url: string, config?: AxiosRequestConfig) {
    return this.axios.delete(url, config);
  }
  
  /**
   * Make PATCH request
   */
  async patch(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axios.patch(url, data, config);
  }
}

/**
 * Validate response against schema
 * 
 * @param data Response data
 * @param schemaRef Schema reference
 */
export function validateResponse(data: any, schemaRef: string): void {
  const validator = validators[schemaRef];
  
  if (!validator) {
    throw new Error(\`Schema not found: \${schemaRef}\`);
  }
  
  const valid = validator(data);
  
  if (!valid) {
    const errors = ajv.errorsText(validator.errors);
    throw new Error(\`Response validation failed: \${errors}\`);
  }
}

// Export singleton instance
export const apiTestClient = new ApiTestClient();
`;
}

/**
 * Convert string to kebab case
 * 
 * @param str Input string
 * @returns Kebab case string
 */
function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
