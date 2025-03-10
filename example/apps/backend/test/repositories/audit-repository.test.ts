import { build } from '../helpers';
import { AuditRepository } from '../../src/repositories/audit-repository';
import { SecurityEventType } from '../../src/services/core/audit-service';

describe('AuditRepository', () => {
  let app;
  let auditRepository: AuditRepository;
  
  beforeAll(async () => {
    app = await build();
    auditRepository = app.repositories.auditRepository;
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('create', () => {
    it('should create a new audit log entry', async () => {
      // Mock audit log data
      const auditData = {
        eventType: SecurityEventType.LOGIN_SUCCESS,
        userId: 'test-user-id',
        context: {
          ip: '127.0.0.1',
          userAgent: 'Test User Agent',
          requestId: 'test-request-id',
          endpoint: 'GET /test',
          timestamp: new Date()
        },
        details: { message: 'Test audit log' },
        severity: 'low' as const,
        ipAddress: '127.0.0.1',
        userAgent: 'Test User Agent',
        timestamp: new Date()
      };
      
      // Mock database response
      // In a real test, this would be handled by the test helpers
      // and a test database, but we'll mock it here
      
      // Create the audit log
      const log = await auditRepository.create(auditData);
      
      // Check that the log has been created
      expect(log).toBeDefined();
      expect(log.event).toBe(SecurityEventType.LOGIN_SUCCESS);
      expect(log.userId).toBe('test-user-id');
      expect(log.severity).toBe('low');
    });
  });
  
  describe('query', () => {
    it('should query audit logs with filters', async () => {
      // Define filters
      const filters = {
        userId: 'test-user-id',
        severity: 'low' as const
      };
      
      // Query logs
      const result = await auditRepository.query(filters);
      
      // Verify result structure
      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.logs)).toBe(true);
    });
  });
  
  describe('getUserLogs', () => {
    it('should get logs for a specific user', async () => {
      // Get logs for test user
      const logs = await auditRepository.getUserLogs('test-user-id');
      
      // Verify that logs is an array
      expect(Array.isArray(logs)).toBe(true);
    });
  });
  
  describe('getHighSeverityLogs', () => {
    it('should get high severity logs', async () => {
      // Get high severity logs
      const logs = await auditRepository.getHighSeverityLogs(7, 10);
      
      // Verify that logs is an array
      expect(Array.isArray(logs)).toBe(true);
    });
  });
  
  describe('cleanupOldLogs', () => {
    it('should delete old logs', async () => {
      // Clean up old logs (older than 90 days)
      const deletedCount = await auditRepository.cleanupOldLogs(90);
      
      // Verify that deletedCount is a number
      expect(typeof deletedCount).toBe('number');
    });
  });
});
