'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { FAQ } from './useFaqData';

// Category style configurations with consistent design language
const CATEGORY_STYLES = {
  general: { 
    gradient: 'from-blue-400 to-blue-600',
    lightGradient: 'from-blue-50 to-blue-100/50',
    glow: 'rgba(59, 130, 246, 0.2)',
    icon: '📝',
    name: 'General',
  },
  'getting-started': { 
    gradient: 'from-green-400 to-emerald-600',
    lightGradient: 'from-green-50 to-emerald-100/50',
    glow: 'rgba(16, 185, 129, 0.2)',
    icon: '🚀',
    name: 'Getting Started',
  },
  points: { 
    gradient: 'from-amber-400 to-yellow-600',
    lightGradient: 'from-amber-50 to-yellow-100/50',
    glow: 'rgba(245, 158, 11, 0.2)',
    icon: '⭐',
    name: 'Success Points',
  },
  tokens: { 
    gradient: 'from-violet-400 to-purple-600',
    lightGradient: 'from-violet-50 to-purple-100/50',
    glow: 'rgba(139, 92, 246, 0.2)',
    icon: '🪙',
    name: 'SKC Tokens',
  },
  wallet: { 
    gradient: 'from-indigo-400 to-blue-600',
    lightGradient: 'from-indigo-50 to-blue-100/50',
    glow: 'rgba(79, 70, 229, 0.2)',
    icon: '💳',
    name: 'Wallet',
  },
  support: { 
    gradient: 'from-rose-400 to-red-600',
    lightGradient: 'from-rose-50 to-red-100/50',
    glow: 'rgba(225, 29, 72, 0.2)',
    icon: '🆘',
    name: 'Support',
  }
};

// Helper component for highlighted text using React components instead of dangerouslySetInnerHTML
interface HighlightedTextProps {
  text: string;
  searchQuery: string;
}

const HighlightedText = ({ text, searchQuery }: HighlightedTextProps) => {
  if (!searchQuery || searchQuery.length < 2) return <>{text}</>;
  
  // Split text by the search term
  const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? 
          <mark key={i} className="bg-yellow-100 px-1 py-0.5 rounded-sm text-gray-900 font-medium">
            {part}
          </mark> : 
          <span key={i}>{part}</span>
      )}
    </>
  );
};

interface AccordionItemProps {
  question: string;
  answer: string;
  category: string;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
  searchQuery: string;
  autoFocus?: boolean;
  isSelected?: boolean;
}

