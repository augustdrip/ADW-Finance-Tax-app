/**
 * Plaid API: Create Link Token
 * Creates a link token for Plaid Link initialization
 */

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Plaid client (server-side only - no VITE_ prefix)
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Create link token
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'ADW Finance',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      // Optional: Enable account select
      account_filters: {
        depository: {
          account_subtypes: ['checking', 'savings'],
        },
        credit: {
          account_subtypes: ['credit card'],
        },
      },
    });

    return res.status(200).json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error: any) {
    console.error('[Plaid] Create link token error:', error);
    return res.status(500).json({
      error: 'Failed to create link token',
      message: error.message,
    });
  }
}
