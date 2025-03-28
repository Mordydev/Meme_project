'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  className = '',
}: SwitchProps) {
  const toggleSwitch = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={toggleSwitch}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleSwitch();
          e.preventDefault();
        }
      }}
    >
      <motion.div
        className="h-5 w-5 rounded-full bg-white shadow-sm"
        animate={{
          x: checked ? 20 : 2,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      />
    </div>
  );
}
