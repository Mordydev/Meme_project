'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FAQ {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  faqs: FAQ[]
}

interface FAQAccordionProps {
  categories: FAQCategory[]
}

export function FAQAccordion({ categories }: FAQAccordionProps) {
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({})
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.title || '')
  
  const toggleFaq = (categoryTitle: string, questionIndex: number) => {
    const key = `${categoryTitle}-${questionIndex}`
    setOpenFaqs(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }
  
  return (
    <div className="space-y-8">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.title}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category.title
                ? 'bg-battle-yellow text-wild-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            onClick={() => setActiveCategory(category.title)}
          >
            {category.title}
          </button>
        ))}
      </div>
      
      {/* FAQ accordions */}
      <div className="space-y-4">
        {categories
          .filter(category => category.title === activeCategory)
          .map((category, categoryIndex) => (
            <div key={`category-${categoryIndex}`} className="space-y-3">
              <h3 className="text-xl font-display text-hype-white">{category.title}</h3>
              <div className="space-y-3">
                {category.faqs.map((faq, faqIndex) => {
                  const key = `${category.title}-${faqIndex}`
                  const isOpen = openFaqs[key] || false
                  
                  return (
                    <div 
                      key={key} 
                      className="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800"
                    >
                      <button
                        className="w-full px-5 py-4 text-left flex justify-between items-center"
                        onClick={() => toggleFaq(category.title, faqIndex)}
                      >
                        <span className="font-medium text-hype-white">{faq.question}</span>
                        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 12L2 6L3.4 4.6L8 9.2L12.6 4.6L14 6L8 12Z" fill="currentColor" />
                          </svg>
                        </span>
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-5 pb-4 prose prose-sm prose-invert max-w-none">
                              <p>{faq.answer}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
