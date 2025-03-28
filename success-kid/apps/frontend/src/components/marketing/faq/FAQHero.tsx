'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FAQ } from './useFaqData';

// Predefined positions for background elements to avoid hydration issues
const BUBBLE_CONFIG = [
  { top: '10%', left: '15%', size: 80, delay: 0 },
  { top: '25%', left: '75%', size: 110, delay: 1 },
  { top: '60%', left: '30%', size: 70, delay: 2 },
  { top: '75%', left: '85%', size: 90, delay: 0.5 },
  { top: '40%', left: '60%', size: 120, delay: 1.5 },
  { top: '15%', left: '45%', size: 65, delay: 2.5 },
  { top: '85%', left: '25%', size: 85, delay: 3 },
  { top: '50%', left: '5%', size: 95, delay: 3.5 },
];

interface BackgroundAnimationProps {
  reducedMotion: boolean;
}

// Enhanced background animation with deterministic values
const BackgroundAnimation = ({ reducedMotion }: BackgroundAnimationProps) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Don't render on server or if reduced motion is preferred
  if (!isMounted || reducedMotion) return null;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {BUBBLE_CONFIG.map((bubble, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-br from-primary-50 to-primary-100"
          style={{
            width: bubble.size,
            height: bubble.size,
            top: bubble.top,
            left: bubble.left,
            opacity: 0.4,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            y: { duration: 5 + (i % 3), repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 4 + (i % 2), repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            delay: bubble.delay,
          }}
        />
      ))}
    </div>
  );
};

interface SearchBoxProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  onClear: () => void;
}

// Enhanced search box component - removed search history
const SearchBox = ({ value, onChange, placeholder, onClear }: SearchBoxProps) => {
  const [isFocused, setIsFocused] = useState(false);

  // Handle input focus state
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="relative mb-6">
      <motion.div 
        className="relative"
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-5 py-4 text-lg rounded-full border transition-all duration-200 ${
            isFocused 
              ? 'border-primary bg-white shadow-lg' 
              : 'border-gray-200 bg-white/90 shadow-md'
          } focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pl-5 pr-12`}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        
        {value ? (
          <button
            onClick={onClear}
            className="absolute right-14 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
        
        <motion.div 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          animate={isFocused ? { scale: 1.1, color: '#1E88E5' } : { scale: 1, color: '#9CA3AF' }}
          transition={{ duration: 0.2 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Helper component for highlighted text using React components
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

interface QuickAnswersProps {
  searchQuery: string;
  popularQuestions: FAQ[];
  onQuestionSelect: (questionId: string) => void;
}

// Enhanced Quick Answers component with improved animations and styling
const QuickAnswers = ({ searchQuery, popularQuestions, onQuestionSelect }: QuickAnswersProps) => {
  // Use useMemo instead of useState + useEffect to prevent infinite updates
  const filteredQuestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) {
      return [];
    }
    
    // First try exact matches
    const query = searchQuery.toLowerCase();
    let matches = popularQuestions.filter(q => 
      q.question.toLowerCase().includes(query) || 
      q.tags?.some(tag => tag.toLowerCase().includes(query))
    );
    
    // If no matches, try keyword matching
    if (matches.length === 0) {
      const terms = query.split(' ').filter(t => t.length > 2);
      matches = popularQuestions.filter(q => 
        terms.some(term => q.question.toLowerCase().includes(term)) || 
        terms.some(term => q.tags?.some(tag => tag.includes(term)))
      );
    }
    
    // Sort by relevance (question matches first, then tag matches)
    matches.sort((a, b) => {
      const aInQuestion = a.question.toLowerCase().includes(query) ? 2 : 0;
      const bInQuestion = b.question.toLowerCase().includes(query) ? 2 : 0;
      const aInTags = a.tags?.some(tag => tag.includes(query)) ? 1 : 0;
      const bInTags = b.tags?.some(tag => tag.includes(query)) ? 1 : 0;
      
      return (bInQuestion + bInTags) - (aInQuestion + aInTags);
    });
    
    return matches.slice(0, 3);
  }, [searchQuery, popularQuestions]);
  
  if (filteredQuestions.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg border border-primary-100 mb-6 overflow-hidden"
    >
      <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center">
          <motion.span 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 5 
            }}
            className="text-primary mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </motion.span>
          <span className="text-sm font-medium text-gray-700">Quick Answers</span>
        </div>
      </div>
      <div>
        {filteredQuestions.map((question, index) => (
          <motion.button
            key={question.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: index * 0.1 } 
            }}
            whileHover={{ 
              backgroundColor: 'rgba(240, 249, 255, 0.5)', 
              scale: 1.005 
            }}
            className="w-full text-left p-4 hover:bg-blue-50/20 focus:outline-none focus:bg-blue-50/20 border-b border-gray-100 last:border-b-0 transition-all duration-200"
            onClick={() => onQuestionSelect(question.id)}
          >
            <div className="font-medium text-gray-900">
              <HighlightedText text={question.question} searchQuery={searchQuery} />
            </div>
            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
              <HighlightedText text={question.answer} searchQuery={searchQuery} />
            </div>
            
            <div className="flex items-center mt-2 text-primary text-xs font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Click to view answer
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

interface FAQHeroProps {
  onSearch: (query: string) => void;
  onCategorySelect: (categoryId: string) => void;
  searchHistory: string[];
  addToSearchHistory: (query: string) => void;
  popularQuestions: FAQ[];
  categories: { id: string; name: string; icon: string }[];
  reducedMotion: boolean;
  onQuickAnswerSelect?: (questionId: string) => void;
}

export const FAQHero = ({ 
  onSearch, 
  onCategorySelect, 
  searchHistory, 
  addToSearchHistory,
  popularQuestions,
  categories,
  reducedMotion,
  onQuickAnswerSelect
}: FAQHeroProps) => {
  const [query, setQuery] = useState('');
  
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  }, [onSearch]);
  
  const handleClearSearch = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);
  
  // Enhanced question selection that directly uses the external handler
  const handleQuestionSelect = useCallback((questionId: string) => {
    // If external handler is provided, use it (for direct scrolling to answer)
    if (onQuickAnswerSelect) {
      onQuickAnswerSelect(questionId);
      return;
    }
    
    // Otherwise fallback to original behavior
    const question = popularQuestions.find(q => q.id === questionId);
    if (question) {
      addToSearchHistory(question.question);
      onSearch(question.question);
    }
  }, [popularQuestions, addToSearchHistory, onSearch, onQuickAnswerSelect]);
  
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-primary-50 via-primary-50/40 to-white">
      {/* Animated background elements */}
      <BackgroundAnimation reducedMotion={reducedMotion} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Title and description */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            How Can We Help?
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-700 mb-10"
          >
            Find answers to common questions about the Success Kid platform
          </motion.p>
          
          {/* Search box with real-time filtering */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <SearchBox 
              value={query}
              onChange={handleSearch}
              placeholder="Search for answers..."
              onClear={handleClearSearch}
            />
          </motion.div>
          
          {/* Quick Answers section shown based on query */}
          <QuickAnswers 
            searchQuery={query}
            popularQuestions={popularQuestions}
            onQuestionSelect={handleQuestionSelect}
          />
        </div>
      </div>
    </section>
  );
};
