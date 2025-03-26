'use client';

import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AmountSelectionProps {
  pointsAmount: number;
  tokenAmount: number;
  conversionRate: number;
  minimumAmount: number;
  maximumAmount: number;
  onChange: (amount: number) => void;
}

export function AmountSelection({
  pointsAmount,
  tokenAmount,
  conversionRate,
  minimumAmount,
  maximumAmount,
  onChange
}: AmountSelectionProps) {
  const [localAmount, setLocalAmount] = useState<string>(pointsAmount.toString());
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // Update local amount when pointsAmount changes
  useEffect(() => {
    setLocalAmount(pointsAmount.toString());
  }, [pointsAmount]);
  
  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    const value = values[0];
    setLocalAmount(value.toString());
    onChange(value);
    setError(null);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalAmount(value);
    
    // Validate and update only if it's a valid number
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Check limits
      if (numValue < minimumAmount) {
        setError(`Minimum amount is ${minimumAmount.toLocaleString()} points`);
      } else if (numValue > maximumAmount) {
        setError(`Maximum amount is ${maximumAmount.toLocaleString()} points`);
      } else {
        setError(null);
        onChange(numValue);
      }
    }
  };
  
  // Format for slider steps
  const formatSliderSteps = () => {
    // For large ranges, generate more meaningful stops
    if (maximumAmount - minimumAmount > 5000) {
      const step = Math.ceil((maximumAmount - minimumAmount) / 5);
      return Array.from({ length: 6 }, (_, i) => 
        Math.min(minimumAmount + i * step, maximumAmount)
      );
    }
    
    // For smaller ranges, use increments of 100
    const steps = [];
    for (let i = minimumAmount; i <= maximumAmount; i += 100) {
      steps.push(i);
    }
    return steps;
  };
  
  // Animation variants
  const animationVariants = prefersReducedMotion ? {} : {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  };
  
  return (
    <div className="space-y-6">
      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="pointsAmount" className="text-base">Select Redemption Amount</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            id="pointsAmount"
            type="number"
            value={localAmount}
            onChange={handleInputChange}
            min={minimumAmount}
            max={maximumAmount}
            step={100}
            className="flex-1"
          />
          <div className="text-sm font-medium">Points</div>
        </div>
        
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
        
        <Slider
          value={[pointsAmount]}
          onValueChange={handleSliderChange}
          min={minimumAmount}
          max={maximumAmount}
          step={100}
          className="my-4"
        />
        
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{minimumAmount.toLocaleString()}</span>
          <span>{maximumAmount.toLocaleString()}</span>
        </div>
      </div>
      
      {/* Conversion Preview */}
      <div>
        <Separator className="my-4" />
        
        <motion.div 
          className="flex justify-between items-center"
          animate={{ scale: [null, 1.03, 1] }}
          transition={{ duration: 0.5, repeat: 0, repeatType: "reverse" }}
        >
          <div className="text-sm text-neutral-600">You'll Receive</div>
          <div className="font-mono text-xl font-semibold">
            {tokenAmount.toLocaleString()} SKC
          </div>
        </motion.div>
        
        <div className="flex justify-center my-4">
          <div className="flex items-center text-sm text-neutral-500">
            <div className="bg-neutral-100 rounded-l-md px-3 py-1">
              {pointsAmount.toLocaleString()} Points
            </div>
            <div className="px-2">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="bg-neutral-100 rounded-r-md px-3 py-1">
              {tokenAmount.toLocaleString()} SKC
            </div>
          </div>
        </div>
        
        <p className="text-xs text-center text-neutral-500">
          Conversion Rate: {conversionRate} Points = 1 SKC Token
        </p>
        
        {/* Quick Selection Buttons */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-neutral-700 mb-2">Quick Select</h4>
          <div className="flex flex-wrap gap-2">
            {formatSliderSteps().map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  onChange(amount);
                  setLocalAmount(amount.toString());
                  setError(null);
                }}
                className={`px-3 py-1 rounded-md text-sm border ${
                  pointsAmount === amount 
                    ? 'bg-primary text-white border-primary' 
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
