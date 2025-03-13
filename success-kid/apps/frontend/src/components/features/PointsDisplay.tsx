'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface PointsDisplayProps {
  balance: number;
  initialBalance?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'detailed';
  onBalanceClick?: () => void;
}

export function PointsDisplay({
  balance,
  initialBalance,
  className = '',
  showLabel = true,
  size = 'md',
  variant = 'default',
  onBalanceClick,
}: PointsDisplayProps) {
  const [displayBalance, setDisplayBalance] = useState(initialBalance ?? balance);
  const prevBalanceRef = useRef(initialBalance ?? balance);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Animate when balance changes
  useEffect(() => {
    if (balance !== prevBalanceRef.current) {
      setShowAnimation(true);
      
      // Animate counter
      const difference = balance - prevBalanceRef.current;
      const duration = 1000; // 1 second
      const startTime = performance.now();
      
      const animateValue = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic: progress = 1 - Math.pow(1 - progress, 3);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = prevBalanceRef.current + difference * easeProgress;
        
        setDisplayBalance(Math.round(currentValue));
        
        if (progress < 1) {
          requestAnimationFrame(animateValue);
        } else {
          setDisplayBalance(balance);
          prevBalanceRef.current = balance;
          setTimeout(() => setShowAnimation(false), 500);
        }
      };
      
      requestAnimationFrame(animateValue);
    }
  }, [balance]);
  
  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    default: 'bg-primary-50 text-primary-900 border border-primary-200 rounded-md px-3 py-1',
    minimal: 'flex items-center',
    detailed: 'bg-white shadow-sm border border-neutral-200 rounded-lg p-3',
  };
  
  return (
    <div 
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className} relative font-mono`}
      onClick={onBalanceClick}
      role={onBalanceClick ? 'button' : undefined}
      tabIndex={onBalanceClick ? 0 : undefined}
    >
      {variant === 'detailed' && (
        <div className="text-xs font-medium text-neutral-500 mb-1">Success Points</div>
      )}
      
      <div className="flex items-center">
        {/* Points icon */}
        <svg 
          className={`mr-1.5 ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        
        {/* Points value */}
        <span className="font-semibold">{displayBalance.toLocaleString()}</span>
        
        {/* Points label */}
        {showLabel && <span className="ml-1 text-neutral-500">SP</span>}
        
        {/* Animation overlay */}
        <AnimatePresence>
          {showAnimation && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 right-2 text-accent-500 font-semibold"
            >
              +{(balance - (initialBalance ?? balance)).toLocaleString()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
