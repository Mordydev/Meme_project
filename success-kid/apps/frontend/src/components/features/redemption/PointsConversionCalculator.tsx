'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { formatCompactNumber } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface PointsConversionCalculatorProps {
  pointsBalance: number;
  minRedemption: number;
  maxRedemption: number;
  conversionRate: number;
  onAmountChange: (amount: number) => void;
  onSubmit?: (amount: number) => void;
  isProcessing?: boolean;
  className?: string;
}

/**
 * Enhanced calculator for points-to-token conversion with improved UX
 */
export function PointsConversionCalculator({
  pointsBalance,
  minRedemption,
  maxRedemption,
  conversionRate,
  onAmountChange,
  onSubmit,
  isProcessing = false,
  className = ''
}: PointsConversionCalculatorProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Default to minimum points or balance if less than minimum
  const initialAmount = pointsBalance < minRedemption 
    ? pointsBalance 
    : Math.min(maxRedemption, Math.max(minRedemption, pointsBalance / 2));

  const [pointsAmount, setPointsAmount] = useState(initialAmount);
  const [sliderValue, setSliderValue] = useState(
    Math.min(100, Math.round((pointsAmount / maxRedemption) * 100))
  );
  
  // Validation
  const [errors, setErrors] = useState<{
    tooLow?: boolean;
    tooHigh?: boolean;
    exceedsBalance?: boolean;
  }>({});
  
  // Derived values
  const tokenAmount = pointsAmount / conversionRate;
  const isValid = 
    pointsAmount >= minRedemption && 
    pointsAmount <= maxRedemption && 
    pointsAmount <= pointsBalance;
  
  // Reset to default values when dependencies change
  useEffect(() => {
    const defaultAmount = pointsBalance < minRedemption 
      ? pointsBalance 
      : Math.min(maxRedemption, Math.max(minRedemption, pointsBalance / 2));
    
    setPointsAmount(defaultAmount);
    
    // Prevent NaN in slider value calculation
    const maxValue = Math.max(1, maxRedemption); // Ensure we don't divide by zero
    const sliderPercentage = (defaultAmount / maxValue) * 100;
    const newSliderValue = Math.min(100, Math.round(sliderPercentage || 0)); // Default to 0 if NaN
    
    setSliderValue(newSliderValue);
    
    // Notify parent of initial amount
    onAmountChange(defaultAmount);
  }, [minRedemption, maxRedemption, pointsBalance, onAmountChange]);
  
  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSliderValue = parseInt(e.target.value, 10);
    setSliderValue(newSliderValue);
    
    // Convert percentage to points value
    const newAmount = Math.round(
      (newSliderValue / 100) * Math.min(maxRedemption, pointsBalance)
    );
    
    setPointsAmount(newAmount);
    onAmountChange(newAmount);
  };
  
  // Handle direct input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = Math.min(
      maxRedemption,
      parseInt(e.target.value, 10) || 0
    );
    
    setPointsAmount(newAmount);
    
    // Update slider to match
    const newSliderValue = Math.min(
      100,
      Math.round((newAmount / Math.min(maxRedemption, pointsBalance)) * 100)
    );
    setSliderValue(newSliderValue);
    
    onAmountChange(newAmount);
  };
  
  // Handle blur to validate
  const handleBlur = useCallback(() => {
    let newErrors = {};
    
    if (pointsAmount < minRedemption) {
      newErrors = { ...newErrors, tooLow: true };
    }
    
    if (pointsAmount > maxRedemption) {
      newErrors = { ...newErrors, tooHigh: true };
    }
    
    if (pointsAmount > pointsBalance) {
      newErrors = { ...newErrors, exceedsBalance: true };
    }
    
    setErrors(newErrors);
  }, [pointsAmount, minRedemption, maxRedemption, pointsBalance]);
  
  // Validate whenever amount changes
  useEffect(() => {
    handleBlur();
  }, [pointsAmount, handleBlur]);
  
  // Handle quick selection buttons
  const setMinimumAmount = () => {
    const newAmount = Math.min(minRedemption, pointsBalance);
    setPointsAmount(newAmount);
    setSliderValue(Math.round((newAmount / Math.min(maxRedemption, pointsBalance)) * 100));
    onAmountChange(newAmount);
  };
  
  const setMaximumAmount = () => {
    const newAmount = Math.min(maxRedemption, pointsBalance);
    setPointsAmount(newAmount);
    setSliderValue(100);
    onAmountChange(newAmount);
  };
  
  const setHalfAmount = () => {
    const halfAmount = Math.floor(pointsBalance / 2);
    const newAmount = Math.min(maxRedemption, Math.max(minRedemption, halfAmount));
    setPointsAmount(newAmount);
    setSliderValue(Math.round((newAmount / Math.min(maxRedemption, pointsBalance)) * 100));
    onAmountChange(newAmount);
  };
  
  const handleSubmit = () => {
    if (isValid && onSubmit) {
      onSubmit(pointsAmount);
    }
  };
  
  // Define some presets for quick selection
  const presets = [
    { label: 'Minimum', value: minRedemption, action: setMinimumAmount },
    { label: 'Half', value: Math.floor(pointsBalance / 2), action: setHalfAmount },
    { label: 'Maximum', value: Math.min(maxRedemption, pointsBalance), action: setMaximumAmount }
  ];
  
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Amount Selector */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="points-input" className="font-medium">
                Points to Redeem
              </label>
              <span className="text-sm text-muted-foreground">
                Available: <span className="font-mono font-medium">{formatCompactNumber(pointsBalance)}</span>
              </span>
            </div>
            
            <div className="flex rounded-md shadow-sm">
              <input
                id="points-input"
                type="number"
                min={0}
                max={Math.min(pointsBalance, maxRedemption)}
                value={pointsAmount}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`block w-full rounded-md border px-3 py-2 text-base font-mono 
                  ${Object.keys(errors).length > 0 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-input focus:border-primary focus:ring-primary'
                  }`}
                disabled={isProcessing}
              />
            </div>
            
            <AnimatePresence>
              {errors.tooLow && (
                <motion.p
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  className="mt-1 text-xs text-red-500"
                >
                  Minimum redemption amount is {minRedemption} SP
                </motion.p>
              )}
              
              {errors.tooHigh && (
                <motion.p
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  className="mt-1 text-xs text-red-500"
                >
                  Maximum redemption amount is {maxRedemption} SP
                </motion.p>
              )}
              
              {errors.exceedsBalance && (
                <motion.p
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  className="mt-1 text-xs text-red-500"
                >
                  Amount exceeds your available balance of {pointsBalance} SP
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          
          {/* Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue || 0} // Ensure we always have a valid value
              onChange={handleSliderChange}
              disabled={isProcessing}
              className="w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 h-2 focus:outline-none disabled:opacity-50"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 SP</span>
              <span>{formatCompactNumber(Math.min(maxRedemption, pointsBalance))} SP</span>
            </div>
          </div>
          
          {/* Quick Selection Buttons */}
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={preset.action}
                disabled={preset.value > pointsBalance || isProcessing}
                className="rounded-md border border-input bg-background px-3 py-1 text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {preset.label} ({formatCompactNumber(preset.value)})
              </button>
            ))}
          </div>
          
          {/* Conversion Preview */}
          <motion.div 
            className="rounded-lg border bg-neutral-50 p-4"
            animate={{ 
              scale: [1, 1.02, 1],
              transition: { duration: 0.4, ease: "easeInOut" }
            }}
            key={pointsAmount} // Force animation on value change
          >
            <h3 className="mb-3 font-medium">Conversion Preview</h3>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-mono text-lg font-medium">{formatCompactNumber(pointsAmount)}</div>
                <div className="text-xs text-muted-foreground">Success Points</div>
              </div>
              
              <div className="text-muted-foreground">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              
              <div className="text-sm">
                <div className="font-mono text-lg font-medium">{tokenAmount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">SKC Tokens</div>
              </div>
            </div>
            
            <p className="mt-3 text-xs text-muted-foreground">
              Conversion Rate: {conversionRate} SP = 1 SKC
            </p>
          </motion.div>
          
          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isProcessing}
            isLoading={isProcessing}
            className="w-full"
          >
            {isProcessing
              ? "Processing..."
              : `Redeem ${formatCompactNumber(pointsAmount)} SP for ${tokenAmount.toFixed(2)} SKC`
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
