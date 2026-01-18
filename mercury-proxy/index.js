const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Your Mercury API key (set as environment variable on Render)
const MERCURY_API_KEY = process.env.MERCURY_API_KEY;

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
  if (!MERCURY_API_KEY) {
    return res.status(500).json({ error: 'MERCURY_API_KEY not configured on server' });
  }
  
  try {
    console.log('[Proxy] Fetching accounts...');
    const response = await fetch('https://api.mercury.com/api/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${MERCURY_API_KEY}`,
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
  if (!MERCURY_API_KEY) {
    return res.status(500).json({ error: 'MERCURY_API_KEY not configured on server' });
  }
  
  try {
    console.log('[Proxy] Fetching credit cards...');
    const response = await fetch('https://api.mercury.com/api/v1/credit-cards', {
      headers: {
        'Authorization': `Bearer ${MERCURY_API_KEY}`,
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

// Proxy: GET /api/mercury/account/:accountId/transactions
app.get('/api/mercury/account/:accountId/transactions', async (req, res) => {
  if (!MERCURY_API_KEY) {
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
        'Authorization': `Bearer ${MERCURY_API_KEY}`,
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
