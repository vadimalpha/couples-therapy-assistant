import { getDatabase } from './db';
import { Conflict, PatternInsights, ThemeFrequency, RelationshipCycle } from '../types';

/**
 * Helper to extract results from SurrealDB query response
 */
function extractQueryResult<T>(result: unknown): T[] {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return [];
  }
  if (result[0] && typeof result[0] === 'object' && 'result' in result[0]) {
    return (result[0] as { result: T[] }).result || [];
  }
  if (Array.isArray(result[0])) {
    return result[0] as T[];
  }
  return [];
}

/**
 * Pattern Recognition Engine
 * Detects recurring themes and relationship cycles in conflict history
 */
export class PatternRecognitionEngine {
  // Theme detection keywords mapped to categories
  private readonly themeKeywords = {
    'finances': ['finance', 'money', 'budget', 'bill', 'expense', 'saving', 'spending', 'debt', 'income'],
    'household chores': ['chore', 'housework', 'cleaning', 'laundry', 'dish', 'vacuum', 'tidy', 'mess'],
    'intimacy': ['intimacy', 'sex', 'affection', 'physical', 'touch', 'romance', 'intimate'],
    'communication': ['communication', 'listening', 'talk', 'conversation', 'discuss', 'hear', 'understand'],
    'family': ['family', 'in-law', 'parent', 'mother', 'father', 'sibling', 'relative'],
    'parenting': ['parenting', 'kid', 'child', 'children', 'baby', 'school', 'daycare'],
    'work': ['work', 'career', 'job', 'office', 'boss', 'colleague', 'overtime', 'promotion'],
    'time together': ['time', 'quality time', 'attention', 'together', 'date', 'weekend', 'vacation'],
  };

  // Relationship cycle patterns
  private readonly cyclePatterns = {
    'pursue-withdraw': {
      keywords: ['ask', 'request', 'want', 'need', 'shut down', 'avoid', 'withdraw', 'silent', 'ignore'],
      description: 'One partner pursues connection while the other withdraws',
    },
    'demand-withdraw': {
      keywords: ['demand', 'insist', 'must', 'have to', 'avoid', 'refuse', 'won\'t', 'can\'t'],
      description: 'One partner makes demands while the other avoids or resists',
    },
    'mutual-criticism': {
      keywords: ['blame', 'fault', 'criticize', 'attack', 'accuse', 'wrong', 'always', 'never'],
      description: 'Both partners engage in mutual blame and criticism',
    },
    'mutual-avoidance': {
      keywords: ['avoid', 'ignore', 'distance', 'separate', 'space', 'alone', 'withdrawn'],
      description: 'Both partners avoid discussing or engaging with the issue',
    },
  };

  /**
   * Main entry point - detect patterns for a relationship
   */
  async detectPatterns(
    relationshipId: string,
    currentConflictId?: string
  ): Promise<PatternInsights> {
    // Analyze different timeframes
    const conflicts30Days = await this.getRecentConflicts(relationshipId, 30);
    const conflicts60Days = await this.getRecentConflicts(relationshipId, 60);
    const conflicts90Days = await this.getRecentConflicts(relationshipId, 90);

    // Exclude current conflict if specified
    const filterConflicts = (conflicts: Conflict[]) => {
      if (!currentConflictId) return conflicts;
      return conflicts.filter(c => c.id !== currentConflictId);
    };

    const filtered30 = filterConflicts(conflicts30Days);
    const filtered60 = filterConflicts(conflicts60Days);
    const filtered90 = filterConflicts(conflicts90Days);

    // Analyze themes across all timeframes
    const themes30 = this.analyzeThemeFrequency(filtered30, 30);
    const themes60 = this.analyzeThemeFrequency(filtered60, 60);
    const themes90 = this.analyzeThemeFrequency(filtered90, 90);

    // Combine themes, prioritizing longer timeframes for context
    const allThemes = [...themes30, ...themes60, ...themes90];
    const recurringThemes = this.consolidateThemes(allThemes);

    // Detect relationship cycles in 90-day window
    const relationshipCycles = this.detectRelationshipCycles(filtered90);

    // Generate frequency alerts
    const frequencyAlerts = this.generateFrequencyAlerts(recurringThemes);

    return {
      recurringThemes,
      relationshipCycles,
      frequencyAlerts,
    };
  }

