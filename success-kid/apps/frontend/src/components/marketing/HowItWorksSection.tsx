'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';

const HowItWorksSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  
  const steps = [
    {
      title: 'Join the Community',
      description: 'Create an account and connect your wallet to become part of the Success Kid ecosystem.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      image: '/images/illustration-join.svg',
      color: 'bg-primary-500',
    },
    {
      title: 'Engage & Earn',
      description: 'Participate in discussions, create content, and earn Success Points (SP) for your contributions.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      ),
      image: '/images/illustration-earn.svg',
      color: 'bg-secondary-500',
    },
    {
      title: 'Level Up',
      description: 'Complete achievements, unlock badges, and rise through community levels as you contribute.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"></path>
          <circle cx="12" cy="8" r="7"></circle>
        </svg>
      ),
      image: '/images/illustration-level.svg',
      color: 'bg-accent-500',
    },
    {
      title: 'Redeem Rewards',
      description: 'Convert your Success Points to SKC tokens and enjoy the benefits of our growing ecosystem.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="M4.93 4.93l1.41 1.41"></path>
          <path d="M17.66 17.66l1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="M6.34 17.66l-1.41 1.41"></path>
          <path d="M19.07 4.93l-1.41 1.41"></path>
        </svg>
      ),
      image: '/images/illustration-redeem.svg',
      color: 'bg-alert-500',
    },
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gray-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl"></div>
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-secondary/5 to-accent/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Your journey from newcomer to valued community member in four simple steps.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute left-1/2 top-24 bottom-24 w-0.5 bg-gray-200 -translate-x-1/2 z-0"></div>
          
          {/* Steps */}
          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`lg:flex items-center ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Content */}
                <div className={`lg:w-5/12 ${index % 2 === 0 ? 'lg:pr-12 lg:text-right' : 'lg:pl-12'}`}>
                  <div className="flex items-center justify-center lg:justify-start mb-4">
                    <div className={`w-12 h-12 rounded-full ${step.color} text-white flex items-center justify-center lg:mx-0 mx-auto`}>
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>

                {/* Center Node for Desktop */}
                <div className="hidden lg:flex w-2/12 justify-center relative z-10">
                  <div className={`w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center ${step.color} text-white`}>
                    {step.icon}
                  </div>
                </div>

                {/* Illustration */}
                <div className="lg:w-5/12 mt-6 lg:mt-0">
                  <div className={`bg-white p-4 rounded-xl shadow-md ${index % 2 === 0 ? 'lg:translate-x-6' : 'lg:-translate-x-6'} hover:shadow-lg transition-shadow duration-300`}>
                    <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {/* Fallback for missing images */}
                      <div className={`w-full h-full ${step.color} opacity-10 absolute inset-0`}></div>
                      <div className="text-6xl">🚀</div>
                      {/* Uncomment when actual images are available */}
                      {/* <Image
                        src={step.image}
                        alt={step.title}
                        layout="fill"
                        objectFit="cover"
                      /> */}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
