'use client';

import { PointsRedemptionFlow } from '@/components/features/redemption';

export default function RedeemPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Redeem Points for Tokens</h1>
        <p className="mt-2 text-muted-foreground">
          Convert your earned Success Points into SKC tokens to use across the Success Kid ecosystem.
        </p>
      </div>
      
      <PointsRedemptionFlow />
    </div>
  );
}
