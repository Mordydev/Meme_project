import { build } from '../../helpers/server';
import { FastifyInstance } from 'fastify';
import { createMockClerkClient } from '../../helpers/auth';

describe('Wallet API - Generate Message', () => {
  let app: FastifyInstance;
  const mockUserId = 'user_123456789';
  const mockVerificationMessage = {
    message: 'Verify your wallet ownership for Wild \'n Out platform. Nonce: abcdef123456',
    expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  };

  beforeAll(async () => {
    // Create mock wallet service
    const mockWalletService = {
      generateVerificationMessage: jest.fn().mockResolvedValue(mockVerificationMessage),
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

  it('should generate a verification message for authenticated users', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/wallet/message',
      headers: {
        Authorization: `Bearer mock_token`
      }
    });

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('expires');
    expect(body.message).toBe(mockVerificationMessage.message);
  });

  it('should return 401 for unauthenticated users', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/wallet/message',
      // No authentication header
    });

    expect(response.statusCode).toBe(401);
    
    const body = JSON.parse(response.body);
    expect(body.error).toHaveProperty('code', 'unauthorized');
  });

  it('should handle service errors gracefully', async () => {
    // Override the mock to simulate an error
    app.walletService.generateVerificationMessage.mockRejectedValueOnce(
      new Error('Service unavailable')
    );

    const response = await app.inject({
      method: 'GET',
      url: '/api/wallet/message',
      headers: {
        Authorization: `Bearer mock_token`
      }
    });

    expect(response.statusCode).toBe(500);
    
    const body = JSON.parse(response.body);
    expect(body.error).toHaveProperty('code', 'generate_message_error');
  });
});
