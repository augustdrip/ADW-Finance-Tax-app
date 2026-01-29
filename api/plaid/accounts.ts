/**
 * Plaid API: Get Accounts
 * Fetches account information for a user's connected banks
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
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get user's Plaid items from database
    const { data: plaidItems, error: dbError } = await supabase
      .from('plaid_items')
      .select('access_token, institution_name, accounts')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (dbError || !plaidItems || plaidItems.length === 0) {
      return res.status(200).json({ accounts: [], institutions: [] });
    }

    // Fetch fresh account data from Plaid
    const allAccounts: any[] = [];
    const institutions: any[] = [];

    for (const item of plaidItems) {
      try {
        const response = await plaidClient.accountsGet({
          access_token: item.access_token,
        });

        const accounts = response.data.accounts.map(a => ({
          account_id: a.account_id,
          name: a.name,
          official_name: a.official_name,
          type: a.type,
          subtype: a.subtype,
          mask: a.mask,
          institution_name: item.institution_name,
          balances: {
            available: a.balances.available,
            current: a.balances.current,
            limit: a.balances.limit,
            iso_currency_code: a.balances.iso_currency_code,
          },
        }));

        allAccounts.push(...accounts);

        if (item.institution_name && !institutions.find(i => i.name === item.institution_name)) {
          institutions.push({ name: item.institution_name });
        }
      } catch (e: any) {
        console.error('[Plaid] Error fetching accounts for item:', e.message);
        // Use cached accounts from database
        if (item.accounts) {
          allAccounts.push(...item.accounts.map((a: any) => ({
            ...a,
            institution_name: item.institution_name,
          })));
        }
      }
    }

    return res.status(200).json({
      accounts: allAccounts,
      institutions,
    });
  } catch (error: any) {
    console.error('[Plaid] Get accounts error:', error);
    return res.status(500).json({
      error: 'Failed to fetch accounts',
      message: error.message,
    });
  }
}
