/**
 * Content Filter Service
 *
 * Screens AI-generated content for harmful, dangerous, or inappropriate advice.
 * Critical safety layer for protecting vulnerable users.
 */

export interface ContentCheckResult {
  isSafe: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export class ContentFilter {
  // Critical keywords that indicate immediate danger
  private readonly criticalKeywords = [
    'kill yourself',
    'suicide',
    'end your life',
    'better off dead',
    'not worth living',
  ];

  // High-severity harmful content patterns
  private readonly harmfulKeywords = [
    'self-harm',
    'hurt yourself',
    'cut yourself',
    'harm yourself',
    'overdose',
  ];

  // Relationship-specific harmful patterns
  private readonly abusivePatterns = [
    'hit them',
    'punch them',
    'slap them',
    'hurt them',
    'they deserve it',
    'make them suffer',
    'get revenge',
    'you should leave',
    'just leave them',
    'abandon them',
  ];

  // Manipulation tactics that should be flagged
  private readonly manipulativePatterns = [
    'gaslight',
    'manipulate them',
    'lie to them',
    'deceive them',
    'trick them',
    'use against them',
  ];

  /**
   * Check content for harmful patterns
   * Returns result with safety status and reason if unsafe
   */
  async checkForHarmfulContent(text: string): Promise<ContentCheckResult> {
    if (!text || text.trim().length === 0) {
      return { isSafe: true };
    }

    const lowerText = text.toLowerCase();

    // Check critical keywords first (immediate danger)
    for (const keyword of this.criticalKeywords) {
      if (lowerText.includes(keyword)) {
        return {
          isSafe: false,
          reason: 'Content contains critical safety concern',
          severity: 'critical',
        };
      }
    }

    // Check harmful content patterns
    for (const keyword of this.harmfulKeywords) {
      if (lowerText.includes(keyword)) {
        return {
          isSafe: false,
          reason: 'Content contains harmful advice',
          severity: 'high',
        };
      }
    }

    // Check abusive patterns
    for (const pattern of this.abusivePatterns) {
      if (lowerText.includes(pattern)) {
        return {
          isSafe: false,
          reason: 'Content contains potentially abusive advice',
          severity: 'high',
        };
      }
    }

    // Check manipulative patterns
    for (const pattern of this.manipulativePatterns) {
      if (lowerText.includes(pattern)) {
        return {
          isSafe: false,
          reason: 'Content contains manipulative advice',
          severity: 'medium',
        };
      }
    }

    return { isSafe: true };
  }

  /**
   * Get fallback message with crisis resources
   * Shown when harmful content is detected
   */
  getFallbackMessage(): string {
    return `I apologize, but I need to pause our conversation here. Based on what you've shared, I want to make sure you have access to immediate support resources.

**Crisis Resources:**

**National Suicide Prevention Lifeline**
Call or text: 988
Available 24/7

**Crisis Text Line**
Text HOME to 741741
Available 24/7

**National Domestic Violence Hotline**
Call: 1-800-799-7233
Text START to 88788
Available 24/7

**SAMHSA National Helpline (Substance Abuse)**
Call: 1-800-662-4357
Available 24/7

These services provide free, confidential support from trained professionals. They're here to help, no matter what you're going through.

If you're in immediate danger, please call 911 or go to your nearest emergency room.

I'm here to support your relationship growth, but these resources can provide the immediate, specialized help that may be needed right now.`;
  }

  /**
   * Log filtered content for review
   * Used for improving filters and auditing
   */
  async logFilteredContent(
    content: string,
    reason: string,
    severity: string,
    context: {
      userId?: string;
      conflictId?: string;
      sessionId?: string;
    }
  ): Promise<void> {
    // Log to console for now
    // In production, this would write to a secure audit log or database
    console.warn('Content filtered:', {
      timestamp: new Date().toISOString(),
      reason,
      severity,
      userId: context.userId,
      conflictId: context.conflictId,
      sessionId: context.sessionId,
      contentLength: content.length,
      // Don't log full content for privacy, just first 100 chars
      contentPreview: content.substring(0, 100) + '...',
    });
  }

  /**
   * Check if content contains crisis-related language
   * Returns true if user may be in distress (used for alerting)
   */
  detectCrisisLanguage(text: string): boolean {
    const lowerText = text.toLowerCase();

    const crisisIndicators = [
      'want to die',
      'wish i was dead',
      'thinking about suicide',
      'planning to hurt',
      'going to hurt',
      'can\'t go on',
      'no reason to live',
      'everyone would be better off',
    ];

    return crisisIndicators.some((indicator) => lowerText.includes(indicator));
  }
}

// Export singleton instance
export const contentFilter = new ContentFilter();
