/**
 * Supabase Service - Main TaxShield database connection
 * Handles transactions, agreements, invoices, and assets
 * Now with multi-tenant user_id support
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// TaxShield Supabase Project credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client (may be null if not configured)
let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Not configured - using localStorage only');
    return null;
  }
  
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Connected to TaxShield database');
  }
  return supabase;
}

// Get current authenticated user
async function getCurrentUser(): Promise<User | null> {
  const client = getClient();
  if (!client) return null;
  
  const { data: { user } } = await client.auth.getUser();
  return user;
}

// Generic CRUD operations with optional user filtering
// When userId is provided, filters by user_id column
async function fetchFromTable(table: string, userId?: string) {
  const client = getClient();
  if (!client) return [];
  
  try {
    let query = client.from(table).select('*');
    
    // Apply user filter if provided (multi-tenant mode)
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('[Supabase] Failed to fetch from ' + table + ':', e);
    return [];
  }
}

async function upsertToTable(table: string, record: any, userId?: string) {
  const client = getClient();
  if (!client) return null;
  
  try {
    // Add user_id to record if provided
    const recordWithUser = userId ? { ...record, user_id: userId } : record;
    
    const { data, error } = await client.from(table).upsert(recordWithUser).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('[Supabase] Failed to upsert to ' + table + ':', e);
    return null;
  }
}

async function deleteFromTable(table: string, id: string, userId?: string) {
  const client = getClient();
  if (!client) return false;
  
  try {
    let query = client.from(table).delete().eq('id', id);
    
    // Also check user_id for security
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] Failed to delete from ' + table + ':', e);
    return false;
  }
}

// Export raw Supabase client for services that need direct access
export function getSupabaseClient(): SupabaseClient | null {
  return getClient();
}

// Export getCurrentUser for auth checks
export { getCurrentUser };

// Database interface with table-specific methods
// Each method now optionally accepts userId for multi-tenant filtering
export const db = {
  transactions: {
    fetch: (userId?: string) => fetchFromTable('transactions', userId),
    upsert: (record: any, userId?: string) => upsertToTable('transactions', record, userId),
    delete: (id: string, userId?: string) => deleteFromTable('transactions', id, userId)
  },
  agreements: {
    fetch: (userId?: string) => fetchFromTable('agreements', userId),
    upsert: (record: any, userId?: string) => upsertToTable('agreements', record, userId),
    delete: (id: string, userId?: string) => deleteFromTable('agreements', id, userId)
  },
  invoices: {
    fetch: (userId?: string) => fetchFromTable('invoices', userId),
    upsert: (record: any, userId?: string) => upsertToTable('invoices', record, userId),
    delete: (id: string, userId?: string) => deleteFromTable('invoices', id, userId)
  },
  assets: {
    fetch: (userId?: string) => fetchFromTable('assets', userId),
    upsert: (record: any, userId?: string) => upsertToTable('assets', record, userId),
    delete: (id: string, userId?: string) => deleteFromTable('assets', id, userId)
  },
  // New tables for SaaS
  profiles: {
    fetch: (userId?: string) => fetchFromTable('profiles', userId),
    upsert: (record: any) => upsertToTable('profiles', record),
    get: async (userId: string) => {
      const client = getClient();
      if (!client) return null;
      const { data } = await client.from('profiles').select('*').eq('id', userId).single();
      return data;
    }
  },
  plaid_items: {
    fetch: (userId?: string) => fetchFromTable('plaid_items', userId),
    upsert: (record: any, userId?: string) => upsertToTable('plaid_items', record, userId),
    delete: (id: string, userId?: string) => deleteFromTable('plaid_items', id, userId)
  }
};

export default db;
