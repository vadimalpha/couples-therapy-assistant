import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

/**
 * Prompt Template Service
 *
 * Manages prompt template files for admin viewing and editing.
 */

const PROMPTS_DIR = join(__dirname, '../prompts');

export interface PromptTemplate {
  name: string;
  content: string;
  category: 'exploration' | 'guidance' | 'synthesis' | 'relationship' | 'other';
  mode?: 'structured' | 'conversational' | 'test';
  lastModified?: Date;
}

export interface PromptTemplateSummary {
  name: string;
  category: string;
  mode?: string;
  size: number;
}

/**
 * Categorize a prompt template by its filename
 */
function categorizePrompt(filename: string): { category: PromptTemplate['category']; mode?: PromptTemplate['mode'] } {
  const name = filename.toLowerCase();

  let mode: PromptTemplate['mode'] | undefined;
  if (name.includes('-structured')) {
    mode = 'structured';
  } else if (name.includes('-conversational')) {
    mode = 'conversational';
  } else if (name.includes('-test')) {
    mode = 'test';
  }

  let category: PromptTemplate['category'] = 'other';
  if (name.includes('exploration')) {
    category = 'exploration';
  } else if (name.includes('individual-guidance') || name.includes('joint-context-chat')) {
    category = 'guidance';
  } else if (name.includes('synthesis') || name.includes('joint-context-synthesis')) {
    category = 'synthesis';
  } else if (name.includes('relationship') || name.includes('intake')) {
    category = 'relationship';
  }

  return { category, mode };
}

/**
 * List all prompt templates
 */
export function listPromptTemplates(): PromptTemplateSummary[] {
  if (!existsSync(PROMPTS_DIR)) {
    return [];
  }

  const files = readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.txt'));

  return files.map(filename => {
    const filepath = join(PROMPTS_DIR, filename);
    const content = readFileSync(filepath, 'utf-8');
    const { category, mode } = categorizePrompt(filename);

    return {
      name: filename,
      category,
      mode,
      size: content.length,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a specific prompt template
 */
export function getPromptTemplate(name: string): PromptTemplate | null {
  const filepath = join(PROMPTS_DIR, name);

  if (!existsSync(filepath)) {
    return null;
  }

  const content = readFileSync(filepath, 'utf-8');
  const { category, mode } = categorizePrompt(name);

  return {
    name,
    content,
    category,
    mode,
  };
}

/**
 * Update a prompt template
 */
export function updatePromptTemplate(name: string, content: string): boolean {
  const filepath = join(PROMPTS_DIR, name);

  // Only allow updating existing files for safety
  if (!existsSync(filepath)) {
    return false;
  }

  // Validate the filename is safe (no path traversal)
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    throw new Error('Invalid filename');
  }

  writeFileSync(filepath, content, 'utf-8');
  return true;
}

/**
 * Get prompt templates grouped by category
 */
export function getPromptTemplatesByCategory(): Record<string, PromptTemplateSummary[]> {
  const templates = listPromptTemplates();
  const grouped: Record<string, PromptTemplateSummary[]> = {
    exploration: [],
    guidance: [],
    synthesis: [],
    relationship: [],
    other: [],
  };

  for (const template of templates) {
    grouped[template.category].push(template);
  }

  return grouped;
}

/**
 * Get mode-specific templates for a base template
 */
export function getModeVariants(baseTemplate: string): PromptTemplateSummary[] {
  const baseName = baseTemplate.replace('.txt', '').replace(/-(?:structured|conversational|test)$/, '');
  const templates = listPromptTemplates();

  return templates.filter(t => {
    const tBaseName = t.name.replace('.txt', '').replace(/-(?:structured|conversational|test)$/, '');
    return tBaseName === baseName;
  });
}
