/**
 * Plaid Service
 * Client-side service for Plaid Link integration
 * Handles bank account connection and transaction sync
 */

// Note: Plaid credentials are server-side only (not VITE_ prefixed)
// The client just calls our API endpoints which handle Plaid securely

// Check if Plaid is configured (will be validated server-side)
export function isPlaidConfigured(): boolean {
  // This will be determined by whether the API endpoints work
  return true;
}

// Plaid account interface
export interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: 'depository' | 'credit' | 'loan' | 'investment' | 'other';
  subtype: string | null;
  mask: string | null;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    iso_currency_code: string | null;
  };
}

// Plaid transaction interface
export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  category: string[];
  pending: boolean;
  payment_channel: string;
  location: {
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
}

// Plaid institution interface
export interface PlaidInstitution {
  institution_id: string;
  name: string;
  logo: string | null;
  primary_color: string | null;
  url: string | null;
}

// Link token response
interface LinkTokenResponse {
  link_token: string;
  expiration: string;
}

// Exchange token response
interface ExchangeTokenResponse {
  success: boolean;
  item_id: string;
  accounts: PlaidAccount[];
  institution: PlaidInstitution | null;
}

// Transactions response
interface TransactionsResponse {
  transactions: PlaidTransaction[];
  accounts: PlaidAccount[];
  total_transactions: number;
}

/**
 * Create a Plaid Link token for the current user
 * This is called before opening the Plaid Link modal
 */
export async function createLinkToken(userId: string): Promise<string> {
  try {
    const response = await fetch('/api/plaid/create-link-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create link token');
    }
    
    const data: LinkTokenResponse = await response.json();
    return data.link_token;
  } catch (error) {
    console.error('[Plaid] Error creating link token:', error);
    throw error;
  }
}

/**
 * Exchange public token for access token after user completes Plaid Link
 * The access token is stored server-side for security
 */
export async function exchangePublicToken(
  publicToken: string,
  userId: string
): Promise<ExchangeTokenResponse> {
  try {
    const response = await fetch('/api/plaid/exchange-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ publicToken, userId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to exchange token');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Plaid] Error exchanging token:', error);
    throw error;
  }
}

/**
 * Fetch accounts for the current user
 */
export async function getAccounts(userId: string): Promise<PlaidAccount[]> {
  try {
    const response = await fetch(`/api/plaid/accounts?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch accounts');
    }
    
    const data = await response.json();
    return data.accounts;
  } catch (error) {
    console.error('[Plaid] Error fetching accounts:', error);
    throw error;
  }
}

/**
 * Fetch transactions for the current user
 * Supports pagination with startDate/endDate
 */
export async function getTransactions(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<TransactionsResponse> {
  try {
    const params = new URLSearchParams({ userId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`/api/plaid/transactions?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch transactions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Plaid] Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Sync transactions (incremental sync using cursor)
 */
export async function syncTransactions(userId: string): Promise<{
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: string[];
}> {
  try {
    const response = await fetch('/api/plaid/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync transactions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Plaid] Error syncing transactions:', error);
    throw error;
  }
}

/**
 * Get institution details
 */
export async function getInstitution(institutionId: string): Promise<PlaidInstitution | null> {
  try {
    const response = await fetch(`/api/plaid/institution?id=${institutionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('[Plaid] Error fetching institution:', error);
    return null;
  }
}

/**
 * Disconnect a bank account (remove Plaid item)
 */
export async function disconnectBank(userId: string, itemId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/plaid/disconnect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, itemId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to disconnect bank');
    }
    
    return true;
  } catch (error) {
    console.error('[Plaid] Error disconnecting bank:', error);
    return false;
  }
}

/**
 * Convert Plaid transaction to our transaction format
 */
export function convertPlaidTransaction(plaidTxn: PlaidTransaction): {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  context: string;
  bankVerified: boolean;
  bankId: string;
  source: 'plaid';
} {
  // Map Plaid categories to our categories
  const categoryMap: Record<string, string> = {
    'Food and Drink': 'Meals & Entertainment',
    'Travel': 'Travel',
    'Shops': 'Supplies & Materials',
    'Service': 'Services',
    'Transfer': 'Transfer',
    'Payment': 'Payment',
    'Recreation': 'Entertainment',
    'Healthcare': 'Health Insurance',
    'Community': 'Other Expenses',
    'Bank Fees': 'Bank Charges',
    'Interest': 'Interest',
    'Tax': 'Taxes'
  };
  
  const plaidCategory = plaidTxn.category?.[0] || 'Other';
  const mappedCategory = categoryMap[plaidCategory] || 'Other Expenses';
  
  return {
    id: `plaid_${plaidTxn.transaction_id}`,
    date: plaidTxn.date,
    vendor: plaidTxn.merchant_name || plaidTxn.name,
    amount: Math.abs(plaidTxn.amount), // Plaid amounts are positive for expenses
    category: mappedCategory,
    context: `${plaidTxn.category?.join(' > ') || ''} | ${plaidTxn.payment_channel}`,
    bankVerified: true,
    bankId: plaidTxn.transaction_id,
    source: 'plaid' as const
  };
}

export const plaidService = {
  isPlaidConfigured,
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getTransactions,
  syncTransactions,
  getInstitution,
  disconnectBank,
  convertPlaidTransaction
};

export default plaidService;
