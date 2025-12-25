import { readFileSync } from 'fs';
import { join } from 'path';
import { getDatabase } from './db';
import { searchSimilar } from './embeddings';
import { SessionType } from '../types';

/**
 * Prompt Builder Service
 *
 * Builds prompts with RAG context and pattern insights injected.
 * Handles graceful degradation when context is unavailable.
 */

export interface PromptContext {
  conflictId: string;
  userId: string;
  sessionType: SessionType;
  includeRAG?: boolean;
  includePatterns?: boolean;
}

export interface PatternInsight {
  theme: string;
  occurrences: number;
  lastOccurrence: string;
  relatedConflicts: string[];
}

/**
 * Build prompt with RAG context and patterns injected
 */
export async function buildPrompt(
  templatePath: string,
  context: PromptContext
): Promise<string> {
  // Load base template
  const template = readFileSync(
    join(__dirname, '../prompts', templatePath),
    'utf-8'
  );

  let prompt = template;

  // Inject RAG context if requested
  if (context.includeRAG) {
    const ragSection = await buildRAGSection(context.conflictId, context.userId);
    prompt = prompt.replace('{{RAG_CONTEXT}}', ragSection);
  } else {
    // Remove placeholder if not using RAG
    prompt = prompt.replace('{{RAG_CONTEXT}}', '');
  }

  // Inject pattern insights if requested (only for joint context sessions)
  if (
    context.includePatterns &&
    (context.sessionType === 'joint_context_a' ||
      context.sessionType === 'joint_context_b')
  ) {
    const db = getDatabase();
    const userResult = await db.query(
      'SELECT relationshipId FROM user WHERE id = $userId',
      { userId: context.userId }
    );

    if (userResult && userResult[0]?.result?.[0]?.relationshipId) {
      const relationshipId = userResult[0].result[0].relationshipId;
      const patternSection = await buildPatternSection(relationshipId);
      prompt = prompt.replace('{{PATTERN_INSIGHTS}}', patternSection);
    } else {
      prompt = prompt.replace('{{PATTERN_INSIGHTS}}', '');
    }
  } else {
    // Remove placeholder if not using patterns
    prompt = prompt.replace('{{PATTERN_INSIGHTS}}', '');
  }

  return prompt;
}

/**
 * Get RAG context section for injection
 * Searches for similar past conversations and conflicts
 */
export async function buildRAGSection(
  conflictId: string,
  userId: string
): Promise<string> {
  try {
    const db = getDatabase();

    // Get current conflict details
    const conflictResult = await db.query(
      'SELECT title FROM conflict WHERE id = $conflictId',
      { conflictId }
    );

    if (!conflictResult || !conflictResult[0]?.result?.[0]) {
      return '';
    }

    const conflictTitle = conflictResult[0].result[0].title;

    // Search for similar past content
    const similarContent = await searchSimilar(userId, conflictTitle, 3);

    if (similarContent.length === 0) {
      return '';
    }

    // Build RAG context section
    let ragSection = '\n\n## Relevant Past Context\n\n';
    ragSection += 'Based on previous conversations and conflicts:\n\n';

    for (const item of similarContent) {
      if (item.similarity > 0.6) {
        // Only include reasonably similar content
        ragSection += `- ${item.metadata.type}: ${item.content.substring(0, 150)}...\n`;
      }
    }

    ragSection += '\nUse this context to inform your responses, but focus on the current situation.\n';

    return ragSection;
  } catch (error) {
    console.error('Error building RAG section:', error);
    // Graceful degradation - return empty string
    return '';
  }
}

/**
 * Get pattern section for injection
 * Identifies recurring themes in the relationship
 */
export async function buildPatternSection(
  relationshipId: string
): Promise<string> {
  try {
    const patterns = await detectPatterns(relationshipId);

    if (patterns.length === 0) {
      return '';
    }

    // Build pattern insights section
    let patternSection = '\n\n## Recurring Relationship Patterns\n\n';
    patternSection +=
      'The following patterns have been identified in this relationship:\n\n';

    for (const pattern of patterns) {
      if (pattern.occurrences >= 3) {
        // Only show patterns with 3+ occurrences
        patternSection += `- **${pattern.theme}**: Observed ${pattern.occurrences} times, most recently on ${new Date(pattern.lastOccurrence).toLocaleDateString()}\n`;
      }
    }

    patternSection +=
      '\nConsider these patterns when providing guidance, but avoid being heavy-handed. Frame insights supportively.\n';

    return patternSection;
  } catch (error) {
    console.error('Error building pattern section:', error);
    // Graceful degradation - return empty string
    return '';
  }
}

/**
 * Detect recurring patterns in relationship conflicts
 * Returns patterns with 3+ occurrences
 */
export async function detectPatterns(
  relationshipId: string
): Promise<PatternInsight[]> {
  try {
    const db = getDatabase();

    // Get all conflicts for this relationship
    const conflictsResult = await db.query(
      'SELECT id, title, created_at FROM conflict WHERE relationship_id = $relationshipId ORDER BY created_at DESC',
      { relationshipId }
    );

    if (!conflictsResult || !conflictsResult[0]?.result) {
      return [];
    }

    const conflicts = conflictsResult[0].result;

    if (conflicts.length < 3) {
      return []; // Need at least 3 conflicts to detect patterns
    }

    // Simple pattern detection based on title keywords
    const themeMap = new Map<string, PatternInsight>();

    // Common relationship themes to look for
    const themes = [
      'communication',
      'trust',
      'time',
      'intimacy',
      'finances',
      'family',
      'chores',
      'work',
      'boundaries',
      'expectations',
      'respect',
      'listening',
      'quality time',
      'affection',
      'appreciation',
    ];

    for (const conflict of conflicts) {
      const title = conflict.title.toLowerCase();

      for (const theme of themes) {
        if (title.includes(theme)) {
          if (!themeMap.has(theme)) {
            themeMap.set(theme, {
              theme,
              occurrences: 0,
              lastOccurrence: conflict.created_at,
              relatedConflicts: [],
            });
          }

          const pattern = themeMap.get(theme)!;
          pattern.occurrences++;
          pattern.relatedConflicts.push(conflict.id);

          // Update last occurrence if this is more recent
          if (
            new Date(conflict.created_at) > new Date(pattern.lastOccurrence)
          ) {
            pattern.lastOccurrence = conflict.created_at;
          }
        }
      }
    }

    // Filter to only patterns with 3+ occurrences
    const patterns = Array.from(themeMap.values()).filter(
      (p) => p.occurrences >= 3
    );

    // Sort by occurrence count (most frequent first)
    patterns.sort((a, b) => b.occurrences - a.occurrences);

    return patterns;
  } catch (error) {
    console.error('Error detecting patterns:', error);
    return [];
  }
}

/**
 * Get pattern insights for a relationship
 * Used by frontend to display patterns
 */
export async function getPatternInsights(
  relationshipId: string
): Promise<PatternInsight[]> {
  return detectPatterns(relationshipId);
}
