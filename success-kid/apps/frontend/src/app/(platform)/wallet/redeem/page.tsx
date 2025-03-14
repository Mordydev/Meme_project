'use client';

import React, { useState } from 'react';
import { PointsRedemptionFlow } from '@/components/features/points/redemption';
import { RedemptionHistory } from '@/components/features/points/redemption';
import { useAuth } from '@/hooks/useAuth';

export default function RedemptionPage() {
  const { user } = useAuth();
  const [completedTransactionId, setCompletedTransactionId] = useState<string | null>(null);
  
  // Handle transaction completion
  const handleTransactionComplete = (transactionId: string) => {
    setCompletedTransactionId(transactionId);
    
    // You could also trigger other actions like notifications here
  };
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-neutral-100 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">Authentication Required</h2>
          <p className="text-neutral-600 mb-4">
            Please log in to access the token redemption features.
          </p>
          <button
            className="bg-primary text-white px-4 py-2 rounded-md"
            onClick={() => window.location.href = '/login'}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Redeem Success Points</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PointsRedemptionFlow
            userId={user.id}
            onComplete={handleTransactionComplete}
          />
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">How Redemption Works</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">1</span>
                <span className="ml-3">Verify eligibility and connect your wallet</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">2</span>
                <span className="ml-3">Choose how many Success Points to redeem</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">3</span>
                <span className="ml-3">Confirm transaction details for processing</span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">4</span>
                <span className="ml-3">Receive SKC tokens directly in your wallet</span>
              </li>
            </ul>
            
            <div className="mt-6 p-4 bg-white rounded-lg">
              <h3 className="font-medium mb-2">Redemption Rules</h3>
              <ul className="text-sm text-neutral-600 space-y-2">
                <li>• Minimum redemption: 1,000 SP (10 SKC)</li>
                <li>• Maximum weekly redemption: 10,000 SP (100 SKC)</li>
                <li>• Conversion rate: 100 SP = 1 SKC</li>
                <li>• Processing time: Up to 24 hours</li>
                <li>• Wallet connection required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">Redemption History</h2>
        <RedemptionHistory
          userId={user.id}
          limit={5}
        />
      </div>
    </div>
  );
}
