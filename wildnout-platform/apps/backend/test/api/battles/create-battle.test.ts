import { build } from '../../helpers';
import { BattleService } from '../../../src/services/battle-service';

// Mock the auth middleware to provide a test user
jest.mock('../../../src/middleware/auth', () => ({
  authenticate: jest.fn(async (request, reply) => {
    request.userId = 'test-user-id';
    request.user = {
      id: 'test-user-id',
      username: 'testuser',
      displayName: 'Test User'
    };
  })
}));

describe('POST /api/battles', () => {
  let app;
  
  beforeEach(async () => {
    app = await build();
    // Mock the battle service
    app.services = {
      battleService: {
        createBattle: jest.fn()
      } as unknown as BattleService
    };
  });
  
  it('should create a battle successfully', async () => {
    const mockBattle = {
      id: 'battle-1',
      title: 'Test Battle',
      description: 'Test description',
      battleType: 'wildStyle',
      rules: {
        prompt: 'Test prompt',
        mediaTypes: ['text']
      },
      status: 'scheduled',
      creatorId: 'test-user-id',
      startTime: new Date('2025-03-10T12:00:00Z'),
      endTime: new Date('2025-03-10T14:00:00Z'),
      votingStartTime: new Date('2025-03-10T14:00:00Z'),
      votingEndTime: new Date('2025-03-10T16:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    app.services.battleService.createBattle.mockResolvedValue(mockBattle);
    
    const response = await app.inject({
      method: 'POST',
      url: '/api/battles',
      payload: {
        title: 'Test Battle',
        description: 'Test description',
        battleType: 'wildStyle',
        rules: {
          prompt: 'Test prompt',
          mediaTypes: ['text']
        },
        startTime: '2025-03-10T12:00:00Z',
        endTime: '2025-03-10T14:00:00Z',
        votingEndTime: '2025-03-10T16:00:00Z'
      }
    });
    
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.payload)).toEqual(expect.objectContaining({
      id: 'battle-1',
      title: 'Test Battle'
    }));
    expect(app.services.battleService.createBattle).toHaveBeenCalledWith(
      'test-user-id', 
      expect.objectContaining({
        title: 'Test Battle',
        description: 'Test description',
        battleType: 'wildStyle'
      })
    );
  });
  
  it('should return 400 for invalid battle data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/battles',
      payload: {
        // Missing required fields
        title: 'Test Battle'
      }
    });
    
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload).error).toBeDefined();
    expect(app.services.battleService.createBattle).not.toHaveBeenCalled();
  });
  
  it('should return 400 when service throws ValidationError', async () => {
    app.services.battleService.createBattle.mockRejectedValue(
      new Error('Validation failed')
    );
    
    const response = await app.inject({
      method: 'POST',
      url: '/api/battles',
      payload: {
        title: 'Test Battle',
        description: 'Test description',
        battleType: 'wildStyle',
        rules: {
          prompt: 'Test prompt',
          mediaTypes: ['text']
        },
        startTime: '2025-03-10T12:00:00Z',
        endTime: '2025-03-10T14:00:00Z',
        votingEndTime: '2025-03-10T16:00:00Z'
      }
    });
    
    expect(response.statusCode).toBe(500);
  });
});
