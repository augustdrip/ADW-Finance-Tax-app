/**
 * Plaid API: Exchange Public Token
 * Exchanges a public token for an access token after user completes Plaid Link
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { publicToken, userId } = req.body;

    if (!publicToken || !userId) {
      return res.status(400).json({ error: 'publicToken and userId are required' });
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;

    // Get institution info
    let institution = null;
    try {
      const item = accountsResponse.data.item;
      if (item.institution_id) {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: item.institution_id,
          country_codes: ['US'],
        });
        institution = {
          institution_id: institutionResponse.data.institution.institution_id,
          name: institutionResponse.data.institution.name,
          logo: institutionResponse.data.institution.logo,
          primary_color: institutionResponse.data.institution.primary_color,
          url: institutionResponse.data.institution.url,
        };
      }
    } catch (e) {
      console.warn('[Plaid] Could not fetch institution info:', e);
    }

    // Store the access token securely in Supabase
    const { error: dbError } = await supabase
      .from('plaid_items')
      .upsert({
        user_id: userId,
        access_token: accessToken, // In production, encrypt this
        item_id: itemId,
        institution_id: institution?.institution_id,
        institution_name: institution?.name,
        accounts: accounts.map(a => ({
          account_id: a.account_id,
          name: a.name,
          official_name: a.official_name,
          type: a.type,
          subtype: a.subtype,
          mask: a.mask,
        })),
        status: 'active',
      });

    if (dbError) {
      console.error('[Plaid] Error storing access token:', dbError);
      // Don't fail the request, token exchange was successful
    }

    // Update user profile with plaid info
    await supabase
      .from('profiles')
      .update({
        plaid_access_token: accessToken,
        plaid_item_id: itemId,
      })
      .eq('id', userId);

    return res.status(200).json({
      success: true,
      item_id: itemId,
      accounts: accounts.map(a => ({
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
      institution,
    });
  } catch (error: any) {
    console.error('[Plaid] Exchange token error:', error);
    return res.status(500).json({
      error: 'Failed to exchange token',
      message: error.message,
    });
  }
}
