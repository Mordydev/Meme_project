'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  description: string;
}

const marketNavItems: NavItem[] = [
  {
    name: 'Market Dashboard',
    href: '/markets',
    icon: '📊',
    description: 'Real-time market data, price charts, and token metrics'
  },
  {
    name: 'Tokenomics',
    href: '/tokenomics',
    icon: '💰',
    description: 'Token distribution, supply information, and economics'
  }
];

export function MarketNavigation() {
  const pathname = usePathname();
  
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="py-4 flex items-center justify-between">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">
              <span className="text-primary">SKC</span> Token
            </h1>
          </div>
          
          <div className="flex space-x-4">
            {marketNavItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="relative"
                >
                  <motion.div 
                    className={`py-2 px-4 rounded-md ${
                      isActive 
                        ? 'text-primary font-medium' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                  >
                    <span className="mr-2">{item.icon}</span>
                    <span>{item.name}</span>
                    
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary"
                        layoutId="marketNavIndicator"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
          
          <div className="flex items-center space-x-2">
            <Link 
              href="https://raydium.io/swap/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-primary text-white py-1.5 px-3 rounded-md hover:bg-primary-600 transition-colors"
            >
              Buy SKC
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default MarketNavigation;
