'use client';

import React from 'react';
import { formatCurrency } from '@/lib/format';
import { motion } from 'framer-motion';

interface CurrentPriceProps {
  price: number;
  className?: string;
}

/**
 * CurrentPrice Component
 * 
 * Displays the current token price with appropriate formatting
 * and subtle animation when the price changes.
 */
export default function CurrentPrice({ price, className }: CurrentPriceProps) {
  return (
    <motion.div 
      className={className}
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: [1, 0.7, 1], 
        scale: [1, 1.02, 1] 
      }}
      transition={{ 
        duration: 0.3, 
        ease: "easeInOut",
        // Only animate on price changes
        x: { type: "tween" } 
      }}
      key={`price-${price}`} // Key changes trigger animation
    >
      {formatCurrency(price)}
    </motion.div>
  );
}
