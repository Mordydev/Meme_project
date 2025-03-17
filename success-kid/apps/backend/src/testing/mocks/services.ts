/**
 * Service Mocks
 * 
 * Provides mock implementations of various services for testing
 */

/**
 * Mock User Service
 */
export function createMockUserService() {
  return {
    getUserById: jest.fn(),
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    searchUsers: jest.fn(),
  };
}

/**
 * Mock Points Service
 */
export function createMockPointsService() {
  return {
    getUserPointsBalance: jest.fn(),
    awardPoints: jest.fn(),
    deductPoints: jest.fn(),
    getUserPointsHistory: jest.fn(),
    transferPoints: jest.fn(),
    redeemPoints: jest.fn(),
    getPointsLeaderboard: jest.fn(),
  };
}

/**
 * Mock Wallet Service
 */
export function createMockWalletService() {
  return {
    generateVerificationMessage: jest.fn(),
    verifyWalletSignature: jest.fn(),
    connectWallet: jest.fn(),
    disconnectWallet: jest.fn(),
    getWalletsByUser: jest.fn(),
    getConnectionHistory: jest.fn(),
    getWalletBalance: jest.fn(),
    getWalletTransactions: jest.fn(),
  };
}

/**
 * Mock Content Service
 */
export function createMockContentService() {
  return {
    createContent: jest.fn(),
    getContentById: jest.fn(),
    getContentFeed: jest.fn(),
    updateContent: jest.fn(),
    deleteContent: jest.fn(),
    createComment: jest.fn(),
    getComments: jest.fn(),
    likeContent: jest.fn(),
    unlikeContent: jest.fn(),
    getUserContent: jest.fn(),
  };
}

/**
 * Mock Authentication Service
 */
export function createMockAuthService() {
  return {
    authenticate: jest.fn(),
    validateToken: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    changePassword: jest.fn(),
    resetPassword: jest.fn(),
    isAuthenticated: jest.fn(),
    hasPermission: jest.fn(),
  };
}

/**
 * Mock Blockchain Service
 */
export function createMockBlockchainService() {
  return {
    getTokenPrice: jest.fn(),
    getMarketCap: jest.fn(),
    getCirculatingSupply: jest.fn(),
    getTokenBalance: jest.fn(),
    getTransactionHistory: jest.fn(),
    transferTokens: jest.fn(),
    verifyTransaction: jest.fn(),
  };
}

/**
 * Mock Notification Service
 */
export function createMockNotificationService() {
  return {
    sendNotification: jest.fn(),
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    getUnreadCount: jest.fn(),
  };
}

/**
 * Create repository mocks for database access
 */
export function createMockRepositories() {
  return {
    users: {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
    },
    profiles: {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    points: {
      getUserPointsTotal: jest.fn(),
      addPointsTransaction: jest.fn(),
      getUserTransactions: jest.fn(),
      getLeaderboard: jest.fn(),
    },
    content: {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getFeed: jest.fn(),
    },
    comments: {
      create: jest.fn(),
      findByContentId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    walletConnections: {
      findByWalletAddress: jest.fn(),
      findByUserId: jest.fn(),
      createWalletConnection: jest.fn(),
      updateVerificationStatus: jest.fn(),
      deleteById: jest.fn(),
    },
  };
}
