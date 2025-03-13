import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';

/**
 * Get redemption eligibility and limits
 */
export async function GET(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // This is a placeholder - in a real implementation, this would fetch from the backend API
  const eligibilityData = {
    isEligible: true,
    requirements: {
      minimumBalance: 1000,
      walletConnected: true,
      verificationComplete: true
    },
    limits: {
      conversionRate: 100, // 100 SP = 1 SKC
      minimumAmount: 1000, // Minimum 1000 SP per redemption
      weeklyLimit: 10000, // Maximum 10000 SP per week
      weeklyUsed: 0,      // SP used this week
      resetsAt: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
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
