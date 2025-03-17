/**
 * Compliance API routes
 * 
 * This module defines the compliance-related API routes.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { gdprService, RequestType } from '../../compliance/gdpr/service';
import { complianceReportingService } from '../../compliance/reporting/service';
import { authMiddleware, roleMiddleware } from '../../middleware/auth';
import { ValidationError } from '../../errors/base-error';

/**
 * Register compliance API routes
 */
export default async function registerComplianceRoutes(app: FastifyInstance): Promise<void> {
  // Apply authentication to all routes in this plugin
  app.addHook('preHandler', authMiddleware);

  // Create GDPR data subject request
  app.post('/gdpr/request', {
    schema: {
      body: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: Object.values(RequestType) }
        },
        required: ['type']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string' }
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
    Body: { type: RequestType }
  }>, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { type } = request.body;
      
      const dataRequest = await gdprService.createDataRequest(request.user.id, type);
      
      return reply.code(200).send({
        data: {
          id: dataRequest.id,
          type: dataRequest.type,
          status: dataRequest.status,
          createdAt: dataRequest.createdAt.toISOString()
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error creating data subject request', { error });
      throw error;
    }
  });

  // Get data subject request status
  app.get('/gdpr/request/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
                type: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string' },
                completedAt: { type: 'string' },
                data: { type: 'object' }
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
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { id } = request.params;
      
      const dataRequest = await gdprService.getDataRequestStatus(id);
      
      // Ensure user can only access their own requests
      if (dataRequest.userId !== request.user.id && request.user.role !== 'admin') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Access denied'
        });
      }
      
      return reply.code(200).send({
        data: {
          id: dataRequest.id,
          type: dataRequest.type,
          status: dataRequest.status,
          createdAt: dataRequest.createdAt.toISOString(),
          completedAt: dataRequest.completedAt?.toISOString(),
          data: dataRequest.data
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting data subject request', { error });
      throw error;
    }
  });

  // Request data export
  app.post('/gdpr/export', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                exportId: { type: 'string' },
                fileSize: { type: 'number' },
                fileFormat: { type: 'string' },
                downloadUrl: { type: 'string' },
                expiresAt: { type: 'string' }
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
      if (!request.user?.id) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const result = await gdprService.processDataExport(request.user.id);
      
      return reply.code(200).send({
        data: {
          exportId: result.exportId,
          fileSize: result.fileSize,
          fileFormat: result.fileFormat,
          downloadUrl: result.downloadUrl,
          expiresAt: result.expiresAt.toISOString()
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error processing data export', { error });
      throw error;
    }
  });

  // Request data deletion
  app.post('/gdpr/deletion', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                deletedCategories: {
                  type: 'array',
                  items: { type: 'string' }
                },
                retainedCategories: {
                  type: 'array',
                  items: { type: 'string' }
                },
                retentionReasons: {
                  type: 'object',
                  additionalProperties: { type: 'string' }
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
      if (!request.user?.id) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const result = await gdprService.processDataDeletion(request.user.id);
      
      return reply.code(200).send({
        data: result,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error processing data deletion', { error });
      throw error;
    }
  });

  // Get data categories
  app.get('/gdpr/categories', {
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
                  type: { type: 'string' },
                  description: { type: 'string' },
                  purpose: { type: 'string' },
                  retention: { type: 'string' },
                  locationDescription: { type: 'string' }
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
      if (!request.user?.id) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const categories = await gdprService.getUserDataCategories(request.user.id);
      
      return reply.code(200).send({
        data: categories,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting data categories', { error });
      throw error;
    }
  });

  // Manage consent
  app.post('/gdpr/consent', {
    schema: {
      body: {
        type: 'object',
        properties: {
          purpose: { type: 'string' },
          granted: { type: 'boolean' }
        },
        required: ['purpose', 'granted']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                purpose: { type: 'string' },
                granted: { type: 'boolean' },
                timestamp: { type: 'string' }
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
    Body: { purpose: string, granted: boolean }
  }>, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { purpose, granted } = request.body;
      
      const consent = await gdprService.recordConsent(request.user.id, purpose, granted);
      
      return reply.code(200).send({
        data: {
          id: consent.id,
          purpose: consent.purpose,
          granted: consent.granted,
          timestamp: consent.timestamp.toISOString()
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error recording consent', { error });
      throw error;
    }
  });

  // Withdraw consent
  app.delete('/gdpr/consent/:purpose', {
    schema: {
      params: {
        type: 'object',
        required: ['purpose'],
        properties: {
          purpose: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                purpose: { type: 'string' }
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
    Params: { purpose: string }
  }>, reply: FastifyReply) => {
    try {
      if (!request.user?.id) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const { purpose } = request.params;
      
      await gdprService.withdrawConsent(request.user.id, purpose);
      
      return reply.code(200).send({
        data: {
          success: true,
          purpose
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error withdrawing consent', { error });
      throw error;
    }
  });

  // Generate compliance report - Admin only
  app.post('/reports', {
    preHandler: [
      roleMiddleware(['admin'])
    ],
    schema: {
      body: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          period: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' }
            },
            required: ['start', 'end']
          }
        },
        required: ['type', 'period']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                period: {
                  type: 'object',
                  properties: {
                    start: { type: 'string' },
                    end: { type: 'string' }
                  }
                },
                status: { type: 'string' },
                createdAt: { type: 'string' }
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
    Body: {
      type: string,
      period: { start: string, end: string }
    }
  }>, reply: FastifyReply) => {
    try {
      const { type, period } = request.body;
      
      // Parse period dates
      const startDate = new Date(period.start);
      const endDate = new Date(period.end);
      
      const report = await complianceReportingService.generateReport(type, {
        start: startDate,
        end: endDate
      });
      
      return reply.code(200).send({
        data: {
          id: report.id,
          type: report.type,
          period: {
            start: report.period.start.toISOString(),
            end: report.period.end.toISOString()
          },
          status: report.status,
          createdAt: report.createdAt.toISOString()
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error generating compliance report', { error });
      throw error;
    }
  });

  // Get specific report by ID - Admin only
  app.get('/reports/:id', {
    preHandler: [
      roleMiddleware(['admin'])
    ],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
                type: { type: 'string' },
                period: {
                  type: 'object',
                  properties: {
                    start: { type: 'string' },
                    end: { type: 'string' }
                  }
                },
                status: { type: 'string' },
                data: { type: 'object' },
                createdAt: { type: 'string' }
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
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      const report = await complianceReportingService.getReportById(id);
      
      return reply.code(200).send({
        data: {
          id: report.id,
          type: report.type,
          period: {
            start: report.period.start.toISOString(),
            end: report.period.end.toISOString()
          },
          status: report.status,
          data: report.data,
          createdAt: report.createdAt.toISOString()
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting compliance report', { error });
      throw error;
    }
  });

  // List reports - Admin only
  app.get('/reports', {
    preHandler: [
      roleMiddleware(['admin'])
    ],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          status: { type: 'string' },
          fromDate: { type: 'string', format: 'date-time' },
          toDate: { type: 'string', format: 'date-time' }
        }
      },
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
                  type: { type: 'string' },
                  period: {
                    type: 'object',
                    properties: {
                      start: { type: 'string' },
                      end: { type: 'string' }
                    }
                  },
                  status: { type: 'string' },
                  createdAt: { type: 'string' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                total: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Querystring: {
      type?: string,
      status?: string,
      fromDate?: string,
      toDate?: string
    }
  }>, reply: FastifyReply) => {
    try {
      const { type, status, fromDate, toDate } = request.query;
      
      // Build filter
      const filter: any = {};
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (fromDate) filter.fromDate = new Date(fromDate);
      if (toDate) filter.toDate = new Date(toDate);
      
      const reports = await complianceReportingService.listReports(filter);
      
      return reply.code(200).send({
        data: reports.map(report => ({
          id: report.id,
          type: report.type,
          period: {
            start: report.period.start.toISOString(),
            end: report.period.end.toISOString()
          },
          status: report.status,
          createdAt: report.createdAt.toISOString()
        })),
        meta: {
          timestamp: new Date().toISOString(),
          total: reports.length
        }
      });
    } catch (error) {
      logger.error('Error listing compliance reports', { error });
      throw error;
    }
  });

  // Get compliance frameworks - Admin only
  app.get('/frameworks', {
    preHandler: [
      roleMiddleware(['admin'])
    ],
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
                  version: { type: 'string' },
                  description: { type: 'string' },
                  enabled: { type: 'boolean' },
                  controlCount: { type: 'number' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                total: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const frameworks = await complianceReportingService.getFrameworks();
      
      return reply.code(200).send({
        data: frameworks.map(framework => ({
          id: framework.id,
          name: framework.name,
          version: framework.version,
          description: framework.description,
          enabled: framework.enabled,
          controlCount: framework.controls.length
        })),
        meta: {
          timestamp: new Date().toISOString(),
          total: frameworks.length
        }
      });
    } catch (error) {
      logger.error('Error getting compliance frameworks', { error });
      throw error;
    }
  });

  // Assess compliance against a framework - Admin only
  app.post('/frameworks/:id/assess', {
    preHandler: [
      roleMiddleware(['admin'])
    ],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                frameworkId: { type: 'string' },
                frameworkName: { type: 'string' },
                timestamp: { type: 'string' },
                overallScore: { type: 'number' },
                controlResults: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      controlId: { type: 'string' },
                      controlName: { type: 'string' },
                      description: { type: 'string' },
                      compliant: { type: 'boolean' },
                      evidence: { type: 'string' }
                    }
                  }
                },
                gaps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      controlId: { type: 'string' },
                      controlName: { type: 'string' },
                      description: { type: 'string' },
                      severity: { type: 'string' },
                      recommendation: { type: 'string' }
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
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      const assessment = await complianceReportingService.assessCompliance(id);
      
      return reply.code(200).send({
        data: {
          frameworkId: assessment.frameworkId,
          frameworkName: assessment.frameworkName,
          timestamp: assessment.timestamp.toISOString(),
          overallScore: assessment.overallScore,
          controlResults: assessment.controlResults,
          gaps: assessment.gaps
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error assessing compliance', { error });
      throw error;
    }
  });

  logger.info('Registered compliance API routes');
}
