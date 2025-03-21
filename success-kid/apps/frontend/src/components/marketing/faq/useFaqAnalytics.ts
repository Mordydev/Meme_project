import { useCallback, useEffect } from 'react';

// Stub for analytics service
// In a real application, this would connect to an actual analytics provider
const analytics = {
  trackEvent: (eventName: string, properties?: Record<string, any>) => {
    console.log(`Analytics event: ${eventName}`, properties);
    return Promise.resolve();
  },
  trackPageView: (pageName: string) => {
    console.log(`Page view: ${pageName}`);
    return Promise.resolve();
  }
};

export const useFaqAnalytics = () => {
  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('faq_page');
  }, []);
  
  // Track search queries
  const trackSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    analytics.trackEvent('faq_search', { query });
  }, []);
  
  // Track question views
  const trackQuestionView = useCallback((questionId: string, questionText: string) => {
    analytics.trackEvent('faq_question_view', { questionId, questionText });
  }, []);
  
  // Track category selection
  const trackCategoryView = useCallback((categoryId: string) => {
    analytics.trackEvent('faq_category_view', { categoryId });
  }, []);
  
  // Track CTA clicks
  const trackCtaClick = useCallback((ctaType: string) => {
    analytics.trackEvent('faq_cta_click', { ctaType });
  }, []);
  
  // Track form submissions
  const trackFormSubmission = useCallback((category: string) => {
    analytics.trackEvent('faq_question_submission', { category });
  }, []);
  
  return {
    trackSearch,
    trackQuestionView,
    trackCategoryView,
    trackCtaClick,
    trackFormSubmission
  };
};
