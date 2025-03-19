'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';
import { Button } from '@/components/ui/button';

interface WalletFeatureProps {
  className?: string;
}

export function WalletFeature({ className = '' }: WalletFeatureProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Wallet connection steps
  const walletSteps = [
    {
      title: 'Click Connect Wallet',
      description: 'Look for the Connect Wallet button in the navigation bar or settings page.',
      icon: '🔗'
    },
    {
      title: 'Select Phantom',
      description: 'Choose Phantom from the list of supported wallets (other wallets coming soon).',
      icon: '👻'
    },
    {
      title: 'Approve Connection',
      description: 'Phantom will ask for permission to connect. Approve the connection request.',
      icon: '✅'
    },
    {
      title: 'Start Using Features',
      description: 'Your wallet is now connected! You can now redeem points and access holder features.',
      icon: '🚀'
    }
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
  
  // Handle step navigation
  const goToNextStep = () => {
    if (currentStep < walletSteps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(1); // Start over
    }
  };
  
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Wallet Connection Guide */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-primary-50 p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Easy Wallet Connection</h3>
          <p className="text-gray-600 text-sm">Connect in under 30 seconds with our simple process</p>
        </div>
        
        <div className="p-5">
          {/* Step indicator */}
          <div className="flex mb-8">
            {walletSteps.map((_, index) => (
              <div 
                key={index} 
                className="flex-1 flex items-center"
                aria-hidden="true"
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                    index + 1 === currentStep
                      ? 'bg-primary text-white'
                      : index + 1 < currentStep
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
                {index < walletSteps.length - 1 && (
                  <div 
                    className={`h-1 flex-1 ${
                      index + 1 < currentStep ? 'bg-primary-100' : 'bg-gray-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Current step content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6 flex items-start"
          >
            <div className="w-16 h-16 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-3xl mr-4">
              {walletSteps[currentStep - 1].icon}
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">{walletSteps[currentStep - 1].title}</h4>
              <p className="text-gray-600">{walletSteps[currentStep - 1].description}</p>
            </div>
          </motion.div>
          
          {/* Navigation button */}
          <Button onClick={goToNextStep}>
            {currentStep < walletSteps.length ? 'Next Step' : 'Start Again'}
          </Button>
        </div>
      </div>
      
      {/* Wallet Benefits */}
      <motion.div
        className="space-y-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <h3 className="text-xl font-semibold">Benefits of Connecting Your Wallet</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div 
            variants={itemVariants} 
            className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl mb-3">
              💰
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Redeem Success Points</h4>
            <p className="text-gray-600">Convert your earned Success Points into SKC tokens at a rate of 100 SP = 1 SKC.</p>
          </motion.div>
          
          <motion.div 
            variants={itemVariants} 
            className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl mb-3">
              🔍
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Track Your Tokens</h4>
            <p className="text-gray-600">Monitor your SKC token balance, transaction history, and market value in real-time.</p>
          </motion.div>
          
          <motion.div 
            variants={itemVariants} 
            className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl mb-3">
              🏅
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Holder Benefits</h4>
            <p className="text-gray-600">Access exclusive features, content, and opportunities available only to token holders.</p>
          </motion.div>
          
          <motion.div 
            variants={itemVariants} 
            className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl mb-3">
              🔒
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Secure & Private</h4>
            <p className="text-gray-600">We only see your public wallet address, never your private keys. Your tokens remain fully under your control.</p>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Security Reassurance */}
      <motion.div
        className="bg-gray-50 p-5 rounded-lg border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Your Security is Our Priority</h4>
            <p className="text-gray-600 text-sm">
              We use industry-standard security practices and never store your private keys. 
              The wallet connection only allows us to verify your token holdings and process redemptions
              that you explicitly approve.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
