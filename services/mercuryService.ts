
import { Transaction } from "../types";

// Always use the Render proxy (has static IP for Mercury whitelist)
// This works both in production AND locally without needing to whitelist your home IP
const MERCURY_API_BASE = "https://mercury-proxy.onrender.com/api/mercury";

// Mercury API key is stored in localStorage (user enters in Settings)
function getMercuryKey(): string {
  return localStorage.getItem('mercury_key') || '';
}

// Export to check if key is configured
export const hasMercuryEnvKey = () => {
  const key = getMercuryKey();
  if (key) {
    console.log("[Mercury] API key found in localStorage.");
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
  // Credit card specific fields
  creditLimit?: number;
  pendingBalance?: number;
}

/**
 * Interface for Mercury's Credit Card format
 */
interface MercuryCreditCard {
  id: string;
  name?: string;
  status: string;
  currentBalance: number;
  availableCredit: number;
  creditLimit: number;
  pendingBalance?: number;
  statementBalance?: number;
  minimumPayment?: number;
  paymentDueDate?: string;
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
  // Fields for who made the transaction
  creatorId?: string;
  creatorName?: string;
  cardholderName?: string;
  initiatedByName?: string;
  dashboardLink?: string;
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
    // Defensive: ensure apiKey is actually a string (prevents runtime "substring is not a function")
    const apiKeyStr = typeof apiKey === 'string' ? apiKey : String((apiKey as any) ?? '');
    if (!apiKeyStr || apiKeyStr === 'undefined' || apiKeyStr === 'null') {
      throw new Error("Mercury API Key is required. Paste your token again.");
    }

    // Debug: Log key info (masked for security)
    console.log("[Mercury] API Key length:", apiKeyStr.length);
    console.log("[Mercury] API Key starts with:", apiKeyStr.substring(0, 20) + "...");
    console.log("[Mercury] Calling:", `${MERCURY_API_BASE}/accounts`);
    
    const response = await fetch(`${MERCURY_API_BASE}/accounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKeyStr}`,
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
   * Fetches credit cards from Mercury (separate endpoint from accounts)
   */
  async fetchCreditCards(apiKey: string): Promise<MercuryCreditCard[]> {
    const apiKeyStr = typeof apiKey === 'string' ? apiKey : String((apiKey as any) ?? '');
    if (!apiKeyStr || apiKeyStr === 'undefined' || apiKeyStr === 'null') {
      return []; // Return empty instead of throwing - credit cards are optional
    }

    console.log("[Mercury] Fetching credit cards...");
    
    try {
      const response = await fetch(`${MERCURY_API_BASE}/credit-cards`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKeyStr}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log("[Mercury] Credit cards response status:", response.status);

      if (!response.ok) {
        // Credit card endpoint might not exist or user might not have a credit card
        console.log("[Mercury] Credit cards endpoint returned:", response.status);
        return [];
      }

      const data = await response.json();
      console.log("[Mercury] Credit cards raw response:", JSON.stringify(data, null, 2));
      return data.creditCards || data.cards || data || [];
    } catch (error) {
      console.log("[Mercury] Credit cards fetch error (may not be available):", error);
      return [];
    }
  },

  /**
   * Fetches the Mercury credit account info (includes account ID needed for transactions)
   */
  async fetchCreditAccount(apiKey: string): Promise<any> {
    const apiKeyStr = typeof apiKey === 'string' ? apiKey : String((apiKey as any) ?? '');
    if (!apiKeyStr) return null;

    console.log("[Mercury] 💳 Fetching credit account info...");
    
    try {
      const response = await fetch(`${MERCURY_API_BASE}/credit`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKeyStr}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`[Mercury] 💳 Credit endpoint returned ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log("[Mercury] 💳 Credit account data:", JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.log("[Mercury] 💳 Error fetching credit account:", error);
      return null;
    }
  },

  /**
   * Fetches credit card transactions from Mercury using the /credit endpoint
   * This is the proper way to get Mercury credit card transactions
   */
  async fetchCreditCardTransactions(apiKey: string): Promise<MercuryTransaction[]> {
    const apiKeyStr = typeof apiKey === 'string' ? apiKey : String((apiKey as any) ?? '');
    if (!apiKeyStr) return [];

    console.log("[Mercury] 💳 Fetching credit card transactions via /credit/transactions...");
    
    const allTransactions: MercuryTransaction[] = [];
    
    try {
      // Use the dedicated credit transactions endpoint on the proxy
      let offset = 0;
      const limit = 500;
      let hasMore = true;
      const startDate = '2020-01-01';
      const endDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      while (hasMore) {
        const url = `${MERCURY_API_BASE}/credit/transactions?limit=${limit}&offset=${offset}&start=${startDate}&end=${endDate}`;
        console.log(`[Mercury] 💳 Fetching: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKeyStr}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.log(`[Mercury] 💳 Credit transactions endpoint returned ${response.status}:`, errorData);
          break;
        }

        const data = await response.json();
        const transactions = data.transactions || [];
        
        console.log(`[Mercury] 💳 Received ${transactions.length} credit card transactions (creditAccountId: ${data.creditAccountId})`);
        
        // Mark these as credit card transactions
        transactions.forEach((t: any) => {
          t.isCreditCard = true;
          t.source = 'mercury_credit';
        });
        
        allTransactions.push(...transactions);

        if (transactions.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
          if (offset > 5000) hasMore = false;
        }
      }
    } catch (error) {
      console.log("[Mercury] 💳 Error fetching credit card transactions:", error);
    }

    // Also try the global transactions endpoint and filter for credit card transactions
    if (allTransactions.length === 0) {
      console.log("[Mercury] 💳 Trying to find credit card transactions in global endpoint...");
      try {
        const globalTxns = await this.fetchGlobalTransactions(apiKeyStr);
        const creditTxns = globalTxns.filter(t => 
          t.kind?.toLowerCase().includes('credit') || 
          t.kind?.toLowerCase().includes('card') ||
          (t as any).creditCardInfo
        );
        console.log(`[Mercury] 💳 Found ${creditTxns.length} credit card transactions in global endpoint`);
        allTransactions.push(...creditTxns);
      } catch (e) {
        console.log("[Mercury] 💳 Global endpoint fallback failed:", e);
      }
    }

    console.log(`[Mercury] 💳 Total credit card transactions: ${allTransactions.length}`);
    return allTransactions;
  },

  /**
   * Fetches transactions from the GLOBAL /transactions endpoint
   * This might return transactions not visible in account-specific endpoints
   */
  async fetchGlobalTransactions(apiKey: string): Promise<MercuryTransaction[]> {
    const apiKeyStr = typeof apiKey === 'string' ? apiKey : String((apiKey as any) ?? '');
    
    console.log("[Mercury] 🌐 Fetching from GLOBAL /transactions endpoint...");
    
    const allTransactions: MercuryTransaction[] = [];
    let offset = 0;
    const limit = 500;
    let hasMore = true;
    
    const startDate = '2020-01-01';
    const endDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    while (hasMore) {
      const url = `${MERCURY_API_BASE}/transactions?limit=${limit}&offset=${offset}&start=${startDate}&end=${endDate}`;
      console.log(`[Mercury] 🌐 Global fetch: offset=${offset}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKeyStr}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`[Mercury] 🌐 Global endpoint returned ${response.status} - might not be available`);
        break;
      }

      const data = await response.json();
      const transactions = data.transactions || [];
      
      allTransactions.push(...transactions);
      console.log(`[Mercury] 🌐 Global: fetched ${transactions.length} (total: ${allTransactions.length})`);

      if (transactions.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
        if (offset > 10000) {
          hasMore = false;
        }
      }
    }

    console.log(`[Mercury] 🌐 Global endpoint total: ${allTransactions.length} transactions`);
    return allTransactions;
  },

  /**
   * Fetches ALL transactions from a specific Mercury account using pagination
   * Uses date range to get complete history back to account creation
   */
  async fetchAccountTransactions(apiKey: string, accountId: string): Promise<MercuryTransaction[]> {
    const apiKeyStr = typeof apiKey === 'string' ? apiKey : String((apiKey as any) ?? '');
    if (!apiKeyStr || apiKeyStr === 'undefined' || apiKeyStr === 'null') {
      throw new Error("Mercury API Key is required. Paste your token again.");
    }

    const allTransactions: MercuryTransaction[] = [];
    let offset = 0;
    const limit = 500; // Max per request
    let hasMore = true;

    // Set date range: from business start to 30 days in future (catches scheduled/pending)
    const startDate = '2020-01-01';
    const endDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]; // 30 days in future
    
    console.log(`[Mercury] 🔄 Fetching ALL transactions for account ${accountId}...`);
    console.log(`[Mercury] 📅 Date range: ${startDate} to ${endDate} (30 days ahead)`);
    console.log(`[Mercury] 📅 Today is: ${new Date().toISOString().split('T')[0]}`);

    while (hasMore) {
      // Mercury API: NOT specifying status means get ALL (pending, sent, completed, failed, cancelled)
      // Adding explicit parameters to ensure complete data
      const url = `${MERCURY_API_BASE}/account/${accountId}/transactions?limit=${limit}&offset=${offset}&start=${startDate}&end=${endDate}`;
      console.log(`[Mercury] 📥 Fetching batch: offset=${offset}, limit=${limit}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKeyStr}`,
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
    const key = apiKey || getMercuryKey();
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
      const accountTransactions: MercuryTransaction[] = [];
      
      for (const account of accounts) {
        console.log(`[Mercury] ===== Fetching transactions for account: ${account.name} (${account.id}) =====`);
        const transactions = await this.fetchAccountTransactions(key, account.id);
        console.log(`[Mercury] Got ${transactions.length} transactions from ${account.name}`);
        accountTransactions.push(...transactions);
      }

      console.log(`[Mercury] ========================================`);
      console.log(`[Mercury] Transactions from account endpoints: ${accountTransactions.length}`);

      // Step 2b: ALSO fetch from global /transactions endpoint (might have data account endpoints miss)
      let globalTransactions: MercuryTransaction[] = [];
      try {
        globalTransactions = await this.fetchGlobalTransactions(key);
        console.log(`[Mercury] Transactions from global endpoint: ${globalTransactions.length}`);
      } catch (err) {
        console.log(`[Mercury] Global endpoint not available, using account-specific only`);
      }

      // Step 2c: Fetch credit card transactions (separate from bank accounts)
      let creditCardTransactions: MercuryTransaction[] = [];
      try {
        creditCardTransactions = await this.fetchCreditCardTransactions(key);
        console.log(`[Mercury] 💳 Credit card transactions: ${creditCardTransactions.length}`);
      } catch (err) {
        console.log(`[Mercury] 💳 Credit card transactions not available`);
      }

      // Merge and deduplicate by ID (global might have same transactions)
      const transactionMap = new Map<string, MercuryTransaction>();
      
      // Add account transactions first
      for (const t of accountTransactions) {
        transactionMap.set(t.id, t);
      }
      
      // Add global transactions (will add any not in account endpoints)
      let newFromGlobal = 0;
      for (const t of globalTransactions) {
        if (!transactionMap.has(t.id)) {
          transactionMap.set(t.id, t);
          newFromGlobal++;
        }
      }
      
      // Add credit card transactions
      let newFromCreditCard = 0;
      for (const t of creditCardTransactions) {
        if (!transactionMap.has(t.id)) {
          transactionMap.set(t.id, t);
          newFromCreditCard++;
        }
      }
      
      if (newFromGlobal > 0) {
        console.log(`[Mercury] ✨ Found ${newFromGlobal} NEW transactions from global endpoint!`);
      }
      if (newFromCreditCard > 0) {
        console.log(`[Mercury] 💳 Found ${newFromCreditCard} NEW transactions from credit card endpoint!`);
      }

      const allTransactions = Array.from(transactionMap.values());
      console.log(`[Mercury] Total unique transactions: ${allTransactions.length}`);

      // Log breakdown
      const incomingCount = allTransactions.filter(t => t.amount > 0).length;
      const outgoingCount = allTransactions.filter(t => t.amount < 0).length;
      console.log(`[Mercury] Incoming (credits): ${incomingCount}`);
      console.log(`[Mercury] Outgoing (debits/expenses): ${outgoingCount}`);
      
      // Log date range of ALL transactions
      if (allTransactions.length > 0) {
        const dates = allTransactions.map(t => t.postedAt || t.createdAt).filter(d => d).sort();
        console.log(`[Mercury] ════════════════════════════════════════`);
        console.log(`[Mercury] 📊 TOTAL FETCHED: ${allTransactions.length} transactions`);
        console.log(`[Mercury] 📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
        
        // Log oldest and newest with full details
        console.log(`[Mercury] 🗓️ Oldest: ${dates[0]}`);
        console.log(`[Mercury] 🗓️ Newest: ${dates[dates.length - 1]}`);
        
        // Log transaction statuses breakdown
        const statuses = allTransactions.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log(`[Mercury] 📋 Transaction statuses:`, statuses);
        
        // Log PENDING transactions specifically (these might be recent!)
        const pendingTxns = allTransactions.filter(t => t.status === 'pending');
        if (pendingTxns.length > 0) {
          console.log(`[Mercury] ⏳ PENDING TRANSACTIONS (${pendingTxns.length}):`);
          pendingTxns.forEach((t, i) => {
            console.log(`  ${i + 1}. ${t.createdAt} - ${t.counterpartyName} - $${Math.abs(t.amount)} (status: ${t.status})`);
          });
        } else {
          console.log(`[Mercury] ⏳ No pending transactions found`);
        }
        
        // Log 10 most recent by createdAt (not postedAt) to catch pending
        const sortedByCreated = [...allTransactions].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        console.log(`[Mercury] 🕐 10 most recently CREATED:`);
        sortedByCreated.slice(0, 10).forEach((t, i) => {
          console.log(`  ${i + 1}. created:${t.createdAt?.split('T')[0]} posted:${t.postedAt?.split('T')[0] || 'PENDING'} - ${t.counterpartyName} - $${Math.abs(t.amount)}`);
        });
        console.log(`[Mercury] ════════════════════════════════════════`);
      }

      // Step 3: Filter based on expensesOnly flag
      const transactionsToReturn = expensesOnly 
        ? allTransactions.filter(t => t.amount < 0)
        : allTransactions;
      
      // Step 4: Sort by date (newest first) - use postedAt if available, fallback to createdAt
      transactionsToReturn.sort((a, b) => {
        const dateA = new Date(a.postedAt || a.createdAt).getTime();
        const dateB = new Date(b.postedAt || b.createdAt).getTime();
        return dateB - dateA; // Newest first
      });
      
      console.log(`[Mercury] Returning ${transactionsToReturn.length} transactions (expensesOnly: ${expensesOnly})`);
      
      // Log the 5 most recent transactions
      if (transactionsToReturn.length > 0) {
        console.log(`[Mercury] 5 most recent transactions:`);
        transactionsToReturn.slice(0, 5).forEach((t, i) => {
          console.log(`  ${i + 1}. ${t.postedAt || t.createdAt} - ${t.counterpartyName} - $${Math.abs(t.amount)}`);
        });
      }

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
   * Fetches account balances by type (checking, savings, credit)
   * @param apiKey - Optional. If not provided, uses MERCURY_API_KEY from .env.local
   */
  async fetchAccountBalances(apiKey?: string): Promise<{ 
    total: number; 
    checking: number; 
    savings: number; 
    credit: number; 
    creditLimit: number;
    creditAvailable: number;
    creditPending: number;
    accounts: Array<{ name: string; type: string; balance: number }> 
  }> {
    const key = apiKey || getMercuryKey();
    
    // Fetch accounts, credit cards, AND the /credit endpoint for full credit info
    const [accounts, creditCards, creditAccount] = await Promise.all([
      this.fetchAccounts(key),
      this.fetchCreditCards(key),
      this.fetchCreditAccount(key)
    ]);
    
    console.log("[Mercury] All accounts (raw):", JSON.stringify(accounts, null, 2));
    console.log("[Mercury] All credit cards (raw):", JSON.stringify(creditCards, null, 2));
    console.log("[Mercury] Credit account (raw):", JSON.stringify(creditAccount, null, 2));
    
    let checking = 0;
    let savings = 0;
    let credit = 0;
    let creditLimit = 0;
    let creditAvailable = 0;
    let creditPending = 0;
    const accountDetails: Array<{ name: string; type: string; balance: number }> = [];
    
    accounts.forEach(acc => {
      const balance = acc.currentBalance || acc.availableBalance || 0;
      const available = acc.availableBalance || 0;
      
      // Log each account for debugging
      console.log("[Mercury] Account:", {
        name: acc.name,
        type: acc.type,
        currentBalance: acc.currentBalance,
        availableBalance: acc.availableBalance,
        allFields: Object.keys(acc)
      });
      
      accountDetails.push({ name: acc.name, type: acc.type, balance });
      
      // Mercury account types - check multiple possible identifiers
      const typeLower = (acc.type || '').toLowerCase();
      const nameLower = (acc.name || '').toLowerCase();
      
      // Check for credit card - Mercury might use various naming
      const isCreditCard = 
        typeLower.includes('credit') || 
        typeLower.includes('card') ||
        typeLower === 'creditcard' ||
        typeLower === 'credit_card' ||
        nameLower.includes('credit') || 
        nameLower.includes('card') ||
        nameLower.includes('io') || // Mercury IO card
        nameLower.includes('mercury card');
      
      if (isCreditCard) {
        // Credit card: currentBalance is amount owed, availableBalance is remaining credit
        credit = Math.abs(balance);
        creditAvailable = Math.abs(available);
        creditLimit = (acc as any).creditLimit || (acc as any).limit || credit + creditAvailable;
        creditPending = (acc as any).pendingBalance || (acc as any).pending || 0;
        console.log("[Mercury] ✅ Credit card FOUND in accounts:", { 
          name: acc.name, 
          type: acc.type,
          credit, 
          creditAvailable, 
          creditLimit, 
          creditPending 
        });
      } else if (typeLower.includes('saving') || nameLower.includes('saving') || nameLower.includes('reserve')) {
        savings += balance;
        console.log("[Mercury] Savings account:", acc.name, balance);
      } else {
        // Default to checking for operating/checking accounts
        checking += balance;
        console.log("[Mercury] Checking account:", acc.name, balance);
      }
    });
    
    // Process credit cards from separate endpoint (if any)
    if (creditCards && creditCards.length > 0) {
      console.log("[Mercury] Processing", creditCards.length, "credit card(s) from dedicated endpoint");
      creditCards.forEach((card: any) => {
        console.log("[Mercury] Credit card from endpoint:", {
          name: card.name,
          currentBalance: card.currentBalance,
          availableCredit: card.availableCredit,
          creditLimit: card.creditLimit,
          allFields: Object.keys(card)
        });
        
        // Mercury credit card fields
        credit = Math.abs(card.currentBalance || card.balance || 0);
        creditAvailable = Math.abs(card.availableCredit || card.availableBalance || 0);
        creditLimit = card.creditLimit || card.limit || (credit + creditAvailable);
        creditPending = card.pendingBalance || card.pending || 0;
        
        accountDetails.push({ 
          name: card.name || 'Mercury Credit Card', 
          type: 'credit_card', 
          balance: credit 
        });
      });
      console.log("[Mercury] ✅ Credit card from dedicated endpoint:", { credit, creditAvailable, creditLimit, creditPending });
    }
    
    // Process the /credit endpoint data (most reliable for credit balance)
    if (creditAccount) {
      console.log("[Mercury] Processing /credit endpoint data...");
      
      // Mercury /credit endpoint may have various structures
      const creditData = creditAccount.credit || creditAccount;
      
      // Extract credit info - try various possible field names
      const newCredit = Math.abs(
        creditData.currentBalance || 
        creditData.balance || 
        creditData.outstandingBalance ||
        creditData.totalBalance ||
        credit // fallback to what we found before
      );
      
      const newCreditAvailable = Math.abs(
        creditData.availableCredit || 
        creditData.availableBalance || 
        creditData.remainingCredit ||
        creditAvailable
      );
      
      const newCreditLimit = 
        creditData.creditLimit || 
        creditData.limit || 
        creditData.totalCreditLimit ||
        (newCredit + newCreditAvailable) ||
        creditLimit;
      
      const newCreditPending = Math.abs(
        creditData.pendingBalance || 
        creditData.pendingCharges ||
        creditData.pending ||
        creditPending
      );
      
      // Only update if we got meaningful data
      if (newCredit > 0 || newCreditAvailable > 0 || newCreditLimit > 0) {
        credit = newCredit;
        creditAvailable = newCreditAvailable;
        creditLimit = newCreditLimit;
        creditPending = newCreditPending;
        
        console.log("[Mercury] ✅ Credit from /credit endpoint:", { 
          credit, 
          creditAvailable, 
          creditLimit, 
          creditPending,
          creditAccountId: creditData.id || creditData.accountId
        });
        
        // Add to account details if not already there
        if (!accountDetails.some(a => a.type === 'credit_card' || a.type === 'credit')) {
          accountDetails.push({ 
            name: creditData.name || 'Mercury Credit', 
            type: 'credit', 
            balance: credit 
          });
        }
      }
    }
    
    const total = checking + savings;
    console.log("[Mercury] ════════════════════════════════════════");
    console.log("[Mercury] 💰 FINAL BALANCES:");
    console.log("[Mercury]   Checking:", checking);
    console.log("[Mercury]   Savings:", savings);
    console.log("[Mercury]   💳 Credit Balance:", credit);
    console.log("[Mercury]   💳 Credit Available:", creditAvailable);
    console.log("[Mercury]   💳 Credit Limit:", creditLimit);
    console.log("[Mercury]   💳 Credit Pending:", creditPending);
    console.log("[Mercury]   Total Liquidity:", total);
    console.log("[Mercury] ════════════════════════════════════════");
    
    return { total, checking, savings, credit, creditLimit, creditAvailable, creditPending, accounts: accountDetails };
  },

  /**
   * Fetches the total balance across all Mercury accounts
   * @param apiKey - Optional. If not provided, uses MERCURY_API_KEY from .env.local
   */
  async fetchTotalBalance(apiKey?: string): Promise<number> {
    const { total } = await this.fetchAccountBalances(apiKey);
    return total;
  },

  /**
   * Maps Mercury API response to our internal Transaction type
   */
  mapMercuryToInternal(mercuryData: MercuryTransaction[]): Transaction[] {
    // Log first transaction to see all available fields from Mercury
    if (mercuryData.length > 0) {
      console.log("[Mercury] Sample transaction fields:", Object.keys(mercuryData[0]));
      console.log("[Mercury] Sample transaction data:", JSON.stringify(mercuryData[0], null, 2));
    }
    
    return mercuryData.map(item => {
      // Extract "made by" name from Mercury - check various possible field names
      const madeBy = (item as any).creatorName 
        || (item as any).cardholderName 
        || (item as any).initiatedByName
        || (item as any).createdByName
        || (item as any).userName
        || (item as any).cardHolder
        || (item as any).initiatedBy
        || undefined;
      
      return {
        id: item.id,
        date: item.postedAt ? item.postedAt.split('T')[0] : item.createdAt.split('T')[0],
        vendor: item.counterpartyName || "Unknown Vendor",
        amount: Math.abs(item.amount), // Mercury returns amounts in dollars
        category: this.guessCategory(item.bankDescription || '', item.counterpartyName || ''),
        context: `Mercury: ${item.note || item.externalMemo || item.bankDescription || 'Bank transfer'}`,
        attachments: [],
        bankVerified: true,
        bankId: item.id,
        madeBy: madeBy
      };
    });
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
  },

  /**
   * Parse CSV credit card statement
   * Supports common formats: Chase, Amex, Capital One, generic
   */
  parseCreditCardCSV(csvContent: string, cardName: string = 'External Card'): Transaction[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    // Detect CSV format by header
    const header = lines[0].toLowerCase();
    const transactions: Transaction[] = [];

    // Column index detection for different card formats
    let dateIdx = 0, descIdx = 1, amountIdx = 2, categoryIdx = -1;

    if (header.includes('transaction date')) {
      // Chase format: Transaction Date,Post Date,Description,Category,Type,Amount,Memo
      const cols = lines[0].split(',');
      dateIdx = cols.findIndex(c => c.toLowerCase().includes('transaction date'));
      descIdx = cols.findIndex(c => c.toLowerCase() === 'description');
      amountIdx = cols.findIndex(c => c.toLowerCase() === 'amount');
      categoryIdx = cols.findIndex(c => c.toLowerCase() === 'category');
    } else if (header.includes('date') && header.includes('description')) {
      // Amex format: Date,Description,Amount
      const cols = lines[0].split(',');
      dateIdx = cols.findIndex(c => c.toLowerCase() === 'date');
      descIdx = cols.findIndex(c => c.toLowerCase() === 'description');
      amountIdx = cols.findIndex(c => c.toLowerCase() === 'amount');
    } else if (header.includes('posted date')) {
      // Capital One format: Posted Date,Transaction Date,Card No.,Description,Category,Debit,Credit
      const cols = lines[0].split(',');
      dateIdx = cols.findIndex(c => c.toLowerCase().includes('posted date'));
      descIdx = cols.findIndex(c => c.toLowerCase() === 'description');
      // Capital One uses separate Debit/Credit columns
      const debitIdx = cols.findIndex(c => c.toLowerCase() === 'debit');
      amountIdx = debitIdx >= 0 ? debitIdx : cols.findIndex(c => c.toLowerCase() === 'amount');
      categoryIdx = cols.findIndex(c => c.toLowerCase() === 'category');
    }

    // Parse data rows (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV with quoted fields
      const cols = this.parseCSVLine(line);
      if (cols.length < 3) continue;

      const dateStr = cols[dateIdx]?.trim();
      const description = cols[descIdx]?.trim() || 'Unknown';
      let amount = parseFloat(cols[amountIdx]?.replace(/[$,]/g, '') || '0');

      // Skip if invalid
      if (!dateStr || isNaN(amount) || amount === 0) continue;

      // Normalize amount (positive = expense for credit cards)
      amount = Math.abs(amount);

      // Parse date (handle various formats)
      let date: Date;
      if (dateStr.includes('/')) {
        // MM/DD/YYYY or M/D/YY
        const parts = dateStr.split('/');
        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        if (year < 100) year += 2000;
        date = new Date(year, month, day);
      } else {
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) continue;

      // Guess category from description or use provided category
      const category = categoryIdx >= 0 && cols[categoryIdx] 
        ? cols[categoryIdx].trim() 
        : this.guessCategory(description, description);

      transactions.push({
        id: `cc_${cardName.replace(/\s+/g, '_')}_${Date.now()}_${i}`,
        date: date.toISOString().split('T')[0],
        vendor: description,
        amount,
        category,
        context: `Credit Card: ${cardName}`,
        attachments: [],
        bankVerified: false,
        madeBy: undefined
      });
    }

    console.log(`[CreditCard] Parsed ${transactions.length} transactions from ${cardName} CSV`);
    return transactions;
  },

  /**
   * Helper to parse CSV line handling quoted fields
   */
  parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
};