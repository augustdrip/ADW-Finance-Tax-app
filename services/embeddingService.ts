/**
 * Embedding Service for RAG
 * Provides semantic search capabilities for the AI War Room
 * Inspired by: https://ai-sdk.dev/cookbook/guides/rag-chatbot
 * 
 * This service handles:
 * 1. Embedding generation (using Gemini or fallback to keyword matching)
 * 2. Semantic similarity search for IRC sections
 * 3. Context retrieval for RAG
 */

import { IRC_KNOWLEDGE_BASE, IRCSection } from '../data/ircKnowledgeBase';

// ============================================
// Types
// ============================================

export interface EmbeddedChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: 'irc' | 'transaction' | 'chat' | 'custom';
    sectionId?: string;
    category?: string;
    relevance?: 'high' | 'medium' | 'low';
  };
}

export interface SearchResult {
  chunk: EmbeddedChunk;
  similarity: number;
}

// ============================================
// Keyword-based Semantic Matching (Fallback)
// ============================================

// Comprehensive keyword mappings for IRC sections
const IRC_KEYWORD_EMBEDDINGS: Record<string, string[]> = {
  '§61': ['income', 'revenue', 'money', 'earnings', 'gross', 'taxable', 'payment', 'compensation'],
  '§62': ['agi', 'adjusted gross income', 'above the line', 'deduction'],
  '§162': ['expense', 'business expense', 'deduction', 'ordinary', 'necessary', 'cost', 'spend', 'purchase', 'buy', 'payment', 'subscription', 'service'],
  '§162(a)(1)': ['salary', 'wages', 'compensation', 'employee', 'contractor', 'payroll', 'pay'],
  '§162(a)(2)': ['travel', 'trip', 'flight', 'hotel', 'lodging', 'airfare', 'business travel'],
  '§162(a)(3)': ['rent', 'lease', 'office space', 'coworking', 'rental'],
  '§163': ['interest', 'loan', 'credit card', 'financing', 'debt', 'borrow'],
  '§164': ['taxes', 'state tax', 'local tax', 'property tax', 'payroll tax'],
  '§165': ['loss', 'casualty', 'theft', 'nol', 'net operating loss'],
  '§167': ['depreciation', 'depreciate', 'useful life', 'asset'],
  '§168': ['macrs', 'depreciation', 'recovery', 'property class'],
  '§168(k)': ['bonus depreciation', 'first year', '60%', '40%', 'accelerated', 'immediate'],
  '§174': ['r&d', 'research', 'development', 'software development', 'experiment', 'innovation', 'amortize', 'capitalize'],
  '§179': ['section 179', '179', 'equipment', 'computer', 'macbook', 'laptop', 'hardware', 'furniture', 'machinery', 'asset', 'expense', 'write off', 'full deduction', 'immediate expense'],
  '§195': ['startup', 'start-up', 'beginning', 'new business', 'formation'],
  '§199A': ['qbi', 'qualified business income', '20%', 'pass-through', 'sole proprietor', 's-corp'],
  '§274': ['meals', 'entertainment', 'food', 'restaurant', 'dinner', 'lunch', 'client meal', '50%', 'business meal'],
  '§274(d)': ['substantiation', 'receipt', 'documentation', 'record', 'proof'],
  '§280A': ['home office', 'work from home', 'simplified', 'square foot', 'home deduction', 'wfh'],
  '§280F': ['vehicle', 'car', 'auto', 'luxury', 'mileage', 'depreciation limit', 'driving'],
  '§401(k)': ['401k', 'retirement', 'solo 401k', 'contribution', 'defer', 'savings'],
  '§408': ['sep', 'sep ira', 'retirement', '25%', 'pension'],
  '§41': ['r&d credit', 'research credit', 'tax credit', 'innovation credit', 'development credit'],
  '§1401': ['self-employment', 'se tax', 'social security', 'medicare', '15.3%', 'self employed'],
  '§162(l)': ['health insurance', 'medical', 'dental', 'vision', 'health premium'],
  '§6654': ['estimated tax', 'quarterly', 'estimated payment', 'quarterly tax'],
  '§1202': ['qsbs', 'qualified small business stock', 'capital gains', 'exclusion'],
  '§83': ['stock options', 'equity', 'vesting', 'restricted stock', 'rsu', '83b'],
  '§6001': ['record', 'records', 'keeping', 'documentation', 'receipt', 'proof']
};

// Expand keyword variations
const expandKeywords = (keywords: string[]): string[] => {
  const expanded = new Set<string>();
  for (const keyword of keywords) {
    expanded.add(keyword);
    // Add singular/plural variations
    if (keyword.endsWith('s')) {
      expanded.add(keyword.slice(0, -1));
    } else {
      expanded.add(keyword + 's');
    }
    // Add common variations
    if (keyword.includes(' ')) {
      expanded.add(keyword.replace(/ /g, ''));
      expanded.add(keyword.replace(/ /g, '-'));
    }
  }
  return Array.from(expanded);
};

