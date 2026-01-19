
import { createClient } from '@supabase/supabase-js';
import { Transaction, Invoice, ClientAgreement, CompanyAsset } from '../types';

// Load from environment variables (VITE_ prefix required for client-side access)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const handleSupabaseError = (context: string, error: any) => {
  const code = error?.code || 'N/A';
  const message = error?.message || 'Unknown error';
  if (code === 'PGRST205' || code === '42P01') {
    console.warn(`[Supabase] Table '${context}' not found.`);
    return true;
  }
  console.error(`[Supabase] Error in ${context}:`, message);
  return false;
};

export const db = {
  transactions: {
    async fetch() {
      if (!supabase) return [];
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (error) { handleSupabaseError('transactions', error); return []; }
      return data || [];
    },
    async upsert(transaction: Transaction) {
      if (!supabase) return transaction;
      const { data, error } = await supabase.from('transactions').upsert(transaction).select();
      if (error) throw error;
      return data[0];
    },
    async delete(id: string) {
      if (!supabase) return;
      const { error } = await supabase.from('transactions').delete().match({ id });
      if (error) throw error;
    }
  },
  invoices: {
    async fetch() {
      if (!supabase) return [];
      const { data, error } = await supabase.from('invoices').select('*').order('issueDate', { ascending: false });
      if (error) { handleSupabaseError('invoices', error); return []; }
      return data || [];
    },
    async upsert(invoice: Invoice) {
      if (!supabase) return invoice;
      const { data, error } = await supabase.from('invoices').upsert(invoice).select();
      if (error) throw error;
      return data[0];
    },
    async delete(id: string) {
      if (!supabase) return;
      const { error } = await supabase.from('invoices').delete().match({ id });
      if (error) throw error;
    }
  },
  agreements: {
    async fetch() {
      if (!supabase) return [];
      const { data, error } = await supabase.from('agreements').select('*').order('effectiveDate', { ascending: false });
      if (error) { handleSupabaseError('agreements', error); return []; }
      return data || [];
    },
    async upsert(agreement: ClientAgreement) {
      if (!supabase) return agreement;
      const { data, error } = await supabase.from('agreements').upsert(agreement).select();
      if (error) throw error;
      return data[0];
    },
    async delete(id: string) {
      if (!supabase) return;
      const { error } = await supabase.from('agreements').delete().match({ id });
      if (error) throw error;
    }
  },
  assets: {
    async fetch() {
      if (!supabase) return [];
      const { data, error } = await supabase.from('assets').select('*').order('dateAdded', { ascending: false });
      if (error) { handleSupabaseError('assets', error); return []; }
      return data || [];
    },
    async upsert(asset: CompanyAsset) {
      if (!supabase) return asset;
      const { data, error } = await supabase.from('assets').upsert(asset).select();
      if (error) throw error;
      return data[0];
    },
    async delete(id: string) {
      if (!supabase) return;
      const { error } = await supabase.from('assets').delete().match({ id });
      if (error) throw error;
    }
  }
};
