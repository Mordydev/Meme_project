/**
 * Utilities for generating OpenAPI route documentation
 */

/**
 * Generate an OpenAPI route description
 * 
 * This helper function makes it easier to create consistent route documentation
 * with proper response schemas following our API standards.
 * 
 * @param config Documentation configuration
 * @returns OpenAPI JSDoc comment string
 */
export function generateRouteDocs({
  method,
  path,
  summary,
  description,
  tags,
  requestBody,
  pathParams,
  queryParams,
  responseSchema,
  responses = {},
  security = [{ bearerAuth: [] }]
}: {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  requestBody?: any;
  pathParams?: any;
  queryParams?: any;
  responseSchema: any;
  responses?: Record<string, any>;
  security?: Array<Record<string, string[]>>;
}): string {
  // Start building the OpenAPI comment
  let docs = `/**
 * @openapi
 * ${path}:
 *   ${method}:
 *     summary: ${summary}`;

  // Add description if provided
  if (description) {
    docs += `
 *     description: ${description}`;
  }

  // Add tags
  docs += `
 *     tags: [${tags.map(tag => `'${tag}'`).join(', ')}]`;

  // Add security if provided
  if (security && security.length > 0) {
    docs += `
 *     security: [${security.map(sec => {
      const [key, value] = Object.entries(sec)[0];
      return `{ ${key}: [${value.map(v => `'${v}'`).join(', ')}] }`;
    }).join(', ')}]`;
  }

  // Add path parameters if provided
  if (pathParams) {
    docs += `
 *     parameters:`;
    
    Object.entries(pathParams).forEach(([name, schema]) => {
      docs += `
 *       - in: path
 *         name: ${name}
 *         required: true
 *         schema:
 *           ${parseSchema(schema, 11)}`;
    });
  }

  // Add query parameters if provided
  if (queryParams) {
    if (!pathParams) {
      docs += `
 *     parameters:`;
    }
    
    Object.entries(queryParams).forEach(([name, param]: [string, any]) => {
      docs += `
 *       - in: query
 *         name: ${name}
 *         required: ${param.required || false}
 *         schema:
 *           ${parseSchema(param.schema || param, 11)}`;
      
      if (param.description) {
        docs += `
 *         description: ${param.description}`;
      }
    });
  }

  // Add request body if provided
  if (requestBody) {
    docs += `
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             ${parseSchema(requestBody, 13)}`;
  }

  // Add success response
  docs += `
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   ${parseSchema(responseSchema, 19)}
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     requestId:
 *                       type: string`;

  // Add pagination if needed
  if (responseSchema.type === 'array' || path.includes('list') || method === 'get' && !path.includes('/{')) {
    docs += `
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       minimum: 1
 *                     pageSize:
 *                       type: integer
 *                       minimum: 1
 *                     totalItems:
 *                       type: integer
 *                       minimum: 0
 *                     totalPages:
 *                       type: integer
 *                       minimum: 0`;
  }

  // Add standard error responses
  docs += `
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'`;

  // Add custom responses if provided
  for (const [code, response] of Object.entries(responses)) {
    if (!['400', '401', '403', '404', '500'].includes(code)) {
      docs += `
 *       ${code}:
 *         description: ${response.description || `Response ${code}`}
 *         content:
 *           application/json:
 *             schema:
 *               ${parseSchema(response.schema || {}, 15)}`;
    }
  }

  // Close the comment
  docs += `
 */`;

  return docs;
}

/**
 * Parse a schema object into an OpenAPI schema string
 * 
 * @param schema Schema object to parse
 * @param indent Indentation level
 * @returns OpenAPI schema string
 */
function parseSchema(schema: any, indent: number): string {
  const spaces = ' '.repeat(indent);
  
  if (typeof schema === 'string') {
    if (schema.startsWith('#/components/schemas/')) {
      return `$ref: '${schema}'`;
    }
    return `type: '${schema}'`;
  }
  
  if (schema.$ref) {
    return `$ref: '${schema.$ref}'`;
  }
  
  let result = '';
  
  if (schema.type) {
    result += `type: ${schema.type}\n`;
    
    if (schema.format) {
      result += `${spaces}format: ${schema.format}\n`;
    }
    
    if (schema.enum) {
      result += `${spaces}enum: [${schema.enum.map((e: any) => `'${e}'`).join(', ')}]\n`;
    }
    
    if (schema.minimum !== undefined) {
      result += `${spaces}minimum: ${schema.minimum}\n`;
    }
    
    if (schema.maximum !== undefined) {
      result += `${spaces}maximum: ${schema.maximum}\n`;
    }
    
    if (schema.minLength !== undefined) {
      result += `${spaces}minLength: ${schema.minLength}\n`;
    }
    
    if (schema.maxLength !== undefined) {
      result += `${spaces}maxLength: ${schema.maxLength}\n`;
    }
    
    if (schema.pattern) {
      result += `${spaces}pattern: '${schema.pattern}'\n`;
    }
    
    if (schema.default !== undefined) {
      result += `${spaces}default: ${JSON.stringify(schema.default)}\n`;
    }
    
    if (schema.example !== undefined) {
      result += `${spaces}example: ${JSON.stringify(schema.example)}\n`;
    }
    
    if (schema.description) {
      result += `${spaces}description: '${schema.description}'\n`;
    }
    
    if (schema.type === 'array' && schema.items) {
      result += `${spaces}items:\n${spaces}  ${parseSchema(schema.items, indent + 2)}\n`;
    }
    
    if (schema.type === 'object' && schema.properties) {
      result += `${spaces}properties:\n`;
      
      for (const [propName, propSchema] of Object.entries<any>(schema.properties)) {
        result += `${spaces}  ${propName}:\n${spaces}    ${parseSchema(propSchema, indent + 4)}\n`;
      }
      
      if (schema.required && schema.required.length > 0) {
        result += `${spaces}required: [${schema.required.map((r: string) => `'${r}'`).join(', ')}]\n`;
      }
    }
    
    // Remove trailing newline
    result = result.trimEnd();
  }
  
  return result;
}

/**
 * Example usage:
 * 
 * const userGetDocs = generateRouteDocs({
 *   method: 'get',
 *   path: '/api/v1/users/{id}',
 *   summary: 'Get user by ID',
 *   tags: ['users'],
 *   pathParams: {
 *     id: { type: 'string' }
 *   },
 *   responseSchema: {
 *     type: 'object',
 *     properties: {
 *       id: { type: 'string' },
 *       email: { type: 'string' },
 *       name: { type: 'string' }
 *     }
 *   }
 * });
 */
