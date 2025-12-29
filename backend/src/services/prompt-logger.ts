import { getDatabase } from './db';
import { PromptLog, PromptLogType, SessionType, GuidanceMode } from '../types';

/**
 * Prompt Logger Service
 *
 * Logs all prompts sent to LLMs for debugging and analysis.
 * Stores logs in SurrealDB for retrieval via admin endpoint.
 */

export interface LogPromptParams {
  userId: string;
  userEmail?: string;
  userName?: string;
  conflictId?: string;
  conflictTitle?: string;
  sessionId?: string;
  sessionType?: SessionType;
  logType: PromptLogType;
  guidanceMode?: GuidanceMode;
  systemPrompt: string;
  userMessage: string;
  aiResponse: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

/**
 * Log a prompt interaction to the database
 */
export async function logPrompt(params: LogPromptParams): Promise<void> {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Convert record IDs to plain strings by replacing colons to prevent
    // SurrealDB from interpreting them as record references
    const toSafeString = (id: string | undefined | null): string | undefined => {
      if (!id) return undefined;
      const strId = typeof id === 'object' ? String(id) : id;
      // Replace colon with double-underscore to prevent record reference interpretation
      return strId.replace(/:/g, '__');
    };

    // Build content object dynamically, omitting undefined values
    // This avoids issues with SurrealDB's handling of null vs NONE
    const content: Record<string, any> = {
      userId: params.userId,
      logType: params.logType,
      systemPrompt: params.systemPrompt,
      userMessage: params.userMessage,
      aiResponse: params.aiResponse,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      cost: params.cost,
      createdAt: now,
    };

    // Add optional fields only if they have values
    if (params.userEmail) content.userEmail = params.userEmail;
    if (params.userName) content.userName = params.userName;
    if (params.conflictId) content.conflictId = toSafeString(params.conflictId);
    if (params.conflictTitle) content.conflictTitle = params.conflictTitle;
    if (params.sessionId) content.sessionId = toSafeString(params.sessionId);
    if (params.sessionType) content.sessionType = params.sessionType;
    if (params.guidanceMode) content.guidanceMode = params.guidanceMode;

    await db.query('CREATE prompt_log CONTENT $content', { content });
  } catch (error) {
    // Log but don't throw - logging shouldn't break main functionality
    console.error('Error logging prompt:', error);
  }
}

/**
 * Get prompt logs with optional filters
 */
export async function getPromptLogs(options: {
  limit?: number;
  offset?: number;
  userId?: string;
  logType?: PromptLogType;
  conflictId?: string;
}): Promise<PromptLog[]> {
  const db = getDatabase();
  const { limit = 100, offset = 0, userId, logType, conflictId } = options;

  let query = 'SELECT * FROM prompt_log';
  const conditions: string[] = [];
  const params: Record<string, any> = { limit, offset };

  if (userId) {
    conditions.push('userId = $userId');
    params.userId = userId;
  }

  if (logType) {
    conditions.push('logType = $logType');
    params.logType = logType;
  }

  if (conflictId) {
    conditions.push('conflictId = $conflictId');
    // Convert to safe format (colons to double underscores) to match stored format
    params.conflictId = conflictId.replace(/:/g, '__');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY createdAt DESC LIMIT $limit START $offset';

  const result = await db.query(query, params);
  const logs = (result as any)?.[0] || [];
  return logs;
}

/**
 * Get total count of prompt logs
 */
export async function getPromptLogCount(options: {
  userId?: string;
  logType?: PromptLogType;
  conflictId?: string;
}): Promise<number> {
  const db = getDatabase();
  const { userId, logType, conflictId } = options;

  let query = 'SELECT count() FROM prompt_log';
  const conditions: string[] = [];
  const params: Record<string, any> = {};

  if (userId) {
    conditions.push('userId = $userId');
    params.userId = userId;
  }

  if (logType) {
    conditions.push('logType = $logType');
    params.logType = logType;
  }

  if (conflictId) {
    conditions.push('conflictId = $conflictId');
    // Convert to safe format (colons to double underscores) to match stored format
    params.conflictId = conflictId.replace(/:/g, '__');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP ALL';

  const result = await db.query(query, params);
  const data = (result as any)?.[0]?.[0];
  return data?.count || 0;
}

/**
 * Delete old prompt logs (older than specified days)
 */
export async function deleteOldLogs(daysOld: number): Promise<number> {
  const db = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await db.query(
    'DELETE FROM prompt_log WHERE createdAt < $cutoff RETURN BEFORE',
    { cutoff: cutoffDate.toISOString() }
  );

  const deleted = (result as any)?.[0] || [];
  return deleted.length;
}

/**
 * Get aggregated stats for prompt logs
 */
export async function getPromptLogStats(): Promise<{
  totalLogs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  byType: Record<string, number>;
}> {
  const db = getDatabase();

  // Get total stats
  const statsResult = await db.query(`
    SELECT
      count() as totalLogs,
      math::sum(inputTokens) as totalInputTokens,
      math::sum(outputTokens) as totalOutputTokens,
      math::sum(cost) as totalCost
    FROM prompt_log
    GROUP ALL
  `);

  const stats = (statsResult as any)?.[0]?.[0] || {
    totalLogs: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
  };

  // Get counts by type
  const byTypeResult = await db.query(`
    SELECT logType, count() as count
    FROM prompt_log
    GROUP BY logType
  `);

  const byType: Record<string, number> = {};
  const typeData = (byTypeResult as any)?.[0] || [];
  for (const item of typeData) {
    if (item.logType) {
      byType[item.logType] = item.count;
    }
  }

  return {
    totalLogs: stats.totalLogs || 0,
    totalInputTokens: stats.totalInputTokens || 0,
    totalOutputTokens: stats.totalOutputTokens || 0,
    totalCost: stats.totalCost || 0,
    byType,
  };
}
