/**
 * Security API routes
 * 
 * This module defines the security-related API routes.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { securityService } from '../../security/framework/service';
import { vulnerabilityScanner } from '../../security/vulnerabilities/scanner';
import { piiService } from '../../security/pii/service';
import { csrfService } from '../../security/csrf/service';
import { authMiddleware, roleMiddleware } from '../../middleware/auth';
import { ValidationError } from '../../errors/base-error';

/**
 * Register security API routes
 */
export default async function registerSecurityRoutes(app: FastifyInstance): Promise<void> {
  // Apply authentication to all routes in this plugin
  app.addHook('preHandler', authMiddleware);
  
  // Get security policies
  app.get('/policies', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  enabled: { type: 'boolean' },
                  priority: { type: 'number' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Admin only for security policies
      if (request.user?.role !== 'admin') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Admin access required'
        });
      }

      const policies = securityService.getPolicies();
      
      return reply.code(200).send({
        data: policies.map(policy => ({
          id: policy.id,
          name: policy.name,
          description: policy.description,
          enabled: policy.enabled,
          priority: policy.priority
        })),
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching security policies', { error });
      throw error;
    }
  });

  // Update security policy
  app.patch('/policies/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          priority: { type: 'number' },
          description: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                enabled: { type: 'boolean' },
                priority: { type: 'number' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Params: { id: string },
    Body: {
      enabled?: boolean,
      priority?: number,
      description?: string
    }
  }>, reply: FastifyReply) => {
    try {
      // Admin only for updating security policies
      if (request.user?.role !== 'admin') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Admin access required'
        });
      }

      const { id } = request.params;
      const updates = request.body;
      
      const policy = securityService.updatePolicy(id, updates);
      
      return reply.code(200).send({
        data: {
          id: policy.id,
          name: policy.name,
          description: policy.description,
          enabled: policy.enabled,
          priority: policy.priority
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error updating security policy', { error });
      throw error;
    }
  });

  // Get security configuration
  app.get('/config', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              // Configuration properties would be defined here
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Admin only for security configuration
      if (request.user?.role !== 'admin') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Admin access required'
        });
      }

      const config = securityService.getConfig();
      
      return reply.code(200).send({
        data: {
          contentSecurityPolicy: {
            enabled: config.contentSecurityPolicy.enabled
          },
          cors: {
            enabled: config.cors.enabled,
            origin: config.cors.origin
          },
          rateLimiting: {
            enabled: config.rateLimiting.enabled,
            defaultLimit: config.rateLimiting.defaultLimit,
            defaultWindow: config.rateLimiting.defaultWindow
          },
          csrf: {
            enabled: config.csrf.enabled
          },
          headers: {
            enabled: config.headers.enabled,
            hsts: config.headers.hsts
          },
          pii: {
            autoDetection: config.pii.autoDetection,
            masking: config.pii.masking
          }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error fetching security configuration', { error });
      throw error;
    }
  });

  // Update security configuration
  app.patch('/config', {
    schema: {
      body: {
        type: 'object',
        properties: {
          contentSecurityPolicy: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' }
            }
          },
          cors: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' }
            }
          },
          rateLimiting: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              defaultLimit: { type: 'number' },
              defaultWindow: { type: 'string' }
            }
          },
          csrf: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' }
            }
          },
          headers: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' }
            }
          },
          pii: {
            type: 'object',
            properties: {
              autoDetection: { type: 'boolean' },
              masking: { 
                type: 'object',
                properties: {
                  enabled: { type: 'boolean' }
                }
              }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              // Configuration properties would be defined here
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Body: Partial<any>
  }>, reply: FastifyReply) => {
    try {
      // Admin only for updating security configuration
      if (request.user?.role !== 'admin') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Admin access required'
        });
      }

      const updates = request.body;
      
      const config = securityService.updateConfig(updates);
      
      return reply.code(200).send({
        data: {
          contentSecurityPolicy: {
            enabled: config.contentSecurityPolicy.enabled
          },
          cors: {
            enabled: config.cors.enabled,
            origin: config.cors.origin
          },
          rateLimiting: {
            enabled: config.rateLimiting.enabled,
            defaultLimit: config.rateLimiting.defaultLimit,
            defaultWindow: config.rateLimiting.defaultWindow
          },
          csrf: {
            enabled: config.csrf.enabled
          },
          headers: {
            enabled: config.headers.enabled,
            hsts: config.headers.hsts
          },
          pii: {
            autoDetection: config.pii.autoDetection,
            masking: config.pii.masking
          }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error updating security configuration', { error });
      throw error;
    }
  });

  // Generate security report
  app.get('/report', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              // Report properties would be defined here
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Admin only for security report
      if (request.user?.role !== 'admin') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Admin access required'
        });
      }

      const report = await securityService.generateSecurityReport();
      
      return reply.code(200).send({
        data: report,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error generating security report', { error });
      throw error;
    }
  });

  // Check for PII in data
  app.post('/pii/scan', {
    schema: {
      body: {
        type: 'object',
        properties: {
          data: { type: 'object' }
        },
        required: ['data']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                hasPii: { type: 'boolean' },
                fields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      path: { type: 'string' },
                      type: { type: 'string' },
                      sensitivity: { type: 'string' },
                      handlingPolicy: { type: 'string' }
                    }
                  }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Body: { data: any }
  }>, reply: FastifyReply) => {
    try {
      const { data } = request.body;
      
      if (!data) {
        throw new ValidationError('Data is required');
      }
      
      const scanResult = piiService.scanForPii(data);
      
      // Remove actual values from response for security
      const safeResult = {
        ...scanResult,
        fields: scanResult.fields.map(field => ({
          path: field.path,
          type: field.type,
          sensitivity: field.sensitivity,
          handlingPolicy: field.handlingPolicy
        }))
      };
      
      return reply.code(200).send({
        data: safeResult,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error scanning for PII', { error });
      throw error;
    }
  });

  // Apply PII redaction/anonymization
  app.post('/pii/process', {
    schema: {
      body: {
        type: 'object',
        properties: {
          data: { type: 'object' },
          policy: { type: 'string', enum: ['redact', 'mask', 'hash', 'anonymize', 'encrypt', 'pseudonymize', 'remove'] }
        },
        required: ['data']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object'
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                policy: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Body: { data: any, policy?: string }
  }>, reply: FastifyReply) => {
    try {
      const { data, policy } = request.body;
      
      if (!data) {
        throw new ValidationError('Data is required');
      }
      
      const processedData = await piiService.applyPiiPolicy(data, policy);
      
      return reply.code(200).send({
        data: processedData,
        meta: {
          timestamp: new Date().toISOString(),
          policy: policy || 'redact'
        }
      });
    } catch (error) {
      logger.error('Error processing PII', { error });
      throw error;
    }
  });

  // Get CSRF token
  app.get('/csrf-token', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = csrfService.generateToken(request);
      
      // Set CSRF cookie
      csrfService.setCookie(reply, token);
      
      return reply.code(200).send({
        data: {
          token
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error generating CSRF token', { error });
      throw error;
    }
  });

  // Test vulnerability scanning
  app.post('/test-vulnerability-scan', {
    preHandler: [
      roleMiddleware(['admin'])
    ],
    schema: {
      body: {
        type: 'object'
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                vulnerabilities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      severity: { type: 'string' },
                      location: { type: 'string' },
                      description: { type: 'string' }
                    }
                  }
                },
                passed: { type: 'boolean' },
                score: { type: 'number' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // This endpoint is only for testing the vulnerability scanner
      // It scans the current request for vulnerabilities
      
      const scanResult = vulnerabilityScanner.scanRequest(request);
      
      return reply.code(200).send({
        data: {
          vulnerabilities: scanResult.vulnerabilities.map(v => ({
            id: v.id,
            name: v.name,
            severity: v.severity,
            location: v.location,
            description: v.description
          })),
          passed: scanResult.passed,
          score: scanResult.score
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error scanning for vulnerabilities', { error });
      throw error;
    }
  });

  logger.info('Registered security API routes');
}
