'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface FeatureSectionProps {
  title: string
  description: string
  image: string
  orientation?: 'left' | 'right'
  features?: string[]
}

export function FeatureSection({
  title,
  description,
  image,
  orientation = 'left',
  features = []
}: FeatureSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  
  return (
    <section 
      ref={ref} 
      className={`py-16 ${orientation === 'right' ? 'bg-zinc-900/50' : ''}`}
    >
      <div className="container mx-auto px-4">
        <div className={`flex flex-col ${orientation === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 md:gap-12 items-center`}>
          <motion.div 
            className="w-full md:w-1/2"
            initial={{ opacity: 0, x: orientation === 'right' ? 50 : -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: orientation === 'right' ? 50 : -50 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 aspect-video flex items-center justify-center">
              {image ? (
                <img 
                  src={image} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <div className="text-xl font-display text-battle-yellow mb-2">
                    {title} Placeholder
                  </div>
                  <div className="text-zinc-400 text-sm">
                    Feature visualization coming soon
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          
          <motion.div 
            className="w-full md:w-1/2"
            initial={{ opacity: 0, x: orientation === 'right' ? -50 : 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: orientation === 'right' ? -50 : 50 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h2 className="text-3xl font-display text-battle-yellow mb-4">
              {title}
            </h2>
            <div className="text-zinc-300 mb-6">
              {description}
            </div>
            
            {features.length > 0 && (
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                  >
                    <svg className="h-6 w-6 text-victory-green flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
