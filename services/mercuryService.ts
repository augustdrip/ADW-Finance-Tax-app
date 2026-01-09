
import { Transaction } from "../types";

// Use proxy in development to bypass CORS, direct API in production
const MERCURY_API_BASE = import.meta.env.DEV 
  ? "/api/mercury"  // Vite proxy handles this
  : "https://api.mercury.com/api/v1";

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
  kind: string;
  bankDescription: string | null;
}

/**
 * Service to interact with Mercury Bank API
 */
export const mercuryService = {
  /**
   * Fetches all accounts from Mercury
   */
  async fetchAccounts(apiKey: string): Promise<MercuryAccount[]> {
    const response = await fetch(`${MERCURY_API_BASE}/accounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Mercury API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.accounts || [];
  },

  /**
   * Fetches transactions from a specific Mercury account
   */
  async fetchAccountTransactions(apiKey: string, accountId: string, limit: number = 100): Promise<MercuryTransaction[]> {
    const response = await fetch(`${MERCURY_API_BASE}/account/${accountId}/transactions?limit=${limit}&status=sent`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Mercury API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.transactions || [];
  },

  /**
   * Fetches transactions from all Mercury accounts
   */
  async fetchTransactions(apiKey: string): Promise<Transaction[]> {
    if (!apiKey) throw new Error("Mercury API Key is required.");

    try {
      // First, get all accounts
      const accounts = await this.fetchAccounts(apiKey);
      
      if (accounts.length === 0) {
        throw new Error("No Mercury accounts found.");
      }

      // Fetch transactions from all accounts
      const allTransactions: MercuryTransaction[] = [];
      
      for (const account of accounts) {
        const transactions = await this.fetchAccountTransactions(apiKey, account.id);
        allTransactions.push(...transactions);
      }

      // Filter to only outgoing transactions (expenses) and map to internal format
      const expenses = allTransactions.filter(t => t.amount < 0);
      return this.mapMercuryToInternal(expenses);
    } catch (error) {
      console.error("Mercury API Error:", error);
      throw error;
    }
  },

  /**
   * Fetches the total balance across all Mercury accounts
   */
  async fetchTotalBalance(apiKey: string): Promise<number> {
    const accounts = await this.fetchAccounts(apiKey);
    return accounts.reduce((sum, acc) => sum + (acc.availableBalance || 0), 0);
  },

  /**
   * Maps Mercury API response to our internal Transaction type
   */
  mapMercuryToInternal(mercuryData: MercuryTransaction[]): Transaction[] {
    return mercuryData.map(item => ({
      id: item.id,
      date: item.postedAt ? item.postedAt.split('T')[0] : item.createdAt.split('T')[0],
      vendor: item.counterpartyName || "Unknown Vendor",
      amount: Math.abs(item.amount / 100), // Mercury amounts are in cents, convert to dollars
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
    if (text.includes("aws") || text.includes("vercel") || text.includes("openai") || text.includes("github") || text.includes("stripe") || text.includes("heroku")) return "Software/SaaS";
    if (text.includes("apple") || text.includes("best buy") || text.includes("dell") || text.includes("amazon") && text.includes("hardware")) return "Hardware";
    if (text.includes("facebook") || text.includes("google ads") || text.includes("linkedin") || text.includes("meta")) return "Advertising";
    if (text.includes("legal") || text.includes("cpa") || text.includes("law") || text.includes("attorney")) return "Legal/Professional";
    if (text.includes("uber") || text.includes("lyft") || text.includes("doordash") || text.includes("grubhub")) return "Travel/Meals";
    if (text.includes("rent") || text.includes("lease") || text.includes("office")) return "Rent/Office";
    return "Operations";
  }
};
