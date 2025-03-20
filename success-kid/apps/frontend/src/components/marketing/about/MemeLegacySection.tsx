'use client';

import { motion } from 'framer-motion';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { GradientBorder } from '@/components/ui/gradient-border';

const MemeLegacySection = () => {
  return (
    <div className="py-16 relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10%] bg-gradient-radial from-sky-50/20 to-transparent opacity-70"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
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
            <motion.div 
              className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-300 via-blue-400 to-primary-300 transform md:translate-x-[-50%]"
              animate={{
                backgroundPosition: ['0% 0%', '0% 100%', '0% 0%'],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear"
              }}
            />
            
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
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
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
                    {/* Timeline marker with glow effect */}
                    <GlowingEffect color="primary" size="sm" className="absolute left-0 md:left-[-8px] top-6 z-10">
                      <div className="w-4 h-4 rounded-full bg-white border-4 border-primary-500"></div>
                    </GlowingEffect>
                    
                    {/* Year label */}
                    <div className="absolute left-6 md:left-4 top-5 text-sm font-bold text-primary-600">2007</div>
                    
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
                        <div className="bg-gradient-to-br from-gray-100 to-blue-50 rounded-lg h-48 w-full max-w-xs flex items-center justify-center text-6xl relative">
                          <div className="absolute inset-0 bg-grid-pattern opacity-10 rounded-lg"></div>
                          👶
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
                        y: -5,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <GradientBorder
                        gradientFrom="from-amber-400" 
                        gradientTo="to-yellow-300"
                        borderWidth={1}
                        animate={false}
                        className="overflow-hidden"
                      >
                        <div className="bg-white p-4 rounded-lg max-w-xs">
                          <div className="text-4xl mb-2">🌟</div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">2010: Rise to Fame</h3>
                          <p className="text-sm text-gray-700">
                            The image went viral on social media as "Success Kid," becoming a symbol of achievement, victory, and overcoming challenges.
                          </p>
                        </div>
                      </GradientBorder>
                    </motion.div>
                  </div>
                  
                  <div className="md:w-1/2 md:pr-8 md:order-1 relative">
                    {/* Timeline marker with glow effect */}
                    <GlowingEffect color="primary" size="sm" className="absolute left-0 md:right-[-8px] top-6 z-10">
                      <div className="w-4 h-4 rounded-full bg-white border-4 border-primary-500"></div>
                    </GlowingEffect>
                    
                    {/* Year label */}
                    <div className="absolute left-6 md:right-4 top-5 text-sm font-bold text-primary-600">2010</div>
                    
                    {/* Image */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ scale: 1.05 }}
                      className="ml-8 md:ml-0 md:text-right"
                    >
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-lg blur opacity-30"></div>
                        <div className="bg-gradient-to-br from-gray-100 to-amber-50 rounded-lg h-48 w-full max-w-xs ml-auto flex items-center justify-center text-6xl relative">
                          <div className="absolute inset-0 bg-grid-pattern opacity-10 rounded-lg"></div>
                          <motion.div
                            animate={{
                              rotate: [0, 5, 0, -5, 0],
                              scale: [1, 1.05, 1, 1.05, 1]
                            }}
                            transition={{
                              duration: 5,
                              repeat: Infinity,
                              repeatType: "loop"
                            }}
                          >
                            👊
                          </motion.div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 mr-2">The iconic fist pump</div>
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
                        y: -5,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <GradientBorder
                        gradientFrom="from-purple-400" 
                        gradientTo="to-indigo-300"
                        borderWidth={1}
                        animate={false}
                        className="overflow-hidden"
                      >
                        <div className="bg-white p-4 rounded-lg max-w-xs">
                          <div className="text-4xl mb-2">🌐</div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">2013-2019: Peak Cultural Impact</h3>
                          <p className="text-sm text-gray-700">
                            Success Kid appeared in major advertising campaigns, helped raise money for medical treatments, and became one of the most recognizable memes worldwide.
                          </p>
                        </div>
                      </GradientBorder>
                    </motion.div>
                  </div>
                  
                  <div className="md:w-1/2 md:pl-8 relative">
                    {/* Timeline marker with glow effect */}
                    <GlowingEffect color="primary" size="sm" className="absolute left-0 md:left-[-8px] top-6 z-10">
                      <div className="w-4 h-4 rounded-full bg-white border-4 border-primary-500"></div>
                    </GlowingEffect>
                    
                    {/* Year label */}
                    <div className="absolute left-6 md:left-4 top-5 text-sm font-bold text-primary-600">2013-2019</div>
                    
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
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-400 to-indigo-300 rounded-lg blur opacity-30"></div>
                        <div className="bg-gradient-to-br from-gray-100 to-purple-50 rounded-lg h-48 w-full max-w-xs flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-grid-pattern opacity-10 rounded-lg"></div>
                          <div className="grid grid-cols-3 gap-3">
                            {['🌟', '🌍', '📱', '📺', '🏆', '🤝'].map((emoji, i) => (
                              <motion.div
                                key={i}
                                animate={{
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 5, 0, -5, 0],
                                }}
                                transition={{
                                  duration: 5,
                                  delay: i * 0.5,
                                  repeat: Infinity,
                                  repeatType: "loop"
                                }}
                                className="text-4xl"
                              >
                                {emoji}
                              </motion.div>
                            ))}
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
                        y: -5,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <GradientBorder
                        gradientFrom="from-primary-500" 
                        gradientTo="to-blue-400"
                        borderWidth={1}
                        animate={true}
                        className="overflow-hidden"
                      >
                        <div className="bg-white p-4 rounded-lg max-w-xs backdrop-blur-sm">
                          <div className="text-4xl mb-2">🚀</div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">2025: Web3 Renaissance</h3>
                          <p className="text-sm text-gray-700">
                            Success Kid evolves for a new era with the launch of the Success Kid Community Platform, transforming the spirit of achievement into a vibrant digital ecosystem that rewards positive engagement.
                          </p>
                        </div>
                      </GradientBorder>
                    </motion.div>
                  </div>
                  
                  <div className="md:w-1/2 md:pr-8 md:order-1 relative">
                    {/* Timeline marker with glow effect */}
                    <GlowingEffect color="primary" size="sm" className="absolute left-0 md:right-[-8px] top-6 z-10">
                      <div className="w-4 h-4 rounded-full bg-white border-4 border-primary-500"></div>
                    </GlowingEffect>
                    
                    {/* Year label with current indicator */}
                    <div className="absolute left-6 md:right-4 top-5">
                      <motion.div
                        className="text-sm font-bold px-2 py-0.5 rounded-full bg-primary-500 text-white"
                        animate={{
                          boxShadow: [
                            '0 0 0 rgba(30, 136, 229, 0.4)',
                            '0 0 10px rgba(30, 136, 229, 0.7)',
                            '0 0 0 rgba(30, 136, 229, 0.4)'
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "loop"
                        }}
                      >
                        2025
                      </motion.div>
                    </div>
                    
                    {/* Image */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ scale: 1.05 }}
                      className="ml-8 md:ml-0 md:text-right"
                    >
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-primary-400 to-blue-400 rounded-lg blur opacity-40"></div>
                        <div className="bg-gradient-to-br from-gray-100 to-primary-50 rounded-lg h-48 w-full max-w-xs ml-auto flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-grid-pattern opacity-10 rounded-lg"></div>
                          <div className="relative h-32 w-32">
                            <GlowingEffect color="primary" size="lg" intensity="strong" className="absolute inset-0">
                              <div className="flex items-center justify-center text-6xl">
                                👊
                              </div>
                            </GlowingEffect>
                            
                            {/* Orbit elements */}
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md"
                                animate={{
                                  rotate: [0, 360],
                                }}
                                transition={{
                                  duration: 10 + i * 2,
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                                style={{
                                  left: '50%',
                                  top: '50%',
                                  marginLeft: '-20px',
                                  marginTop: '-20px',
                                  transformOrigin: '50% 50%',
                                  translate: `0 -${60 + i * 15}px`
                                }}
                                whileHover={{ scale: 1.2, boxShadow: '0 0 15px rgba(30, 136, 229, 0.5)' }}
                              >
                                {i === 0 ? '💰' : i === 1 ? '👥' : '⭐'}
                              </motion.div>
                            ))}
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
                    y: -5,
                    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
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
                        rotate: [0, 5, 0, -5, 0],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                      className="w-40 h-40 rounded-full bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center text-6xl"
                      whileHover={{ scale: 1.05 }}
                    >
                      👊
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
