'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export interface MiniRedemptionWidgetProps {
  onFullRedemptionClick?: () => void;
  className?: string;
}

export function MiniRedemptionWidget({
  onFullRedemptionClick,
  className = ''
}: MiniRedemptionWidgetProps) {
  const router = useRouter();
  
  // Placeholder values
  const balance = 1000;
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  
  // Navigate to full redemption flow
  const handleFullRedemptionClick = () => {
    if (onFullRedemptionClick) {
      onFullRedemptionClick();
    } else {
      // Default behavior - navigate to points/redeem page
      router.push('/points/redeem');
    }
  };
  
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Balance Display */}
          <div>
            <div className="text-sm text-muted-foreground">Available to Redeem</div>
            <div className="font-mono text-2xl font-bold">{balance} SP</div>
          </div>
          
          {/* Simple Redemption Section */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Redemption Amount</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedAmount(500)}
                className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                  selectedAmount === 500
                    ? 'border-primary bg-primary-50 text-primary-900' 
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                500 SP
              </button>
              <button
                onClick={() => setSelectedAmount(1000)}
                className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                  selectedAmount === 1000
                    ? 'border-primary bg-primary-50 text-primary-900' 
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                1000 SP
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={handleFullRedemptionClick}
            >
              Redeem {selectedAmount} SP
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullRedemptionClick}
            >
              Advanced Options
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
