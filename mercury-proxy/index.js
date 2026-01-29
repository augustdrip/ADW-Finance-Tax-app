const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Your Mercury API key (set as environment variable on Render)
const MERCURY_API_KEY = process.env.MERCURY_API_KEY;

const getApiKeyFromRequest = (req) => {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  if (!authHeader || typeof authHeader !== 'string') return '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  return authHeader.trim();
};

const getMercuryApiKey = (req) => {
  return MERCURY_API_KEY || getApiKeyFromRequest(req);
};

// Allowed origins - add your Vercel URL here
const allowedOrigins = [
  'https://adw-finance-tax-app.vercel.app',
  'https://adw-finance-tax-app-augustdrips-projects.vercel.app',
  /\.vercel\.app$/,  // Any vercel.app subdomain
  'http://localhost:3000',
  'http://localhost:3009',
  'http://localhost:3010'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origin
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(null, true); // Allow anyway for now, log for debugging
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Mercury Proxy Online',
    timestamp: new Date().toISOString()
  });
});

// Proxy: GET /api/mercury/accounts
app.get('/api/mercury/accounts', async (req, res) => {
  const apiKey = getMercuryApiKey(req);
  if (!apiKey) {
    return res.status(500).json({ error: 'MERCURY_API_KEY not configured on server' });
  }
  
  try {
    console.log('[Proxy] Fetching accounts...');
    const response = await fetch('https://api.mercury.com/api/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('[Proxy] Accounts response status:', response.status);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Proxy] Error fetching accounts:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Proxy: GET /api/mercury/credit-cards
app.get('/api/mercury/credit-cards', async (req, res) => {
  const apiKey = getMercuryApiKey(req);
  if (!apiKey) {
    return res.status(500).json({ error: 'MERCURY_API_KEY not configured on server' });
  }
  
  try {
    console.log('[Proxy] Fetching credit cards...');
    const response = await fetch('https://api.mercury.com/api/v1/credit-cards', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('[Proxy] Credit cards response status:', response.status);
    console.log('[Proxy] Credit cards data:', JSON.stringify(data, null, 2));
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Proxy] Error fetching credit cards:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Proxy: GET /api/mercury/credit (Mercury Credit endpoint - returns credit account info)
app.get('/api/mercury/credit', async (req, res) => {
  const apiKey = getMercuryApiKey(req);
  if (!apiKey) {
    return res.status(500).json({ error: 'MERCURY_API_KEY not configured on server' });
  }
  
  try {
    console.log('[Proxy] Fetching credit account info...');
    const response = await fetch('https://api.mercury.com/api/v1/credit', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('[Proxy] Credit account response status:', response.status);
    console.log('[Proxy] Credit account data:', JSON.stringify(data, null, 2));
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Proxy] Error fetching credit account:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Proxy: GET /api/mercury/credit/transactions (Credit card transactions)
app.get('/api/mercury/credit/transactions', async (req, res) => {
  const apiKey = getMercuryApiKey(req);
  if (!apiKey) {
    return res.status(500).json({ error: 'MERCURY_API_KEY not configured on server' });
  }
  
  try {
    // First get the credit account ID
    console.log('[Proxy] Step 1: Fetching credit account ID...');
    const creditResponse = await fetch('https://api.mercury.com/api/v1/credit', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const creditData = await creditResponse.json();
    console.log('[Proxy] Credit data:', JSON.stringify(creditData, null, 2));
    
    // Extract credit account ID (Mercury may return it in different formats)
    const creditAccountId = creditData.id || creditData.accountId || creditData.creditAccountId || 
                           (creditData.accounts && creditData.accounts[0]?.id) ||
                           (creditData.creditCards && creditData.creditCards[0]?.id);
    
    if (!creditAccountId) {
      console.log('[Proxy] No credit account ID found in response');
      return res.status(404).json({ error: 'No credit account found', creditData });
    }
    
    // Now fetch transactions for the credit account
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const txnUrl = `https://api.mercury.com/api/v1/account/${creditAccountId}/transactions${queryString}`;
    
    console.log('[Proxy] Step 2: Fetching credit transactions from:', txnUrl);
    const txnResponse = await fetch(txnUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const txnData = await txnResponse.json();
    console.log('[Proxy] Credit transactions response status:', txnResponse.status);
    console.log('[Proxy] Credit transactions count:', txnData.transactions?.length || 0);
    
    // Return transactions with credit account info
    res.status(txnResponse.status).json({
      ...txnData,
      creditAccountId,
      source: 'mercury_credit'
    });
  } catch (error) {
    console.error('[Proxy] Error fetching credit transactions:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Proxy: GET /api/mercury/credit/statements (Credit card statements)
app.get('/api/mercury/credit/statements', async (req, res) => {
  const apiKey = getMercuryApiKey(req);
  if (!apiKey) {
    return res.status(500).json({ error: 'MERCURY_API_KEY not configured on server' });
  }
  
  try {
    console.log('[Proxy] Step 1: Fetching credit account ID for statements...');
    const creditResponse = await fetch('https://api.mercury.com/api/v1/credit', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const creditData = await creditResponse.json();
    const creditAccountId = creditData.id || creditData.accountId || creditData.creditAccountId || 
                           (creditData.accounts && creditData.accounts[0]?.id) ||
                           (creditData.creditCards && creditData.creditCards[0]?.id);
    
    if (!creditAccountId) {
      console.log('[Proxy] No credit account ID found for statements');
      return res.status(404).json({ error: 'No credit account found', creditData });
    }
    
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const statementsUrl = `https://api.mercury.com/api/v1/account/${creditAccountId}/statements${queryString}`;
    
    console.log('[Proxy] Step 2: Fetching credit statements from:', statementsUrl);
    const statementsResponse = await fetch(statementsUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const statementsData = await statementsResponse.json();
    console.log('[Proxy] Credit statements response status:', statementsResponse.status);
    
    res.status(statementsResponse.status).json({
      ...statementsData,
      creditAccountId,
      source: 'mercury_credit'
    });
  } catch (error) {
    console.error('[Proxy] Error fetching credit statements:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Proxy: GET /api/mercury/statements/:statementId/pdf (Download statement PDF)
app.get('/api/mercury/statements/:statementId/pdf', async (req, res) => {
  const apiKey = getMercuryApiKey(req);
  if (!apiKey) {
    return res.status(500).json({ error: 'MERCURY_API_KEY not configured on server' });
  }
  
  try {
    const { statementId } = req.params;
    console.log('[Proxy] Fetching statement PDF:', statementId);
    
    const pdfResponse = await fetch(`https://api.mercury.com/api/v1/statements/${statementId}/pdf`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!pdfResponse.ok) {
      const errorData = await pdfResponse.json().catch(() => ({}));
      console.log('[Proxy] Statement PDF error:', pdfResponse.status, errorData);
      return res.status(pdfResponse.status).json(errorData);
    }
    
    const arrayBuffer = await pdfResponse.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="statement-${statementId}.pdf"`);
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('[Proxy] Error fetching statement PDF:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Proxy: GET /api/mercury/transactions (GLOBAL endpoint - all transactions)
app.get('/api/mercury/transactions', async (req, res) => {
  const apiKey = getMercuryApiKey(req);
  if (!apiKey) {
    return res.status(500).json({ error: 'MERCURY_API_KEY not configured on server' });
  }
  
  try {
    // Preserve query string (limit, offset, start, end, etc.)
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const url = `https://api.mercury.com/api/v1/transactions${queryString}`;
    
    console.log('[Proxy] Fetching GLOBAL transactions:', url);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('[Proxy] Global transactions response status:', response.status);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Proxy] Error fetching global transactions:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Proxy: GET /api/mercury/account/:accountId/transactions
app.get('/api/mercury/account/:accountId/transactions', async (req, res) => {
  const apiKey = getMercuryApiKey(req);
  if (!apiKey) {
    return res.status(500).json({ error: 'MERCURY_API_KEY not configured on server' });
  }
  
  try {
    const { accountId } = req.params;
    // Preserve query string (limit, offset, start, end, etc.)
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const url = `https://api.mercury.com/api/v1/account/${accountId}/transactions${queryString}`;
    
    console.log('[Proxy] Fetching transactions:', url);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('[Proxy] Transactions response status:', response.status);
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Proxy] Error fetching transactions:', error);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Mercury Proxy running on port ${PORT}`);
  console.log(`MERCURY_API_KEY configured: ${MERCURY_API_KEY ? 'Yes' : 'No'}`);
});
