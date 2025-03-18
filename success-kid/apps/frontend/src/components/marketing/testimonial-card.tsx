import React from 'react';
import { motion } from 'framer-motion';

export interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  avatarSrc?: string;
  index?: number;
}

export function TestimonialCard({ 
  quote, 
  author, 
  role, 
  avatarSrc,
  index = 0 
}: TestimonialCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white shadow rounded-xl p-6"
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
