'use client';

/**
 * Analytics Module
 * 
 * Provides standardized tracking for user behaviors and events
 */

// Define event categories
export enum EventCategory {
  USER = 'user',
  ENGAGEMENT = 'engagement',
  CONTENT = 'content',
  TOKEN = 'token',
  POINTS = 'points',
  WALLET = 'wallet',
  PERFORMANCE = 'performance',
  ERROR = 'error',
  APP = 'app'
}

// Define standard event actions
export enum EventAction {
  // User actions
  SIGNUP = 'signup',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PROFILE_VIEW = 'profile_view',
  PROFILE_UPDATE = 'profile_update',
  
  // Engagement actions
  VIEW = 'view',
  CLICK = 'click',
  SCROLL = 'scroll',
  IMPRESSION = 'impression',
  COMPLETION = 'completion',
  
  // Content actions
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  LIKE = 'like',
  COMMENT = 'comment',
  SHARE = 'share',
  
  // Token actions
  PRICE_VIEW = 'price_view',
  TRANSACTION_VIEW = 'transaction_view',
  
  // Points actions
  POINTS_EARNED = 'points_earned',
  POINTS_REDEEMED = 'points_redeemed',
  POINTS_BALANCE_VIEW = 'points_balance_view',
  
  // Wallet actions
  WALLET_CONNECT = 'wallet_connect',
  WALLET_DISCONNECT = 'wallet_disconnect',
  WALLET_TRANSACTION = 'wallet_transaction',
  
  // Performance actions
  PAGE_LOAD = 'page_load',
  COMPONENT_RENDER = 'component_render',
  
  // Error actions
  ERROR_OCCURRED = 'error',
  ERROR_RESOLVED = 'error_resolved',
  
  // App actions
  APP_INSTALL = 'app_install',
  APP_UPDATE = 'app_update',
  APP_FOREGROUND = 'app_foreground',
  APP_BACKGROUND = 'app_background'
}

// Analytics event interface
export interface AnalyticsEvent {
  /**
   * Event category
   */
  category: EventCategory;
  
  /**
   * Event action
   */
  action: EventAction | string;
  
  /**
   * Event label (optional)
   */
  label?: string;
  
  /**
   * Event value (optional)
   */
  value?: number;
  
  /**
   * Additional event properties
   */
  properties?: Record<string, any>;
  
  /**
   * Event timestamp
   */
  timestamp?: number;
}

/**
 * Analytics implementation
 */
class Analytics {
  private static instance: Analytics;
  private initialized: boolean = false;
  private enabled: boolean = true;
  private anonymousMode: boolean = false;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private lastEvents: AnalyticsEvent[] = [];
  
