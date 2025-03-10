import { build } from '../../helpers/server';
import { FastifyInstance } from 'fastify';
import { createMockClerkClient } from '../../helpers/auth';

describe('Wallet API - Verify Wallet', () => {
  let app: FastifyInstance;
  const mockUserId = 'user_123456789';
  const mockWalletAddress = 'BxDrLN4c8iBLxx8rTqp3PmY8TmHqpbBs4ZvioG5v5a8S';
  const mockSignature = 'mockSignature123456789abcdef';
  
  const mockVerificationResult = {
    userId: mockUserId,
    walletAddress: mockWalletAddress,
    verified: true,
    verifiedAt: new Date()
  };

  beforeAll(async () => {
    // Create mock wallet service
    const mockWalletService = {
      verifyWallet: jest.fn().mockResolvedValue(mockVerificationResult),
    };

    // Build the app with mocked services
    app = await build({
      clerk: createMockClerkClient(mockUserId),
      walletService: mockWalletService
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should verify wallet ownership for valid request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/wallet/verify',
      headers: {
        Authorization: `Bearer mock_token`,
        'Content-Type': 'application/json'
      },
      payload: {
        walletAddress: mockWalletAddress,
        signature: mockSignature
      }
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('userId', mockUserId);
    expect(body).toHaveProperty('walletAddress', mockWalletAddress);
    expect(body).toHaveProperty('verified', true);
    expect(body).toHaveProperty('verifiedAt');
  });

  it('should return 401 for unauthenticated users', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/wallet/verify',
      payload: {
        walletAddress: mockWalletAddress,
        signature: mockSignature
      }
      // No authentication header
    });

    expect(response.statusCode).toBe(401);
    
    const body = JSON.parse(response.body);
    expect(body.error).toHaveProperty('code', 'unauthorized');
  });

  it('should return 400 for invalid request body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/wallet/verify',
      headers: {
        Authorization: `Bearer mock_token`,
        'Content-Type': 'application/json'
      },
      payload: {
        // Missing required fields
        walletAddress: mockWalletAddress
        // No signature
      }
    });

    expect(response.statusCode).toBe(400);
    
    const body = JSON.parse(response.body);
    expect(body.error).toHaveProperty('code', 'validation_error');
  });

  it('should handle validation errors from service', async () => {
    // Override the mock to simulate a validation error
    app.walletService.verifyWallet.mockRejectedValueOnce({
      code: 'validation_error',
      message: 'Invalid signature'
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/wallet/verify',
      headers: {
        Authorization: `Bearer mock_token`,
        'Content-Type': 'application/json'
      },
      payload: {
        walletAddress: mockWalletAddress,
        signature: 'invalid_signature'
      }
    });

    expect(response.statusCode).toBe(400);
    
    const body = JSON.parse(response.body);
    expect(body.error).toHaveProperty('code', 'validation_error');
    expect(body.error).toHaveProperty('message', 'Invalid signature');
  });

  it('should handle unexpected errors gracefully', async () => {
    // Override the mock to simulate an unexpected error
    app.walletService.verifyWallet.mockRejectedValueOnce(
      new Error('Unexpected service error')
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/wallet/verify',
      headers: {
        Authorization: `Bearer mock_token`,
        'Content-Type': 'application/json'
      },
      payload: {
        walletAddress: mockWalletAddress,
        signature: mockSignature
      }
    });

    expect(response.statusCode).toBe(500);
    
    const body = JSON.parse(response.body);
    expect(body.error).toHaveProperty('code', 'verification_failed');
  });
});
