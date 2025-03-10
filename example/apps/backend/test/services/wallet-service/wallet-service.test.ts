import { WalletService } from '../../../src/services/wallet-service';
import { TokenService } from '../../../src/services/token-service';
import { BlockchainService } from '../../../src/services/blockchain-service';
import { EventEmitter, EventType } from '../../../src/lib/events';
import { AppError } from '../../../src/lib/errors';
import { PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';
import * as nacl from 'tweetnacl';
import { Logger } from 'pino';

// Mocks
jest.mock('@solana/web3.js', () => {
  return {
    PublicKey: jest.fn().mockImplementation((address) => ({
      toString: () => address,
      toBytes: () => new Uint8Array([1, 2, 3, 4])
    }))
  };
});

jest.mock('bs58', () => ({
  decode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4]))
}));

jest.mock('tweetnacl', () => ({
  sign: {
    detached: {
      verify: jest.fn().mockReturnValue(true)
    }
  }
}));

// Mock repositories and services
const mockWalletRepository = {
  createVerificationMessage: jest.fn(),
  getVerificationMessage: jest.fn(),
  getUserByWalletAddress: jest.fn(),
  saveUserWallet: jest.fn(),
  getUserWallet: jest.fn(),
  updateUserTokenHoldings: jest.fn(),
  deleteVerificationMessages: jest.fn()
};

const mockBlockchainService = {
  getTokenBalance: jest.fn(),
  verifyMessageSignature: jest.fn()
};

const mockTokenService = {
  getUserTier: jest.fn(),
  refreshUserBenefits: jest.fn()
};

const mockAuditService = {
  logSecurityEvent: jest.fn()
};

const mockEventEmitter = {
  emit: jest.fn()
} as unknown as EventEmitter;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as unknown as Logger;

