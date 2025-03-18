'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

const TokenomicsSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    },
  };

  return (
    <section ref={sectionRef} className="py-20 bg-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <svg 
          className="absolute top-0 right-0 w-1/3 text-primary opacity-5" 
          viewBox="0 0 200 200" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            fill="currentColor" 
            d="M37.5,-48.1C52.9,-39.4,72.2,-33.9,79.5,-21.7C86.7,-9.4,82,-9.5,79.1,9.7C76.3,28.9,75.3,48.5,65.5,61.5C55.6,74.4,37,80.6,20.6,76.7C4.2,72.8,-9.9,58.9,-25.5,49.8C-41.2,40.7,-58.3,36.4,-68,25.3C-77.7,14.2,-79.9,-3.8,-74.4,-18.5C-68.8,-33.3,-55.5,-44.7,-41.7,-53.7C-27.9,-62.7,-14,-69.3,-1.6,-67.2C10.7,-65.2,22.1,-56.8,37.5,-48.1Z" 
            transform="translate(100 100)" 
          />
        </svg>
        <svg 
          className="absolute bottom-0 left-0 w-1/4 text-secondary opacity-5" 
          viewBox="0 0 200 200" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            fill="currentColor" 
            d="M45.7,-51.9C59.5,-41.5,71.3,-26.5,74.4,-9.5C77.5,7.5,71.9,26.5,61.1,40.2C50.3,53.9,34.3,62.3,16.3,69.1C-1.6,75.9,-21.6,81.1,-35.9,74.1C-50.3,67.2,-59.1,48.1,-67.3,28.3C-75.6,8.5,-83.3,-12,-78.6,-29.2C-73.9,-46.5,-56.8,-60.5,-39.8,-69.1C-22.8,-77.8,-5.8,-81.1,9.2,-77.6C24.2,-74.1,31.9,-62.3,45.7,-51.9Z" 
            transform="translate(100 100)" 
          />
        </svg>
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Tokenomics & Community
          </h2>
          <p className="text-xl text-gray-600">
            Understanding our dual-token system and how we're building a sustainable ecosystem together.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Token Economy Visual */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="relative"
          >
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 relative overflow-hidden h-full">
              <h3 className="text-2xl font-display font-bold mb-6">Token Economy</h3>
              
              <motion.div variants={itemVariants} className="mb-8">
                <h4 className="text-lg font-semibold mb-2">Total Supply</h4>
                <p className="text-xl font-display font-bold text-primary">7 billion SKC tokens</p>
              </motion.div>
              
              <div className="space-y-4">
                <motion.div variants={itemVariants}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Community Rewards</span>
                    <span className="font-bold text-primary">50%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-primary h-3 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">3.5 billion tokens distributed weekly over 12 months</p>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Development Team</span>
                    <span className="font-bold text-accent">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-accent h-3 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">1.4 billion tokens with delayed distribution starting Month 3</p>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Public Sale</span>
                    <span className="font-bold text-secondary">30%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-secondary h-3 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">2.1 billion tokens for distribution and liquidity</p>
                </motion.div>
              </div>
              
              <motion.div 
                variants={itemVariants}
                className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20"
              >
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-primary mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-sm">
                    <span className="font-semibold">Success Points (SP)</span> are earned through platform engagement and can be redeemed for SKC tokens at a fixed rate of 100 SP = 1 SKC, with daily earning caps to ensure sustainability.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Community Features */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="relative"
          >
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 relative overflow-hidden h-full">
              <h3 className="text-2xl font-display font-bold mb-6">Market Cap Milestones</h3>
              
              <div className="space-y-6">
                <motion.div variants={itemVariants} className="relative">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm mr-3">
                      1
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="font-semibold">$100,000</span>
                      <span className="text-accent font-medium">First milestone</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div className="bg-accent h-2.5 rounded-full w-[45%]"></div>
                  </div>
                  <p className="text-xs text-gray-500">45% complete - Growing steadily!</p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="relative">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold text-sm mr-3">
                      2
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="font-semibold">$500,000</span>
                      <span className="text-gray-500 font-medium">Initial growth target</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div className="bg-gray-400 h-2.5 rounded-full w-[10%]"></div>
                  </div>
                  <p className="text-xs text-gray-500">10% complete - Building momentum</p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="relative">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold text-sm mr-3">
                      3
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="font-semibold">$1,000,000</span>
                      <span className="text-gray-500 font-medium">Community establishment</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div className="bg-gray-400 h-2.5 rounded-full w-[5%]"></div>
                  </div>
                  <p className="text-xs text-gray-500">5% complete - On the horizon</p>
                </motion.div>
                
                <motion.div variants={itemVariants} className="relative">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold text-sm mr-3">
                      4
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="font-semibold">$5,000,000</span>
                      <span className="text-gray-500 font-medium">Expansion milestone</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div className="bg-gray-300 h-2.5 rounded-full w-[1%]"></div>
                  </div>
                  <p className="text-xs text-gray-500">Getting started</p>
                </motion.div>
              </div>
              
              <motion.div 
                variants={itemVariants}
                className="mt-8 p-4 bg-secondary/10 rounded-lg border border-secondary/20"
              >
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-secondary mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-sm">
                    <span className="font-semibold">Each milestone unlocks new features</span> for the community, including enhanced platform capabilities, additional reward mechanisms, and expanded governance rights.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TokenomicsSection;
