'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { 
  FAQHero, 
  FAQAccordion, 
  FAQCategories,
  PointsConversionDemo,
  QuestionSubmissionForm,
  SmartCTA,
  useFaqData,
  useFaqAnalytics
} from '@/components/marketing/faq';
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference';

// SEO Component for FAQ Page
const FAQPageSEO = ({ faqs, categories }: { faqs: any[], categories: any[] }) => {
  // Generate structured data for FAQs
  const generateStructuredData = () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": typeof faq.answer === 'string' ? faq.answer : 'See our detailed answer on the website.'
        }
      }))
    };
    
    return JSON.stringify(structuredData);
  };
  
  return (
    <Head>
      <title>Frequently Asked Questions | Success Kid Community Platform</title>
      <meta name="description" content="Find answers to common questions about the Success Kid Community Platform, tokens, rewards, and more." />
      <meta name="keywords" content="Success Kid FAQ, crypto questions, tokenomics, Success Points, SKC token, rewards" />
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateStructuredData() }}
      />
    </Head>
  );
};

// Loading state component
const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div 
        className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      ></motion.div>
      <motion.p 
        className="text-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        Loading FAQ content...
      </motion.p>
    </div>
  );
};

// Results summary component
interface ResultsSummaryProps {
  searchQuery: string;
  activeCategory: string;
  resultCount: number;
  visibleCount: number;
  categories: any[];
}

const ResultsSummary = ({ 
  searchQuery, 
  activeCategory, 
  resultCount,
  visibleCount,
  categories
}: ResultsSummaryProps) => {
  // Find category name
  const categoryName = useMemo(() => {
    if (activeCategory === 'all') return 'All Topics';
    const category = categories.find(c => c.id === activeCategory);
    return category ? category.name : 'All Topics';
  }, [activeCategory, categories]);
  
  if (!searchQuery && activeCategory === 'all') return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-4 text-gray-700 font-medium"
    >
      {searchQuery ? (
        <div className="flex items-center">
          <span className="text-primary mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          Found <span className="font-semibold text-gray-900 mx-1">{resultCount}</span> {resultCount === 1 ? 'result' : 'results'} for "<span className="font-semibold text-primary">{searchQuery}</span>"
          {activeCategory !== 'all' ? <> in <span className="font-semibold text-gray-900">{categoryName}</span></> : ''}
          {resultCount > visibleCount && (
            <span className="ml-1 text-gray-500 text-sm">
              (showing {visibleCount} of {resultCount})
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center">
          <span className="text-primary mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </span>
          Showing <span className="font-semibold text-gray-900 mx-1">{visibleCount}</span> 
          {resultCount > visibleCount && (
            <span className="text-gray-500">of <span className="font-semibold text-gray-900">{resultCount}</span></span>
          )} {resultCount === 1 ? 'question' : 'questions'} in <span className="font-semibold text-gray-900">{categoryName}</span>
        </div>
      )}
    </motion.div>
  );
};

// Show More button component
interface ShowMoreButtonProps {
  onClick: () => void;
  remainingCount: number;
  loading?: boolean;
}

const ShowMoreButton = ({ onClick, remainingCount, loading = false }: ShowMoreButtonProps) => {
  if (remainingCount <= 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-8 text-center"
    >
      <button
        onClick={onClick}
        disabled={loading}
        className="px-6 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium transition-colors flex items-center mx-auto space-x-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading more answers...</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Show {Math.min(remainingCount, 5)} more answers</span>
          </>
        )}
      </button>
    </motion.div>
  );
};

