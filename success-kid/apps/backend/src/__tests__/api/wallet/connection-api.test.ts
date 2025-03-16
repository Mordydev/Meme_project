/**
 * Tests for Wallet Connection API endpoints
 */
import { build } from '../../helpers/app-builder';
import { WalletConnectionService } from '../../../services/wallet/connection-service';
import { WalletAlreadyConnectedError, WalletVerificationError } from '../../../errors/wallet-errors';

// Mock the wallet connection service
jest.mock('../../../services/wallet/connection-service');

describe('Wallet Connection API', () => {
  const app = build();
  
  // Mock authenticated user
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User'
  };
  
  // Mock service results
  const mockSessionId = 'session-123';
  const mockMessage = 'Sign this message to verify your wallet ownership';
  const mockAddress = 'phantom-wallet-address-123456789012345678901234567890';
  const mockSignature = 'test-signature';
  const mockWalletConnection = {
    id: 'connection-123',
    wallet_address: mockAddress,
    user_id: mockUser.id,
    is_verified: true,
    connected_at: new Date(),
    last_verified_at: new Date()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up authentication mock
    app.addHook('preHandler', (request, reply, done) => {
      request.user = mockUser;
      done();
    });
    
    // Mock service methods
    const mockService = app.walletConnectionService as jest.Mocked<WalletConnectionService>;
    
    mockService.generateVerificationMessage.mockResolvedValue({
      sessionId: mockSessionId,
      message: mockMessage,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    
    mockService.verifyWalletSignature.mockResolvedValue({
      verified: true,
      walletConnection: mockWalletConnection
    });
    
    mockService.connectWallet.mockResolvedValue(mockWalletConnection);
    
    mockService.disconnectWallet.mockResolvedValue(true);
    
    mockService.getWalletsByUser.mockResolvedValue([mockWalletConnection]);
    
    mockService.getConnectionHistory.mockResolvedValue([
      {
        id: 'event-1',
        userId: mockUser.id,
        walletAddress: mockAddress,
        eventType: 'connection',
        timestamp: new Date(),
        metadata: { provider: 'phantom' }
      },
      {
        id: 'event-2',
        userId: mockUser.id,
        walletAddress: mockAddress,
        eventType: 'verification',
        timestamp: new Date(),
        metadata: { sessionId: mockSessionId }
      }
    ]);
  });
  
  describe('POST /wallet/connection/initialize', () => {
    it('should initialize wallet connection', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/wallet/connection/initialize',
        payload: {
          data: {
            walletType: 'phantom'
          }
        }
      });
      
      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(result.data).toHaveProperty('sessionId', mockSessionId);
      expect(result.data).toHaveProperty('message', mockMessage);
      expect(result.data).toHaveProperty('expiresAt');
      
      expect(app.walletConnectionService.generateVerificationMessage).toHaveBeenCalledWith(
        mockUser.id,
        'phantom'
      );
    });
    
    it('should return 400 for invalid wallet type', async () => {
      // Mock service to throw validation error
      const mockService = app.walletConnectionService as jest.Mocked<WalletConnectionService>;
      mockService.generateVerificationMessage.mockRejectedValueOnce(
        new Error('Invalid wallet type')
      );
      
      const response = await app.inject({
        method: 'POST',
        url: '/wallet/connection/initialize',
        payload: {
          data: {
            walletType: 'invalid-wallet'
          }
        }
      });
      
      expect(response.statusCode).toBe(500);
      
      const result = JSON.parse(response.body);
      expect(result.errors[0].message).toContain('Invalid wallet type');
    });
  });
  
  describe('POST /wallet/connection/verify', () => {
    it('should verify wallet signature', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/wallet/connection/verify',
        payload: {
          data: {
            sessionId: mockSessionId,
            address: mockAddress,
            signature: mockSignature
          }
        }
      });
      
      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(result.data).toHaveProperty('verified', true);
      expect(result.data).toHaveProperty('address', mockAddress);
      
      expect(app.walletConnectionService.verifyWalletSignature).toHaveBeenCalledWith(
        mockSessionId,
        mockSignature,
        mockAddress
      );
    });
    
    it('should return 400 for verification failure', async () => {
      // Mock service to throw verification error
      const mockService = app.walletConnectionService as jest.Mocked<WalletConnectionService>;
      mockService.verifyWalletSignature.mockRejectedValueOnce(
        new WalletVerificationError('Signature verification failed')
      );
      
      const response = await app.inject({
        method: 'POST',
        url: '/wallet/connection/verify',
        payload: {
          data: {
            sessionId: mockSessionId,
            address: mockAddress,
            signature: 'invalid-signature'
          }
        }
      });
      
      expect(response.statusCode).toBe(400);
      
      const result = JSON.parse(response.body);
      expect(result.errors[0].code).toBe('WALLET_VERIFICATION_FAILED');
    });
    
    it('should return 409 if wallet already connected to another user', async () => {
      // Mock service to throw already connected error
      const mockService = app.walletConnectionService as jest.Mocked<WalletConnectionService>;
      mockService.verifyWalletSignature.mockRejectedValueOnce(
        new WalletAlreadyConnectedError('Wallet already connected to another account')
      );
      
      const response = await app.inject({
        method: 'POST',
        url: '/wallet/connection/verify',
        payload: {
          data: {
            sessionId: mockSessionId,
            address: mockAddress,
            signature: mockSignature
          }
        }
      });
      
      expect(response.statusCode).toBe(409);
      
      const result = JSON.parse(response.body);
      expect(result.errors[0].code).toBe('WALLET_ALREADY_CONNECTED');
    });
  });
  
  describe('GET /wallet/connection', () => {
    it('should return user wallet connections', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/wallet/connection'
      });
      
      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.data[0]).toHaveProperty('address', mockAddress);
      
      expect(app.walletConnectionService.getWalletsByUser).toHaveBeenCalledWith(mockUser.id);
    });
  });
  
  describe('DELETE /wallet/connection', () => {
    it('should disconnect a wallet', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/wallet/connection',
        payload: {
          data: {
            address: mockAddress
          }
        }
      });
      
      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(result.data).toHaveProperty('success', true);
      
      expect(app.walletConnectionService.disconnectWallet).toHaveBeenCalledWith(
        mockUser.id,
        mockAddress
      );
    });
    
    it('should return error if disconnection fails', async () => {
      // Mock service to throw error
      const mockService = app.walletConnectionService as jest.Mocked<WalletConnectionService>;
      mockService.disconnectWallet.mockRejectedValueOnce(
        new Error('Failed to disconnect wallet')
      );
      
      const response = await app.inject({
        method: 'DELETE',
        url: '/wallet/connection',
        payload: {
          data: {
            address: mockAddress
          }
        }
      });
      
      expect(response.statusCode).toBe(500);
      
      const result = JSON.parse(response.body);
      expect(result.errors[0].message).toContain('Failed to disconnect wallet');
    });
  });
  
  describe('GET /wallet/connection/history', () => {
    it('should return connection history', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/wallet/connection/history'
      });
      
      expect(response.statusCode).toBe(200);
      
      const result = JSON.parse(response.body);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0]).toHaveProperty('eventType', 'connection');
      expect(result.data[1]).toHaveProperty('eventType', 'verification');
      
      expect(app.walletConnectionService.getConnectionHistory).toHaveBeenCalledWith(
        mockUser.id,
        20 // default limit
      );
    });
    
    it('should respect limit parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/wallet/connection/history?limit=1'
      });
      
      expect(response.statusCode).toBe(200);
      
      expect(app.walletConnectionService.getConnectionHistory).toHaveBeenCalledWith(
        mockUser.id,
        1 // specified limit
      );
    });
  });
});
