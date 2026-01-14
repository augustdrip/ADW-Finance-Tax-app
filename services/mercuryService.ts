
import { Transaction } from "../types";

// Uses Vite proxy in development to bypass CORS
// The /api/mercury route is proxied to https://api.mercury.com/api/v1 by vite.config.ts
const MERCURY_API_BASE = "/api/mercury";

// Mercury API key can be set in .env.local as MERCURY_API_KEY
// Or passed directly to the functions
const ENV_MERCURY_KEY = process.env.MERCURY_API_KEY || '';

// Export to check if env key is configured
export const hasMercuryEnvKey = () => {
  if (ENV_MERCURY_KEY) {
    console.log("[Mercury] Environment API key found.");
    return true;
  }
  return false;
};

/**
 * Interface for Mercury's API Account format
 */
interface MercuryAccount {
  id: string;
  name: string;
  status: string;
  type: string;
  availableBalance: number;
  currentBalance: number;
}

/**
 * Interface for Mercury's API Transaction format
 */
interface MercuryTransaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  postedAt: string | null;
  counterpartyName: string;
  note: string | null;
  externalMemo: string | null;
  bankDescription: string | null;
  kind: string;
}

/**
 * Service to interact with Mercury Bank API
 * 
 * IMPORTANT: Mercury API requires fetching accounts first, then transactions per account.
 * Direct browser calls are blocked by CORS - must use a proxy.
 */
