import { TokenService } from '../../../src/services/token-service';
import { TokenHolderTier } from '../../../src/models/wallet';
import { EventEmitter, EventType } from '../../../src/lib/events';
import { Logger } from 'pino';

// Mock repositories
const mockTokenRepository = {
  getLatestPrice: jest.fn(),
  getPriceHistory: jest.fn(),
  getMilestones: jest.fn(),
  getCurrentMilestoneProgress: jest.fn(),
  getRecentTransactions: jest.fn(),
  addPriceRecord: jest.fn(),
  addTransaction: jest.fn()
};

const mockWalletRepository = {
  getUserWallet: jest.fn(),
  getUserTokenHoldings: jest.fn(),
  getAllTokenBenefits: jest.fn(),
  updateUserTokenBenefits: jest.fn()
};

// Mock blockchain service
const mockBlockchainService = {
  getTokenBalance: jest.fn()
};

// Mock event emitter
const mockEventEmitter = {
  emit: jest.fn(),
  on: jest.fn()
} as unknown as EventEmitter;

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as unknown as Logger;

describe('TokenService', () => {
  let tokenService: TokenService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    tokenService = new TokenService(
      mockTokenRepository as any,
      mockWalletRepository as any,
      mockBlockchainService as any,
      mockEventEmitter,
      mockLogger
    );
  });
  
  describe('getCurrentTokenPrice', () => {
    it('should return latest price data', async () => {
      const mockPrice = {
        price: 0.0001,
        marketCap: 100000,
        change24h: 5.5,
        volume24h: 50000,
        timestamp: new Date()
      };
      
      mockTokenRepository.getLatestPrice.mockResolvedValue(mockPrice);
      
      const result = await tokenService.getCurrentTokenPrice();
      
      expect(result).toEqual(mockPrice);
      expect(mockTokenRepository.getLatestPrice).toHaveBeenCalledTimes(1);
    });
    
    it('should return default values when no price data exists', async () => {
      mockTokenRepository.getLatestPrice.mockResolvedValue(null);
      
      const result = await tokenService.getCurrentTokenPrice();
      
      expect(result).toEqual({
        price: 0,
        marketCap: 0,
        change24h: 0,
        volume24h: 0,
        timestamp: expect.any(Date)
      });
    });
  });
  
  describe('updateTokenPrice', () => {
    it('should add price record and emit event', async () => {
      const priceData = {
        price: 0.0002,
        marketCap: 200000,
        change24h: 10,
        volume24h: 75000
      };
      
      const mockPriceRecord = {
        ...priceData,
        id: 'price-123',
        timestamp: new Date()
      };
      
      mockTokenRepository.addPriceRecord.mockResolvedValue(mockPriceRecord);
      
      const result = await tokenService.updateTokenPrice(
        priceData.price,
        priceData.marketCap,
        priceData.change24h,
        priceData.volume24h
      );
      
      expect(result).toEqual(mockPriceRecord);
      expect(mockTokenRepository.addPriceRecord).toHaveBeenCalledWith(
        priceData.price,
        priceData.marketCap,
        priceData.change24h,
        priceData.volume24h
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EventType.TOKEN_PRICE_UPDATED,
        expect.objectContaining({
          price: priceData.price,
          change: priceData.change24h
        })
      );
    });
    
    it('should throw error when price is negative', async () => {
      await expect(
        tokenService.updateTokenPrice(-0.001, 100000, 5, 50000)
      ).rejects.toThrow('Price cannot be negative');
    });
    
    it('should throw error when market cap is negative', async () => {
      await expect(
        tokenService.updateTokenPrice(0.001, -100000, 5, 50000)
      ).rejects.toThrow('Market cap cannot be negative');
    });
  });
  
  describe('getUserTier', () => {
    it('should return bronze tier for minimal holdings', () => {
      const result = tokenService.getUserTier(1);
      
      expect(result.name).toBe(TokenHolderTier.BRONZE);
      expect(result.multiplier).toBe(1);
    });
    
    it('should return silver tier for appropriate holdings', () => {
      const result = tokenService.getUserTier(1500);
      
      expect(result.name).toBe(TokenHolderTier.SILVER);
      expect(result.multiplier).toBe(1.25);
    });
    
    it('should return gold tier for appropriate holdings', () => {
      const result = tokenService.getUserTier(15000);
      
      expect(result.name).toBe(TokenHolderTier.GOLD);
      expect(result.multiplier).toBe(1.5);
    });
    
    it('should return platinum tier for high holdings', () => {
      const result = tokenService.getUserTier(150000);
      
      expect(result.name).toBe(TokenHolderTier.PLATINUM);
      expect(result.multiplier).toBe(2);
    });
  });
  
  describe('refreshUserBenefits', () => {
    it('should update user benefits based on token holdings', async () => {
      // Mock wallet and holdings
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        address: 'solana-address',
        verified: true
      };
      
      const mockHoldings = {
        id: 'holdings-123',
        userId: 'user-123',
        walletId: 'wallet-123',
        tokenAmount: 1500,
        tier: TokenHolderTier.SILVER,
        lastCheckedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours old
      };
      
      const mockBenefits = [
        { id: 'basic_battles', name: 'Basic Battles', description: 'Access to basic battles' },
        { id: 'creator_spotlight', name: 'Creator Spotlight', description: 'Featured on creator page' },
        { id: 'silver_badge', name: 'Silver Badge', description: 'Silver holder badge' }
      ];
      
      // Mock repository responses
      mockWalletRepository.getUserWallet.mockResolvedValue(mockWallet);
      mockWalletRepository.getUserTokenHoldings.mockResolvedValue(mockHoldings);
      mockBlockchainService.getTokenBalance.mockResolvedValue(2000);
      mockWalletRepository.getAllTokenBenefits.mockResolvedValue(mockBenefits);
      mockWalletRepository.updateUserTokenBenefits.mockResolvedValue(true);
      
      // Call the service method
      const result = await tokenService.refreshUserBenefits('user-123');
      
      // Verify the results
      expect(result).toBe(true);
      expect(mockBlockchainService.getTokenBalance).toHaveBeenCalledWith(mockWallet.address);
      expect(mockWalletRepository.updateUserTokenBenefits).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          holdings: 2000,
          tier: TokenHolderTier.SILVER,
          multiplier: 1.25
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EventType.USER_BENEFITS_UPDATED,
        expect.objectContaining({
          userId: 'user-123',
          tier: TokenHolderTier.SILVER,
          holdings: 2000
        })
      );
    });
    
    it('should return false when no verified wallet found', async () => {
      // Mock no wallet
      mockWalletRepository.getUserWallet.mockResolvedValue(null);
      
      // Call the service method
      const result = await tokenService.refreshUserBenefits('user-123');
      
      // Verify the results
      expect(result).toBe(false);
      expect(mockWalletRepository.updateUserTokenBenefits).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
    
    it('should use blockchain balance when holdings are stale', async () => {
      // Mock wallet and stale holdings
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        address: 'solana-address',
        verified: true
      };
      
      const mockHoldings = {
        id: 'holdings-123',
        userId: 'user-123',
        walletId: 'wallet-123',
        tokenAmount: 1500,
        tier: TokenHolderTier.SILVER,
        lastCheckedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours old
      };
      
      // Mock repository responses
      mockWalletRepository.getUserWallet.mockResolvedValue(mockWallet);
      mockWalletRepository.getUserTokenHoldings.mockResolvedValue(mockHoldings);
      mockBlockchainService.getTokenBalance.mockResolvedValue(12000);
      mockWalletRepository.getAllTokenBenefits.mockResolvedValue([]);
      mockWalletRepository.updateUserTokenBenefits.mockResolvedValue(true);
      
      // Call the service method
      const result = await tokenService.refreshUserBenefits('user-123');
      
      // Verify blockchain was queried and higher tier assigned
      expect(result).toBe(true);
      expect(mockBlockchainService.getTokenBalance).toHaveBeenCalledWith(mockWallet.address);
      expect(mockWalletRepository.updateUserTokenBenefits).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          holdings: 12000,
          tier: TokenHolderTier.GOLD,
          multiplier: 1.5
        })
      );
    });
    
    it('should handle blockchain service errors gracefully', async () => {
      // Mock wallet and holdings
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        address: 'solana-address',
        verified: true
      };
      
      const mockHoldings = {
        id: 'holdings-123',
        userId: 'user-123',
        walletId: 'wallet-123',
        tokenAmount: 1500,
        tier: TokenHolderTier.SILVER,
        lastCheckedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours old
      };
      
      // Mock repository responses
      mockWalletRepository.getUserWallet.mockResolvedValue(mockWallet);
      mockWalletRepository.getUserTokenHoldings.mockResolvedValue(mockHoldings);
      mockBlockchainService.getTokenBalance.mockRejectedValue(new Error('RPC node error'));
      mockWalletRepository.getAllTokenBenefits.mockResolvedValue([]);
      mockWalletRepository.updateUserTokenBenefits.mockResolvedValue(true);
      
      // Call the service method
      const result = await tokenService.refreshUserBenefits('user-123');
      
      // Verify fallback to existing holdings
      expect(result).toBe(true);
      expect(mockBlockchainService.getTokenBalance).toHaveBeenCalledWith(mockWallet.address);
      expect(mockWalletRepository.updateUserTokenBenefits).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          holdings: 1500,
          tier: TokenHolderTier.SILVER
        })
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
