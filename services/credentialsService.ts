/**
 * Credentials Service
 * Securely store utility account credentials in Supabase
 * NOTE: For production, consider additional encryption
 */

import { getSupabaseClient } from './supabaseService';

export interface AccountCredential {
  id: string;
  service_name: string;
  service_url: string;
  username: string;
  password: string;
  category: 'utility' | 'financial' | 'business' | 'other';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Local storage key for offline access
const CREDENTIALS_KEY = 'adw_credentials_encrypted';

// Current user ID for multi-tenancy
let currentUserId: string | undefined;

/**
 * Set the current user ID for multi-tenant storage
 */
export function setCurrentUserId(userId: string | undefined): void {
  currentUserId = userId;
}

// Get user-specific storage key
function getUserStorageKey(): string {
  return currentUserId ? `${CREDENTIALS_KEY}_${currentUserId}` : CREDENTIALS_KEY;
}

// Simple obfuscation for localStorage (NOT true encryption - just prevents casual viewing)
// For true security, use proper encryption or don't store locally
function obfuscate(str: string): string {
  return btoa(encodeURIComponent(str));
}

function deobfuscate(str: string): string {
  try {
    return decodeURIComponent(atob(str));
  } catch {
    return str;
  }
}

// ============================================
// Supabase Operations
// ============================================

/**
 * Initialize credentials table if it doesn't exist
 * Run this SQL in Supabase:
 * 
 * CREATE TABLE IF NOT EXISTS credentials (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   service_name TEXT NOT NULL,
 *   service_url TEXT,
 *   username TEXT NOT NULL,
 *   password TEXT NOT NULL,
 *   category TEXT DEFAULT 'utility',
 *   notes TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- Enable RLS for security
 * ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
 */

export async function getAllCredentials(): Promise<AccountCredential[]> {
  const client = getSupabaseClient();
  
  if (client) {
    try {
      const { data, error } = await client
        .from('credentials')
        .select('*')
        .order('service_name');
      
      if (error) throw error;
      
      // Cache to localStorage
      if (data && data.length > 0) {
        localStorage.setItem(getUserStorageKey(), obfuscate(JSON.stringify(data)));
      }
      
      return data || [];
    } catch (e) {
      console.warn('[Credentials] Supabase fetch failed, using localStorage:', e);
    }
  }
  
  // Fallback to localStorage
  const cached = localStorage.getItem(getUserStorageKey());
  if (cached) {
    try {
      return JSON.parse(deobfuscate(cached));
    } catch {
      return [];
    }
  }
  
  return [];
}

export async function getCredential(id: string): Promise<AccountCredential | null> {
  const credentials = await getAllCredentials();
  return credentials.find(c => c.id === id) || null;
}

export async function getCredentialByService(serviceName: string): Promise<AccountCredential | null> {
  const credentials = await getAllCredentials();
  return credentials.find(c => 
    c.service_name.toLowerCase().includes(serviceName.toLowerCase())
  ) || null;
}

export async function saveCredential(credential: Omit<AccountCredential, 'id' | 'created_at' | 'updated_at'>): Promise<AccountCredential | null> {
  const client = getSupabaseClient();
  
  const now = new Date().toISOString();
  const newCredential: AccountCredential = {
    ...credential,
    id: `cred_${Date.now()}`,
    created_at: now,
    updated_at: now
  };
  
  if (client) {
    try {
      const { data, error } = await client
        .from('credentials')
        .insert({
          service_name: credential.service_name,
          service_url: credential.service_url,
          username: credential.username,
          password: credential.password,
          category: credential.category,
          notes: credential.notes
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update localStorage cache
      const all = await getAllCredentials();
      localStorage.setItem(getUserStorageKey(), obfuscate(JSON.stringify(all)));
      
      return data;
    } catch (e) {
      console.error('[Credentials] Failed to save to Supabase:', e);
    }
  }
  
  // Fallback: save to localStorage only
  const cached = localStorage.getItem(getUserStorageKey());
  const existing = cached ? JSON.parse(deobfuscate(cached)) : [];
  existing.push(newCredential);
  localStorage.setItem(getUserStorageKey(), obfuscate(JSON.stringify(existing)));
  
  return newCredential;
}

export async function updateCredential(id: string, updates: Partial<AccountCredential>): Promise<AccountCredential | null> {
  const client = getSupabaseClient();
  
  if (client) {
    try {
      const { data, error } = await client
        .from('credentials')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update localStorage cache
      const all = await getAllCredentials();
      localStorage.setItem(getUserStorageKey(), obfuscate(JSON.stringify(all)));
      
      return data;
    } catch (e) {
      console.error('[Credentials] Failed to update:', e);
    }
  }
  
  return null;
}

export async function deleteCredential(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  
  if (client) {
    try {
      const { error } = await client
        .from('credentials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update localStorage cache
      const all = await getAllCredentials();
      const filtered = all.filter(c => c.id !== id);
      localStorage.setItem(getUserStorageKey(), obfuscate(JSON.stringify(filtered)));
      
      return true;
    } catch (e) {
      console.error('[Credentials] Failed to delete:', e);
    }
  }
  
  return false;
}

/**
 * Initialize default utility credentials
 * Call this once to populate the credentials table
 */
export async function initializeUtilityCredentials(): Promise<void> {
  const existing = await getAllCredentials();
  
  // Default utility accounts for 2420 Lenai Cir
  const defaultCredentials = [
    {
      service_name: 'City of Corona Water',
      service_url: 'https://myaccount.coronaca.gov/Dashboard',
      username: 'Mustafa@agencydevworks.ai',
      password: 'Alobaidi2001!',
      category: 'utility' as const,
      notes: '2420 Lenai Cir - Water utility'
    },
    {
      service_name: 'SCE (Southern California Edison)',
      service_url: 'https://www.sce.com',
      username: 'Mustafa@agencydevworks.ai',
      password: 'Alobaidi2001!',
      category: 'utility' as const,
      notes: '2420 Lenai Cir - Electric'
    },
    {
      service_name: 'SoCalGas',
      service_url: 'https://www.socalgas.com',
      username: 'Mustafa@agencydevworks.ai',
      password: 'Alobaidi2001!',
      category: 'utility' as const,
      notes: '2420 Lenai Cir - Gas'
    },
    {
      service_name: 'Waste Management',
      service_url: 'https://www.wm.com/us/en',
      username: 'Mustafa@agencydevworks.ai',
      password: 'Alobaidi2001!',
      category: 'utility' as const,
      notes: '2420 Lenai Cir - Trash/Recycling'
    },
    {
      service_name: 'Spectrum Internet',
      service_url: 'https://www.spectrum.net',
      username: '', // User to add
      password: '', // User to add
      category: 'utility' as const,
      notes: '2420 Lenai Cir - Internet (~$80/month)'
    }
  ];
  
  for (const cred of defaultCredentials) {
    // Check if already exists
    const exists = existing.some(e => 
      e.service_name.toLowerCase() === cred.service_name.toLowerCase()
    );
    
    if (!exists) {
      await saveCredential(cred);
      console.log(`[Credentials] Added: ${cred.service_name}`);
    }
  }
}

export const credentialsService = {
  getAllCredentials,
  getCredential,
  getCredentialByService,
  saveCredential,
  updateCredential,
  deleteCredential,
  initializeUtilityCredentials,
  setCurrentUserId
};

export default credentialsService;
