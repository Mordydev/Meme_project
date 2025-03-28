'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface SecondaryCTAProps {
  title: string;
  description: string;
  icon?: string;
  ctaText: string;
  ctaLink: string;
  variant?: 'light' | 'dark' | 'bordered';
  className?: string;
}

export function SecondaryCTA({
  title,
  description,
  icon,
  ctaText,
  ctaLink,
  variant = 'light',
  className = '',
}: SecondaryCTAProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  
  // Get styles based on variant
  const getStyles = () => {
    switch (variant) {
      case 'light':
        return 'bg-gray-50 border border-gray-100';
      case 'dark':
        return 'bg-gray-800 text-white border border-gray-700';
      case 'bordered':
        return 'bg-white border border-primary-100';
      default:
        return 'bg-gray-50 border border-gray-100';
    }
  };
  
  // Text color based on variant
  const getTextColor = () => {
    return variant === 'dark' ? 'text-white' : 'text-gray-900';
  };
  
  const getDescriptionColor = () => {
    return variant === 'dark' ? 'text-gray-300' : 'text-gray-600';
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { 
      opacity: prefersReducedMotion ? 1 : 0, 
      y: prefersReducedMotion ? 0 : 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  
  return (
    <motion.div
      className={`rounded-lg p-6 shadow-sm ${getStyles()} ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0 md:flex-1">
          <div className="flex items-center mb-2">
            {icon && (
              <div className={`w-10 h-10 rounded-full ${
                variant === 'dark' ? 'bg-primary-600' : 'bg-primary-100'
              } flex items-center justify-center text-xl mr-3`}>
                {icon}
              </div>
            )}
            <h3 className={`text-xl font-semibold ${getTextColor()}`}>{title}</h3>
          </div>
          <p className={`${getDescriptionColor()}`}>{description}</p>
        </div>
        
        <div className="md:ml-8">
          <Button asChild variant={variant === 'dark' ? 'outline' : 'primary'}>
            <Link href={ctaLink}>
              {ctaText}
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
