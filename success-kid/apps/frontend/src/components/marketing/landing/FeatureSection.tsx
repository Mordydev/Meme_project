'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FeatureSectionProps {
  title: string;
  description: string;
  imageSide?: 'left' | 'right';
  imageSrc?: React.ReactNode;
  ctaText?: string;
  ctaLink?: string;
  bgColor?: string;
  features?: string[];
  stats?: Array<{ label: string; value: string }>;
  children?: React.ReactNode;
  className?: string;
  imageClassName?: string;
  contentClassName?: string;
  category?: string;
}

export function FeatureSection({
  title,
  description,
  imageSide = 'right',
  imageSrc,
  ctaText,
  ctaLink,
  bgColor = 'bg-white',
  features,
  stats,
  children,
  className = '',
  imageClassName = '',
  contentClassName = '',
  category
}: FeatureSectionProps) {
  const prefersReducedMotion = useReducedMotionPreference();

  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: prefersReducedMotion ? 1 : 0, 
      y: prefersReducedMotion ? 0 : 30
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
    <section className={`py-20 ${bgColor} ${className}`}>
      <div className="container mx-auto px-4">
        <div className={`grid gap-12 lg:gap-16 lg:grid-cols-2 items-center ${
          imageSide === 'left' ? 'lg:grid-flow-col-dense' : ''
        }`}>
          {/* Content section */}
          <motion.div
            className={`${contentClassName}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {category && (
              <motion.p 
                variants={itemVariants}
                className="text-sm font-semibold uppercase tracking-wider text-primary mb-2"
              >
                {category}
              </motion.p>
            )}
            
            <motion.h2 
              variants={itemVariants}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              {title}
            </motion.h2>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg text-gray-600 mb-6"
            >
              {description}
            </motion.p>
            
            {features && features.length > 0 && (
              <motion.ul 
                variants={itemVariants}
                className="mb-6 space-y-2"
              >
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg 
                      className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        className="opacity-20"
                      />
                      <path 
                        d="M9 12l2 2 4-4" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="ml-3 text-gray-600">{feature}</span>
                  </li>
                ))}
              </motion.ul>
            )}
            
            {stats && stats.length > 0 && (
              <motion.div 
                variants={itemVariants}
                className="grid grid-cols-2 gap-4 mb-6"
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            )}
            
            {ctaText && ctaLink && (
              <motion.div variants={itemVariants}>
                <Link href={ctaLink}>
                  <Button size="lg" className="mt-2">
                    {ctaText}
                  </Button>
                </Link>
              </motion.div>
            )}
            
            {children && (
              <motion.div variants={itemVariants}>
                {children}
              </motion.div>
            )}
          </motion.div>
          
          {/* Image/visualization section */}
          <motion.div
            className={`${imageSide === 'left' ? 'lg:col-start-1' : 'lg:col-start-2'} ${imageClassName}`}
            initial={{ 
              opacity: prefersReducedMotion ? 1 : 0, 
              x: prefersReducedMotion ? 0 : (imageSide === 'left' ? -50 : 50)
            }}
            whileInView={{ 
              opacity: 1, 
              x: 0
            }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            {imageSrc}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
