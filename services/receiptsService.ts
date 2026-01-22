/**
 * Receipts Service - Uses MAIN TaxShield Supabase database
 * All receipts and transaction links stored in one place!
 */

import { getSupabaseClient } from './supabaseService';

// Helper to get the Supabase client
function getClient() {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[Receipts] Supabase not configured - using localStorage only');
  }
  return client;
}

// Receipt type from the receipts table
export interface Receipt {
  id: string;
  file_path: string;
  public_url: string;
  created_at: string;
  // Database fields for transaction linking
  transaction_id?: string | null;
  vendor_name?: string | null;
  amount?: number | null;
  receipt_date?: string | null;
  match_confidence?: string | null;
  notes?: string | null;
}

// Local cache for fast synchronous lookups (synced with database)
let receiptLinksCache: Record<string, string> = {};

// Initialize cache from localStorage on load
function initCache() {
  const stored = localStorage.getItem('receipt_transaction_links');
  if (stored) {
    receiptLinksCache = JSON.parse(stored);
  }
}
initCache();

// Save cache to localStorage
function saveCache() {
  localStorage.setItem('receipt_transaction_links', JSON.stringify(receiptLinksCache));
}

export const receiptsService = {
  /**
   * Fetch all receipts from the database
   */
  async fetchAllReceipts(): Promise<Receipt[]> {
    const client = getClient();
    if (!client) return [];
    
    try {
      const { data, error } = await client
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Receipts] Error fetching receipts:', error);
        throw error;
      }

      // Sync cache with database
      const newCache: Record<string, string> = {};
      data?.forEach(r => {
        if (r.transaction_id) {
          newCache[r.id] = r.transaction_id;
        }
      });
      receiptLinksCache = newCache;
      saveCache();

      console.log(`[Receipts] Fetched ${data?.length || 0} receipts from main database`);
      return data || [];
    } catch (error) {
      console.error('[Receipts] Failed to fetch receipts:', error);
      throw error;
    }
  },

  /**
   * Fetch receipts within a date range (useful for matching to transactions)
   */
  async fetchReceiptsByDateRange(startDate: string, endDate: string): Promise<Receipt[]> {
    const client = getClient();
    if (!client) return [];
    
    try {
      const { data, error } = await client
        .from('receipts')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Receipts] Error fetching receipts by date:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[Receipts] Failed to fetch receipts by date:', error);
      throw error;
    }
  },

  /**
   * Get a single receipt by ID
   */
  async getReceiptById(id: string): Promise<Receipt | null> {
    const client = getClient();
    if (!client) return null;
    
    try {
      const { data, error } = await client
        .from('receipts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[Receipts] Error fetching receipt:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Receipts] Failed to fetch receipt:', error);
      return null;
    }
  },

  /**
   * Link a receipt to a transaction - SAVES TO DATABASE
   */
  async linkReceiptToTransaction(receiptId: string, transactionId: string): Promise<void> {
    // Update local cache immediately for fast UI response
    receiptLinksCache[receiptId] = transactionId;
    saveCache();
    console.log(`[Receipts] Linked receipt ${receiptId} to transaction ${transactionId}`);

    // Save to database
    const client = getClient();
    if (client) {
      try {
        const { error } = await client
          .from('receipts')
          .update({ transaction_id: transactionId })
          .eq('id', receiptId);

        if (error) {
          console.error('[Receipts] Error saving link to database:', error);
          // Keep local cache as fallback
        } else {
          console.log('[Receipts] Link saved to database');
        }
      } catch (error) {
        console.error('[Receipts] Failed to save link:', error);
      }
    }
  },

  /**
   * Unlink a receipt from a transaction - SAVES TO DATABASE
   */
  async unlinkReceipt(receiptId: string): Promise<void> {
    // Update local cache immediately
    delete receiptLinksCache[receiptId];
    saveCache();
    console.log(`[Receipts] Unlinked receipt ${receiptId}`);

    // Save to database
    const client = getClient();
    if (client) {
      try {
        const { error } = await client
          .from('receipts')
          .update({ transaction_id: null })
          .eq('id', receiptId);

        if (error) {
          console.error('[Receipts] Error removing link from database:', error);
        } else {
          console.log('[Receipts] Link removed from database');
        }
      } catch (error) {
        console.error('[Receipts] Failed to remove link:', error);
      }
    }
  },

  /**
   * Get all receipt-to-transaction links (from cache for fast sync access)
   */
  getReceiptLinks(): Record<string, string> {
    return { ...receiptLinksCache };
  },

  /**
   * Get receipts linked to a specific transaction (sync, uses cache)
   */
  getReceiptsForTransaction(transactionId: string): string[] {
    return Object.entries(receiptLinksCache)
      .filter(([_, txnId]) => txnId === transactionId)
      .map(([receiptId]) => receiptId);
  },

  /**
   * Get the transaction ID linked to a receipt (sync, uses cache)
   */
  getTransactionForReceipt(receiptId: string): string | null {
    return receiptLinksCache[receiptId] || null;
  },

  /**
   * Fetch receipts for a specific transaction from database
   */
  async fetchReceiptsForTransaction(transactionId: string): Promise<Receipt[]> {
    const client = getClient();
    if (!client) return [];
    
    try {
      const { data, error } = await client
        .from('receipts')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Receipts] Error fetching receipts for transaction:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Receipts] Failed to fetch receipts for transaction:', error);
      return [];
    }
  },

  /**
   * Get unlinked receipts (no transaction_id)
   */
  async fetchUnlinkedReceipts(): Promise<Receipt[]> {
    const client = getClient();
    if (!client) return [];
    
    try {
      const { data, error } = await client
        .from('receipts')
        .select('*')
        .is('transaction_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Receipts] Error fetching unlinked receipts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Receipts] Failed to fetch unlinked receipts:', error);
      return [];
    }
  }
};

export default receiptsService;
