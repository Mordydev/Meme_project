'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  avatarSrc?: string;
  index?: number;
  variant?: 'default' | 'outlined' | 'accent';
  rating?: number;
  className?: string;
}

export function TestimonialCard({ 
  quote, 
  author, 
  role, 
  avatarSrc,
  index = 0,
  variant = 'default',
  rating,
  className = ''
}: TestimonialCardProps) {
  // Get variant classes
  const variantClasses = {
    default: "bg-white shadow rounded-xl p-6",
    outlined: "bg-white border border-gray-200 rounded-xl p-6 shadow-sm",
    accent: "bg-primary/5 shadow rounded-xl p-6"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`${variantClasses[variant]} ${className}`}
    >
      <div className="mb-4 text-primary">
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </svg>
      </div>
      
      {/* Optional rating */}
      {rating && (
        <div className="flex mb-3">
          {[...Array(5)].map((_, i) => (
            <svg 
              key={i}
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill={i < rating ? "currentColor" : "none"}
              stroke="currentColor" 
              strokeWidth="2"
              className={i < rating ? "text-yellow-500" : "text-gray-300"}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      )}
      
      <p className="text-neutral-700 mb-6">{quote}</p>
      
      <div className="flex items-center">
        {avatarSrc ? (
          <img 
            src={avatarSrc} 
            alt={author} 
            className="w-10 h-10 rounded-full mr-3 object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-neutral-200 mr-3 flex items-center justify-center text-neutral-600">
            {author.charAt(0)}
          </div>
        )}
        
        <div>
          <h4 className="font-semibold">{author}</h4>
          <p className="text-sm text-neutral-500">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default TestimonialCard;
