'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface BattleFormatCardProps {
  title: string
  description: string
  icon: string
  color: string
  features: string[]
  index: number
}

export function BattleFormatCard({
  title,
  description,
  icon,
  color,
  features,
  index
}: BattleFormatCardProps) {
  const colors: Record<string, string> = {
    yellow: 'battle-yellow',
    blue: 'flow-blue',
    red: 'roast-red',
    green: 'victory-green',
    purple: 'purple-500'
  }
  
  const colorClass = colors[color] || 'battle-yellow'
  
  return (
    <motion.div 
      className={`bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className={`bg-${colorClass}/10 p-4 border-b border-${colorClass}/20`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className={`text-${colorClass} text-xl font-display`}>{title}</h3>
        </div>
      </div>
      
      <div className="p-5">
        <p className="text-zinc-300 mb-5">
          {description}
        </p>
        
        <div className="space-y-3 mb-5">
          <h4 className="text-hype-white font-medium text-sm">Key Features:</h4>
          <ul className="space-y-2">
            {features.map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-start">
                <svg className={`h-5 w-5 text-${colorClass} flex-shrink-0 mr-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-300 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <Link 
          href="/sign-up" 
          className={`block text-center bg-transparent hover:bg-${colorClass}/10 text-${colorClass} border border-${colorClass} font-medium px-4 py-2 rounded-md text-sm transition-colors`}
        >
          Try {title} Battles
        </Link>
      </div>
    </motion.div>
  )
}
