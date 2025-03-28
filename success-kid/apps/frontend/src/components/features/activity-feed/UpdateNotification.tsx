'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export interface UpdateNotificationProps {
  count: number;
  onClick: () => void;
  position?: 'top' | 'bottom';
  className?: string;
}

export function UpdateNotification({
  count,
  onClick,
  position = 'top',
  className = ''
}: UpdateNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
      className={`w-full flex justify-center ${className}`}
    >
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-colors"
      >
        <span className="text-sm font-medium">
          {count} new {count === 1 ? 'item' : 'items'}
        </span>
        <ArrowDown size={16} className="animate-bounce" />
      </button>
    </motion.div>
  );
}
