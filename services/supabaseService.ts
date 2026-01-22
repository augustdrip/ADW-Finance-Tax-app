/**
 * Supabase Service - Main TaxShield database connection
 * Handles transactions, agreements, invoices, and assets
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// Generic CRUD operations that gracefully handle missing Supabase
async function fetchFromTable(table: string) {
  const client = getClient();
  if (!client) return [];
  
  try {
    const { data, error } = await client.from(table).select('*');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('[Supabase] Failed to fetch from ' + table + ':', e);
    return [];
  }
}

async function upsertToTable(table: string, record: any) {
  const client = getClient();
  if (!client) return null;
  
  try {
    const { data, error } = await client.from(table).upsert(record).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('[Supabase] Failed to upsert to ' + table + ':', e);
    return null;
  }
}

async function deleteFromTable(table: string, id: string) {
  const client = getClient();
  if (!client) return false;
  
  try {
    const { error } = await client.from(table).delete().eq('id', id);
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

// Database interface with table-specific methods
export const db = {
  transactions: {
    fetch: () => fetchFromTable('transactions'),
    upsert: (record: any) => upsertToTable('transactions', record),
    delete: (id: string) => deleteFromTable('transactions', id)
  },
  agreements: {
    fetch: () => fetchFromTable('agreements'),
    upsert: (record: any) => upsertToTable('agreements', record),
    delete: (id: string) => deleteFromTable('agreements', id)
  },
  invoices: {
    fetch: () => fetchFromTable('invoices'),
    upsert: (record: any) => upsertToTable('invoices', record),
    delete: (id: string) => deleteFromTable('invoices', id)
  },
  assets: {
    fetch: () => fetchFromTable('assets'),
    upsert: (record: any) => upsertToTable('assets', record),
    delete: (id: string) => deleteFromTable('assets', id)
  }
};

export default db;
