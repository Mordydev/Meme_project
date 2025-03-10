import { PointsService } from '../../../src/services/points-service';
import { EventEmitter, EventType } from '../../../src/lib/events';
import { PointsSource } from '../../../src/models/points';

const mockPointsRepository = {
  createTransaction: jest.fn(),
  getUserPointsBalance: jest.fn(),
  updateUserPoints: jest.fn(),
  getUserTransactions: jest.fn(),
  sumPointsBySourceAndDate: jest.fn(),
};

const mockTransactionManager = {
  execute: jest.fn((callback) => callback()),
  start: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
};

const eventEmitter = new EventEmitter();

describe('PointsService', () => {
  let pointsService: PointsService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    pointsService = new PointsService(mockPointsRepository, eventEmitter, mockTransactionManager);
  });
  
  describe('awardPoints', () => {
    it('should award points to a user', async () => {
      // Mock data
      const userId = 'user123';
      const amount = 100;
      const source = PointsSource.BATTLE_WIN;
      const detail = 'Won Battle #123';
      
      // Mock repository responses
      mockPointsRepository.getUserPointsBalance.mockResolvedValue({
        userId,
        totalPoints: 100,
        level: 1,
        lastUpdated: new Date(),
      });
      
      mockPointsRepository.createTransaction.mockResolvedValue({
        id: 'tx123',
        userId,
        amount,
        source,
        detail,
        createdAt: new Date(),
      });
      
      mockPointsRepository.updateUserPoints.mockResolvedValue({
        userId,
        totalPoints: 200,
        level: 1,
        lastUpdated: new Date(),
      });
      
      mockPointsRepository.sumPointsBySourceAndDate.mockResolvedValue(0);
      
      // Call the service method
      const result = await pointsService.awardPoints(userId, amount, source, { detail });
      
      // Assertions
      expect(mockTransactionManager.execute).toHaveBeenCalled();
      expect(mockPointsRepository.sumPointsBySourceAndDate).toHaveBeenCalledWith(
        userId, source, expect.any(Date), undefined
      );
      expect(mockPointsRepository.createTransaction).toHaveBeenCalledWith({
        userId,
        amount,
        source,
        detail,
        multiplier: undefined,
        referenceId: undefined,
        referenceType: undefined,
      }, undefined);
      expect(mockPointsRepository.updateUserPoints).toHaveBeenCalledWith(
        userId, amount, undefined
      );
      expect(result).toEqual({
        id: 'tx123',
        userId,
        amount,
        source,
        detail,
        createdAt: expect.any(Date),
      });
    });
    
    it('should enforce daily points limits', async () => {
      // Mock data
      const userId = 'user123';
      const amount = 100;
      const source = PointsSource.CONTENT_ENGAGEMENT;
      const dailyLimit = 200;
      
      // Mock repository responses - already at limit
      mockPointsRepository.sumPointsBySourceAndDate.mockResolvedValue(dailyLimit);
      
      // Expect the service to throw an error
      await expect(
        pointsService.awardPoints(userId, amount, source)
      ).rejects.toThrow(/Daily limit reached/);
      
      // Should not have created transaction or updated points
      expect(mockPointsRepository.createTransaction).not.toHaveBeenCalled();
      expect(mockPointsRepository.updateUserPoints).not.toHaveBeenCalled();
    });
  });
  
  describe('awardPointsForEvent', () => {
    it('should award points for a battle entry submitted event', async () => {
      // Mock data
      const userId = 'user123';
      const battleId = 'battle123';
      const eventData = { userId, battleId };
      
      // Setup spy on awardPoints
      const awardPointsSpy = jest.spyOn(pointsService, 'awardPoints');
      awardPointsSpy.mockResolvedValue({} as any);
      
      // Call the service method
      await pointsService.awardPointsForEvent(EventType.BATTLE_ENTRY_SUBMITTED, eventData);
      
      // Assertions
      expect(awardPointsSpy).toHaveBeenCalledWith(
        userId,
        expect.any(Number),
        PointsSource.BATTLE_PARTICIPATION,
        expect.objectContaining({
          detail: expect.stringContaining(battleId),
          referenceId: battleId,
          referenceType: 'battle',
        })
      );
    });
    
    it('should not award points if no userId in event data', async () => {
      // Mock data with missing userId
      const eventData = { battleId: 'battle123' };
      
      // Setup spy on awardPoints
      const awardPointsSpy = jest.spyOn(pointsService, 'awardPoints');
      
      // Call the service method
      await pointsService.awardPointsForEvent(EventType.BATTLE_ENTRY_SUBMITTED, eventData);
      
      // Assertions
      expect(awardPointsSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserPointsBalance', () => {
    it('should return user points balance', async () => {
      // Mock data
      const userId = 'user123';
      const mockBalance = {
        userId,
        totalPoints: 500,
        level: 2,
        lastUpdated: new Date(),
      };
      
      // Mock repository response
      mockPointsRepository.getUserPointsBalance.mockResolvedValue(mockBalance);
      
      // Call the service method
      const result = await pointsService.getUserPointsBalance(userId);
      
      // Assertions
      expect(mockPointsRepository.getUserPointsBalance).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockBalance);
    });
  });
  
  describe('getUserTransactions', () => {
    it('should return user points transactions', async () => {
      // Mock data
      const userId = 'user123';
      const mockTransactions = {
        transactions: [
          {
            id: 'tx123',
            userId,
            amount: 100,
            source: PointsSource.BATTLE_WIN,
            detail: 'Won Battle #123',
            createdAt: new Date(),
          }
        ],
        total: 1,
      };
      
      // Mock repository response
      mockPointsRepository.getUserTransactions.mockResolvedValue(mockTransactions);
      
      // Call the service method
      const result = await pointsService.getUserTransactions(userId);
      
      // Assertions
      expect(mockPointsRepository.getUserTransactions).toHaveBeenCalledWith(userId, {});
      expect(result).toEqual(mockTransactions);
    });
    
    it('should pass options to repository', async () => {
      // Mock data
      const userId = 'user123';
      const options = {
        limit: 10,
        offset: 20,
        source: PointsSource.BATTLE_WIN,
      };
      
      // Mock repository response
      mockPointsRepository.getUserTransactions.mockResolvedValue({ transactions: [], total: 0 });
      
      // Call the service method
      await pointsService.getUserTransactions(userId, options);
      
      // Assertions
      expect(mockPointsRepository.getUserTransactions).toHaveBeenCalledWith(userId, options);
    });
  });
  
  describe('Event handling', () => {
    it('should register event handlers', () => {
      // Setup spy on event emitter
      const onSpy = jest.spyOn(eventEmitter, 'on');
      
      // Call the service method
      pointsService.registerEventHandlers();
      
      // Assertions - should register for several event types
      expect(onSpy).toHaveBeenCalledWith(EventType.BATTLE_ENTRY_SUBMITTED, expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith(EventType.BATTLE_COMPLETED, expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith(EventType.CONTENT_CREATED, expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith(EventType.CONTENT_REACTION_ADDED, expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith(EventType.CONTENT_COMMENT_ADDED, expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith(EventType.USER_REGISTERED, expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith(EventType.WALLET_CONNECTED, expect.any(Function));
    });
  });
});