export const mercuryService = {
  /**
   * Fetches all accounts from Mercury
   */
  async fetchAccounts(apiKey: string): Promise<MercuryAccount[]> {
    // Debug: Log key info (masked for security)
    console.log("[Mercury] API Key length:", apiKey?.length);
    console.log("[Mercury] API Key starts with:", apiKey?.substring(0, 20) + "...");
    console.log("[Mercury] Calling:", `${MERCURY_API_BASE}/accounts`);
    
    const response = await fetch(`${MERCURY_API_BASE}/accounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log("[Mercury] Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("[Mercury] Error response:", JSON.stringify(errorData, null, 2));
      const errMsg = errorData.errors?.[0]?.message || errorData.message || `Mercury API Error: ${response.status}`;
      throw new Error(errMsg);
    }

    const data = await response.json();
    return data.accounts || [];
  },

  /**
   * Fetches ALL transactions from a specific Mercury account using pagination
   * Uses date range to get complete history back to account creation
   */
  async fetchAccountTransactions(apiKey: string, accountId: string): Promise<MercuryTransaction[]> {
    const allTransactions: MercuryTransaction[] = [];
    let offset = 0;
    const limit = 500; // Max per request
    let hasMore = true;

    // Set date range to get ALL history (from 2020 to now + 1 day)
    const startDate = '2020-01-01';
    const endDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // Tomorrow
    
    console.log(`[Mercury] Fetching all transactions for account ${accountId}...`);
    console.log(`[Mercury] Date range: ${startDate} to ${endDate}`);

    while (hasMore) {
      // Mercury API supports: limit, offset, start, end, status, search
      const url = `${MERCURY_API_BASE}/account/${accountId}/transactions?limit=${limit}&offset=${offset}&start=${startDate}&end=${endDate}`;
      console.log(`[Mercury] Fetching: offset=${offset}, limit=${limit}, start=${startDate}, end=${endDate}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[Mercury] Error response:`, errorData);
        throw new Error(errorData.message || `Mercury API Error: ${response.status}`);
      }

      const data = await response.json();
      const transactions = data.transactions || [];
      const total = data.total; // Mercury may return total count
      
      allTransactions.push(...transactions);
      console.log(`[Mercury] Fetched ${transactions.length} transactions (total so far: ${allTransactions.length})${total ? ` of ${total} total` : ''}`);

      // Check if there are more transactions
      if (transactions.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
        // Safety: if we've fetched more than 10,000, stop to prevent infinite loop
        if (offset > 10000) {
          console.warn(`[Mercury] Stopping pagination at ${offset} to prevent infinite loop`);
          hasMore = false;
        }
      }
    }

    console.log(`[Mercury] Total transactions fetched for account: ${allTransactions.length}`);
    return allTransactions;
  },

  /**
   * Fetches ALL transactions from all Mercury accounts (complete history)
   * @param apiKey - Optional. If not provided, uses MERCURY_API_KEY from .env.local
   * @param expensesOnly - If true, only return outgoing transactions (default: true for backward compatibility)
   */
  async fetchTransactions(apiKey?: string, expensesOnly: boolean = true): Promise<Transaction[]> {
    const key = apiKey || ENV_MERCURY_KEY;
    if (!key) throw new Error("Mercury API Key is required. Set MERCURY_API_KEY in .env.local or pass it directly.");

    try {
      // Step 1: Get all accounts
      const accounts = await this.fetchAccounts(key);
      console.log(`[Mercury] Found ${accounts.length} accounts`);
      console.log(`[Mercury] Accounts:`, accounts.map(a => `${a.name} (${a.id})`));
      
      if (accounts.length === 0) {
        throw new Error("No Mercury accounts found. Check your API key permissions.");
      }

      // Step 2: Fetch ALL transactions from each account (with pagination and date range)
      const allTransactions: MercuryTransaction[] = [];
      
      for (const account of accounts) {
        console.log(`[Mercury] ===== Fetching transactions for account: ${account.name} (${account.id}) =====`);
        const transactions = await this.fetchAccountTransactions(key, account.id);
        console.log(`[Mercury] Got ${transactions.length} transactions from ${account.name}`);
        allTransactions.push(...transactions);
      }

      console.log(`[Mercury] ========================================`);
      console.log(`[Mercury] Total raw transactions across all accounts: ${allTransactions.length}`);

      // Log breakdown
      const incomingCount = allTransactions.filter(t => t.amount > 0).length;
      const outgoingCount = allTransactions.filter(t => t.amount < 0).length;
      console.log(`[Mercury] Incoming (credits): ${incomingCount}`);
      console.log(`[Mercury] Outgoing (debits/expenses): ${outgoingCount}`);
      
      // Log date range of ALL transactions
      if (allTransactions.length > 0) {
        const dates = allTransactions.map(t => t.postedAt || t.createdAt).sort();
        console.log(`[Mercury] Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
        
        // Log oldest and newest
        console.log(`[Mercury] Oldest transaction date: ${dates[0]}`);
        console.log(`[Mercury] Newest transaction date: ${dates[dates.length - 1]}`);
      }

      // Step 3: Filter based on expensesOnly flag
      const transactionsToReturn = expensesOnly 
        ? allTransactions.filter(t => t.amount < 0)
        : allTransactions;
      
      console.log(`[Mercury] Returning ${transactionsToReturn.length} transactions (expensesOnly: ${expensesOnly})`);

      return this.mapMercuryToInternal(transactionsToReturn);
    } catch (error: any) {
      console.error("Mercury API Error:", error);
      
      // Provide helpful error messages
      if (error.message?.includes('Failed to fetch')) {
        throw new Error("Cannot connect to Mercury. In production, ensure your API proxy is configured.");
      }
      throw error;
    }
  },

  /**
   * Fetches the total balance across all Mercury accounts
   * @param apiKey - Optional. If not provided, uses MERCURY_API_KEY from .env.local
   */
  async fetchTotalBalance(apiKey?: string): Promise<number> {
    const key = apiKey || ENV_MERCURY_KEY;
    const accounts = await this.fetchAccounts(key);
    console.log("[Mercury] Accounts for balance:", accounts.map(a => ({ name: a.name, availableBalance: a.availableBalance, currentBalance: a.currentBalance })));
    const total = accounts.reduce((sum, acc) => sum + (acc.availableBalance || 0), 0);
    console.log("[Mercury] Total balance (cents):", total);
    return total;
  },

  /**
   * Maps Mercury API response to our internal Transaction type
   */
  mapMercuryToInternal(mercuryData: MercuryTransaction[]): Transaction[] {
    return mercuryData.map(item => ({
      id: item.id,
      date: item.postedAt ? item.postedAt.split('T')[0] : item.createdAt.split('T')[0],
      vendor: item.counterpartyName || "Unknown Vendor",
      amount: Math.abs(item.amount), // Mercury returns amounts in dollars
      category: this.guessCategory(item.bankDescription || '', item.counterpartyName || ''),
      context: `Mercury: ${item.note || item.externalMemo || item.bankDescription || 'Bank transfer'}`,
      attachments: [],
      bankVerified: true,
      bankId: item.id
    }));
  },

  /**
   * Helper to guess category based on vendor name/description
   */
  guessCategory(description: string, vendor: string): string {
    const text = ((description || '') + " " + (vendor || '')).toLowerCase();
    if (text.includes("aws") || text.includes("vercel") || text.includes("openai") || text.includes("github") || text.includes("stripe")) return "Software/SaaS";
    if (text.includes("apple") || text.includes("best buy") || text.includes("dell")) return "Hardware";
    if (text.includes("facebook") || text.includes("google ads") || text.includes("linkedin") || text.includes("meta")) return "Advertising";
    if (text.includes("legal") || text.includes("cpa") || text.includes("law") || text.includes("attorney")) return "Legal/Professional";
    if (text.includes("uber") || text.includes("lyft") || text.includes("doordash")) return "Travel/Meals";
    return "Operations";
  }
};