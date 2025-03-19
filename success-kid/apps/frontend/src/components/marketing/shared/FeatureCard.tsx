'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  index?: number;
  variant?: 'default' | 'outlined' | 'accent';
  iconClassName?: string;
  className?: string;
}

export function FeatureCard({ 
  icon, 
  title, 
  description, 
  index = 0,
  variant = 'default',
  iconClassName = '',
  className = ''
}: FeatureCardProps) {
  // Get variant classes
  const variantClasses = {
    default: "bg-white shadow rounded-xl p-6",
    outlined: "bg-white border border-gray-200 rounded-xl p-6 shadow-sm",
    accent: "bg-primary/5 shadow rounded-xl p-6"
  };
  
  // Get icon background classes
  const getIconBgClass = () => {
    switch (variant) {
      case 'accent':
        return 'bg-primary/20 text-primary';
      case 'outlined':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-primary/10 text-primary';
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`${variantClasses[variant]} flex flex-col items-center md:items-start text-center md:text-left ${className}`}
    >
      <div className={`w-12 h-12 rounded-full ${getIconBgClass()} flex items-center justify-center mb-4 ${iconClassName}`}>
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      
      <p className="text-neutral-600">{description}</p>
    </motion.div>
  );
}

export default FeatureCard;
