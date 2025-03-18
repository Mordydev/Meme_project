import React from 'react';
import { motion } from 'framer-motion';

export interface AnimatedPointsBadgeProps {
  label: string;
  points: number;
  icon: string;
  className?: string;
  delay?: number;
}

export function AnimatedPointsBadge({
  label,
  points,
  icon,
  className = '',
  delay = 0
}: AnimatedPointsBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: delay
      }}
      className={`inline-flex items-center rounded-full bg-white px-3 py-1 shadow-sm ${className}`}
    >
      <span className="mr-1">{icon}</span>
      <span className="mr-2 text-sm text-gray-700">{label}</span>
      <span className="text-sm font-semibold text-primary">+{points} SP</span>
    </motion.div>
  );
}

export default AnimatedPointsBadge;
