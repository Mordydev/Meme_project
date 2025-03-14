'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConversionCalculatorProps {
  pointsBalance: number;
  conversionRate: number;
  minRedemption: number;
  maxRedemption: number;
  onAmountChange: (amount: number) => void;
  onSubmit?: () => void;
  className?: string;
}

export const ConversionCalculator: React.FC<ConversionCalculatorProps> = ({
  pointsBalance,
  conversionRate,
  minRedemption,
  maxRedemption,
  onAmountChange,
  onSubmit,
  className,
}) => {
  const [pointsAmount, setPointsAmount] = useState<number>(minRedemption);
  const [tokensAmount, setTokensAmount] = useState<number>(minRedemption / conversionRate);
  const [sliderValue, setSliderValue] = useState<number>(minRedemption);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate the maximum amount user can redeem based on balance and max limit
  const effectiveMaximum = Math.min(pointsBalance, maxRedemption);
  
  // Calculate the percentage for the slider based on the points amount
  const sliderPercentage = Math.floor(((sliderValue - minRedemption) / (effectiveMaximum - minRedemption)) * 100) || 0;
  
  // Preset amounts for quick selection
  const getPresetAmounts = () => {
    const presets = [];
    
    // Start with minimum
    presets.push(minRedemption);
    
    // Add 25%, 50%, 75% of effective maximum if they're above minimum
    const quarter = Math.floor(effectiveMaximum * 0.25);
    const half = Math.floor(effectiveMaximum * 0.5);
    const threeQuarters = Math.floor(effectiveMaximum * 0.75);
    
    if (quarter > minRedemption) presets.push(quarter);
    if (half > minRedemption && half > quarter) presets.push(half);
    if (threeQuarters > half) presets.push(threeQuarters);
    
    // Add maximum if it's not already included
    if (!presets.includes(effectiveMaximum)) {
      presets.push(effectiveMaximum);
    }
    
    return presets;
  };
  
  const presetAmounts = getPresetAmounts();

  // Validate the points amount
  const validatePointsAmount = (amount: number): string | null => {
    if (amount < minRedemption) {
      return `Minimum redemption is ${minRedemption} points`;
    }
    
    if (amount > effectiveMaximum) {
      return `Maximum redemption is ${effectiveMaximum} points`;
    }
    
    return null;
  };
  
  // Handle points input change
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const numberValue = value ? parseInt(value, 10) : 0;
    
    setPointsAmount(numberValue);
    setSliderValue(numberValue);
    setTokensAmount(numberValue / conversionRate);
    
    // Validate input
    const validationError = validatePointsAmount(numberValue);
    setError(validationError);
    
    // Only update parent if valid
    if (!validationError) {
      onAmountChange(numberValue);
    }
  };
  
  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    const scaledValue = Math.floor(
      minRedemption + ((value / 100) * (effectiveMaximum - minRedemption))
    );
    
    setSliderValue(scaledValue);
    setPointsAmount(scaledValue);
    setTokensAmount(scaledValue / conversionRate);
    
    // Validate and update parent
    const validationError = validatePointsAmount(scaledValue);
    setError(validationError);
    
    if (!validationError) {
      onAmountChange(scaledValue);
    }
  };
  
  // Handle preset amount selection
  const handlePresetClick = (amount: number) => {
    setPointsAmount(amount);
    setSliderValue(amount);
    setTokensAmount(amount / conversionRate);
    
    // Validate and update parent
    const validationError = validatePointsAmount(amount);
    setError(validationError);
    
    if (!validationError) {
      onAmountChange(amount);
    }
  };
  
  // Initialize with minimum valid amount
  useEffect(() => {
    if (minRedemption > 0) {
      setPointsAmount(minRedemption);
      setSliderValue(minRedemption);
      setTokensAmount(minRedemption / conversionRate);
      onAmountChange(minRedemption);
    }
  }, [minRedemption, conversionRate, onAmountChange]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Select Redemption Amount</CardTitle>
        <CardDescription>Choose how many Success Points you want to convert to SKC tokens</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Conversion preview */}
        <div className="bg-primary-50 p-4 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 text-2xl font-bold">
              <span>{pointsAmount} SP</span>
              <span className="text-neutral-400">→</span>
              <span>{tokensAmount.toFixed(2)} SKC</span>
            </div>
            <p className="text-sm text-neutral-600 mt-1">
              Rate: 100 SP = 1 SKC
            </p>
          </div>
        </div>
        
        {/* Points amount input */}
        <div className="space-y-2">
          <label htmlFor="points-amount" className="block text-sm font-medium text-neutral-700">
            Points Amount
          </label>
          <Input
            id="points-amount"
            type="text"
            value={pointsAmount.toString()}
            onChange={handlePointsChange}
            error={error || undefined}
            className="text-right"
          />
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>Min: {minRedemption}</span>
            <span>Max: {effectiveMaximum}</span>
          </div>
        </div>
        
        {/* Slider for amount selection */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${sliderPercentage}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPercentage}
            onChange={handleSliderChange}
            className="w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
        </div>
        
        {/* Preset amounts */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700">Quick Select</p>
          <div className="flex flex-wrap gap-2">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handlePresetClick(amount)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  pointsAmount === amount
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {amount} SP
              </button>
            ))}
          </div>
        </div>
        
        {/* Current balance */}
        <div className="text-sm text-neutral-600">
          <div className="flex justify-between">
            <span>Current Points Balance:</span>
            <span className="font-medium">{pointsBalance} SP</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Remaining After Redemption:</span>
            <span className="font-medium">{Math.max(0, pointsBalance - pointsAmount)} SP</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        {onSubmit && (
          <Button
            variant="primary"
            className="w-full"
            disabled={!!error || pointsAmount < minRedemption}
            onClick={onSubmit}
          >
            Continue to Confirmation
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
