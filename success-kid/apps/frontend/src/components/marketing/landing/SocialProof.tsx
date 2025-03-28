'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

interface Testimonial {
  content: string;
  author: string;
  role: string;
  avatar?: string;
}

interface SocialProofProps {
  className?: string;
  testimonials?: Testimonial[];
  showStats?: boolean;
}

export function SocialProof({ 
  className = '',
  testimonials,
  showStats = true
}: SocialProofProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  
  // Default testimonials if none provided
  const defaultTestimonials: Testimonial[] = [
    {
      content: "Success Kid has completely changed how I engage with crypto communities. I've earned over 15,000 SP in just my first month by sharing content and helping others.",
      author: "Alex Thompson",
      role: "Content Creator",
      avatar: "👨‍💼"
    },
    {
      content: "The points system makes every interaction rewarding. It's the first platform where my contributions actually earn real value, and the community is incredibly supportive.",
      author: "Sarah Chen",
      role: "Blockchain Enthusiast",
      avatar: "👩‍💻"
    },
    {
      content: "I started with zero crypto knowledge, and now I'm earning tokens every week. The onboarding was super simple and everyone is so helpful to newcomers.",
      author: "Jordan Kim",
      role: "New Community Member",
      avatar: "🧑‍🎓"
    }
  ];
  
  const displayTestimonials = testimonials || defaultTestimonials;
  
  // Community stats
  const stats = [
    { label: 'Active Members', value: '50,000+' },
    { label: 'Points Awarded', value: '4.2M+' },
    { label: 'Token Holders', value: '8,400+' },
    { label: 'Countries', value: '120+' }
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
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
    <div className={`${className}`}>
      {/* Community Stats */}
      {showStats && (
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Join Our Growing Community</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm"
              >
                <p className="text-2xl font-bold text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Testimonials */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">What Our Community Says</h2>
        </div>
        
        <motion.div
          className="grid gap-6 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {displayTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <div className="mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 mr-1">★</span>
                ))}
              </div>
              
              <blockquote className="text-gray-700 mb-4">
                "{testimonial.content}"
              </blockquote>
              
              <div className="flex items-center">
                {testimonial.avatar && (
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xl mr-3">
                    {testimonial.avatar}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
