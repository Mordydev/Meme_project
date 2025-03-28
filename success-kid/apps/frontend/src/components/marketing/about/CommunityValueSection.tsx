'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { GradientBorder } from '@/components/ui/gradient-border';
import { ParticleEffect } from '@/components/ui/particle-effect';

const CommunityValueSection = () => {
  const [activeValue, setActiveValue] = useState(0);
  
  // Shared transition configurations for consistency
  const smoothTransition = {
    type: 'spring',
    stiffness: 200,
    damping: 30,
    mass: 0.8
  };
  
  const hoverTransition = {
    duration: 0.8,
    ease: "easeInOut"
  };
  
  // Core values and needs fulfilled
  const communityValues = [
    {
      title: "Collective Achievement",
      icon: "🏆",
      color: "blue",
      gradientFrom: "from-blue-500",
      gradientTo: "to-cyan-400",
      description: "The community amplifies individual success through shared knowledge, support, and resources.",
      details: [
        "Knowledge-sharing accelerates learning and growth",
        "Collective problem-solving produces better solutions",
        "Network effects multiply individual contributions",
        "Shared resources reduce individual barriers to entry"
      ],
      quote: {
        text: "Alone we can do so little; together we can do so much.",
        author: "Helen Keller"
      }
    },
    {
      title: "Aligned Incentives",
      icon: "⚖️",
      color: "green",
      gradientFrom: "from-green-500",
      gradientTo: "to-emerald-400",
      description: "Our dual-token model ensures that community contribution and platform value grow together.",
      details: [
        "Success Points reward meaningful engagement",
        "Token value increases with community growth",
        "Rewards proportional to value contribution",
        "Long-term holders and active participants both benefit"
      ],
      quote: {
        text: "The best way to predict the future is to create it.",
        author: "Peter Drucker"
      }
    },
    {
      title: "Accessible Innovation",
      icon: "🔑",
      color: "purple",
      gradientFrom: "from-purple-500",
      gradientTo: "to-indigo-400",
      description: "We remove traditional barriers to crypto participation, making Web3 accessible to everyone.",
      details: [
        "No technical knowledge required to start",
        "Progressive learning path for crypto concepts",
        "Inclusive design accommodates all experience levels",
        "Clear explanations without intimidating jargon"
      ],
      quote: {
        text: "Innovation is the ability to see change as an opportunity, not a threat.",
        author: "Steve Jobs"
      }
    },
    {
      title: "Authentic Connection",
      icon: "🤝",
      color: "amber",
      gradientFrom: "from-amber-500",
      gradientTo: "to-yellow-400",
      description: "Beyond transactions, we build meaningful human connections through shared values and goals.",
      details: [
        "Genuine engagement over shallow interactions",
        "Common purpose creates deeper connections",
        "Recognition and celebration of achievements",
        "Diversity of perspectives enriches the community"
      ],
      quote: {
        text: "The quality of your life is determined by the quality of your relationships.",
        author: "Anthony Robbins"
      }
    }
  ];
  
  // Needs fulfilled in the crypto/social space
  const needsFulfilled = [
    {
      need: "Utility Behind Memes",
      icon: "🚀",
      color: "blue",
      problem: "Most meme coins lack substantive utility or purpose",
      solution: "Success Kid builds a functioning economy around genuine community engagement"
    },
    {
      need: "Knowledge Accessibility",
      icon: "🧠",
      color: "purple",
      problem: "Crypto knowledge remains siloed and technical",
      solution: "Progressive disclosure makes concepts accessible to newcomers while depth is available for experts"
    },
    {
      need: "Aligned Incentives",
      icon: "⚖️",
      color: "green",
      problem: "Social platforms monetize user data without sharing value",
      solution: "Direct rewards for community contributions create fair value distribution"
    },
    {
      need: "Sustainable Growth",
      icon: "📈",
      color: "amber",
      problem: "Meme coins often experience boom-bust cycles",
      solution: "Dual-token economy creates stable growth tied to genuine activity and value creation"
    }
  ];
  
  return (
    <div className="py-16 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Enhanced Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10%] bg-gradient-radial from-indigo-50/20 to-transparent opacity-70"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {/* Subtle radial gradient background */}
        <motion.div 
          className="absolute inset-0 opacity-10" 
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(79,70,229,0.6) 0%, transparent 70%), radial-gradient(circle at 70% 70%, rgba(37,99,235,0.6) 0%, transparent 70%)'
          }}
          animate={{
            opacity: [0.06, 0.1, 0.06],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
        
        {/* Subtle dot pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: 'radial-gradient(rgba(30,136,229,0.4) 1px, transparent 1px), radial-gradient(rgba(30,136,229,0.4) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px'
          }}
        />
        
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "loop"
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
              Why This Community Matters
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-gray-700"
            >
              The Success Kid Community fills critical gaps in both the social and crypto landscapes, creating unique value for members.
            </motion.p>
          </div>
          
          {/* Core Values Tabs */}
          <div className="mb-20">
            <div className="flex flex-wrap justify-center mb-8">
              {communityValues.map((value, index) => (
                <motion.button
                  key={index}
                  className={`relative m-2 px-5 py-2.5 rounded-full flex items-center ${
                    activeValue === index
                      ? `bg-gradient-to-r ${value.gradientFrom} ${value.gradientTo} text-white shadow-lg`
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm'
                  }`}
                  onClick={() => setActiveValue(index)}
                  whileHover={{ 
                    scale: 1.03,
                    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)'
                  }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 260, 
                    damping: 20 
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  {activeValue === index && (
                    <motion.span
                      className="absolute inset-0 rounded-full opacity-50"
                      animate={{
                        boxShadow: [
                          `0 0 0 rgba(${value.color === 'blue' ? '30, 136, 229' : value.color === 'green' ? '34, 197, 94' : value.color === 'purple' ? '147, 51, 234' : '245, 158, 11'}, 0.4)`,
                          `0 0 20px rgba(${value.color === 'blue' ? '30, 136, 229' : value.color === 'green' ? '34, 197, 94' : value.color === 'purple' ? '147, 51, 234' : '245, 158, 11'}, 0.6)`,
                          `0 0 0 rgba(${value.color === 'blue' ? '30, 136, 229' : value.color === 'green' ? '34, 197, 94' : value.color === 'purple' ? '147, 51, 234' : '245, 158, 11'}, 0.4)`,
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                    />
                  )}
                  <span className="mr-2.5 text-xl">{value.icon}</span>
                  <span className="font-medium">{value.title}</span>
                </motion.button>
              ))}
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeValue}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <GradientBorder
                  gradientFrom={communityValues[activeValue].gradientFrom}
                  gradientTo={communityValues[activeValue].gradientTo}
                  borderWidth={2}
                  animate={true}
                  className="rounded-xl overflow-hidden"
                >
                  <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl relative">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5 rounded-xl"></div>
                    
                    <div className="flex items-start mb-8">
                      <div className="md:w-1/3 mb-6 md:mb-0 md:pr-6 flex justify-center">
                        <GlowingEffect color="primary" size="lg" pulseEffect={true} intensity="medium">
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
                            whileHover={{ 
                              scale: 1.03,
                              boxShadow: '0 0 20px rgba(30, 136, 229, 0.3)'
                            }}
                            transition={{
                              scale: { type: 'spring', stiffness: 300, damping: 15 },
                              boxShadow: { duration: 0.3 }
                            }}
                          >
                            {/* Enhanced hover animation gradient overlay with smoother transition */}
                            <motion.div 
                              className="absolute inset-0 bg-gradient-to-br from-primary-100/30 to-blue-100/30 opacity-0"
                              whileHover={{ opacity: 0.4 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
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
                                  scale: [1, 1.04, 1],
                                  rotateZ: [0, 1.5, 0, -1.5, 0]
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
                      
                      <div>
                        <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent" 
                          style={{
                            backgroundImage: `linear-gradient(to right, ${communityValues[activeValue].gradientFrom.replace('from-', '')}, ${communityValues[activeValue].gradientTo.replace('to-', '')})`
                          }}
                        >
                          {communityValues[activeValue].title}
                        </h3>
                        <p className="text-lg text-gray-700">
                          {communityValues[activeValue].description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pl-20">
                      <ul className="space-y-2 mb-6">
                        {communityValues[activeValue].details.map((detail, index) => (
                          <motion.li
                            key={index}
                            className="flex items-start"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <svg 
                              className={`w-5 h-5 mt-0.5 mr-2 flex-shrink-0 text-${communityValues[activeValue].color}-500`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700">{detail}</span>
                          </motion.li>
                        ))}
                      </ul>
                      
                      <div 
                        className={`p-4 rounded-lg italic border-l-4`}
                        style={{
                          borderLeftColor: communityValues[activeValue].color === 'blue' ? '#1E88E5' : 
                                          communityValues[activeValue].color === 'green' ? '#22C55E' : 
                                          communityValues[activeValue].color === 'purple' ? '#9333EA' : 
                                          '#F59E0B',
                          background: communityValues[activeValue].color === 'blue' ? 'linear-gradient(to bottom right, rgba(30, 136, 229, 0.08), rgba(59, 130, 246, 0.05))' :
                                     communityValues[activeValue].color === 'green' ? 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.08), rgba(16, 185, 129, 0.05))' :
                                     communityValues[activeValue].color === 'purple' ? 'linear-gradient(to bottom right, rgba(147, 51, 234, 0.08), rgba(79, 70, 229, 0.05))' :
                                     'linear-gradient(to bottom right, rgba(245, 158, 11, 0.08), rgba(252, 211, 77, 0.05))'
                        }}
                      >
                        <p className="text-gray-700 mb-2">"{communityValues[activeValue].quote.text}"</p>
                        <p className="text-right text-sm text-gray-500">— {communityValues[activeValue].quote.author}</p>
                      </div>
                    </div>
                  </div>
                </GradientBorder>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Needs We're Filling */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-600">
              Filling Critical Gaps
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {needsFulfilled.map((item, index) => {
                const colorClass = item.color === 'blue' ? 'primary' : 
                                  item.color === 'green' ? 'green' : 
                                  item.color === 'purple' ? 'purple' : 
                                  'amber';
                                  
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative group cursor-pointer"
                  >
                    <div className="absolute -inset-0.5 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-all duration-500"
                      style={{
                        background: `linear-gradient(to bottom right, 
                          ${colorClass === 'primary' ? '#1E88E5' : 
                            colorClass === 'green' ? '#22C55E' : 
                            colorClass === 'purple' ? '#9333EA' : 
                            '#F59E0B'}, 
                          ${colorClass === 'primary' ? '#64B5F6' : 
                            colorClass === 'green' ? '#6EE7B7' : 
                            colorClass === 'purple' ? '#C4B5FD' : 
                            '#FCD34D'})
                        `
                      }}
                    ></div>
                    
                    <motion.div 
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative h-full"
                      whileHover={{ 
                        y: -5,
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 200, 
                        damping: 30,
                        mass: 0.8
                      }}
                    >
                      <ParticleEffect
                        count={8}
                        color={colorClass === 'primary' ? 'primary' : colorClass}
                        trigger="hover"
                        className="absolute inset-0 pointer-events-none"
                      />
                      
                      <div className="p-4 border-b"
                        style={{
                          background: `linear-gradient(to right, 
                            ${colorClass === 'primary' ? 'rgba(30, 136, 229, 0.1)' : 
                              colorClass === 'green' ? 'rgba(34, 197, 94, 0.1)' : 
                              colorClass === 'purple' ? 'rgba(147, 51, 234, 0.1)' : 
                              'rgba(245, 158, 11, 0.1)'}, 
                            ${colorClass === 'primary' ? 'rgba(100, 181, 246, 0.05)' : 
                              colorClass === 'green' ? 'rgba(110, 231, 183, 0.05)' : 
                              colorClass === 'purple' ? 'rgba(196, 181, 253, 0.05)' : 
                              'rgba(252, 211, 77, 0.05)'})
                          `,
                          borderColor: colorClass === 'primary' ? '#90CAF9' : 
                                       colorClass === 'green' ? '#A7F3D0' : 
                                       colorClass === 'purple' ? '#C4B5FD' : 
                                       '#FDE68A'
                        }}
                      >
                        <h4 className="font-bold text-gray-900 flex items-center">
                          <span 
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${colorClass === 'primary' ? 'from-primary-500 to-blue-600' : colorClass === 'green' ? 'from-green-500 to-emerald-600' : colorClass === 'purple' ? 'from-purple-500 to-indigo-600' : 'from-amber-500 to-amber-600'} text-white flex items-center justify-center mr-3 shadow-md`}
                          >
                            {item.icon}
                          </span>
                          {item.need}
                        </h4>
                      </div>
                      
                      <div className="p-4">
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-500 mb-1">Current Problem:</div>
                          <div className="text-gray-700 pl-4 border-l-2 border-gray-300 py-1">{item.problem}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">Our Solution:</div>
                          <div className={`text-gray-700 pl-4 border-l-2 py-1 border-${colorClass === 'primary' ? 'primary' : colorClass}-400`}>{item.solution}</div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Value Proposition Statement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl blur opacity-30"></div>
              
              <div className="relative rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-blue-700">
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      background: [
                        'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
                        'linear-gradient(225deg, #1976d2 0%, #0d47a1 100%)',
                        'linear-gradient(315deg, #1e88e5 0%, #1565c0 100%)',
                        'linear-gradient(45deg, #1976d2 0%, #0d47a1 100%)',
                      ],
                    }}
                    transition={{
                      duration: 15,
                      repeat: Infinity,
                      repeatType: 'loop',
                      ease: 'linear',
                    }}
                  />
                </div>
                
                <div className="absolute inset-0 opacity-25">
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] bg-repeat mix-blend-overlay"></div>
                  <div className="h-full w-full bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                </div>
                
                <div className="relative p-8 text-white text-center">
                  <motion.h3 
                    className="text-2xl font-bold mb-4"
                    animate={{
                      textShadow: [
                        '0 0 5px rgba(255, 255, 255, 0.2)',
                        '0 0 15px rgba(255, 255, 255, 0.4)',
                        '0 0 5px rgba(255, 255, 255, 0.2)',
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                  >
                    Our Community Value Proposition
                  </motion.h3>
                  <p className="text-xl">
                    Success Kid transforms the positive energy of an iconic meme into a sustainable ecosystem where genuine engagement creates real value, meaningful connections, and accessible opportunities for everyone.
                  </p>
                  
                  <motion.div 
                    className="mt-6 flex justify-center"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: '0 3px 15px rgba(30, 136, 229, 0.3)'
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={smoothTransition}
                  >
                    <a href="/register" className="px-6 py-2.5 bg-white text-primary-600 rounded-full font-medium hover:shadow-lg transition-all duration-300">
                      Join Our Community
                    </a>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityValueSection;