// Enhanced accordion item
const AccordionItem = ({ 
  question, 
  answer, 
  category, 
  isExpanded, 
  onToggle,
  index,
  searchQuery,
  autoFocus,
  isSelected
}: AccordionItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isInView = useInView(itemRef, { once: true, amount: 0.3 });
  
  // Auto-focus when specified (for search results or selected item)
  useEffect(() => {
    if ((autoFocus || isSelected) && isExpanded && buttonRef.current) {
      buttonRef.current.focus();
      
      // Scroll the item into view with a smooth animation
      itemRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
    }
  }, [autoFocus, isExpanded, isSelected]);
  
  // Get category style or fallback to general
  const style = CATEGORY_STYLES[category as keyof typeof CATEGORY_STYLES] || CATEGORY_STYLES.general;
  
  // Animation variants for fluid transitions
  const containerVariants = {
    collapsed: { 
      borderColor: 'rgba(229, 231, 235, 1)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    expanded: {
      borderColor: 'rgba(59, 130, 246, 0.6)',
      boxShadow: `0 10px 25px -5px ${style.glow}, 0 8px 10px -6px ${style.glow}`
    },
    hover: {
      borderColor: 'rgba(59, 130, 246, 0.4)',
      boxShadow: `0 4px 12px -2px ${style.glow}, 0 2px 6px -2px ${style.glow}`,
      y: -2
    },
    selected: {
      borderColor: 'rgba(59, 130, 246, 0.8)',
      boxShadow: `0 12px 28px -6px ${style.glow}, 0 10px 12px -8px ${style.glow}`,
      y: -2
    }
  };

  // Entry animation for staggered appearance
  const entryVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.05 * index,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };
  
  return (
    <motion.div
      id={`faq-item-${index}`}
      ref={itemRef}
      variants={entryVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={`overflow-hidden ${isSelected ? 'ring-2 ring-primary-300 ring-offset-4 z-10 relative' : ''}`}
    >
      <motion.div
        className="rounded-xl border-2 overflow-hidden bg-white transition-all"
        variants={containerVariants}
        initial="collapsed"
        animate={isExpanded ? "expanded" : isSelected ? "selected" : "collapsed"}
        whileHover={!isExpanded && !isSelected ? "hover" : undefined}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
      >
        <button
          ref={buttonRef}
          className={`w-full text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/40 focus:ring-offset-white rounded-lg overflow-hidden`}
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <div className={`flex items-start justify-between p-5 ${
            isExpanded ? `bg-gradient-to-r ${style.lightGradient}` : ""
          }`}>
            <div className="flex-1 pr-4">
              <div className="flex items-center mb-1.5">
                <span className={`inline-block text-sm mr-2 px-2.5 py-1 rounded-full bg-gradient-to-r ${style.gradient} text-white font-medium shadow-sm`}>
                  {style.icon} {style.name}
                </span>
                
                {isSelected && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    Quick Answer
                  </span>
                )}
              </div>
              <h3 className={`text-lg font-medium ${isExpanded ? "text-gray-900" : "text-gray-700"}`}>
                <HighlightedText text={question} searchQuery={searchQuery} />
              </h3>
            </div>
            
            <div className="flex-shrink-0 mt-1">
              <motion.div 
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isExpanded 
                    ? `bg-gradient-to-r ${style.gradient} text-white shadow-sm` 
                    : 'bg-gray-100 text-gray-500'
                }`}
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </div>
          </div>
        </button>
        
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: "auto", 
                opacity: 1,
                transition: {
                  height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
                  opacity: { duration: 0.25, delay: 0.1 }
                }
              }}
              exit={{ 
                height: 0, 
                opacity: 0,
                transition: {
                  height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                  opacity: { duration: 0.15 }
                } 
              }}
              className="overflow-hidden"
            >
              <motion.div 
                className={`px-5 pt-1 pb-6 leading-relaxed`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.15 }}
              >
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <div className="prose prose-sm max-w-none prose-p:text-gray-800 prose-headings:text-gray-900 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:text-gray-800">
                    <HighlightedText text={answer} searchQuery={searchQuery} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

interface NoResultsFoundProps {
  searchQuery: string;
}

// Enhanced "No Results" component
const NoResultsFound = ({ searchQuery }: NoResultsFoundProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-12 px-6 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 shadow-sm text-center"
    >
      <div className="max-w-md mx-auto">
        <motion.div 
          className="inline-block text-6xl mb-4"
          animate={{ 
            rotate: [0, -10, 10, 0], 
            scale: [1, 1.1, 0.9, 1] 
          }}
          transition={{ 
            rotate: { repeat: Infinity, repeatDelay: 3, duration: 1 },
            scale: { repeat: Infinity, repeatDelay: 3, duration: 1 }
          }}
        >
          🔍
        </motion.div>
        <h3 className="text-xl font-semibold mb-3 text-gray-800">No results found</h3>
        <p className="text-gray-600 mb-5">
          We couldn't find any FAQ matches for <span className="font-semibold text-primary">"{searchQuery}"</span>
        </p>
        <div className="space-y-3">
          <p className="text-gray-600">Try:</p>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>• Using different keywords or shorter phrases</li>
            <li>• Checking for typos or misspellings</li>
            <li>• Browsing by category instead</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

// Search match visualization component
const SearchMatchVisualizer = ({ count }: { count: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-primary-50 to-white rounded-lg p-4 mb-6 border border-primary-100 shadow-sm"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
        <div>
          <p className="text-gray-700">
            <span className="font-semibold">{count}</span> {count === 1 ? 'result' : 'results'} found for your search.
            {count > 0 && <span className="ml-1 italic text-gray-500 text-sm">We've automatically opened the most relevant match.</span>}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

interface FAQAccordionProps {
  items: FAQ[];
  searchQuery: string;
  activeCategory: string;
  trackQuestionView: (questionId: string, questionText: string) => void;
  selectedQuestionId?: string | null;
}

export const FAQAccordion = ({ 
  items, 
  searchQuery, 
  activeCategory,
  trackQuestionView,
  selectedQuestionId
}: FAQAccordionProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchMessage, setShowSearchMessage] = useState(false);
  const prevSearchQueryRef = useRef(searchQuery);
  const prevActiveCategoryRef = useRef(activeCategory);
  const prevSelectedIdRef = useRef(selectedQuestionId);
  
  // Find index of selected question if any
  const selectedIndex = useMemo(() => {
    if (!selectedQuestionId) return null;
    
    const index = items.findIndex(item => item.id === selectedQuestionId);
    return index >= 0 ? index : null;
  }, [items, selectedQuestionId]);
  
  // Update expanded index when selected question changes (but avoid resetting it)
  useEffect(() => {
    // Only respond to actual changes in selectedQuestionId
    if (selectedQuestionId !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedQuestionId;
      
      if (selectedIndex !== null) {
        // Always expand the selected question
        setExpandedIndex(selectedIndex);
        
        // Track view of selected question
        const selectedItem = items[selectedIndex];
        if (selectedItem) {
          trackQuestionView(selectedItem.id, selectedItem.question);
        }
      }
    }
  }, [selectedIndex, items, trackQuestionView, selectedQuestionId]);
  
  // Handle search changes
  useEffect(() => {
    // Check if search query or category changed
    const searchChanged = prevSearchQueryRef.current !== searchQuery;
    const categoryChanged = prevActiveCategoryRef.current !== activeCategory;
    
    // Update the refs
    prevSearchQueryRef.current = searchQuery;
    prevActiveCategoryRef.current = activeCategory;
    
    // If we're starting or changing a search
    if (searchQuery && searchQuery.length >= 2) {
      setIsSearching(true);
      
      if (items.length > 0 && !selectedQuestionId) {
        // Only update expanded state when search changes and no specific question is selected
        if (searchChanged) {
          setExpandedIndex(0);
          trackQuestionView(items[0].id, items[0].question);
        }
        setShowSearchMessage(true);
      } else {
        setShowSearchMessage(false);
      }
    } else {
      setIsSearching(false);
      setShowSearchMessage(false);
      
      // Only reset expanded index when category changes (not during search)
      // And no specific question is selected
      if (categoryChanged && !searchQuery && !selectedQuestionId) {
        setExpandedIndex(null);
      }
    }
  }, [searchQuery, activeCategory, items, trackQuestionView, selectedQuestionId]);
  
  // The toggle function now properly handles selected items too
  const toggleItem = useCallback((index: number) => {
    if (index === expandedIndex) {
      // If clicking an already expanded item, always collapse it
      setExpandedIndex(null);
      // Clear selected question if this was selected via quick search
      if (selectedQuestionId && items[index]?.id === selectedQuestionId) {
        prevSelectedIdRef.current = null;
      }
    } else {
      // Otherwise expand the clicked item and track the view
      setExpandedIndex(index);
      trackQuestionView(items[index].id, items[index].question);
    }
  }, [expandedIndex, items, trackQuestionView, selectedQuestionId]);
  
  // Container animation variants for the list
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  return (
    <>
      {/* Show search match message when appropriate */}
      {showSearchMessage && (
        <SearchMatchVisualizer count={items.length} />
      )}
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {items.map((item, index) => (
          <AccordionItem
            key={item.id}
            question={item.question}
            answer={item.answer}
            category={item.category}
            isExpanded={index === expandedIndex}
            onToggle={() => toggleItem(index)}
            index={index}
            searchQuery={searchQuery}
            // Auto-focus the first result when searching
            autoFocus={isSearching && index === 0 && index === expandedIndex && !selectedQuestionId}
            // Highlight selected item from Quick Answers
            isSelected={selectedQuestionId === item.id}
          />
        ))}
        
        {items.length === 0 && searchQuery && (
          <NoResultsFound searchQuery={searchQuery} />
        )}
      </motion.div>
    </>
  );
};
