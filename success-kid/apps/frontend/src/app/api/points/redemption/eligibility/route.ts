import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get user's redemption eligibility and limits
 */
export async function GET(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Mock data for wallet connection status
  // In a real implementation, this would check if the user has a connected wallet
  const walletConnected = false;
  
  // This is a placeholder - in a real implementation, this would fetch from the backend API
  const eligibilityData = {
    isEligible: walletConnected && true, // Assuming other criteria are met
    requirements: {
      minimumBalance: 1000,
      walletConnected: walletConnected,
      verificationComplete: true
    },
    limits: {
      conversionRate: 100, // 100 SP = 1 SKC
      minimumAmount: 1000,
      weeklyLimit: 10000,
      weeklyUsed: 0,
      resetsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    balance: {
      current: 2450,
      pending: 0
    }
  };
  
  return Response.json({
    data: eligibilityData,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    }
  });
}
