'use client';

import React from 'react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { MarketStats } from '@/types';

interface KeyMetricsProps {
  stats: MarketStats;
  className?: string;
}

/**
 * KeyMetrics Component
 * 
 * Displays essential market metrics in a compact format.
 */
export default function KeyMetrics({ stats, className }: KeyMetricsProps) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-neutral-500 font-medium">Market Cap</div>
          <div className="font-semibold">{formatCurrency(stats.marketCap, 0)}</div>
        </div>
        
        <div>
          <div className="text-neutral-500 font-medium">24h Volume</div>
          <div className="font-semibold">{formatCurrency(stats.volume24h, 0)}</div>
        </div>
        
        <div>
          <div className="text-neutral-500 font-medium">Liquidity</div>
          <div className="font-semibold">{formatCurrency(stats.liquidity, 0)}</div>
        </div>
        
        <div>
          <div className="text-neutral-500 font-medium">Holders</div>
          <div className="font-semibold">{formatNumber(stats.holders)}</div>
        </div>
      </div>
    </div>
  );
}
