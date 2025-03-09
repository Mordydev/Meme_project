import { BlockchainService } from '../../../src/services/blockchain-service';
import { CircuitBreaker } from '../../../src/lib/blockchain/circuit-breaker';
import { Connection, PublicKey } from '@solana/web3.js';
import { Logger } from 'pino';
import { config } from '../../../src/config';

// Mock dependencies
jest.mock('@solana/web3.js', () => {
  const original = jest.requireActual('@solana/web3.js');
  return {
    ...original,
    Connection: jest.fn().mockImplementation(() => ({
      getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue({
        value: [
          {
            account: {
              data: {
                parsed: {
                  info: {
                    tokenAmount: {
                      amount: '5000000000',
                      decimals: 9
                    }
                  }
                }
              }
            }
          }
        ]
      }),
      getTransaction: jest.fn().mockResolvedValue({
        signature: 'mock-signature',
        blockTime: Date.now() / 1000
      }),
      getBlockHeight: jest.fn().mockResolvedValue(100)
    })),
    PublicKey: jest.fn().mockImplementation((address) => ({
      toString: () => address,
      toBytes: () => new Uint8Array([1, 2, 3, 4])
    }))
  };
});

jest.mock('../../../src/lib/blockchain/circuit-breaker', () => {
  return {
    CircuitBreaker: jest.fn().mockImplementation(() => ({
      execute: jest.fn((fn) => fn()),
      isOpen: jest.fn().mockReturnValue(false),
      getState: jest.fn().mockReturnValue(0) // CLOSED
    }))
  };
});

jest.mock('../../../src/config', () => ({
  config: {
    solana: {
      rpcUrls: ['https://mock-rpc-1.com', 'https://mock-rpc-2.com'],
      tokenMint: 'mock-token-mint',
      networkType: 'devnet'
    }
  }
}));

describe('BlockchainService', () => {
  let blockchainService: BlockchainService;
  let mockLogger: Logger;
  
  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as unknown as Logger;
    
    blockchainService = new BlockchainService(mockLogger);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('initialization', () => {
    it('should initialize with multiple connections', () => {
      expect(Connection).toHaveBeenCalledTimes(2);
      expect(Connection).toHaveBeenCalledWith('https://mock-rpc-1.com', 'confirmed');
      expect(Connection).toHaveBeenCalledWith('https://mock-rpc-2.com', 'confirmed');
    });
    
    it('should initialize token mint public key', () => {
      expect(PublicKey).toHaveBeenCalledWith(config.solana.tokenMint);
    });
    
    it('should initialize circuit breakers', () => {
      expect(CircuitBreaker).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('executeWithRetry', () => {
    it('should execute operation successfully', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await blockchainService.executeWithRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
    
    it('should retry on failure', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce('success');
      
      // Mock circuit breaker's execute to simulate failure then success
      const mockExecute = jest.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockImplementationOnce((fn) => fn());
      
      (CircuitBreaker as jest.Mock).mockImplementation(() => ({
        execute: mockExecute,
        isOpen: jest.fn().mockReturnValue(false),
        getState: jest.fn().mockReturnValue(0)
      }));
      
      blockchainService = new BlockchainService(mockLogger);
      
      const result = await blockchainService.executeWithRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getTokenBalance', () => {
    it('should return token balance for an address', async () => {
      const result = await blockchainService.getTokenBalance('mock-wallet-address');
      
      expect(result).toBe(5); // 5000000000 / 10^9
    });
    
    it('should handle multiple token accounts', async () => {
      // Mock multiple token accounts
      const getParsedTokenAccountsByOwner = jest.fn().mockResolvedValue({
        value: [
          {
            account: {
              data: {
                parsed: {
                  info: {
                    tokenAmount: {
                      amount: '3000000000',
                      decimals: 9
                    }
                  }
                }
              }
            }
          },
          {
            account: {
              data: {
                parsed: {
                  info: {
                    tokenAmount: {
                      amount: '2000000000',
                      decimals: 9
                    }
                  }
                }
              }
            }
          }
        ]
      });
      
      (Connection as jest.Mock).mockImplementation(() => ({
        getParsedTokenAccountsByOwner,
        getTransaction: jest.fn().mockResolvedValue({}),
        getBlockHeight: jest.fn().mockResolvedValue(100)
      }));
      
      blockchainService = new BlockchainService(mockLogger);
      
      const result = await blockchainService.getTokenBalance('mock-wallet-address');
      
      expect(result).toBe(5); // (3000000000 + 2000000000) / 10^9
    });
  });
  
  describe('getBlockHeight', () => {
    it('should return the current block height', async () => {
      const result = await blockchainService.getBlockHeight();
      
      expect(result).toBe(100);
    });
  });
  
  describe('getConnectionHealth', () => {
    it('should return connection health statistics', () => {
      const health = blockchainService.getConnectionHealth();
      
      expect(health).toHaveProperty('total', 2);
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('stats');
    });
  });
});
