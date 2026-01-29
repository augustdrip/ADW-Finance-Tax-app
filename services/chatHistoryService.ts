/**
 * Chat History Service
 * Persists AI War Room conversations for future reference
 * Based on Vercel AI SDK RAG patterns: https://ai-sdk.dev/cookbook/guides/rag-chatbot
 */

import { getSupabaseClient } from './supabaseService';

// Chat message interface (matches types.ts)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    ircSectionsUsed?: string[];
    toolsCalled?: string[];
    tokensUsed?: number;
  };
}

// Chat session interface
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  summary?: string;
  tags?: string[];
}

// Local storage keys
const CHAT_SESSIONS_KEY = 'adw_chat_sessions';
const CURRENT_SESSION_KEY = 'adw_current_session';

// ============================================
// Local Storage Operations (Fallback)
// ============================================

function getSessionsFromLocalStorage(): ChatSession[] {
  try {
    const data = localStorage.getItem(CHAT_SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('[ChatHistory] Failed to parse local storage:', e);
    return [];
  }
}

function saveSessionsToLocalStorage(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('[ChatHistory] Failed to save to local storage:', e);
  }
}

function getCurrentSessionIdFromLocalStorage(): string | null {
  return localStorage.getItem(CURRENT_SESSION_KEY);
}

function setCurrentSessionIdInLocalStorage(id: string): void {
  localStorage.setItem(CURRENT_SESSION_KEY, id);
}

// ============================================
// Supabase Operations
// ============================================

async function getSessionsFromSupabase(): Promise<ChatSession[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(row => ({
      id: row.id,
      title: row.title,
      messages: row.messages || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      summary: row.summary,
      tags: row.tags
    }));
  } catch (e) {
    console.warn('[ChatHistory] Supabase fetch failed, using localStorage:', e);
    return [];
  }
}

async function saveSessionToSupabase(session: ChatSession): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('chat_sessions')
      .upsert({
        id: session.id,
        title: session.title,
        messages: session.messages,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        summary: session.summary,
        tags: session.tags
      });

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[ChatHistory] Supabase save failed:', e);
    return false;
  }
}

async function deleteSessionFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[ChatHistory] Supabase delete failed:', e);
    return false;
  }
}

// ============================================
// Public API - Hybrid Storage (Supabase + localStorage)
// ============================================

/**
 * Generate a title for a chat session based on the first message
 */
function generateSessionTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Conversation';
  
  const content = firstUserMessage.content;
  // Truncate to first 50 chars or first sentence
  const title = content.length > 50 
    ? content.substring(0, 47) + '...'
    : content.split(/[.!?]/)[0] || content;
  
  return title;
}

/**
 * Create a new chat session
 */
export function createSession(): ChatSession {
  const session: ChatSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: 'New Conversation',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: []
  };
  
  // Save to localStorage immediately
  const sessions = getSessionsFromLocalStorage();
  sessions.unshift(session);
  saveSessionsToLocalStorage(sessions);
  setCurrentSessionIdInLocalStorage(session.id);
  
  return session;
}

/**
 * Get all chat sessions (from Supabase if available, otherwise localStorage)
 */
export async function getAllSessions(): Promise<ChatSession[]> {
  // Try Supabase first
  const supabaseSessions = await getSessionsFromSupabase();
  
  if (supabaseSessions.length > 0) {
    // Sync to localStorage for offline access
    saveSessionsToLocalStorage(supabaseSessions);
    return supabaseSessions;
  }
  
  // Fallback to localStorage
  return getSessionsFromLocalStorage();
}

/**
 * Get a specific session by ID
 */
export async function getSession(id: string): Promise<ChatSession | null> {
  const sessions = await getAllSessions();
  return sessions.find(s => s.id === id) || null;
}

/**
 * Get the current active session (or create one if none exists)
 */
export async function getCurrentSession(): Promise<ChatSession> {
  const currentId = getCurrentSessionIdFromLocalStorage();
  
  if (currentId) {
    const session = await getSession(currentId);
    if (session) return session;
  }
  
  // No current session, create one
  return createSession();
}

/**
 * Add a message to a session
 */
