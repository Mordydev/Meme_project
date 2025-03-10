import { FastifyInstance } from 'fastify';
import { ContentModerationFlag, ModerationDecision } from './moderation-service';
import { CircuitBreaker } from '../lib/circuit-breaker';

/**
 * AI moderation analysis result
 */
export interface ModerationAnalysisResult {
  decision: ModerationDecision;
  confidence: number;
  reason?: string;
  flags: ContentModerationFlag[];
}

/**
 * Service for AI-powered content moderation
 */
export class AIModerationService {
  private aiServiceBreaker: CircuitBreaker;
  
  constructor(private fastify: FastifyInstance) {
    // Create circuit breaker for external AI service
    this.aiServiceBreaker = new CircuitBreaker(
      'ai-moderation-service',
      {
        failureThreshold: 3,
        resetTimeout: 30000,
        timeoutDuration: 5000, // 5 second timeout for AI service calls
        monitorIntervalMs: 60000 // Monitor health every minute
      }
    );
  }

  /**
   * Analyze content for moderation issues
   */
  async analyzeContent(content: any): Promise<ModerationAnalysisResult> {
    try {
      // Use circuit breaker for external service call
      return await this.aiServiceBreaker.execute(() => this.performContentAnalysis(content));
    } catch (error) {
      // On error, fail open with a safe default
      this.fastify.log.warn(
        { error, contentId: content.id }, 
        'AI moderation service failure - using fallback'
      );
      
      return this.fallbackModeration(content);
    }
  }

  /**
   * Perform content analysis
   * This would typically call an external AI service
   */
  private async performContentAnalysis(content: any): Promise<ModerationAnalysisResult> {
    // For demonstration, using a simplified local implementation
    // In production, this would call an AI service API (OpenAI, Google Perspective, etc.)
    
    // Mock API call with timeout
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Extract text content for analysis
    const textToAnalyze = this.extractTextContent(content);
    
    // Simple keyword check for demonstration
    const flags: ContentModerationFlag[] = [];
    let highestSeverity = 'low';
    
    // Check for potential issues (simplistic example)
    if (this.containsKeywords(textToAnalyze, ['hate', 'slur', 'racist', 'sexist'])) {
      flags.push({
        type: 'hate_speech',
        severity: 'high',
        confidence: 0.9,
        details: { matches: this.findMatchingPatterns(textToAnalyze, ['hate', 'slur', 'racist', 'sexist']) }
      });
      highestSeverity = 'high';
    }
    
    if (this.containsKeywords(textToAnalyze, ['threat', 'kill', 'attack', 'bomb'])) {
      flags.push({
        type: 'threats',
        severity: 'high',
        confidence: 0.85,
        details: { matches: this.findMatchingPatterns(textToAnalyze, ['threat', 'kill', 'attack', 'bomb']) }
      });
      highestSeverity = 'high';
    }
    
    if (this.containsKeywords(textToAnalyze, ['sex', 'explicit', 'nude'])) {
      flags.push({
        type: 'adult_content',
        severity: 'medium',
        confidence: 0.8,
        details: { matches: this.findMatchingPatterns(textToAnalyze, ['sex', 'explicit', 'nude']) }
      });
      if (highestSeverity !== 'high') highestSeverity = 'medium';
    }
    
    // Make decision based on flags
    let decision: ModerationDecision = 'approved';
    let confidence = 0.7;
    let reason = '';
    
    if (flags.length > 0) {
      if (highestSeverity === 'high') {
        decision = 'rejected';
        reason = 'Content violates community guidelines';
        confidence = 0.85;
      } else {
        decision = 'escalated';
        reason = 'Potential content policy violation';
        confidence = 0.7;
      }
    }
    
    return {
      decision,
      confidence,
      reason,
      flags
    };
  }

  /**
   * Extract text content from various content types
   */
  private extractTextContent(content: any): string {
    let textContent = '';
    
    // Add title if available
    if (content.title) {
      textContent += content.title + ' ';
    }
    
    // Add body if available
    if (content.body) {
      textContent += content.body + ' ';
    }
    
    // Add tags if available
    if (content.tags && Array.isArray(content.tags)) {
      textContent += content.tags.join(' ') + ' ';
    }
    
    return textContent.toLowerCase();
  }

  /**
   * Check if text contains any of the specified keywords
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * Find matching patterns in text
   */
  private findMatchingPatterns(text: string, patterns: string[]): string[] {
    const lowerText = text.toLowerCase();
    return patterns.filter(pattern => lowerText.includes(pattern.toLowerCase()));
  }

  /**
   * Fallback moderation for when the AI service is unavailable
   */
  private fallbackModeration(content: any): ModerationAnalysisResult {
    // In fallback mode, only flag obvious issues and escalate the rest
    
    const textContent = this.extractTextContent(content);
    const flags: ContentModerationFlag[] = [];
    
    // Only check for critical keywords that absolutely must be blocked
    if (this.containsKeywords(textContent, ['hate', 'slur', 'terrorist', 'kill'])) {
      flags.push({
        type: 'critical_keywords',
        severity: 'high',
        confidence: 0.6,
        details: { 
          note: 'Flagged by fallback system due to AI service unavailability',
          matches: this.findMatchingPatterns(textContent, ['hate', 'slur', 'terrorist', 'kill'])
        }
      });
      
      return {
        decision: 'escalated', // Escalate instead of reject when in fallback mode
        confidence: 0.6,
        reason: 'Potential content policy violation (fallback detection)',
        flags
      };
    }
    
    // Default safe fallback
    return {
      decision: 'approved',
      confidence: 0.5,
      reason: 'Approved by fallback system (AI service unavailable)',
      flags: []
    };
  }
}
