/**
 * Plaid API: Get Transactions
 * Fetches transactions for a user's connected bank accounts
 */

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get user's Plaid items from database
    const { data: plaidItems, error: dbError } = await supabase
      .from('plaid_items')
      .select('access_token, accounts')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (dbError || !plaidItems || plaidItems.length === 0) {
      return res.status(404).json({ error: 'No connected bank accounts found' });
    }

    // Calculate date range (default: last 30 days)
    const end = endDate ? String(endDate) : new Date().toISOString().split('T')[0];
    const start = startDate 
      ? String(startDate) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch transactions from all connected accounts
    const allTransactions: any[] = [];
    const allAccounts: any[] = [];

    for (const item of plaidItems) {
      try {
        const response = await plaidClient.transactionsGet({
          access_token: item.access_token,
          start_date: start,
          end_date: end,
          options: {
            count: 500,
            offset: 0,
          },
        });

        allTransactions.push(...response.data.transactions);
        allAccounts.push(...response.data.accounts);
      } catch (e: any) {
        console.error('[Plaid] Error fetching transactions for item:', e.message);
        // Continue with other items
      }
    }

    // Sort transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json({
      transactions: allTransactions.map(t => ({
        transaction_id: t.transaction_id,
        account_id: t.account_id,
        amount: t.amount,
        date: t.date,
        name: t.name,
        merchant_name: t.merchant_name,
        category: t.category,
        pending: t.pending,
        payment_channel: t.payment_channel,
        location: t.location,
      })),
      accounts: allAccounts.map(a => ({
        account_id: a.account_id,
        name: a.name,
        official_name: a.official_name,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask,
        balances: {
          available: a.balances.available,
          current: a.balances.current,
          limit: a.balances.limit,
          iso_currency_code: a.balances.iso_currency_code,
        },
      })),
      total_transactions: allTransactions.length,
    });
  } catch (error: any) {
    console.error('[Plaid] Get transactions error:', error);
    return res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
    });
  }
}
