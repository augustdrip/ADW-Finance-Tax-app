/**
 * Local development server for API routes
 * This runs alongside Vite for local development
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Plaid client
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

console.log('[API Server] Plaid configured:', {
  env: process.env.PLAID_ENV,
  clientId: process.env.PLAID_CLIENT_ID ? '✓' : '✗',
  secret: process.env.PLAID_SECRET ? '✓' : '✗',
});

// Create Link Token
app.post('/api/plaid/create-link-token', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log('[Plaid] Creating link token for user:', userId);

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'ADW Finance',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      account_filters: {
        depository: {
          account_subtypes: ['checking', 'savings'],
        },
        credit: {
          account_subtypes: ['credit card'],
        },
      },
    });

    console.log('[Plaid] Link token created successfully');
    return res.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error) {
    console.error('[Plaid] Create link token error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to create link token',
      message: error.response?.data?.error_message || error.message,
    });
  }
});

// Exchange Public Token
app.post('/api/plaid/exchange-token', async (req, res) => {
  try {
    const { publicToken, userId } = req.body;

    if (!publicToken || !userId) {
      return res.status(400).json({ error: 'publicToken and userId are required' });
    }

    console.log('[Plaid] Exchanging public token for user:', userId);

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get accounts info
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Get institution info
    let institution = null;
    if (accountsResponse.data.item?.institution_id) {
      try {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: accountsResponse.data.item.institution_id,
          country_codes: [CountryCode.Us],
        });
        institution = institutionResponse.data.institution;
      } catch (e) {
        console.warn('[Plaid] Could not fetch institution:', e.message);
      }
    }

    // TODO: Store access token securely in database
    console.log('[Plaid] Token exchanged, item_id:', itemId);

    return res.json({
      success: true,
      item_id: itemId,
      accounts: accountsResponse.data.accounts,
      institution: institution ? {
        institution_id: institution.institution_id,
        name: institution.name,
        logo: institution.logo,
        primary_color: institution.primary_color,
        url: institution.url,
      } : null,
    });
  } catch (error) {
    console.error('[Plaid] Exchange token error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to exchange token',
      message: error.response?.data?.error_message || error.message,
    });
  }
});

// Get Accounts
app.get('/api/plaid/accounts', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // TODO: Get access token from database for this user
    // For now, return empty accounts
    console.log('[Plaid] Fetching accounts for user:', userId);

    return res.json({
      accounts: [],
    });
  } catch (error) {
    console.error('[Plaid] Get accounts error:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch accounts',
      message: error.message,
    });
  }
});

// Get Transactions
app.get('/api/plaid/transactions', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // TODO: Get access token from database and fetch transactions
    console.log('[Plaid] Fetching transactions for user:', userId);

    return res.json({
      transactions: [],
      accounts: [],
      total_transactions: 0,
    });
  } catch (error) {
    console.error('[Plaid] Get transactions error:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[API Server] Running on http://localhost:${PORT}`);
  console.log('[API Server] Plaid API routes available:');
  console.log('  POST /api/plaid/create-link-token');
  console.log('  POST /api/plaid/exchange-token');
  console.log('  GET  /api/plaid/accounts');
  console.log('  GET  /api/plaid/transactions');
});
