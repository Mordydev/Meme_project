import { BattleService } from '../../src/services/battle-service';
import { BattleRepository } from '../../src/repositories/battle-repository';
import { EntryRepository } from '../../src/repositories/entry-repository';
import { EventEmitter } from '../../src/lib/events';
import { ValidationError, NotFoundError, ForbiddenError } from '../../src/lib/errors';

// Mock repositories and dependencies
const mockBattleRepository = {
  findById: jest.fn(),
  getBattleWithDetails: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateBattleStatus: jest.fn(),
  updateParticipationCounts: jest.fn(),
  getBattlesForStatusUpdate: jest.fn(),
  getBattlesByStatus: jest.fn(),
  findManyWithPagination: jest.fn()
} as unknown as BattleRepository;

const mockEntryRepository = {
  findById: jest.fn(),
  getEntryWithDetails: jest.fn(),
  create: jest.fn(),
  hasUserSubmittedToBattle: jest.fn(),
  count: jest.fn(),
  voteForEntry: jest.fn(),
  getEntriesByBattle: jest.fn(),
  calculateBattleResults: jest.fn()
} as unknown as EntryRepository;

const mockEventEmitter = {
  emit: jest.fn(),
  on: jest.fn()
} as unknown as EventEmitter;

describe('BattleService', () => {
  let battleService: BattleService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    battleService = new BattleService(
      mockBattleRepository,
      mockEntryRepository,
      mockEventEmitter
    );
  });
  
  describe('getBattleById', () => {
    it('should return a battle when it exists', async () => {
      const mockBattle = { id: 'battle-1', title: 'Test Battle' };
      mockBattleRepository.getBattleWithDetails.mockResolvedValue(mockBattle);
      
      const result = await battleService.getBattleById('battle-1');
      
      expect(result).toEqual(mockBattle);
      expect(mockBattleRepository.getBattleWithDetails).toHaveBeenCalledWith('battle-1');
    });
    
    it('should throw NotFoundError when battle does not exist', async () => {
      mockBattleRepository.getBattleWithDetails.mockResolvedValue(null);
      
      await expect(battleService.getBattleById('non-existent')).rejects.toThrow(NotFoundError);
      expect(mockBattleRepository.getBattleWithDetails).toHaveBeenCalledWith('non-existent');
    });
  });
  
  describe('createBattle', () => {
    it('should create a battle successfully', async () => {
      const mockBattle = {
        id: 'battle-1',
        title: 'Test Battle',
        status: 'scheduled',
        creatorId: 'user-1'
      };
      mockBattleRepository.create.mockResolvedValue(mockBattle);
      
      const battleData = {
        title: 'Test Battle',
        description: 'Test description',
        battleType: 'wildStyle' as const,
        rules: {
          prompt: 'Test prompt',
          mediaTypes: ['text']
        },
        startTime: new Date(Date.now() + 86400000), // tomorrow
        endTime: new Date(Date.now() + 172800000), // day after tomorrow
        votingEndTime: new Date(Date.now() + 259200000) // three days from now
      };
      
      const result = await battleService.createBattle('user-1', battleData);
      
      expect(result).toEqual(mockBattle);
      expect(mockBattleRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Battle',
        status: 'scheduled',
        creatorId: 'user-1'
      }));
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'battle.created',
        expect.objectContaining({
          battleId: 'battle-1',
          creatorId: 'user-1'
        })
      );
    });
    
    it('should throw ValidationError when startTime is in the past', async () => {
      const battleData = {
        title: 'Test Battle',
        description: 'Test description',
        battleType: 'wildStyle' as const,
        rules: {
          prompt: 'Test prompt',
          mediaTypes: ['text']
        },
        startTime: new Date(Date.now() - 86400000), // yesterday
        endTime: new Date(Date.now() + 86400000), // tomorrow
        votingEndTime: new Date(Date.now() + 172800000) // day after tomorrow
      };
      
      await expect(battleService.createBattle('user-1', battleData)).rejects.toThrow(ValidationError);
      expect(mockBattleRepository.create).not.toHaveBeenCalled();
    });
  });
  
  describe('updateBattleStatus', () => {
    it('should update battle status when valid transition', async () => {
      const mockBattle = {
        id: 'battle-1',
        status: 'scheduled',
        creatorId: 'user-1',
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(Date.now() + 3600000), // 1 hour from now
        votingEndTime: new Date(Date.now() + 7200000) // 2 hours from now
      };
      mockBattleRepository.findById.mockResolvedValue(mockBattle);
      mockBattleRepository.update.mockResolvedValue({
        ...mockBattle,
        status: 'open'
      });
      
      const result = await battleService.updateBattleStatus('battle-1', 'open', 'user-1');
      
      expect(result.status).toBe('open');
      expect(mockBattleRepository.update).toHaveBeenCalledWith(
        'battle-1',
        expect.objectContaining({
          status: 'open'
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'battle.updated',
        expect.objectContaining({
          battleId: 'battle-1',
          updatedFields: ['status']
        })
      );
    });
    
    it('should throw ForbiddenError when user is not the creator', async () => {
      const mockBattle = {
        id: 'battle-1',
        status: 'scheduled',
        creatorId: 'user-1',
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(Date.now() + 3600000) // 1 hour from now
      };
      mockBattleRepository.findById.mockResolvedValue(mockBattle);
      
      await expect(battleService.updateBattleStatus('battle-1', 'open', 'user-2')).rejects.toThrow(ForbiddenError);
      expect(mockBattleRepository.update).not.toHaveBeenCalled();
    });
    
    it('should throw ValidationError for invalid status transition', async () => {
      const mockBattle = {
        id: 'battle-1',
        status: 'completed',
        creatorId: 'user-1',
        startTime: new Date(Date.now() - 7200000), // 2 hours ago
        endTime: new Date(Date.now() - 3600000) // 1 hour ago
      };
      mockBattleRepository.findById.mockResolvedValue(mockBattle);
      
      await expect(battleService.updateBattleStatus('battle-1', 'open', 'user-1')).rejects.toThrow(ValidationError);
      expect(mockBattleRepository.update).not.toHaveBeenCalled();
    });
  });
  
  describe('submitEntry', () => {
    it('should submit entry successfully', async () => {
      const mockBattle = {
        id: 'battle-1',
        status: 'open',
        participantCount: 5,
        entryCount: 10,
        maxEntriesPerUser: 2,
        rules: {
          prompt: 'Test prompt',
          mediaTypes: ['text'],
          minLength: 10,
          maxLength: 1000
        }
      };
      const mockEntry = {
        id: 'entry-1',
        battleId: 'battle-1',
        userId: 'user-1',
        content: {
          type: 'text',
          body: 'This is a test entry'
        }
      };
      
      mockBattleRepository.getBattleWithDetails.mockResolvedValue(mockBattle);
      mockEntryRepository.count.mockResolvedValue(1); // User already has 1 entry
      mockEntryRepository.create.mockResolvedValue(mockEntry);
      
      const entryData = {
        content: {
          type: 'text',
          body: 'This is a test entry'
        }
      };
      
      const result = await battleService.submitEntry('battle-1', 'user-1', entryData);
      
      expect(result).toEqual(mockEntry);
      expect(mockEntryRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        battleId: 'battle-1',
        userId: 'user-1',
        content: entryData.content
      }));
      expect(mockBattleRepository.updateParticipationCounts).toHaveBeenCalledWith(
        'battle-1',
        {
          participantCount: 6,
          entryCount: 11
        }
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'battle.entry.submitted',
        expect.objectContaining({
          battleId: 'battle-1',
          entryId: 'entry-1',
          userId: 'user-1'
        })
      );
    });
    
    it('should throw ValidationError when battle is not open', async () => {
      const mockBattle = {
        id: 'battle-1',
        status: 'voting',
        rules: {
          prompt: 'Test prompt',
          mediaTypes: ['text']
        }
      };
      mockBattleRepository.getBattleWithDetails.mockResolvedValue(mockBattle);
      
      const entryData = {
        content: {
          type: 'text',
          body: 'This is a test entry'
        }
      };
      
      await expect(battleService.submitEntry('battle-1', 'user-1', entryData)).rejects.toThrow(ValidationError);
      expect(mockEntryRepository.create).not.toHaveBeenCalled();
    });
    
    it('should throw ValidationError when user has reached max entries', async () => {
      const mockBattle = {
        id: 'battle-1',
        status: 'open',
        maxEntriesPerUser: 2,
        rules: {
          prompt: 'Test prompt',
          mediaTypes: ['text']
        }
      };
      mockBattleRepository.getBattleWithDetails.mockResolvedValue(mockBattle);
      mockEntryRepository.count.mockResolvedValue(2); // User already has 2 entries
      
      const entryData = {
        content: {
          type: 'text',
          body: 'This is a test entry'
        }
      };
      
      await expect(battleService.submitEntry('battle-1', 'user-1', entryData)).rejects.toThrow(ValidationError);
      expect(mockEntryRepository.create).not.toHaveBeenCalled();
    });
    
    it('should throw ValidationError when content type is not allowed', async () => {
      const mockBattle = {
        id: 'battle-1',
        status: 'open',
        maxEntriesPerUser: 2,
        rules: {
          prompt: 'Test prompt',
          mediaTypes: ['image']
        }
      };
      mockBattleRepository.getBattleWithDetails.mockResolvedValue(mockBattle);
      mockEntryRepository.count.mockResolvedValue(0);
      
      const entryData = {
        content: {
          type: 'text',
          body: 'This is a test entry'
        }
      };
      
      await expect(battleService.submitEntry('battle-1', 'user-1', entryData)).rejects.toThrow(ValidationError);
      expect(mockEntryRepository.create).not.toHaveBeenCalled();
    });
  });
  
  describe('voteForEntry', () => {
    it('should vote for entry successfully', async () => {
      const mockEntry = {
        id: 'entry-1',
        battleId: 'battle-1',
        userId: 'user-2'
      };
      const mockBattle = {
        id: 'battle-1',
        status: 'voting'
      };
      
      mockEntryRepository.getEntryWithDetails.mockResolvedValue(mockEntry);
      mockBattleRepository.getBattleById.mockResolvedValue(mockBattle);
      
      await battleService.voteForEntry('entry-1', 'user-1');
      
      expect(mockEntryRepository.voteForEntry).toHaveBeenCalledWith('entry-1', 'user-1', 'battle-1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'achievement.progress',
        expect.objectContaining({
          userId: 'user-1',
          achievementId: 'battle-voter'
        })
      );
    });
    
    it('should throw ValidationError when voting for own entry', async () => {
      const mockEntry = {
        id: 'entry-1',
        battleId: 'battle-1',
        userId: 'user-1'
      };
      const mockBattle = {
        id: 'battle-1',
        status: 'voting'
      };
      
      mockEntryRepository.getEntryWithDetails.mockResolvedValue(mockEntry);
      mockBattleRepository.getBattleById.mockResolvedValue(mockBattle);
      
      await expect(battleService.voteForEntry('entry-1', 'user-1')).rejects.toThrow(ValidationError);
      expect(mockEntryRepository.voteForEntry).not.toHaveBeenCalled();
    });
    
    it('should throw ValidationError when battle is not in voting phase', async () => {
      const mockEntry = {
        id: 'entry-1',
        battleId: 'battle-1',
        userId: 'user-2'
      };
      const mockBattle = {
        id: 'battle-1',
        status: 'open'
      };
      
      mockEntryRepository.getEntryWithDetails.mockResolvedValue(mockEntry);
      mockBattleRepository.getBattleById.mockResolvedValue(mockBattle);
      
      await expect(battleService.voteForEntry('entry-1', 'user-1')).rejects.toThrow(ValidationError);
      expect(mockEntryRepository.voteForEntry).not.toHaveBeenCalled();
    });
  });
  
  describe('processBattleStatusUpdates', () => {
    it('should update battles with proper status changes', async () => {
      const now = new Date();
      
      const scheduledBattle = {
        id: 'battle-1',
        title: 'Scheduled Battle',
        status: 'scheduled',
        startTime: new Date(now.getTime() - 3600000), // 1 hour ago
        endTime: new Date(now.getTime() + 3600000), // 1 hour from now
        votingEndTime: new Date(now.getTime() + 7200000) // 2 hours from now
      };
      
      const openBattle = {
        id: 'battle-2',
        title: 'Open Battle',
        status: 'open',
        startTime: new Date(now.getTime() - 7200000), // 2 hours ago
        endTime: new Date(now.getTime() - 3600000), // 1 hour ago
        votingEndTime: new Date(now.getTime() + 3600000) // 1 hour from now
      };
      
      const votingBattle = {
        id: 'battle-3',
        title: 'Voting Battle',
        status: 'voting',
        startTime: new Date(now.getTime() - 10800000), // 3 hours ago
        endTime: new Date(now.getTime() - 7200000), // 2 hours ago
        votingEndTime: new Date(now.getTime() - 3600000) // 1 hour ago
      };
      
      mockBattleRepository.getBattlesForStatusUpdate.mockResolvedValue([
        scheduledBattle, openBattle, votingBattle
      ]);
      
      // Mock updateBattleStatus to return updated battles
      battleService.updateBattleStatus = jest.fn()
        .mockResolvedValueOnce({ ...scheduledBattle, status: 'open' })
        .mockResolvedValueOnce({ ...openBattle, status: 'voting' })
        .mockResolvedValueOnce({ ...votingBattle, status: 'completed' });
      
      const result = await battleService.processBattleStatusUpdates();
      
      expect(result.updated).toBe(3);
      expect(result.battles).toEqual([
        {
          id: 'battle-1',
          title: 'Scheduled Battle',
          oldStatus: 'scheduled',
          newStatus: 'open'
        },
        {
          id: 'battle-2',
          title: 'Open Battle',
          oldStatus: 'open',
          newStatus: 'voting'
        },
        {
          id: 'battle-3',
          title: 'Voting Battle',
          oldStatus: 'voting',
          newStatus: 'completed'
        }
      ]);
      
      expect(battleService.updateBattleStatus).toHaveBeenCalledWith('battle-1', 'open');
      expect(battleService.updateBattleStatus).toHaveBeenCalledWith('battle-2', 'voting');
      expect(battleService.updateBattleStatus).toHaveBeenCalledWith('battle-3', 'completed');
    });
    
    it('should return empty result when no battles need updates', async () => {
      mockBattleRepository.getBattlesForStatusUpdate.mockResolvedValue([]);
      
      const result = await battleService.processBattleStatusUpdates();
      
      expect(result.updated).toBe(0);
      expect(result.battles).toEqual([]);
    });
  });
});