// Pre-compute expanded keywords
const EXPANDED_IRC_KEYWORDS: Record<string, string[]> = {};
for (const [section, keywords] of Object.entries(IRC_KEYWORD_EMBEDDINGS)) {
  EXPANDED_IRC_KEYWORDS[section] = expandKeywords(keywords);
}

/**
 * Calculate similarity score between query and IRC section
 * Uses TF-IDF-like scoring with keyword matching
 */
function calculateSimilarity(query: string, section: IRCSection): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  let score = 0;
  
  // 1. Direct section reference (highest weight)
  if (queryLower.includes(section.section.toLowerCase())) {
    score += 100;
  }
  
  // 2. Keyword matching from our embeddings
  const sectionKeywords = EXPANDED_IRC_KEYWORDS[section.section] || [];
  for (const keyword of sectionKeywords) {
    if (queryLower.includes(keyword)) {
      score += 25;
    }
    // Partial word match
    for (const word of queryWords) {
      if (keyword.includes(word) || word.includes(keyword)) {
        score += 10;
      }
    }
  }
  
  // 3. Title matching
  const titleLower = section.title.toLowerCase();
  for (const word of queryWords) {
    if (titleLower.includes(word)) {
      score += 15;
    }
  }
  
  // 4. Summary matching
  const summaryLower = section.summary.toLowerCase();
  for (const word of queryWords) {
    if (summaryLower.includes(word)) {
      score += 5;
    }
  }
  
  // 5. Key points matching
  for (const point of section.keyPoints) {
    const pointLower = point.toLowerCase();
    for (const word of queryWords) {
      if (pointLower.includes(word)) {
        score += 3;
      }
    }
  }
  
  // 6. Category matching
  const categoryLower = section.category.toLowerCase();
  for (const word of queryWords) {
    if (categoryLower.includes(word)) {
      score += 8;
    }
  }
  
  // 7. Examples matching (if present)
  if (section.examples) {
    for (const example of section.examples) {
      const exampleLower = example.toLowerCase();
      for (const word of queryWords) {
        if (exampleLower.includes(word)) {
          score += 7;
        }
      }
    }
  }
  
  // 8. Boost based on business relevance
  if (section.businessRelevance === 'high') {
    score *= 1.5;
  } else if (section.businessRelevance === 'medium') {
    score *= 1.2;
  }
  
  return score;
}

/**
 * Find the most relevant IRC sections for a query
 */
export function findRelevantIRCSections(query: string, topK: number = 5): IRCSection[] {
  const scored = IRC_KNOWLEDGE_BASE.map(section => ({
    section,
    score: calculateSimilarity(query, section)
  }));
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.section);
}

/**
 * Generate context from relevant IRC sections
 */
export function generateIRCContext(sections: IRCSection[]): string {
  if (sections.length === 0) return '';
  
  return sections.map(s => `
## ${s.section}: ${s.title}
${s.summary}

**Key Points:**
${s.keyPoints.map(p => `• ${p}`).join('\n')}

${s.limits ? `**Limits:** ${Object.entries(s.limits).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}
${s.scheduleC_line ? `**Schedule C Line:** ${s.scheduleC_line}` : ''}
${s.examples ? `**Examples:** ${s.examples.slice(0, 3).join(', ')}` : ''}
`).join('\n---\n');
}

/**
 * Chunk text into smaller pieces for embedding
 * Based on Vercel RAG guide chunking strategy
 */
export function chunkText(text: string, maxChunkSize: number = 500): string[] {
  // Split by sentences first
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Search for relevant content across all sources
 */
export function searchAllSources(query: string): {
  ircSections: IRCSection[];
  context: string;
} {
  const ircSections = findRelevantIRCSections(query, 5);
  const context = generateIRCContext(ircSections);
  
  return { ircSections, context };
}

// ============================================
// Gemini Embedding Support (Optional Enhancement)
// ============================================

// Note: Gemini's embedding API can be integrated here for true vector embeddings
// For now, we use keyword-based matching which works well for structured data like IRC

/**
 * Check if Gemini embedding is available
 */
export function isGeminiEmbeddingAvailable(): boolean {
  const apiKey = localStorage.getItem('gemini_api_key');
  return !!apiKey;
}

/**
 * Generate embedding using Gemini (placeholder for future enhancement)
 * When Gemini's embedding model is used, this would generate actual vectors
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  // For now, return null - keyword matching is used instead
  // Future: Use Gemini's text-embedding model when available
  console.log('[Embedding] Using keyword-based matching (Gemini embeddings not implemented)');
  return null;
}

// ============================================
// Pre-indexed IRC Knowledge Base
// ============================================

// Create a searchable index of all IRC sections
export const IRC_INDEX = IRC_KNOWLEDGE_BASE.map(section => ({
  id: section.section,
  content: `${section.title} ${section.summary} ${section.keyPoints.join(' ')} ${section.examples?.join(' ') || ''}`,
  section,
  keywords: EXPANDED_IRC_KEYWORDS[section.section] || []
}));

export const embeddingService = {
  findRelevantIRCSections,
  generateIRCContext,
  chunkText,
  searchAllSources,
  isGeminiEmbeddingAvailable,
  generateEmbedding,
  IRC_INDEX
};

export default embeddingService;
