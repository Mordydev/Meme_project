/**
 * Tests for Wallet Connection Service
 */
import { WalletConnectionService } from '../../../services/wallet/connection-service';
import { WalletConnectionRepository } from '../../../repositories/wallet-connection-repository';
import { Redis } from 'ioredis';
import { WalletAlreadyConnectedError, WalletConnectionError, WalletVerificationError } from '../../../errors/wallet-errors';
import { ValidationError } from '../../../errors/base-error';

// Mock the repository and Redis client
jest.mock('../../../repositories/wallet-connection-repository');
jest.mock('ioredis');

describe('WalletConnectionService', () => {
  let service: WalletConnectionService;
  let mockWalletRepo: jest.Mocked<WalletConnectionRepository>;
  let mockRedis: jest.Mocked<Redis>;
  
  const userId = 'user-123';
  const sessionId = 'session-123';
  const walletAddress = 'phantom-wallet-address-123456789012345678901234567890';
  const signature = 'valid-signature';
  
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockWalletRepo = new WalletConnectionRepository(null) as jest.Mocked<WalletConnectionRepository>;
    mockRedis = new Redis() as jest.Mocked<Redis>;
    
    // Setup mock implementations
    mockRedis.set = jest.fn().mockResolvedValue('OK');
    mockRedis.get = jest.fn().mockResolvedValue(null);
    mockRedis.del = jest.fn().mockResolvedValue(1);
    mockRedis.zadd = jest.fn().mockResolvedValue(1);
    mockRedis.zremrangebyrank = jest.fn().mockResolvedValue(1);
    mockRedis.expire = jest.fn().mockResolvedValue(1);
    mockRedis.zrevrange = jest.fn().mockResolvedValue([]);
    
    // Create service with mocked dependencies
    service = new WalletConnectionService(mockWalletRepo, mockRedis);
  });
  
  describe('generateVerificationMessage', () => {
    it('should generate a verification message and store it in Redis', async () => {
      const walletType = 'phantom';
      
      const result = await service.generateVerificationMessage(userId, walletType);
      
      // Verify result
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('expiresAt');
      
      // Verify Redis storage
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('wallet:session:'),
        expect.any(String),
        'EX',
        300 // 5 minutes TTL
      );
    });
    
    it('should throw validation error for unsupported wallet type', async () => {
      const walletType = 'unsupported-wallet';
      
      await expect(service.generateVerificationMessage(userId, walletType))
        .rejects
        .toThrow(ValidationError);
    });
  });
  
  describe('verifyWalletSignature', () => {
    beforeEach(() => {
      // Mock sessionData in Redis
      const sessionData = {
        walletType: 'phantom',
        message: 'test-message',
        timestamp: Date.now(),
        userId,
        nonce: 'test-nonce',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString() // 5 minutes from now
      };
      
      mockRedis.get.mockImplementation((key: string) => {
        if (key.includes(sessionId)) {
          return Promise.resolve(JSON.stringify(sessionData));
        }
        return Promise.resolve(null);
      });
    });
    
    it('should throw error for expired or non-existent session', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      
      await expect(service.verifyWalletSignature(sessionId, signature, walletAddress))
        .rejects
        .toThrow(WalletVerificationError);
    });
    
    it('should throw error for invalid wallet address', async () => {
      await expect(service.verifyWalletSignature(sessionId, signature, 'invalid-address'))
        .rejects
        .toThrow(ValidationError);
    });
    
    it('should handle wallet already connected to another user', async () => {
      // Mock wallet already connected to another user
      mockWalletRepo.findByWalletAddress.mockResolvedValueOnce({
        id: 'existing-connection',
        user_id: 'other-user',
        wallet_address: walletAddress,
        is_verified: true,
        connected_at: new Date(),
        last_verified_at: new Date()
      });
      
      // Mock the verifySignature function to return true
      jest.spyOn(require('../../../lib/wallet-utils'), 'verifySignature')
        .mockResolvedValueOnce(true);
      
      await expect(service.verifyWalletSignature(sessionId, signature, walletAddress))
        .rejects
        .toThrow(WalletAlreadyConnectedError);
    });
    
    it('should update existing connection for same user', async () => {
      // Mock existing connection for same user
      const existingConnection = {
        id: 'existing-connection',
        user_id: userId,
        wallet_address: walletAddress,
        is_verified: false,
        connected_at: new Date(),
        last_verified_at: null
      };
      
      mockWalletRepo.findByWalletAddress.mockResolvedValueOnce(existingConnection);
      
      // Mock update verification status
      mockWalletRepo.updateVerificationStatus.mockResolvedValueOnce({
        ...existingConnection,
        is_verified: true,
        last_verified_at: new Date()
      });
      
      // Mock the verifySignature function to return true
      jest.spyOn(require('../../../lib/wallet-utils'), 'verifySignature')
        .mockResolvedValueOnce(true);
      
      const result = await service.verifyWalletSignature(sessionId, signature, walletAddress);
      
      expect(result.verified).toBe(true);
      expect(mockWalletRepo.updateVerificationStatus).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalled();
    });
    
    it('should create new connection if one does not exist', async () => {
      // Mock no existing connection
      mockWalletRepo.findByWalletAddress.mockResolvedValueOnce(null);
      
      // Mock create connection
      mockWalletRepo.createWalletConnection.mockResolvedValueOnce({
        id: 'new-connection',
        user_id: userId,
        wallet_address: walletAddress,
        is_verified: true,
        connected_at: new Date(),
        last_verified_at: new Date()
      });
      
      // Mock the verifySignature function to return true
      jest.spyOn(require('../../../lib/wallet-utils'), 'verifySignature')
        .mockResolvedValueOnce(true);
      
      const result = await service.verifyWalletSignature(sessionId, signature, walletAddress);
      
      expect(result.verified).toBe(true);
      expect(mockWalletRepo.createWalletConnection).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });
  
  describe('connectWallet', () => {
    it('should connect a new wallet', async () => {
      // Mock no existing connection
      mockWalletRepo.findByWalletAddress.mockResolvedValueOnce(null);
      
      // Mock create connection
      const newConnection = {
        id: 'new-connection',
        user_id: userId,
        wallet_address: walletAddress,
        is_verified: false,
        connected_at: new Date(),
        last_verified_at: null
      };
      
      mockWalletRepo.createWalletConnection.mockResolvedValueOnce(newConnection);
      
      const result = await service.connectWallet(userId, walletAddress, 'phantom');
      
      expect(result).toEqual(newConnection);
      expect(mockWalletRepo.createWalletConnection).toHaveBeenCalledWith({
        user_id: userId,
        wallet_address: walletAddress,
        is_verified: false
      });
    });
    
    it('should throw error for invalid wallet address', async () => {
      await expect(service.connectWallet(userId, 'invalid-address', 'phantom'))
        .rejects
        .toThrow(ValidationError);
    });
    
    it('should throw error if wallet already connected to another user', async () => {
      // Mock wallet already connected to another user
      mockWalletRepo.findByWalletAddress.mockResolvedValueOnce({
        id: 'existing-connection',
        user_id: 'other-user',
        wallet_address: walletAddress,
        is_verified: true,
        connected_at: new Date(),
        last_verified_at: new Date()
      });
      
      await expect(service.connectWallet(userId, walletAddress, 'phantom'))
        .rejects
        .toThrow(WalletAlreadyConnectedError);
    });
  });
  
  describe('disconnectWallet', () => {
    it('should disconnect an existing wallet', async () => {
      // Mock existing connection for this user
      mockWalletRepo.findByWalletAddress.mockResolvedValueOnce({
        id: 'existing-connection',
        user_id: userId,
        wallet_address: walletAddress,
        is_verified: true,
        connected_at: new Date(),
        last_verified_at: new Date()
      });
      
      // Mock successful deletion
      mockWalletRepo.deleteById.mockResolvedValueOnce(true);
      
      const result = await service.disconnectWallet(userId, walletAddress);
      
      expect(result).toBe(true);
      expect(mockWalletRepo.deleteById).toHaveBeenCalledWith('existing-connection');
    });
    
    it('should return false if wallet not found', async () => {
      // Mock no existing connection
      mockWalletRepo.findByWalletAddress.mockResolvedValueOnce(null);
      
      const result = await service.disconnectWallet(userId, walletAddress);
      
      expect(result).toBe(false);
      expect(mockWalletRepo.deleteById).not.toHaveBeenCalled();
    });
    
    it('should throw error if wallet belongs to another user', async () => {
      // Mock wallet belongs to another user
      mockWalletRepo.findByWalletAddress.mockResolvedValueOnce({
        id: 'existing-connection',
        user_id: 'other-user',
        wallet_address: walletAddress,
        is_verified: true,
        connected_at: new Date(),
        last_verified_at: new Date()
      });
      
      await expect(service.disconnectWallet(userId, walletAddress))
        .rejects
        .toThrow(WalletConnectionError);
    });
  });
  
  describe('getWalletsByUser', () => {
    it('should return wallets for a user', async () => {
      // Mock wallet connections
      const walletConnections = [
        {
          id: 'connection-1',
          user_id: userId,
          wallet_address: walletAddress,
          is_verified: true,
          connected_at: new Date(),
          last_verified_at: new Date()
        },
        {
          id: 'connection-2',
          user_id: userId,
          wallet_address: 'another-wallet-address',
          is_verified: false,
          connected_at: new Date(),
          last_verified_at: null
        }
      ];
      
      mockWalletRepo.findByUserId.mockResolvedValueOnce(walletConnections);
      
      const result = await service.getWalletsByUser(userId);
      
      expect(result).toEqual(walletConnections);
      expect(mockWalletRepo.findByUserId).toHaveBeenCalledWith(userId);
    });
  });
  
  describe('getConnectionHistory', () => {
    it('should return connection history', async () => {
      // Mock event IDs in Redis
      mockRedis.zrevrange.mockResolvedValueOnce(['event-1', 'event-2']);
      
      // Mock event data in Redis
      const events = [
        {
          id: 'event-1',
          userId,
          walletAddress,
          eventType: 'connection',
          timestamp: new Date(),
          metadata: { provider: 'phantom' }
        },
        {
          id: 'event-2',
          userId,
          walletAddress,
          eventType: 'verification',
          timestamp: new Date(),
          metadata: { provider: 'phantom' }
        }
      ];
      
      mockRedis.get.mockImplementation((key: string) => {
        if (key.includes('event-1')) {
          return Promise.resolve(JSON.stringify(events[0]));
        } else if (key.includes('event-2')) {
          return Promise.resolve(JSON.stringify(events[1]));
        }
        return Promise.resolve(null);
      });
      
      const result = await service.getConnectionHistory(userId, 2);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('event-1');
      expect(result[1].id).toBe('event-2');
    });
  });
});
