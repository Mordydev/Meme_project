'use client';

import { motion } from 'framer-motion';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { GradientBorder } from '@/components/ui/gradient-border';

const MemeLegacySection = () => {
  return (
    <div className="py-16 relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
      {/* Enhanced Background elements with subtle, professional gradients and dynamic effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Base gradient background with subtle blue tone */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/30 via-white to-blue-50/20"></div>
        
        {/* Subtle radial gradient for depth */}
        <div className="absolute -inset-[10%] bg-gradient-radial from-sky-50/30 to-transparent opacity-70"></div>
        
        {/* Gradient border at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-300/50 to-transparent"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.04]"></div>
        
        {/* Animated central glow effect */}
        <motion.div
          className="absolute inset-0 opacity-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(30,136,229,0.15) 0%, transparent 70%)'
          }}
          animate={{
            opacity: [0.04, 0.08, 0.04]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        />
        
        {/* Enhanced Timeline central rays - more subtle and professional */}
        <motion.div 
          className="absolute left-1/2 top-0 bottom-0 w-[600px] transform -translate-x-1/2 opacity-[0.03] pointer-events-none z-0" 
          style={{
            background: 'radial-gradient(ellipse at center, rgba(30,136,229,0.3) 0%, transparent 70%)',
            backgroundSize: '100% 200%'
          }}
          animate={{
            backgroundPosition: ['center top', 'center bottom'],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{
            backgroundPosition: {
              duration: 25,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear'
            },
            opacity: {
              duration: 12,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: "easeInOut"
            }
          }}
        />
        
        {/* Subtle floating particles effect */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-primary-400/20"
            style={{
              left: `${10 + (i * 5)}%`,
              top: `${10 + ((i * 7) % 80)}%`,
              boxShadow: '0 0 5px rgba(30, 136, 229, 0.3)'
            }}
            animate={{
              y: [0, -15, 0],
              x: [0, i % 2 === 0 ? 10 : -10, 0],
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 10 + (i % 5),
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Dual radial gradient effect for visual depth */}
        <motion.div 
          className="absolute left-0 right-0 top-0 bottom-0 opacity-[0.02] pointer-events-none z-0" 
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(59,130,246,0.4) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(30,136,229,0.4) 0%, transparent 60%)'
          }}
          animate={{
            opacity: [0.02, 0.04, 0.02],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: "easeInOut"
          }}
        />
        
        {/* Subtle diagonal pattern */}
        <div 
          className="absolute inset-0 opacity-[0.01] pointer-events-none z-0" 
          style={{
            background: 'repeating-linear-gradient(45deg, rgba(30,136,229,0.05), rgba(30,136,229,0.05) 1px, transparent 1px, transparent 10px)'
          }}
        />
        
        {/* Dynamic light rays effect */}
        <motion.div
          className="absolute inset-0 opacity-0"
          style={{
            background: 'conic-gradient(from 180deg at 50% 50%, rgba(30,136,229,0.15) 0deg, transparent 60deg, rgba(30,136,229,0.1) 120deg, transparent 180deg, rgba(30,136,229,0.15) 240deg, transparent 300deg, rgba(30,136,229,0.05) 360deg)'
          }}
          animate={{
            opacity: [0, 0.03, 0],
            rotate: [0, 360]
          }}
          transition={{
            opacity: {
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            },
            rotate: {
              duration: 60,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-600"
            >
              From Viral Meme to Vibrant Community
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-gray-700"
            >
              The journey of Success Kid from a beach photograph to an iconic symbol of triumph and determination.
            </motion.p>
          </div>
          
          {/* Meme Timeline */}
          <div className="relative mb-20">
            {/* Vertical timeline line with animated gradient */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 transform md:-translate-x-1/2 flex justify-center w-1">
              {/* Base timeline line */}
              <div className="absolute inset-0 bg-gray-200 z-0"></div>
              
              {/* Animated gradient overlay */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-b from-primary-300 via-blue-400 to-primary-300 z-1"
                animate={{
                  backgroundPosition: ['0% 0%', '0% 100%', '0% 0%'],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  backgroundPosition: {
                    duration: 15,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "linear"
                  },
                  opacity: {
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut"
                  }
                }}
                style={{ backgroundSize: '100% 200%' }}
              />
              
              {/* Traveling pulse effect */}
              <motion.div 
                className="absolute w-3 h-12 bg-primary-500/50 blur-sm rounded-full -left-1 md:left-0 transform md:-translate-x-1/2 z-2"
                animate={{
                  top: ['-5%', '105%'],
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  top: {
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 1
                  },
                  opacity: {
                    duration: 8,
                    repeat: Infinity,
                    times: [0, 0.1, 0.9, 1],
                    ease: "easeInOut",
                    repeatDelay: 1
                  },
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }
                }}
              />
            </div>
            
            {/* Timeline Events */}
            <div className="relative">
              {/* 2007: Original Photo */}
              <div className="mb-16 md:mb-28 relative">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex md:justify-end md:w-1/2 mb-4 md:mb-0 md:pr-8">
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ 
                        y: -5,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        transition: { duration: 0.6, ease: "easeInOut" }
                      }}
                    >
                      <GradientBorder
                        gradientFrom="from-blue-400" 
                        gradientTo="to-sky-300"
                        borderWidth={1}
                        animate={false}
                        className="overflow-hidden"
                      >
                        <div className="bg-white p-4 rounded-lg max-w-xs">
                          <div className="text-4xl mb-2">📸</div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">2007: The Original Photo</h3>
                          <p className="text-sm text-gray-700">
                            The iconic image was taken on a beach in 2007 by Laney Griner of her 11-month-old son Sammy, who was playing with sand.
                          </p>
                        </div>
                      </GradientBorder>
                    </motion.div>
                  </div>
                  
                  <div className="md:w-1/2 md:pl-8 relative">
                    {/* Timeline marker with glow effect - centered on timeline */}
                    <div className="absolute left-0 md:left-0 top-6 md:transform md:translate-x-[-50%] z-10">
                      <GlowingEffect color="primary" size="sm">
                        <div className="w-4 h-4 rounded-full bg-white border-4 border-primary-500"></div>
                      </GlowingEffect>
                    </div>
                    
                    {/* Image */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ scale: 1.05 }}
                      className="ml-8 md:ml-6"
                    >
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-400 to-sky-300 rounded-lg blur opacity-30"></div>
                        <div className="bg-gradient-to-br from-gray-100 to-blue-50 rounded-lg h-48 w-full max-w-xs flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-grid-pattern opacity-10 rounded-lg"></div>
                          <img 
                            src="/images/success_kid.png" 
                            alt="Original Success Kid" 
                            className="h-40 w-auto object-contain"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-2">Original beach photo</div>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* 2010: Rise to Fame */}
              <div className="mb-16 md:mb-28 relative">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex md:justify-start md:w-1/2 md:order-2 mb-4 md:mb-0 md:pl-8">
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ 
                        y: -8,
                        boxShadow: '0 15px 30px rgba(245, 158, 11, 0.15)',
                        transition: { duration: 0.5, type: 'spring', stiffness: 300, damping: 15 }
                      }}
                    >
                      <GradientBorder
                        gradientFrom="from-amber-400" 
                        gradientTo="to-yellow-300"
                        borderWidth={1}
                        animate={true}
                        className="overflow-hidden"
                      >
                        <div className="bg-white p-4 rounded-lg max-w-xs">
                          <div className="text-4xl mb-2 relative inline-block">
                            <motion.div 
                              className="absolute -inset-1 rounded-full opacity-20 bg-amber-300" 
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.2, 0.3, 0.2]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse"
                              }}
                            />
                            <span className="relative">🌟</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">2010: Rise to Fame</h3>
                          <p className="text-sm text-gray-700">
                            The image went viral on social media as "Success Kid," becoming a symbol of achievement, victory, and overcoming challenges.
                          </p>
                        </div>
                      </GradientBorder>
                    </motion.div>
                  </div>
                  
                  <div className="md:w-1/2 md:pr-8 md:order-1 relative">
                    {/* Timeline marker with glow effect - centered on timeline */}
                    <div className="absolute left-0 md:left-full top-6 md:transform md:-translate-x-1/2 z-10">
                      <GlowingEffect color="primary" size="sm" intensity="strong" pulseEffect={true}>
                        <div className="w-4 h-4 rounded-full bg-white border-4 border-amber-500"></div>
                      </GlowingEffect>
                    </div>
                    
                    {/* Image */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: '0 15px 30px rgba(245, 158, 11, 0.15)',
                        transition: { duration: 0.5, type: 'spring', stiffness: 300, damping: 15 }
                      }}
                      className="ml-8 md:ml-0 md:text-right"
                    >
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                        <div className="bg-gradient-to-br from-gray-100 to-amber-50 rounded-lg h-56 w-full max-w-xs ml-auto flex items-center justify-center relative overflow-hidden">
                          <motion.div className="absolute inset-0 bg-grid-pattern opacity-10 rounded-lg" />
                          <motion.div 
                            className="absolute inset-0" 
                            animate={{
                              background: [
                                'radial-gradient(circle at 30% 30%, rgba(245,158,11,0.3) 0%, rgba(251,191,36,0.1) 50%, transparent 70%)',
                                'radial-gradient(circle at 70% 70%, rgba(245,158,11,0.3) 0%, rgba(251,191,36,0.1) 50%, transparent 70%)',
                                'radial-gradient(circle at 30% 30%, rgba(245,158,11,0.3) 0%, rgba(251,191,36,0.1) 50%, transparent 70%)'
                              ],
                            }}
                            transition={{
                              duration: 8,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "easeInOut"
                            }}
                          />
                          <div className="relative z-10 flex items-center justify-center h-full w-full p-4">
                            <img 
                              src="/images/2010.png" 
                              alt="2010 - Rise to Fame" 
                              className="max-h-full max-w-full object-contain rounded-md shadow-lg"
                            />
                            <motion.div
                              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-gradient-to-br from-amber-500/10 to-yellow-400/10 transition-opacity duration-300"
                              animate={{
                                boxShadow: [
                                  'inset 0 0 20px rgba(245,158,11,0)',
                                  'inset 0 0 30px rgba(245,158,11,0.2)',
                                  'inset 0 0 20px rgba(245,158,11,0)'
                                ]
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 mr-2">The meme rises to global fame</div>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* 2013-2019: Peak Cultural Impact */}
              <div className="mb-16 md:mb-28 relative">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex md:justify-end md:w-1/2 mb-4 md:mb-0 md:pr-8">
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ 
                        y: -8,
                        boxShadow: '0 15px 30px rgba(139, 92, 246, 0.15)',
                        transition: { duration: 0.5, type: 'spring', stiffness: 300, damping: 15 }
                      }}
                    >
                      <GradientBorder
                        gradientFrom="from-purple-400" 
                        gradientTo="to-indigo-300"
                        borderWidth={1}
                        animate={true}
                        className="overflow-hidden"
                      >
                        <div className="bg-white p-4 rounded-lg max-w-xs">
                          <div className="text-4xl mb-2 relative inline-block">
                            <motion.div 
                              className="absolute -inset-1 rounded-full opacity-20 bg-purple-300" 
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.2, 0.3, 0.2]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse"
                              }}
                            />
                            <span className="relative">🌐</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">2013-2019: Peak Cultural Impact</h3>
                          <p className="text-sm text-gray-700">
                            Success Kid appeared in major advertising campaigns, helped raise money for medical treatments, and became one of the most recognizable memes worldwide.
                          </p>
                        </div>
                      </GradientBorder>
                    </motion.div>
                  </div>
                  
                  <div className="md:w-1/2 md:pl-8 relative">
                    {/* Timeline marker with glow effect - centered on timeline */}
                    <div className="absolute left-0 md:left-0 top-6 md:transform md:translate-x-[-50%] z-10">
                      <GlowingEffect color="primary" size="sm" intensity="strong" pulseEffect={true}>
                        <div className="w-4 h-4 rounded-full bg-white border-4 border-purple-500"></div>
                      </GlowingEffect>
                    </div>
                    
                    {/* Image */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: '0 15px 30px rgba(139, 92, 246, 0.15)',
                        transition: { duration: 0.5, type: 'spring', stiffness: 300, damping: 15 }
                      }}
                      className="ml-8 md:ml-6"
                    >
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-purple-400 to-indigo-300 rounded-lg blur opacity-20 group-hover:opacity-35 transition-opacity duration-500"></div>
                        <div className="bg-gradient-to-br from-gray-100 to-purple-50 rounded-lg h-56 w-full max-w-xs flex items-center justify-center relative overflow-hidden">
                          <motion.div className="absolute inset-0 bg-grid-pattern opacity-10 rounded-lg" />
                          <motion.div 
                            className="absolute inset-0" 
                            animate={{
                              background: [
                                'radial-gradient(circle at 30% 30%, rgba(139,92,246,0.3) 0%, rgba(129,140,248,0.1) 50%, transparent 70%)',
                                'radial-gradient(circle at 70% 70%, rgba(139,92,246,0.3) 0%, rgba(129,140,248,0.1) 50%, transparent 70%)',
                                'radial-gradient(circle at 30% 30%, rgba(139,92,246,0.3) 0%, rgba(129,140,248,0.1) 50%, transparent 70%)'
                              ],
                            }}
                            transition={{
                              duration: 8,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "easeInOut"
                            }}
                          />
                          <div className="relative z-10 flex items-center justify-center h-full w-full p-4">
                            <img 
                              src="/images/2013-2019.png" 
                              alt="2013-2019 - Peak Cultural Impact" 
                              className="max-h-full max-w-full object-contain rounded-md shadow-lg"
                            />
                            <motion.div
                              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-gradient-to-br from-purple-500/10 to-indigo-400/10 transition-opacity duration-300"
                              animate={{
                                boxShadow: [
                                  'inset 0 0 20px rgba(139,92,246,0)',
                                  'inset 0 0 30px rgba(139,92,246,0.2)',
                                  'inset 0 0 20px rgba(139,92,246,0)'
                                ]
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-2">Global cultural phenomenon</div>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* 2025: Web3 Renaissance */}
              <div className="relative">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="flex md:justify-start md:w-1/2 md:order-2 mb-4 md:mb-0 md:pl-8">
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      whileHover={{ 
                        y: -8,
                        boxShadow: '0 15px 30px rgba(30, 136, 229, 0.15)',
                        transition: { duration: 0.5, type: 'spring', stiffness: 300, damping: 15 }
                      }}
                    >
                      <GradientBorder
                        gradientFrom="from-primary-500" 
                        gradientTo="to-blue-400"
                        borderWidth={2}
                        animate={true}
                        className="overflow-hidden"
                      >
                        <div className="bg-white p-4 rounded-lg max-w-xs backdrop-blur-sm">
                          <div className="text-4xl mb-2 relative inline-block">
                            <motion.div 
                              className="absolute -inset-1 rounded-full opacity-20 bg-primary-300" 
                              animate={{ 
                                scale: [1, 1.3, 1],
                                opacity: [0.2, 0.4, 0.2],
                                boxShadow: [
                                  '0 0 0 0 rgba(30,136,229,0)',
                                  '0 0 0 8px rgba(30,136,229,0.2)',
                                  '0 0 0 0 rgba(30,136,229,0)'
                                ]
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse"
                              }}
                            />
                            <span className="relative">🚀</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">2025: Web3 Renaissance</h3>
                          <p className="text-sm text-gray-700">
                            Success Kid evolves for a new era with the launch of the Success Kid Community Platform, transforming the spirit of achievement into a vibrant digital ecosystem that rewards positive engagement.
                          </p>
                        </div>
                      </GradientBorder>
                    </motion.div>
                  </div>
                  
                  <div className="md:w-1/2 md:pr-8 md:order-1 relative">
                    {/* Timeline marker with enhanced glow effect - centered on timeline */}
                    <div className="absolute left-0 md:left-full top-6 md:transform md:-translate-x-1/2 z-10">
                      <GlowingEffect color="primary" size="md" intensity="strong" pulseEffect={true}>
                        <div className="w-4 h-4 rounded-full bg-white border-4 border-primary-500"></div>
                      </GlowingEffect>
                    </div>
                    
                    {/* Image */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: '0 15px 30px rgba(30, 136, 229, 0.15)',
                        transition: { duration: 0.5, type: 'spring', stiffness: 300, damping: 15 }
                      }}
                      className="ml-8 md:ml-0 md:text-right"
                    >
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-primary-400 to-blue-400 rounded-lg blur opacity-15 group-hover:opacity-30 transition-opacity duration-500"></div>
                        <div className="bg-gradient-to-br from-gray-100 to-primary-50 rounded-lg h-56 w-full max-w-xs ml-auto flex items-center justify-center relative overflow-hidden">
                          <motion.div className="absolute inset-0 bg-grid-pattern opacity-10 rounded-lg" />
                          
                          {/* Enhanced gradient and light ray effects */}
                          <motion.div 
                            className="absolute inset-0" 
                            animate={{
                              background: [
                                'radial-gradient(circle at 30% 30%, rgba(30,136,229,0.3) 0%, rgba(59,130,246,0.1) 50%, transparent 70%)',
                                'radial-gradient(circle at 70% 70%, rgba(30,136,229,0.3) 0%, rgba(59,130,246,0.1) 50%, transparent 70%)',
                                'radial-gradient(circle at 30% 30%, rgba(30,136,229,0.3) 0%, rgba(59,130,246,0.1) 50%, transparent 70%)'
                              ],
                            }}
                            transition={{
                              duration: 8,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "easeInOut"
                            }}
                          />
                          
                          {/* Light rays effect */}
                          <motion.div 
                            className="absolute inset-0 opacity-10" 
                            style={{
                              background: 'radial-gradient(circle at center, rgba(30,136,229,0.8) 0%, transparent 70%)',
                              backgroundSize: '200% 200%',
                              backgroundPosition: 'center'
                            }}
                            animate={{ 
                              opacity: [0.1, 0.2, 0.1],
                              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                            }}
                            transition={{ 
                              duration: 10,
                              repeat: Infinity,
                              repeatType: "loop"
                            }}
                          />
                          
                          <div className="relative z-10 flex items-center justify-center h-full w-full p-4">
                            <img 
                              src="/images/2025.png" 
                              alt="2025 - Web3 Renaissance" 
                              className="max-h-full max-w-full object-contain rounded-md shadow-lg"
                            />
                            <motion.div
                              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-gradient-to-br from-primary-500/10 to-blue-400/10 transition-opacity duration-300"
                              animate={{
                                boxShadow: [
                                  'inset 0 0 20px rgba(30,136,229,0)',
                                  'inset 0 0 30px rgba(30,136,229,0.3)',
                                  'inset 0 0 20px rgba(30,136,229,0)'
                                ]
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 mr-2">The Web3 evolution</div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Cultural Impact */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">The Cultural Impact of Success Kid</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "🌟",
                  title: "Symbol of Achievement",
                  desc: "Success Kid became a universal symbol of triumph over obstacles, embodying the satisfaction of achievement and determination.",
                  color: "from-amber-400 to-amber-300"
                },
                {
                  icon: "💪",
                  title: "Expression of Determination",
                  desc: "The clenched fist and determined expression resonated across cultures as a universal gesture of perseverance and success.",
                  color: "from-primary-500 to-blue-400"
                },
                {
                  icon: "🌐",
                  title: "Cross-Cultural Recognition",
                  desc: "One of the few memes recognized globally, transcending language barriers and cultural differences to communicate a universal emotion.",
                  color: "from-green-500 to-emerald-400"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ 
                    y: -3,
                    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)',
                    transition: { duration: 0.3, ease: "easeInOut" }
                  }}
                  className="relative group"
                >
                  <div className={`absolute -inset-0.5 bg-gradient-to-br ${item.color} rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300`}></div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative h-full">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-700">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Meme to Platform */}
          <GradientBorder
            borderWidth={2}
            gradientFrom="from-primary-500" 
            gradientTo="to-blue-500"
            animate={true}
            className="rounded-xl overflow-hidden"
          >
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl relative">
              <div className="absolute inset-0 bg-grid-pattern opacity-5 rounded-xl"></div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-600">
                From Meme to Meaningful Community
              </h3>
              
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 mb-6 md:mb-0 md:pr-6 flex justify-center">
                  <GlowingEffect color="primary" size="lg" pulseEffect={true}>
                    <motion.div
                      animate={{
                        rotate: [0, 2, 0, -2, 0],
                      }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "easeInOut"
                      }}
                      className="w-40 h-40 rounded-full bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center text-6xl relative overflow-hidden shadow-md"
                    >
                      {/* Enhanced hover animation gradient overlay - smoother and more subtle */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-primary-100/30 to-blue-100/30 opacity-0"
                        whileHover={{ opacity: 0.5, scale: 1.05 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      <div className="relative flex items-center justify-center">
                        <motion.div 
                          className="absolute inset-0 opacity-50 blur-sm" 
                          animate={{
                            background: [
                              'radial-gradient(circle at 30% 30%, rgba(30,136,229,0.7) 0%, rgba(59,130,246,0.4) 50%, transparent 70%)',
                              'radial-gradient(circle at 70% 70%, rgba(30,136,229,0.7) 0%, rgba(59,130,246,0.4) 50%, transparent 70%)',
                              'radial-gradient(circle at 30% 30%, rgba(30,136,229,0.7) 0%, rgba(59,130,246,0.4) 50%, transparent 70%)'
                            ],
                          }}
                          transition={{
                            duration: 12,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                          }}
                        />
                        <motion.span 
                          className="relative z-10 drop-shadow-lg text-6xl"
                          animate={{
                            scale: [1, 1.05, 1],
                            rotateZ: [0, 2, 0, -2, 0]
                          }}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                          }}
                        >
                          👊
                        </motion.span>
                      </div>
                    </motion.div>
                  </GlowingEffect>
                </div>
                
                <div className="md:w-2/3 md:pl-6">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-gray-700 mb-4"
                  >
                    The Success Kid Community Platform takes the spirit embodied in this iconic meme and transforms it into something more meaningful: a vibrant ecosystem where that spirit of success and determination can flourish in a tangible way.
                  </motion.p>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-gray-700 mb-4"
                  >
                    Just as the meme captured a moment of triumph, our platform captures and rewards those moments of contribution, engagement, and community support. The fist bump that symbolized success now facilitates real achievements and rewards.
                  </motion.p>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-gray-700"
                  >
                    We're building more than just another crypto project—we're creating a community bound by the shared values of determination, achievement, and mutual support that made Success Kid resonate worldwide.
                  </motion.p>
                </div>
              </div>
            </div>
          </GradientBorder>
        </div>
      </div>
    </div>
  );
};

export default MemeLegacySection;
