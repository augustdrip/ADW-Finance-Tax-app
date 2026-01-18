/**
 * Database Service - Uses Prisma API endpoints for data persistence
 * Replaces localStorage with proper database storage
 */

const API_BASE = import.meta.env.PROD 
  ? '' // Same domain in production (Vercel)
  : 'http://localhost:3000'; // Local development

// Helper function for API calls
async function apiCall(endpoint: string, method: string, data?: any) {
  const response = await fetch(`${API_BASE}/api/${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

// ==================== TRANSACTIONS ====================

export async function fetchTransactions() {
  try {
    return await apiCall('transactions', 'GET');
  } catch (error) {
    console.error('[DB] Failed to fetch transactions:', error);
    // Fallback to localStorage if API fails
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveTransaction(transaction: any) {
  try {
    const result = transaction.id 
      ? await apiCall('transactions', 'PUT', transaction)
      : await apiCall('transactions', 'POST', transaction);
    return result;
  } catch (error) {
    console.error('[DB] Failed to save transaction:', error);
    throw error;
  }
}

export async function deleteTransaction(id: string) {
  try {
    await apiCall('transactions', 'DELETE', { id });
    return true;
  } catch (error) {
    console.error('[DB] Failed to delete transaction:', error);
    throw error;
  }
}

// Bulk save transactions (for Mercury sync)
export async function bulkSaveTransactions(transactions: any[]) {
  try {
    const results = await Promise.all(
      transactions.map(t => saveTransaction(t))
    );
    return results;
  } catch (error) {
    console.error('[DB] Failed to bulk save transactions:', error);
    throw error;
  }
}

// ==================== AGREEMENTS ====================

export async function fetchAgreements() {
  try {
    return await apiCall('agreements', 'GET');
  } catch (error) {
    console.error('[DB] Failed to fetch agreements:', error);
    const saved = localStorage.getItem('agreements');
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveAgreement(agreement: any) {
  try {
    const result = agreement.id 
      ? await apiCall('agreements', 'PUT', agreement)
      : await apiCall('agreements', 'POST', agreement);
    return result;
  } catch (error) {
    console.error('[DB] Failed to save agreement:', error);
    throw error;
  }
}

export async function deleteAgreement(id: string) {
  try {
    await apiCall('agreements', 'DELETE', { id });
    return true;
  } catch (error) {
    console.error('[DB] Failed to delete agreement:', error);
    throw error;
  }
}

// ==================== INVOICES ====================

export async function fetchInvoices() {
  try {
    return await apiCall('invoices', 'GET');
  } catch (error) {
    console.error('[DB] Failed to fetch invoices:', error);
    const saved = localStorage.getItem('invoices');
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveInvoice(invoice: any) {
  try {
    const result = invoice.id 
      ? await apiCall('invoices', 'PUT', invoice)
      : await apiCall('invoices', 'POST', invoice);
    return result;
  } catch (error) {
    console.error('[DB] Failed to save invoice:', error);
    throw error;
  }
}

export async function deleteInvoice(id: string) {
  try {
    await apiCall('invoices', 'DELETE', { id });
    return true;
  } catch (error) {
    console.error('[DB] Failed to delete invoice:', error);
    throw error;
  }
}

// ==================== ASSETS ====================

export async function fetchAssets() {
  try {
    return await apiCall('assets', 'GET');
  } catch (error) {
    console.error('[DB] Failed to fetch assets:', error);
    const saved = localStorage.getItem('assets');
    return saved ? JSON.parse(saved) : [];
  }
}

export async function saveAsset(asset: any) {
  try {
    const result = asset.id 
      ? await apiCall('assets', 'PUT', asset)
      : await apiCall('assets', 'POST', asset);
    return result;
  } catch (error) {
    console.error('[DB] Failed to save asset:', error);
    throw error;
  }
}

export async function deleteAsset(id: string) {
  try {
    await apiCall('assets', 'DELETE', { id });
    return true;
  } catch (error) {
    console.error('[DB] Failed to delete asset:', error);
    throw error;
  }
}

// ==================== SYNC UTILITIES ====================

// Sync local data to database (one-time migration)
export async function syncLocalToDatabase() {
  console.log('[DB] Starting local -> database sync...');
  
  try {
    // Sync transactions
    const localTransactions = localStorage.getItem('transactions');
    if (localTransactions) {
      const transactions = JSON.parse(localTransactions);
      console.log(`[DB] Syncing ${transactions.length} transactions...`);
      await bulkSaveTransactions(transactions);
    }

    // Sync agreements
    const localAgreements = localStorage.getItem('agreements');
    if (localAgreements) {
      const agreements = JSON.parse(localAgreements);
      console.log(`[DB] Syncing ${agreements.length} agreements...`);
      for (const agreement of agreements) {
        await saveAgreement(agreement);
      }
    }

    // Sync invoices
    const localInvoices = localStorage.getItem('invoices');
    if (localInvoices) {
      const invoices = JSON.parse(localInvoices);
      console.log(`[DB] Syncing ${invoices.length} invoices...`);
      for (const invoice of invoices) {
        await saveInvoice(invoice);
      }
    }

    // Sync assets
    const localAssets = localStorage.getItem('assets');
    if (localAssets) {
      const assets = JSON.parse(localAssets);
      console.log(`[DB] Syncing ${assets.length} assets...`);
      for (const asset of assets) {
        await saveAsset(asset);
      }
    }

    console.log('[DB] Sync complete!');
    return true;
  } catch (error) {
    console.error('[DB] Sync failed:', error);
    throw error;
  }
}

export default {
  fetchTransactions,
  saveTransaction,
  deleteTransaction,
  bulkSaveTransactions,
  fetchAgreements,
  saveAgreement,
  deleteAgreement,
  fetchInvoices,
  saveInvoice,
  deleteInvoice,
  fetchAssets,
  saveAsset,
  deleteAsset,
  syncLocalToDatabase
};