export default function FAQPage() {
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewedCategories, setViewedCategories] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [visibleItemCount, setVisibleItemCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [forceAccordionRender, setForceAccordionRender] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Hook for reduced motion preference
  const prefersReducedMotion = useReducedMotionPreference();
  
  // FAQ data loading
  const { 
    faqData, 
    categories, 
    loading, 
    error,
    searchHistory,
    trackQuestionView,
    getPopularQuestions,
    searchFaqs,
    addToSearchHistory
  } = useFaqData();
  
  // Analytics hooks
  const { 
    trackSearch, 
    trackQuestionView: logQuestionView, 
    trackCategoryView,
    trackCtaClick,
    trackFormSubmission
  } = useFaqAnalytics();
  
  // Reset visible count when search or category changes
  useEffect(() => {
    setVisibleItemCount(5);
  }, [searchQuery, activeCategory]);
  
  // Handle loading more items
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    
    // Simulate a slight delay for loading animation
    setTimeout(() => {
      setVisibleItemCount(prev => prev + 5);
      setIsLoadingMore(false);
    }, 500);
  };
  
  // Handle scrolling (only when explicitly triggered)
  useEffect(() => {
    if (shouldScroll && resultsRef.current) {
      const yOffset = -80; // Increased offset to ensure we don't scroll too far
      const y = resultsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({ top: y, behavior: 'smooth' });
      setShouldScroll(false);
    }
  }, [shouldScroll]);
  
  // Handle search query changes
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length > 2) {
      setIsSearching(true);
      trackSearch(query);
      // No longer set auto-scrolling on search
    } else {
      setIsSearching(false);
      
      // Clear selected question when search is cleared
      if (!query.trim() && selectedQuestionId) {
        setSelectedQuestionId(null);
      }
    }
  };
  
  // Reference for the search timeout
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      searchTimeoutRef.current && clearTimeout(searchTimeoutRef.current);
    };
  }, []);
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(categoryId);
    trackCategoryView(categoryId);
    
    // Add to viewed categories for smart CTAs
    if (categoryId !== 'all' && !viewedCategories.includes(categoryId)) {
      setViewedCategories(prev => [...prev, categoryId]);
    }
    
    // Clear selected question when changing categories
    setSelectedQuestionId(null);
    
    // Trigger scroll only when category is selected
    setShouldScroll(true);
  };
  
  // Synchronous state updates using batch update pattern
  const batchStateUpdate = (updates: (() => void)[]) => {
    // Execute all state updates in sequence
    updates.forEach(update => update());
  };
  
  // Enhanced Quick answer selection to ensure the selected question is expanded
  const handleQuickAnswerSelect = (questionId: string) => {
    // Find the question in the data
    const question = faqData.find(q => q.id === questionId);
    if (question) {
      // Track this as a view
      handleQuestionView(questionId, question.question);
      
      // Add to search history
      addToSearchHistory(question.question);
      
      // Use batch state updates to ensure correct order and prevent race conditions
      batchStateUpdate([
        // Step 1: Set category to 'all' to search across all categories
        () => setActiveCategory('all'),
        
        // Step 2: Clear any active search
        () => setSearchQuery(''),
        
        // Step 3: Set the selected question ID last to ensure it takes priority
        () => setSelectedQuestionId(questionId),
        
        // Step 4: Force a re-render of the accordion to ensure expanded state is applied
        () => setForceAccordionRender(prev => prev + 1),
        
        // Step 5: Trigger scrolling to the results
        () => setShouldScroll(true)
      ]);
    }
  };
  
  // Track question view with both hooks
  const handleQuestionView = (questionId: string, questionText: string) => {
    trackQuestionView(questionId);
    logQuestionView(questionId, questionText);
  };
  
  // Get filtered FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    let results = searchQuery ? searchFaqs(searchQuery) : faqData;
    
    if (activeCategory !== 'all') {
      results = results.filter(item => item.category === activeCategory);
    }
    
    // If we have a selected question from Quick Answers, make sure it's at the top
    if (selectedQuestionId) {
      const selectedQuestion = results.find(q => q.id === selectedQuestionId);
      if (selectedQuestion) {
        // Remove it from current position and add it to the front
        results = [
          selectedQuestion,
          ...results.filter(q => q.id !== selectedQuestionId)
        ];
      }
    }
    
    return results;
  }, [faqData, searchQuery, activeCategory, searchFaqs, selectedQuestionId]);
  
  // Get the visible FAQ items based on pagination
  const visibleFaqs = useMemo(() => {
    if (selectedQuestionId) {
      // If there's a selected question, prioritize showing it
      const selectedItem = filteredFaqs.find(item => item.id === selectedQuestionId);
      if (selectedItem) {
        const restOfItems = filteredFaqs
          .filter(item => item.id !== selectedQuestionId)
          .slice(0, visibleItemCount - 1);
        return [selectedItem, ...restOfItems];
      }
    }
    return filteredFaqs.slice(0, visibleItemCount);
  }, [filteredFaqs, visibleItemCount, selectedQuestionId]);
  
  // Calculate remaining items to show
  const remainingItems = filteredFaqs.length - visibleItemCount;
  
  // Show the token demo based on context
  const showTokenDemo = useMemo(() => {
    return activeCategory === 'all' || 
      activeCategory === 'tokens' || 
      viewedCategories.includes('tokens') ||
      searchQuery.toLowerCase().includes('token') ||
      searchQuery.toLowerCase().includes('convert') ||
      searchQuery.toLowerCase().includes('point');
  }, [activeCategory, viewedCategories, searchQuery]);
  
  // If loading failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900 mb-6"
            >
              Oops! Something went wrong
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-700 mb-8"
            >
              We're having trouble loading the FAQ content. Please try again later.
            </motion.p>
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-primary-600 transition-colors"
            >
              Refresh Page
            </motion.button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
      <FAQHero 
        onSearch={handleSearch}
        onCategorySelect={handleCategorySelect}
        searchHistory={searchHistory}
        addToSearchHistory={addToSearchHistory}
        popularQuestions={faqData} // Use all FAQs instead of just popular ones for more comprehensive search
        categories={categories}
        reducedMotion={prefersReducedMotion}
        onQuickAnswerSelect={handleQuickAnswerSelect}
      />
      
      <div className="container mx-auto px-4 py-2">
        {/* Loading state */}
        {loading ? (
          <LoadingState />
        ) : (
          <>
            {/* Category Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <FAQCategories
                categories={categories}
                activeCategory={activeCategory}
                onCategorySelect={handleCategorySelect}
                trackCategoryView={trackCategoryView}
              />
            </motion.div>
            
            {/* FAQ Results */}
            <div className="mb-12 scroll-mt-24" id="faq-results" ref={resultsRef}>
              <ResultsSummary 
                searchQuery={searchQuery}
                activeCategory={activeCategory}
                resultCount={filteredFaqs.length}
                visibleCount={visibleFaqs.length}
                categories={categories}
              />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeCategory}-${searchQuery}-${selectedQuestionId || ''}-${forceAccordionRender}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FAQAccordion 
                    items={visibleFaqs}
                    searchQuery={searchQuery}
                    activeCategory={activeCategory}
                    trackQuestionView={handleQuestionView}
                    selectedQuestionId={selectedQuestionId}
                  />
                  
                  {/* Show More button */}
                  <ShowMoreButton 
                    onClick={handleLoadMore}
                    remainingCount={remainingItems}
                    loading={isLoadingMore}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Interactive Demo - show for relevant categories */}
            {showTokenDemo && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-6">Interactive Demo</h2>
                <PointsConversionDemo />
              </motion.section>
            )}
            
            {/* Question Submission Form */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold mb-6">Still Have Questions?</h2>
              <QuestionSubmissionForm trackFormSubmission={trackFormSubmission} />
            </motion.section>
            
            {/* Smart CTA Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              <SmartCTA 
                viewedCategories={viewedCategories}
                searchQuery={searchQuery}
                trackCtaClick={trackCtaClick}
              />
            </motion.section>
          </>
        )}
      </div>
    </div>
  );
}