  /**
   * Get singleton instance
   */
  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }
  
  /**
   * Initialize analytics
   */
  public init(): void {
    if (this.initialized) return;
    
    // Generate session ID
    this.sessionId = this.generateSessionId();
    
    // Check if user has opted out
    this.checkOptOutStatus();
    
    // Initialize external analytics if available
    this.initExternalAnalytics();
    
    // Mark as initialized
    this.initialized = true;
    
    // Track app initialized event
    this.track({
      category: EventCategory.APP,
      action: 'initialized',
      properties: {
        url: typeof window !== 'undefined' ? window.location.pathname : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined
      }
    });
  }
  
  /**
   * Track analytics event
   */
  public track(event: AnalyticsEvent): void {
    if (!this.initialized) {
      this.init();
    }
    
    if (!this.enabled) return;
    
    // Add timestamp if not present
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || Date.now()
    };
    
    // Add to recent events
    this.lastEvents.unshift(eventWithTimestamp);
    if (this.lastEvents.length > 20) {
      this.lastEvents.pop();
    }
    
    // Skip sensitive events in anonymous mode
    if (this.anonymousMode && this.isSensitiveEvent(event)) {
      return;
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventWithTimestamp);
    }
    
    // Send to backend analytics service
    this.sendToBackend(eventWithTimestamp);
    
    // Send to external analytics service if available
    this.sendToExternalAnalytics(eventWithTimestamp);
  }
  
  /**
   * Set user ID for analytics
   */
  public setUserId(userId: string | null): void {
    this.userId = userId;
    
    // Update external analytics
    if (typeof window !== 'undefined' && 
        window.analyticsService && 
        typeof window.analyticsService.setUser === 'function') {
      window.analyticsService.setUser(userId);
    }
  }
  
  /**
   * Enable or disable analytics
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    // Store preference
    if (typeof localStorage !== 'undefined') {
      if (!enabled) {
        localStorage.setItem('analytics_opt_out', 'true');
      } else {
        localStorage.removeItem('analytics_opt_out');
      }
    }
    
    // Update external analytics
    if (typeof window !== 'undefined' && 
        window.analyticsService && 
        typeof window.analyticsService.setEnabled === 'function') {
      window.analyticsService.setEnabled(enabled);
    }
  }
  
  /**
   * Set anonymous mode
   */
  public setAnonymousMode(anonymous: boolean): void {
    this.anonymousMode = anonymous;
  }
  
  /**
   * Get recent tracking events
   */
  public getRecentEvents(): AnalyticsEvent[] {
    return [...this.lastEvents];
  }
  
  /**
   * Track page view
   */
  public trackPageView(path: string, title?: string): void {
    this.track({
      category: EventCategory.ENGAGEMENT,
      action: 'page_view',
      label: title || path,
      properties: {
        path,
        title,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined
      }
    });
  }
  
  /**
   * Track user login
   */
  public trackLogin(method: string, userId: string): void {
    this.setUserId(userId);
    this.track({
      category: EventCategory.USER,
      action: EventAction.LOGIN,
      label: method,
      properties: {
        method
      }
    });
  }
  
  /**
   * Track user signup
   */
  public trackSignup(method: string, userId: string): void {
    this.setUserId(userId);
    this.track({
      category: EventCategory.USER,
      action: EventAction.SIGNUP,
      label: method,
      properties: {
        method
      }
    });
  }
  
  /**
   * Track user logout
   */
  public trackLogout(): void {
    this.track({
      category: EventCategory.USER,
      action: EventAction.LOGOUT
    });
    this.setUserId(null);
  }
  
  /**
   * Track content creation
   */
  public trackContentCreation(contentType: string, contentId: string): void {
    this.track({
      category: EventCategory.CONTENT,
      action: EventAction.CREATE,
      label: contentType,
      properties: {
        contentType,
        contentId
      }
    });
  }
  
  /**
   * Track content engagement
   */
  public trackContentEngagement(action: EventAction, contentType: string, contentId: string): void {
    this.track({
      category: EventCategory.CONTENT,
      action,
      label: contentType,
      properties: {
        contentType,
        contentId,
        action
      }
    });
  }
  
  /**
   * Track points activity
   */
  public trackPointsActivity(action: EventAction, amount: number, source: string): void {
    this.track({
      category: EventCategory.POINTS,
      action,
      value: amount,
      properties: {
        amount,
        source
      }
    });
  }
  
  /**
   * Track wallet connection
   */
  public trackWalletConnection(success: boolean, walletType: string): void {
    this.track({
      category: EventCategory.WALLET,
      action: success ? EventAction.WALLET_CONNECT : 'wallet_connect_failed',
      label: walletType,
      properties: {
        walletType,
        success
      }
    });
  }
  
  /**
   * Track error event
   */
  public trackError(errorCode: string, errorMessage: string, component?: string): void {
    this.track({
      category: EventCategory.ERROR,
      action: EventAction.ERROR_OCCURRED,
      label: errorCode,
      properties: {
        errorCode,
        errorMessage,
        component
      }
    });
  }
  
  /**
   * Track performance event
   */
  public trackPerformance(metric: string, value: number, context?: Record<string, any>): void {
    this.track({
      category: EventCategory.PERFORMANCE,
      action: metric,
      value,
      properties: context
    });
  }
  
  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomStr}`;
  }
  
  /**
   * Check if user has opted out
   */
  private checkOptOutStatus(): void {
    if (typeof localStorage !== 'undefined') {
      this.enabled = localStorage.getItem('analytics_opt_out') !== 'true';
    }
  }
  
  /**
   * Initialize external analytics integration
   */
  private initExternalAnalytics(): void {
    // Skip if not in browser
    if (typeof window === 'undefined') return;
    
    // Skip if external analytics is already initialized
    if (window.analyticsService) return;
    
    // This would normally integrate with an external analytics service
    // For now, we'll just create a placeholder
    window.analyticsService = {
      track: (event: any) => {
        // External tracking would happen here
      },
      setUser: (userId: string | null) => {
        // User identification would happen here
      },
      setEnabled: (enabled: boolean) => {
        // Toggle tracking would happen here
      }
    };
  }
  
  /**
   * Send to backend analytics service
   */
  private sendToBackend(event: AnalyticsEvent): void {
    // Skip if not in browser
    if (typeof window === 'undefined') return;
    
    // Skip in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_ANALYTICS_IN_DEV) {
      return;
    }
    
    // Enrich with user and session info
    const enrichedEvent = {
      ...event,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: event.timestamp || Date.now()
    };
    
    // Use sendBeacon for more reliable delivery, especially during page navigation
    if (navigator.sendBeacon) {
      const blob = new Blob(
        [JSON.stringify(enrichedEvent)], 
        { type: 'application/json' }
      );
      navigator.sendBeacon('/api/monitoring/analytics', blob);
    } else {
      // Fallback to fetch
      fetch('/api/monitoring/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrichedEvent),
        keepalive: true
      }).catch(error => {
        console.warn('[Analytics] Failed to send event:', error);
      });
    }
  }
  
  /**
   * Send to external analytics service
   */
  private sendToExternalAnalytics(event: AnalyticsEvent): void {
    // Skip if not in browser or no external service
    if (typeof window === 'undefined' || !window.analyticsService) return;
    
    try {
      window.analyticsService.track(event);
    } catch (error) {
      console.warn('[Analytics] External service error:', error);
    }
  }
  
  /**
   * Check if event is considered sensitive for anonymous mode
   */
  private isSensitiveEvent(event: AnalyticsEvent): boolean {
    // Wallet and user events are considered sensitive
    if (
      event.category === EventCategory.WALLET ||
      event.category === EventCategory.USER
    ) {
      return true;
    }
    
    // Points redemption events are sensitive
    if (
      event.category === EventCategory.POINTS &&
      event.action === EventAction.POINTS_REDEEMED
    ) {
      return true;
    }
    
    return false;
  }
}

// Export singleton instance
const analytics = Analytics.getInstance();
export default analytics;

// Type augmentation for window
declare global {
  interface Window {
    analyticsService?: {
      track: (event: any) => void;
      setUser: (userId: string | null) => void;
      setEnabled: (enabled: boolean) => void;
    };
    errorTrackingService?: {
      captureError: (error: any) => void;
    };
  }
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  analytics.init();
  
  // Track page views automatically
  if (typeof window !== 'undefined') {
    const trackPageChange = () => {
      analytics.trackPageView(
        window.location.pathname + window.location.search,
        document.title
      );
    };
    
    // Initial page load
    window.addEventListener('load', trackPageChange);
    
    // For client-side routing
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      trackPageChange();
      return result;
    };
    
    window.addEventListener('popstate', trackPageChange);
  }
}