/**
 * Wallet Connection Service Tests
 * 
 * Tests the wallet connection functionality
 */
import { WalletConnectionService } from '../../wallet/connection/service';
import { ValidationError, ConflictError } from '../../errors';

// Mock dependencies
const mockWalletRepository = {
  findByAddress: jest.fn(),
  findByUserId: jest.fn(),
  findPrimaryWallet: jest.fn(),
  createWalletConnection: jest.fn(),
  updateWalletConnection: jest.fn(),
  hasConnections: jest.fn(),
  delete: jest.fn()
};

// Mock the blockchain utility
jest.mock('../../blockchain/utils/address', () => ({
  isValidAddress: jest.fn().mockImplementation((address) => {
    // Basic mock validation - accepts addresses starting with a specific pattern
    return !!address && address.startsWith('8');
  })
}));

describe('WalletConnectionService', () => {
  let walletConnectionService: WalletConnectionService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    walletConnectionService = new WalletConnectionService(mockWalletRepository as any);
  });
  
  describe('connectWallet', () => {
    it('should throw ValidationError for invalid wallet address', async () => {
      // Arrange
      const userId = 'user123';
      const invalidAddress = 'invalid-address';
      
      // Act & Assert
      await expect(
        walletConnectionService.connectWallet(userId, invalidAddress)
      ).rejects.toThrow(ValidationError);
    });
    
    it('should throw ConflictError if wallet already connected to another user', async () => {
      // Arrange
      const userId = 'user123';
      const otherUserId = 'user456';
      const validAddress = '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp';
      
      mockWalletRepository.findByAddress.mockResolvedValue({
        id: 'wallet123',
        user_id: otherUserId,
        wallet_address: validAddress
      });
      
      // Act & Assert
      await expect(
        walletConnectionService.connectWallet(userId, validAddress)
      ).rejects.toThrow(ConflictError);
    });
    
    it('should update existing wallet if already connected to this user', async () => {
      // Arrange
      const userId = 'user123';
      const validAddress = '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp';
      const existingWallet = {
        id: 'wallet123',
        user_id: userId,
        wallet_address: validAddress,
        is_primary: false
      };
      const updatedWallet = {
        ...existingWallet,
        is_primary: true
      };
      
      mockWalletRepository.findByAddress.mockResolvedValue(existingWallet);
      mockWalletRepository.updateWalletConnection.mockResolvedValue(updatedWallet);
      
      // Act
      const result = await walletConnectionService.connectWallet(userId, validAddress, 'phantom', true);
      
      // Assert
      expect(mockWalletRepository.updateWalletConnection).toHaveBeenCalledWith(
        existingWallet.id,
        { is_primary: true }
      );
      expect(result).toEqual(updatedWallet);
    });
    
    it('should create new wallet connection if not already connected', async () => {
      // Arrange
      const userId = 'user123';
      const validAddress = '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp';
      const newWallet = {
        id: 'wallet-new',
        user_id: userId,
        wallet_address: validAddress,
        wallet_type: 'phantom',
        is_verified: false,
        is_primary: true,
        connected_at: new Date()
      };
      
      mockWalletRepository.findByAddress.mockResolvedValue(null);
      mockWalletRepository.createWalletConnection.mockResolvedValue(newWallet);
      
      // Act
      const result = await walletConnectionService.connectWallet(userId, validAddress, 'phantom', true);
      
      // Assert
      expect(mockWalletRepository.createWalletConnection).toHaveBeenCalledWith(expect.objectContaining({
        user_id: userId,
        wallet_address: validAddress,
        wallet_type: 'phantom',
        is_primary: true
      }));
      expect(result).toEqual(newWallet);
    });
  });
  
  describe('disconnectWallet', () => {
    it('should return false if wallet not found', async () => {
      // Arrange
      const userId = 'user123';
      const address = '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp';
      
      mockWalletRepository.findByAddress.mockResolvedValue(null);
      
      // Act
      const result = await walletConnectionService.disconnectWallet(userId, address);
      
      // Assert
      expect(result).toBe(false);
      expect(mockWalletRepository.delete).not.toHaveBeenCalled();
    });
    
    it('should return false if wallet connected to another user', async () => {
      // Arrange
      const userId = 'user123';
      const otherUserId = 'user456';
      const address = '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp';
      
      mockWalletRepository.findByAddress.mockResolvedValue({
        id: 'wallet123',
        user_id: otherUserId,
        wallet_address: address
      });
      
      // Act
      const result = await walletConnectionService.disconnectWallet(userId, address);
      
      // Assert
      expect(result).toBe(false);
      expect(mockWalletRepository.delete).not.toHaveBeenCalled();
    });
    
    it('should delete wallet connection if found for user', async () => {
      // Arrange
      const userId = 'user123';
      const address = '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp';
      const wallet = {
        id: 'wallet123',
        user_id: userId,
        wallet_address: address
      };
      
      mockWalletRepository.findByAddress.mockResolvedValue(wallet);
      mockWalletRepository.delete.mockResolvedValue(true);
      
      // Act
      const result = await walletConnectionService.disconnectWallet(userId, address);
      
      // Assert
      expect(result).toBe(true);
      expect(mockWalletRepository.delete).toHaveBeenCalledWith(wallet.id);
    });
  });
});
