'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface CallToActionProps {
  title: string;
  subtitle: string;
  primaryCta: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  backgroundStyle?: 'primary' | 'secondary' | 'gradient' | 'pattern';
  className?: string;
}

export function CallToAction({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  backgroundStyle = 'primary',
  className = '',
}: CallToActionProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  
  // Get background styles based on the selected style
  const getBgStyles = () => {
    switch (backgroundStyle) {
      case 'primary':
        return 'bg-primary-50';
      case 'secondary':
        return 'bg-secondary-50';
      case 'gradient':
        return 'bg-gradient-to-r from-primary-50 to-secondary-50';
      case 'pattern':
        return 'bg-white relative overflow-hidden';
      default:
        return 'bg-primary-50';
    }
  };
  
  return (
    <section className={`py-16 ${getBgStyles()} ${className}`}>
      {/* Background pattern for the 'pattern' style */}
      {backgroundStyle === 'pattern' && (
        <div className="absolute inset-0 -z-10 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="successPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 0 L10 0 L10 10 L0 10 Z" fill="#1E88E5" />
                <path d="M20 0 L30 0 L30 10 L20 10 Z" fill="#FFC107" />
                <path d="M10 10 L20 10 L20 20 L10 20 Z" fill="#4CAF50" />
                <path d="M30 10 L40 10 L40 20 L30 20 Z" fill="#1E88E5" />
                <path d="M0 20 L10 20 L10 30 L0 30 Z" fill="#FFC107" />
                <path d="M20 20 L30 20 L30 30 L20 30 Z" fill="#1E88E5" />
                <path d="M10 30 L20 30 L20 40 L10 40 Z" fill="#4CAF50" />
                <path d="M30 30 L40 30 L40 40 L30 40 Z" fill="#FFC107" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#successPattern)" />
          </svg>
        </div>
      )}
      
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">{subtitle}</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <motion.div
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button size="lg" asChild className="relative overflow-hidden group">
                <Link href={primaryCta.href}>
                  {/* Hover glow effect */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md"></span>
                  <span className="relative">{primaryCta.text}</span>
                </Link>
              </Button>
            </motion.div>
            
            {secondaryCta && (
              <motion.div
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button size="lg" variant="outline" asChild>
                  <Link href={secondaryCta.href}>{secondaryCta.text}</Link>
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Subtle animated particles for non-reduced motion users */}
      {!prefersReducedMotion && backgroundStyle === 'primary' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-primary opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