export async function addMessage(
  sessionId: string, 
  message: ChatMessage
): Promise<ChatSession | null> {
  const sessions = getSessionsFromLocalStorage();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex === -1) return null;
  
  const session = sessions[sessionIndex];
  session.messages.push(message);
  session.updatedAt = new Date().toISOString();
  
  // Auto-generate title from first user message
  if (session.messages.length === 1 && message.role === 'user') {
    session.title = generateSessionTitle(session.messages);
  }
  
  // Update localStorage
  sessions[sessionIndex] = session;
  saveSessionsToLocalStorage(sessions);
  
  // Async save to Supabase (don't await)
  saveSessionToSupabase(session).catch(console.warn);
  
  return session;
}

/**
 * Update multiple messages in a session (for streaming responses)
 */
export async function updateSessionMessages(
  sessionId: string,
  messages: ChatMessage[]
): Promise<ChatSession | null> {
  const sessions = getSessionsFromLocalStorage();
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex === -1) return null;
  
  const session = sessions[sessionIndex];
  session.messages = messages;
  session.updatedAt = new Date().toISOString();
  
  // Auto-generate title
  if (messages.length > 0 && session.title === 'New Conversation') {
    session.title = generateSessionTitle(messages);
  }
  
  // Update localStorage
  sessions[sessionIndex] = session;
  saveSessionsToLocalStorage(sessions);
  
  // Async save to Supabase
  saveSessionToSupabase(session).catch(console.warn);
  
  return session;
}

/**
 * Delete a chat session
 */
export async function deleteSession(id: string): Promise<boolean> {
  // Remove from localStorage
  const sessions = getSessionsFromLocalStorage();
  const filtered = sessions.filter(s => s.id !== id);
  saveSessionsToLocalStorage(filtered);
  
  // Clear current session if it was deleted
  if (getCurrentSessionIdFromLocalStorage() === id) {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }
  
  // Delete from Supabase
  await deleteSessionFromSupabase(id);
  
  return true;
}

/**
 * Set the current active session
 */
export function setCurrentSession(id: string): void {
  setCurrentSessionIdInLocalStorage(id);
}

/**
 * Search chat history for relevant messages
 */
export async function searchChatHistory(query: string): Promise<{
  session: ChatSession;
  message: ChatMessage;
  relevance: number;
}[]> {
  const sessions = await getAllSessions();
  const results: { session: ChatSession; message: ChatMessage; relevance: number }[] = [];
  
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  for (const session of sessions) {
    for (const message of session.messages) {
      const contentLower = message.content.toLowerCase();
      let relevance = 0;
      
      // Exact phrase match
      if (contentLower.includes(queryLower)) {
        relevance += 10;
      }
      
      // Word matches
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          relevance += 2;
        }
      }
      
      if (relevance > 0) {
        results.push({ session, message, relevance });
      }
    }
  }
  
  // Sort by relevance
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
}

/**
 * Export chat history as JSON
 */
export async function exportChatHistory(): Promise<string> {
  const sessions = await getAllSessions();
  return JSON.stringify(sessions, null, 2);
}

/**
 * Import chat history from JSON
 */
export async function importChatHistory(json: string): Promise<number> {
  try {
    const sessions: ChatSession[] = JSON.parse(json);
    const existing = getSessionsFromLocalStorage();
    
    // Merge, avoiding duplicates
    const existingIds = new Set(existing.map(s => s.id));
    const newSessions = sessions.filter(s => !existingIds.has(s.id));
    
    const merged = [...newSessions, ...existing];
    saveSessionsToLocalStorage(merged);
    
    // Sync to Supabase
    for (const session of newSessions) {
      await saveSessionToSupabase(session);
    }
    
    return newSessions.length;
  } catch (e) {
    console.error('[ChatHistory] Import failed:', e);
    return 0;
  }
}

export const chatHistoryService = {
  createSession,
  getAllSessions,
  getSession,
  getCurrentSession,
  addMessage,
  updateSessionMessages,
  deleteSession,
  setCurrentSession,
  searchChatHistory,
  exportChatHistory,
  importChatHistory
};

export default chatHistoryService;