  /**
   * Get conflicts within a specific timeframe
   */
  private async getRecentConflicts(
    relationshipId: string,
    days: number
  ): Promise<Conflict[]> {
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    const result = await db.query(
      `SELECT * FROM conflict
       WHERE relationship_id = $relationshipId
       AND created_at >= $cutoffDate
       AND status = 'both_finalized'
       ORDER BY created_at DESC`,
      {
        relationshipId,
        cutoffDate: cutoffISO,
      }
    );

    return extractQueryResult<Conflict>(result);
  }

  /**
   * Analyze theme frequency in conflicts
   */
  private analyzeThemeFrequency(
    conflicts: Conflict[],
    timeframeDays: number
  ): ThemeFrequency[] {
    const themeCounts = new Map<string, number>();

    for (const conflict of conflicts) {
      // Analyze conflict title (always available)
      const text = (conflict.title || '').toLowerCase();

      // Skip if no text to analyze
      if (!text.trim()) continue;

      // Check for theme keywords
      for (const [theme, keywords] of Object.entries(this.themeKeywords)) {
        const hasMatch = keywords.some(keyword => text.includes(keyword));
        if (hasMatch) {
          themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
        }
      }
    }

    // Only include themes with 3+ occurrences
    const themes: ThemeFrequency[] = [];
    for (const [theme, count] of themeCounts.entries()) {
      if (count >= 3) {
        themes.push({ theme, count, timeframeDays });
      }
    }

    // Sort by count descending
    return themes.sort((a, b) => b.count - a.count);
  }

  /**
   * Detect relationship cycles in conflicts
   */
  private detectRelationshipCycles(conflicts: Conflict[]): RelationshipCycle[] {
    const cycles: RelationshipCycle[] = [];
    const cycleCounts = new Map<string, number>();

    for (const conflict of conflicts) {
      const text = (conflict.title || '').toLowerCase();

      if (!text.trim()) continue;

      // Check for cycle patterns
      for (const [cycleType, pattern] of Object.entries(this.cyclePatterns)) {
        const matchCount = pattern.keywords.filter(keyword =>
          text.includes(keyword)
        ).length;

        // Require at least 2 keyword matches for conservative detection
        if (matchCount >= 2) {
          cycleCounts.set(cycleType, (cycleCounts.get(cycleType) || 0) + 1);
        }
      }
    }

    // Only include cycles with 3+ occurrences
    for (const [cycleType, frequency] of cycleCounts.entries()) {
      if (frequency >= 3) {
        const pattern = this.cyclePatterns[cycleType as keyof typeof this.cyclePatterns];
        cycles.push({
          type: cycleType as RelationshipCycle['type'],
          description: pattern.description,
          frequency,
        });
      }
    }

    // Sort by frequency descending
    return cycles.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Consolidate themes from multiple timeframes
   * Prioritize most recent and most frequent
   */
  private consolidateThemes(allThemes: ThemeFrequency[]): ThemeFrequency[] {
    const themeMap = new Map<string, ThemeFrequency>();

    for (const theme of allThemes) {
      const existing = themeMap.get(theme.theme);

      // Keep the theme with the shortest timeframe (most recent)
      // or highest count if same timeframe
      if (!existing ||
          theme.timeframeDays < existing.timeframeDays ||
          (theme.timeframeDays === existing.timeframeDays && theme.count > existing.count)) {
        themeMap.set(theme.theme, theme);
      }
    }

    return Array.from(themeMap.values())
      .sort((a, b) => {
        // Sort by count first, then by timeframe (shorter = more recent)
        if (b.count !== a.count) return b.count - a.count;
        return a.timeframeDays - b.timeframeDays;
      });
  }

  /**
   * Generate human-readable frequency alerts
   */
  private generateFrequencyAlerts(themes: ThemeFrequency[]): string[] {
    const alerts: string[] = [];

    for (const theme of themes) {
      const timeframeText = theme.timeframeDays === 30
        ? 'in the past month'
        : theme.timeframeDays === 60
        ? 'in the past 2 months'
        : 'in the past 3 months';

      if (theme.count === 3) {
        alerts.push(`You've discussed ${theme.theme} 3 times ${timeframeText}`);
      } else if (theme.count === 4) {
        alerts.push(`This is the 4th conflict about ${theme.theme} ${timeframeText}`);
      } else if (theme.count === 5) {
        alerts.push(`You've discussed ${theme.theme} 5 times ${timeframeText}`);
      } else if (theme.count > 5) {
        alerts.push(`${theme.theme} has come up ${theme.count} times ${timeframeText}`);
      }
    }

    return alerts;
  }
}

export const patternRecognitionEngine = new PatternRecognitionEngine();
