'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'

interface RegistrationCTAProps {
  title?: string
  subtitle?: string
  buttonText?: string
  buttonLink?: string
}

export function RegistrationCTA({
  title = 'Ready to Join the Wild Side?',
  subtitle = 'Community first. Entertainment always. Innovation constantly. Get started today.',
  buttonText = 'Sign Up Now',
  buttonLink = '/sign-up'
}: RegistrationCTAProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  
  return (
    <section 
      className="py-16 px-4 bg-gradient-to-r from-battle-yellow/20 to-flow-blue/20 relative overflow-hidden"
      ref={ref}
    >
      {/* Abstract background shapes */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-battle-yellow rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-flow-blue rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>
      
      <div className="container mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-display text-hype-white mb-6">
            {title}
          </h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
          <Link 
            href={buttonLink} 
            className="inline-block bg-battle-yellow hover:bg-battle-yellow/90 text-wild-black font-medium px-8 py-3 rounded-md text-lg transition-colors"
          >
            {buttonText}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
