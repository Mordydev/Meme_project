import { FastifyInstance } from 'fastify';
import { createServices, ServiceContainer } from '../../src/services/core/service-provider';
import { EventEmitter } from '../../src/lib/events';
import { createRepositories } from '../../src/repositories/repository-provider';

// Mock dependencies
jest.mock('../../src/repositories/repository-provider', () => ({
  createRepositories: jest.fn(() => ({
    profileRepository: { tableName: 'profiles' },
    achievementRepository: { tableName: 'achievements' },
    battleRepository: { tableName: 'battles' },
    entryRepository: { tableName: 'entries' },
    contentRepository: { tableName: 'contents' },
    commentRepository: { tableName: 'comments' },
    tokenRepository: { tableName: 'tokens' },
    notificationRepository: { tableName: 'notifications' },
  })),
}));

// Mock service implementations
jest.mock('../../src/services/profile-service', () => {
  return {
    ProfileService: jest.fn().mockImplementation(() => ({
      registerEventHandlers: jest.fn()
    }))
  };
});

jest.mock('../../src/services/achievement-service', () => {
  return {
    AchievementService: jest.fn().mockImplementation(() => ({
      registerEventHandlers: jest.fn()
    }))
  };
});

jest.mock('../../src/services/battle-service', () => {
  return {
    BattleService: jest.fn().mockImplementation(() => ({
      registerEventHandlers: jest.fn()
    }))
  };
});

jest.mock('../../src/services/content-service', () => {
  return {
    ContentService: jest.fn().mockImplementation(() => ({
      registerEventHandlers: jest.fn()
    }))
  };
});

jest.mock('../../src/services/token-service', () => {
  return {
    TokenService: jest.fn().mockImplementation(() => ({
      registerEventHandlers: jest.fn()
    }))
  };
});

jest.mock('../../src/services/notification-service', () => {
  return {
    NotificationService: jest.fn().mockImplementation(() => ({
      registerEventHandlers: jest.fn()
    }))
  };
});

// Mock Fastify instance
const mockFastify = {
  log: {
    info: jest.fn(),
    error: jest.fn()
  }
} as unknown as FastifyInstance;

describe('Service Provider', () => {
  let services: ServiceContainer;
  
  beforeEach(() => {
    jest.clearAllMocks();
    services = createServices(mockFastify);
  });
  
  it('should create repositories', () => {
    expect(createRepositories).toHaveBeenCalledWith(mockFastify);
    expect(services.repositories).toBeDefined();
  });
  
  it('should create event emitter', () => {
    expect(services.eventEmitter).toBeDefined();
    expect(services.eventEmitter).toBeInstanceOf(EventEmitter);
  });
  
  it('should create all services with dependencies', () => {
    // Verify all services are created
    expect(services.profileService).toBeDefined();
    expect(services.achievementService).toBeDefined();
    expect(services.battleService).toBeDefined();
    expect(services.contentService).toBeDefined();
    expect(services.tokenService).toBeDefined();
    expect(services.notificationService).toBeDefined();
  });
  
  it('should register event handlers for all services', () => {
    // Verify all services registered event handlers
    expect(services.profileService.registerEventHandlers).toHaveBeenCalled();
    expect(services.achievementService.registerEventHandlers).toHaveBeenCalled();
    expect(services.battleService.registerEventHandlers).toHaveBeenCalled();
    expect(services.contentService.registerEventHandlers).toHaveBeenCalled();
    expect(services.notificationService.registerEventHandlers).toHaveBeenCalled();
  });
});