describe('WalletService', () => {
  let walletService: WalletService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    walletService = new WalletService(
      mockWalletRepository as any,
      mockBlockchainService as any,
      mockTokenService as any,
      mockAuditService as any,
      mockEventEmitter,
      mockLogger
    );
  });
  
  describe('generateVerificationMessage', () => {
    it('should delete existing verification messages before creating a new one', async () => {
      const mockMessage = {
        message: 'Verify wallet: abc123',
        expires: new Date(Date.now() + 10 * 60 * 1000)
      };
      
      mockWalletRepository.createVerificationMessage.mockResolvedValue(mockMessage);
      
      const result = await walletService.generateVerificationMessage('user-123');
      
      expect(mockWalletRepository.deleteVerificationMessages).toHaveBeenCalledWith('user-123');
      expect(mockWalletRepository.createVerificationMessage).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockMessage);
    });
  });
  
  describe('verifyWallet', () => {
    it('should successfully verify a wallet with valid signature', async () => {
      // Mock verification message
      const mockVerification = {
        message: 'Verify wallet: abc123',
        expires: new Date(Date.now() + 10 * 60 * 1000)
      };
      
      // Mock wallet details
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        address: 'wallet-address',
        verified: true,
        verifiedAt: new Date()
      };
      
      // Setup mocks
      mockWalletRepository.getVerificationMessage.mockResolvedValue(mockVerification);
      mockWalletRepository.getUserByWalletAddress.mockResolvedValue(null);
      mockWalletRepository.saveUserWallet.mockResolvedValue(mockWallet);
      
      // Call service method
      const result = await walletService.verifyWallet(
        'user-123',
        'wallet-address',
        'valid-signature'
      );
      
      // Assert results
      expect(PublicKey).toHaveBeenCalledWith('wallet-address');
      expect(bs58.decode).toHaveBeenCalledWith('valid-signature');
      expect(nacl.sign.detached.verify).toHaveBeenCalled();
      expect(mockWalletRepository.saveUserWallet).toHaveBeenCalledWith(
        'user-123',
        'wallet-address',
        'phantom',
        true
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        EventType.WALLET_CONNECTED,
        expect.objectContaining({
          userId: 'user-123',
          walletAddress: 'wallet-address'
        })
      );
      expect(result).toEqual({
        userId: 'user-123',
        walletAddress: 'wallet-address',
        verified: true,
        verifiedAt: mockWallet.verifiedAt
      });
    });
    
    it('should throw error when verification message is expired', async () => {
      // Mock expired verification message
      const mockExpiredVerification = {
        message: 'Verify wallet: abc123',
        expires: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes in the past
      };
      
      mockWalletRepository.getVerificationMessage.mockResolvedValue(mockExpiredVerification);
      
      // Call service method and expect error
      await expect(
        walletService.verifyWallet('user-123', 'wallet-address', 'valid-signature')
      ).rejects.toThrow('Verification expired or not found');
    });
    
    it('should throw error when verification message is not found', async () => {
      mockWalletRepository.getVerificationMessage.mockResolvedValue(null);
      
      // Call service method and expect error
      await expect(
        walletService.verifyWallet('user-123', 'wallet-address', 'valid-signature')
      ).rejects.toThrow('Verification expired or not found');
    });
    
    it('should throw error when signature is invalid', async () => {
      // Mock verification message
      const mockVerification = {
        message: 'Verify wallet: abc123',
        expires: new Date(Date.now() + 10 * 60 * 1000)
      };
      
      // Setup mocks
      mockWalletRepository.getVerificationMessage.mockResolvedValue(mockVerification);
      (nacl.sign.detached.verify as jest.Mock).mockReturnValue(false);
      
      // Call service method and expect error
      await expect(
        walletService.verifyWallet('user-123', 'wallet-address', 'invalid-signature')
      ).rejects.toThrow('Invalid signature');
      
      // Verify security event was logged
      expect(mockAuditService.logSecurityEvent).toHaveBeenCalledWith(
        'wallet_verification_failed',
        'user-123',
        { walletAddress: 'wallet-address', reason: 'invalid_signature' },
        'medium'
      );
    });
    
    it('should throw error when wallet is already associated with another user', async () => {
      // Mock verification message
      const mockVerification = {
        message: 'Verify wallet: abc123',
        expires: new Date(Date.now() + 10 * 60 * 1000)
      };
      
      // Mock existing user with this wallet
      const mockExistingUser = {
        id: 'other-user',
        username: 'other-username'
      };
      
      // Setup mocks
      mockWalletRepository.getVerificationMessage.mockResolvedValue(mockVerification);
      mockWalletRepository.getUserByWalletAddress.mockResolvedValue(mockExistingUser);
      (nacl.sign.detached.verify as jest.Mock).mockReturnValue(true);
      
      // Call service method and expect error
      await expect(
        walletService.verifyWallet('user-123', 'wallet-address', 'valid-signature')
      ).rejects.toThrow('Wallet already associated with another account');
    });
  });
  
  describe('updateTokenHoldings', () => {
    it('should update token holdings successfully', async () => {
      // Mock wallet
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        address: 'wallet-address',
        verified: true
      };
      
      // Setup mocks
      mockWalletRepository.getUserWallet.mockResolvedValue(mockWallet);
      mockBlockchainService.getTokenBalance.mockResolvedValue(5000);
      mockTokenService.getUserTier.mockReturnValue({
        name: 'gold',
        threshold: 5000,
        multiplier: 1.5,
        benefits: []
      });
      
      // Call service method
      const result = await walletService.updateTokenHoldings('user-123', 'wallet-address');
      
      // Assert results
      expect(result).toBe(true);
      expect(mockBlockchainService.getTokenBalance).toHaveBeenCalledWith('wallet-address');
      expect(mockWalletRepository.updateUserTokenHoldings).toHaveBeenCalledWith(
        'user-123',
        'wallet-123',
        5000,
        'gold'
      );
      expect(mockTokenService.refreshUserBenefits).toHaveBeenCalledWith('user-123');
    });
    
    it('should throw error when no verified wallet found', async () => {
      // Mock no wallet
      mockWalletRepository.getUserWallet.mockResolvedValue(null);
      
      // Call service method and expect error
      await expect(
        walletService.updateTokenHoldings('user-123', 'wallet-address')
      ).rejects.toThrow('No verified wallet found for user');
    });
    
    it('should throw error when wallet is not verified', async () => {
      // Mock unverified wallet
      const mockUnverifiedWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        address: 'wallet-address',
        verified: false
      };
      
      mockWalletRepository.getUserWallet.mockResolvedValue(mockUnverifiedWallet);
      
      // Call service method and expect error
      await expect(
        walletService.updateTokenHoldings('user-123', 'wallet-address')
      ).rejects.toThrow('No verified wallet found for user');
    });
    
    it('should handle blockchain service errors gracefully', async () => {
      // Mock wallet
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        address: 'wallet-address',
        verified: true
      };
      
      // Setup mocks
      mockWalletRepository.getUserWallet.mockResolvedValue(mockWallet);
      mockBlockchainService.getTokenBalance.mockRejectedValue(new Error('RPC node error'));
      
      // Call service method
      const result = await walletService.updateTokenHoldings('user-123', 'wallet-address');
      
      // Assert results
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
