import { build } from '../../helpers/server';
import { FastifyInstance } from 'fastify';
import { createMockClerkClient } from '../../helpers/auth';
import { TokenHolderTier } from '../../../src/models/wallet';

describe('Wallet API - Wallet Status', () => {
  let app: FastifyInstance;
  const mockUserId = 'user_123456789';
  const mockWalletAddress = 'BxDrLN4c8iBLxx8rTqp3PmY8TmHqpbBs4ZvioG5v5a8S';
  
  // Mock wallet with connected and verified state
  const mockConnectedWallet = {
    id: 'wallet_1',
    userId: mockUserId,
    address: mockWalletAddress,
    provider: 'phantom',
    verified: true,
    verifiedAt: new Date(),
    connectedAt: new Date(),
    lastUpdatedAt: new Date()
  };

  // Mock holdings data
  const mockHoldings = {
    id: 'holdings_1',
    userId: mockUserId,
    walletId: 'wallet_1',
    tokenAmount: 5000,
    tier: TokenHolderTier.SILVER,
    lastCheckedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Mock benefits
  const mockBenefits = {
    holdings: 5000,
    tier: TokenHolderTier.SILVER,
    updatedAt: new Date(),
    multiplier: 1.25,
    benefits: [
      {
        id: 'basic_battles',
        name: 'Basic Battles',
        description: 'Access to basic battle formats',
        status: 'active',
        activatedAt: new Date()
      },
      {
        id: 'creator_spotlight',
        name: 'Creator Spotlight',
        description: 'Featured placement in creator feeds',
        status: 'active',
        activatedAt: new Date()
      }
    ]
  };

  beforeAll(async () => {
    // Create mock services
    const mockWalletService = {
      getUserWallet: jest.fn().mockResolvedValue(mockConnectedWallet),
    };

    const mockTokenService = {
      getUserBenefits: jest.fn().mockResolvedValue(mockBenefits),
    };

    const mockWalletRepository = {
      getUserTokenHoldings: jest.fn().mockResolvedValue(mockHoldings),
    };

    // Build the app with mocked services
    app = await build({
      clerk: createMockClerkClient(mockUserId),
      walletService: mockWalletService,
      tokenService: mockTokenService,
      walletRepository: mockWalletRepository
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return wallet status for connected wallet', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/wallet/status',
      headers: {
        Authorization: `Bearer mock_token`
      }
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('connected', true);
    expect(body).toHaveProperty('verified', true);
    expect(body).toHaveProperty('walletAddress', mockWalletAddress);
    expect(body).toHaveProperty('displayAddress');
    expect(body).toHaveProperty('holdings');
    expect(body.holdings).toHaveProperty('tokenAmount', 5000);
    expect(body.holdings).toHaveProperty('tier', TokenHolderTier.SILVER);
    expect(body).toHaveProperty('benefits');
    expect(body.benefits).toHaveLength(2);
  });

  it('should return disconnected status when no wallet found', async () => {
    // Override the mock to simulate no wallet
    app.walletService.getUserWallet.mockResolvedValueOnce(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/wallet/status',
      headers: {
        Authorization: `Bearer mock_token`
      }
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('connected', false);
    expect(body).not.toHaveProperty('verified');
    expect(body).not.toHaveProperty('walletAddress');
    expect(body).not.toHaveProperty('holdings');
    expect(body).not.toHaveProperty('benefits');
  });

  it('should return 401 for unauthenticated users', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/wallet/status',
      // No authentication header
    });

    expect(response.statusCode).toBe(401);
    
    const body = JSON.parse(response.body);
    expect(body.error).toHaveProperty('code', 'unauthorized');
  });

  it('should handle service errors gracefully', async () => {
    // Override the mock to simulate an error
    app.walletService.getUserWallet.mockRejectedValueOnce(
      new Error('Service unavailable')
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/wallet/status',
      headers: {
        Authorization: `Bearer mock_token`
      }
    });

    expect(response.statusCode).toBe(500);
    
    const body = JSON.parse(response.body);
    expect(body.error).toHaveProperty('code', 'status_error');
  });
});
