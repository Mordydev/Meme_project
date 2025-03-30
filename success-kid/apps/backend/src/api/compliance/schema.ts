/**
 * Schemas for the Compliance API module
 */
import { RequestType } from './types'; // Import the enum/type

const metaProperties = {
  timestamp: { type: 'string', format: 'date-time' } // Use consistent format
};

export const createGdprRequestSchema = {
  tags: ['Compliance', 'GDPR'],
  summary: 'Create GDPR data subject request',
  description: 'Allows an authenticated user to submit a GDPR data request (access, deletion).',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: Object.values(RequestType) }
    },
    required: ['type']
  },
  response: {
    200: {
      description: 'GDPR request created successfully',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: Object.values(RequestType) },
            status: { type: 'string' }, // Consider enum: pending, processing, completed, failed
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    }
  }
};

export const getGdprRequestStatusSchema = {
  tags: ['Compliance', 'GDPR'],
  summary: 'Get GDPR data subject request status',
  description: 'Retrieves the status and details of a specific GDPR request.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  response: {
    200: {
      description: 'GDPR request details',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: Object.values(RequestType) },
            status: { type: 'string' }, // Consider enum
            createdAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            data: { type: 'object', nullable: true } // Data for access requests
          }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden' },
    404: { description: 'Request not found' }
  }
};

export const requestDataExportSchema = {
  tags: ['Compliance', 'GDPR'],
  summary: 'Request data export',
  description: 'Initiates a data export process for the authenticated user.',
  security: [{ bearerAuth: [] }],
  response: {
    200: { // Should likely be 202 Accepted as it's async
      description: 'Data export initiated',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            exportId: { type: 'string' },
            // These might not be available immediately, consider returning just the ID
            fileSize: { type: 'number', nullable: true },
            fileFormat: { type: 'string', nullable: true },
            downloadUrl: { type: 'string', nullable: true },
            expiresAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    }
  }
};

export const requestDataDeletionSchema = {
  tags: ['Compliance', 'GDPR'],
  summary: 'Request data deletion',
  description: 'Initiates a data deletion process for the authenticated user.',
  security: [{ bearerAuth: [] }],
  response: {
    200: { // Should likely be 202 Accepted
      description: 'Data deletion request received',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }, // Indicates request received, not completion
            // These details might be better retrieved via status endpoint
            deletedCategories: { type: 'array', items: { type: 'string' }, nullable: true },
            retainedCategories: { type: 'array', items: { type: 'string' }, nullable: true },
            retentionReasons: { type: 'object', additionalProperties: { type: 'string' }, nullable: true }
          }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    }
  }
};

export const getDataCategoriesSchema = {
  tags: ['Compliance', 'GDPR'],
  summary: 'Get data categories',
  description: 'Retrieves the categories of data processed for the authenticated user.',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'List of data categories',
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
        meta: { type: 'object', properties: metaProperties }
      }
    }
  }
};

export const manageConsentSchema = {
  tags: ['Compliance', 'GDPR'],
  summary: 'Manage consent',
  description: 'Allows the authenticated user to grant or revoke consent for specific data processing purposes.',
  security: [{ bearerAuth: [] }],
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
      description: 'Consent status updated',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            purpose: { type: 'string' },
            granted: { type: 'boolean' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    }
  }
};

export const withdrawConsentSchema = {
  tags: ['Compliance', 'GDPR'],
  summary: 'Withdraw consent',
  description: 'Allows the authenticated user to withdraw consent for a specific purpose.',
  security: [{ bearerAuth: [] }],
  params: {
    type: 'object',
    required: ['purpose'],
    properties: {
      purpose: { type: 'string' }
    }
  },
  response: {
    200: {
      description: 'Consent withdrawn successfully',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            purpose: { type: 'string' }
          }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    }
  }
};

// --- Admin Schemas ---

export const generateComplianceReportSchema = {
  tags: ['Compliance', 'Admin'],
  summary: 'Generate compliance report (Admin)',
  description: 'Generates a compliance report for a specified type and period.',
  security: [{ bearerAuth: [] }], // Add admin role check
  body: {
    type: 'object',
    properties: {
      type: { type: 'string' }, // Consider enum
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
    200: { // Should likely be 202 Accepted
      description: 'Compliance report generation initiated',
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
                start: { type: 'string', format: 'date-time' },
                end: { type: 'string', format: 'date-time' }
              }
            },
            status: { type: 'string' }, // Consider enum: pending, processing, completed, failed
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden - Admin only' }
  }
};

export const getComplianceReportSchema = {
  tags: ['Compliance', 'Admin'],
  summary: 'Get compliance report by ID (Admin)',
  description: 'Retrieves a specific compliance report.',
  security: [{ bearerAuth: [] }], // Add admin role check
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  response: {
    200: {
      description: 'Compliance report details',
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
                start: { type: 'string', format: 'date-time' },
                end: { type: 'string', format: 'date-time' }
              }
            },
            status: { type: 'string' },
            data: { type: 'object' }, // Report content
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden - Admin only' },
    404: { description: 'Report not found' }
  }
};

export const listComplianceReportsSchema = {
  tags: ['Compliance', 'Admin'],
  summary: 'List compliance reports (Admin)',
  description: 'Lists compliance reports with optional filtering.',
  security: [{ bearerAuth: [] }], // Add admin role check
  querystring: {
    type: 'object',
    properties: {
      type: { type: 'string' }, // Consider enum
      status: { type: 'string' }, // Consider enum
      fromDate: { type: 'string', format: 'date-time' },
      toDate: { type: 'string', format: 'date-time' }
    }
  },
  response: {
    200: {
      description: 'List of compliance reports',
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
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' }
                }
              },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            total: { type: 'number' }
          }
        }
      }
    },
    403: { description: 'Forbidden - Admin only' }
  }
};

export const getComplianceFrameworksSchema = {
  tags: ['Compliance', 'Admin'],
  summary: 'Get compliance frameworks (Admin)',
  description: 'Retrieves information about configured compliance frameworks.',
  security: [{ bearerAuth: [] }], // Add admin role check
  response: {
    200: {
      description: 'List of compliance frameworks',
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
            timestamp: { type: 'string', format: 'date-time' },
            total: { type: 'number' }
          }
        }
      }
    },
    403: { description: 'Forbidden - Admin only' }
  }
};

export const assessComplianceSchema = {
  tags: ['Compliance', 'Admin'],
  summary: 'Assess compliance against a framework (Admin)',
  description: 'Performs a compliance assessment against a specified framework.',
  security: [{ bearerAuth: [] }], // Add admin role check
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' } // Framework ID
    }
  },
  response: {
    200: { // Should likely be 202 Accepted
      description: 'Compliance assessment results',
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            frameworkId: { type: 'string' },
            frameworkName: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
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
                  evidence: { type: 'string', nullable: true }
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
                  severity: { type: 'string' }, // Consider enum
                  recommendation: { type: 'string' }
                }
              }
            }
          }
        },
        meta: { type: 'object', properties: metaProperties }
      }
    },
    403: { description: 'Forbidden - Admin only' },
    404: { description: 'Framework not found' }
  }
};
