/**
 * Bills Service
 * Track recurring household bills paid with company card
 * Supports manual entry with recurring bill automation
 */

import { getSupabaseClient } from './supabaseService';

// Bill categories
export type BillCategory = 'rent' | 'electricity' | 'gas' | 'water' | 'trash' | 'internet' | 'phone' | 'insurance' | 'other';

// Bill frequency
export type BillFrequency = 'monthly' | 'quarterly' | 'annually' | 'one-time';

// Bill status
export type BillStatus = 'pending' | 'paid' | 'overdue' | 'scheduled';

// Bill interface
export interface Bill {
  id: string;
  category: BillCategory;
  provider: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  frequency: BillFrequency;
  status: BillStatus;
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
  accountNumber?: string;
  autoPayEnabled: boolean;
  reminderDays: number; // Days before due date to remind
  createdAt: string;
  updatedAt: string;
}

// Bill payment record
export interface BillPayment {
  id: string;
  billId: string;
  amount: number;
  paidDate: string;
  paymentMethod: string;
  confirmationNumber?: string;
  notes?: string;
}

// Local storage keys - base keys that get userId appended
const BILLS_KEY = 'adw_bills';
const BILL_PAYMENTS_KEY = 'adw_bill_payments';

// Current user ID for multi-tenancy
let currentUserId: string | undefined;

/**
 * Set the current user ID for multi-tenant storage
 */
export function setCurrentUserId(userId: string | undefined): void {
  currentUserId = userId;
}

// Get user-specific storage key
function getUserStorageKey(baseKey: string): string {
  return currentUserId ? `${baseKey}_${currentUserId}` : baseKey;
}

// ============================================
// Local Storage Operations
// ============================================

function getBillsFromLocalStorage(): Bill[] {
  try {
    const data = localStorage.getItem(getUserStorageKey(BILLS_KEY));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('[Bills] Failed to parse local storage:', e);
    return [];
  }
}

function saveBillsToLocalStorage(bills: Bill[]): void {
  try {
    localStorage.setItem(getUserStorageKey(BILLS_KEY), JSON.stringify(bills));
  } catch (e) {
    console.warn('[Bills] Failed to save to local storage:', e);
  }
}

function getPaymentsFromLocalStorage(): BillPayment[] {
  try {
    const data = localStorage.getItem(getUserStorageKey(BILL_PAYMENTS_KEY));
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function savePaymentsToLocalStorage(payments: BillPayment[]): void {
  try {
    localStorage.setItem(getUserStorageKey(BILL_PAYMENTS_KEY), JSON.stringify(payments));
  } catch (e) {
    console.warn('[Bills] Failed to save payments:', e);
  }
}

// ============================================
// Supabase Operations (Optional)
// ============================================

async function syncBillsToSupabase(bills: Bill[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    for (const bill of bills) {
      await client.from('bills').upsert({
        id: bill.id,
        category: bill.category,
        provider: bill.provider,
        amount: bill.amount,
        due_date: bill.dueDate,
        frequency: bill.frequency,
        status: bill.status,
        is_paid: bill.isPaid,
        paid_date: bill.paidDate,
        notes: bill.notes,
        account_number: bill.accountNumber,
        auto_pay_enabled: bill.autoPayEnabled,
        reminder_days: bill.reminderDays,
        created_at: bill.createdAt,
        updated_at: bill.updatedAt
      });
    }
  } catch (e) {
    console.warn('[Bills] Supabase sync failed:', e);
  }
}

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCategoryIcon(category: BillCategory): string {
  const icons: Record<BillCategory, string> = {
    rent: '🏠',
    electricity: '⚡',
    gas: '🔥',
    water: '💧',
    trash: '🗑️',
    internet: '📶',
    phone: '📱',
    insurance: '🛡️',
    other: '📄'
  };
  return icons[category] || '📄';
}

function getCategoryColor(category: BillCategory): string {
  const colors: Record<BillCategory, string> = {
    rent: 'indigo',
    electricity: 'amber',
    gas: 'orange',
    water: 'cyan',
    trash: 'slate',
    internet: 'violet',
    phone: 'emerald',
    insurance: 'rose',
    other: 'gray'
  };
  return colors[category] || 'gray';
}

function getNextDueDate(currentDueDate: string, frequency: BillFrequency): string {
  const date = new Date(currentDueDate);
  
  switch (frequency) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'one-time':
      // No next date for one-time bills
      return currentDueDate;
  }
  
  return date.toISOString().split('T')[0];
}

function getBillStatus(bill: Bill): BillStatus {
  if (bill.isPaid) return 'paid';
  
  const today = new Date();
  const dueDate = new Date(bill.dueDate);
  
  if (dueDate < today) return 'overdue';
  if (bill.autoPayEnabled) return 'scheduled';
  
  return 'pending';
}

// ============================================
// Public API
// ============================================

/**
 * Get all bills
 */
export async function getAllBills(): Promise<Bill[]> {
  const bills = getBillsFromLocalStorage();
  
  // Update statuses based on current date
  const updatedBills = bills.map(bill => ({
    ...bill,
    status: getBillStatus(bill)
  }));
  
  return updatedBills.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/**
 * Get bill by ID
 */
export async function getBill(id: string): Promise<Bill | null> {
  const bills = getBillsFromLocalStorage();
  return bills.find(b => b.id === id) || null;
}

/**
 * Create a new bill
 */
export async function createBill(billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Bill> {
  const now = new Date().toISOString();
  
  const bill: Bill = {
    ...billData,
    id: generateId(),
    status: getBillStatus({ ...billData, id: '', createdAt: now, updatedAt: now, status: 'pending' }),
    createdAt: now,
    updatedAt: now
  };
  
  const bills = getBillsFromLocalStorage();
  bills.push(bill);
  saveBillsToLocalStorage(bills);
  
  // Sync to Supabase
  syncBillsToSupabase([bill]).catch(console.warn);
  
  return bill;
}

/**
 * Update a bill
 */
export async function updateBill(id: string, updates: Partial<Bill>): Promise<Bill | null> {
  const bills = getBillsFromLocalStorage();
  const index = bills.findIndex(b => b.id === id);
  
  if (index === -1) return null;
  
  const updatedBill: Bill = {
    ...bills[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  updatedBill.status = getBillStatus(updatedBill);
  
  bills[index] = updatedBill;
  saveBillsToLocalStorage(bills);
  
  // Sync to Supabase
  syncBillsToSupabase([updatedBill]).catch(console.warn);
  
  return updatedBill;
}

/**
 * Delete a bill
 */
export async function deleteBill(id: string): Promise<boolean> {
  const bills = getBillsFromLocalStorage();
  const filtered = bills.filter(b => b.id !== id);
  
  if (filtered.length === bills.length) return false;
  
  saveBillsToLocalStorage(filtered);
  
  // Delete from Supabase
  const client = getSupabaseClient();
  if (client) {
    client.from('bills').delete().eq('id', id).catch(console.warn);
  }
  
  return true;
}

/**
 * Mark bill as paid
 */
export async function markBillAsPaid(id: string, paidDate?: string): Promise<Bill | null> {
  const bill = await getBill(id);
  if (!bill) return null;
  
  const now = paidDate || new Date().toISOString().split('T')[0];
  
  // Update the bill
  const updatedBill = await updateBill(id, {
    isPaid: true,
    paidDate: now,
    status: 'paid'
  });
  
  // Record the payment
  const payment: BillPayment = {
    id: `pay_${Date.now()}`,
    billId: id,
    amount: bill.amount,
    paidDate: now,
    paymentMethod: 'Company Card (Mercury)'
  };
  
  const payments = getPaymentsFromLocalStorage();
  payments.push(payment);
  savePaymentsToLocalStorage(payments);
  
  // If recurring, create next occurrence
  if (bill.frequency !== 'one-time' && updatedBill) {
    const nextDueDate = getNextDueDate(bill.dueDate, bill.frequency);
    await createBill({
      ...bill,
      dueDate: nextDueDate,
      isPaid: false,
      paidDate: undefined
    });
  }
  
  return updatedBill;
}

/**
 * Get upcoming bills (next 30 days)
 */
export async function getUpcomingBills(): Promise<Bill[]> {
  const bills = await getAllBills();
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return bills.filter(bill => {
    const dueDate = new Date(bill.dueDate);
    return !bill.isPaid && dueDate >= today && dueDate <= thirtyDaysFromNow;
  });
}

/**
 * Get overdue bills
 */
export async function getOverdueBills(): Promise<Bill[]> {
  const bills = await getAllBills();
  const today = new Date();
  
  return bills.filter(bill => {
    const dueDate = new Date(bill.dueDate);
    return !bill.isPaid && dueDate < today;
  });
}

/**
 * Get monthly bill summary
 */
export async function getMonthlyBillSummary(year: number, month: number): Promise<{
  totalDue: number;
  totalPaid: number;
  billsByCategory: Record<BillCategory, number>;
  bills: Bill[];
}> {
  const allBills = await getAllBills();
  
  // Filter bills for the specified month
  const monthBills = allBills.filter(bill => {
    const dueDate = new Date(bill.dueDate);
    return dueDate.getFullYear() === year && dueDate.getMonth() === month;
  });
  
  const totalDue = monthBills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = monthBills.filter(b => b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  
  const billsByCategory: Record<BillCategory, number> = {
    rent: 0, electricity: 0, gas: 0, water: 0, trash: 0,
    internet: 0, phone: 0, insurance: 0, other: 0
  };
  
  monthBills.forEach(bill => {
    billsByCategory[bill.category] += bill.amount;
  });
  
  return { totalDue, totalPaid, billsByCategory, bills: monthBills };
}

/**
 * Get payment history for a bill
 */
export async function getBillPaymentHistory(billId: string): Promise<BillPayment[]> {
  const payments = getPaymentsFromLocalStorage();
  return payments.filter(p => p.billId === billId).sort((a, b) => 
    new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime()
  );
}

/**
 * Get all payment history
 */
export async function getAllPaymentHistory(): Promise<BillPayment[]> {
  return getPaymentsFromLocalStorage().sort((a, b) => 
    new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime()
  );
}

/**
 * Initialize default bills for 2420 Lenai Cir
 */
export async function initializeDefaultBills(): Promise<void> {
  const bills = getBillsFromLocalStorage();
  
  // Default bills for 2420 Lenai Cir, Corona CA
  const defaultBills: Array<{
    category: BillCategory;
    provider: string;
    amount: number;
    frequency: BillFrequency;
    notes: string;
    accountUrl?: string;
  }> = [
    {
      category: 'rent',
      provider: '2420 Lenai Cir - Rent',
      amount: 4500,
      frequency: 'monthly',
      notes: 'Monthly rent payment - 2420 Lenai Cir, Corona CA'
    },
    {
      category: 'water',
      provider: 'City of Corona Water',
      amount: 0, // Variable - update when bill arrives
      frequency: 'monthly',
      notes: 'Corona CA Water Utility',
      accountUrl: 'https://myaccount.coronaca.gov/Dashboard'
    },
    {
      category: 'electricity',
      provider: 'SCE (Southern California Edison)',
      amount: 0, // Variable - update when bill arrives
      frequency: 'monthly',
      notes: 'Electric bill - sce.com',
      accountUrl: 'https://www.sce.com'
    },
    {
      category: 'gas',
      provider: 'SoCalGas',
      amount: 0, // Variable - update when bill arrives
      frequency: 'monthly',
      notes: 'Gas bill - socalgas.com',
      accountUrl: 'https://www.socalgas.com'
    },
    {
      category: 'trash',
      provider: 'Waste Management',
      amount: 0, // Variable - update when bill arrives
      frequency: 'monthly',
      notes: 'Trash/recycling - wm.com',
      accountUrl: 'https://www.wm.com/us/en'
    },
    {
      category: 'internet',
      provider: 'Spectrum',
      amount: 80, // Approximately $80/month
      frequency: 'monthly',
      notes: 'Internet service - spectrum.net',
      accountUrl: 'https://www.spectrum.net'
    }
  ];
  
  // Check which bills already exist
  for (const defaultBill of defaultBills) {
    const exists = bills.some(b => 
      b.category === defaultBill.category && 
      b.provider.toLowerCase().includes(defaultBill.provider.toLowerCase().split(' ')[0])
    );
    
    if (!exists) {
      // Create due date - 1st of next month for rent, 15th for utilities
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(defaultBill.category === 'rent' ? 1 : 15);
      
      await createBill({
        category: defaultBill.category,
        provider: defaultBill.provider,
        amount: defaultBill.amount,
        dueDate: dueDate.toISOString().split('T')[0],
        frequency: defaultBill.frequency,
        isPaid: false,
        autoPayEnabled: false,
        reminderDays: 5,
        notes: defaultBill.notes + (defaultBill.accountUrl ? `\nAccount: ${defaultBill.accountUrl}` : '')
      });
    }
  }
}

// ============================================
// Transaction Matching for Bills
// ============================================

// Keywords to match Mercury transactions to bill categories
const BILL_TRANSACTION_MATCHERS: Record<BillCategory, string[]> = {
  rent: ['rent', 'landlord', 'property management', 'lenai'],
  electricity: ['sce', 'edison', 'southern california edison', 'electric', 'socal edison'],
  gas: ['socalgas', 'socal gas', 'southern california gas', 'gas company'],
  water: ['corona water', 'city of corona', 'water utility', 'water bill'],
  trash: ['waste management', 'wm.com', 'trash', 'recycling', 'garbage'],
  internet: ['spectrum', 'charter', 'internet', 'broadband', 'wifi'],
  phone: ['verizon', 'att', 'at&t', 't-mobile', 'tmobile', 'phone'],
  insurance: ['insurance', 'geico', 'state farm', 'allstate', 'progressive'],
  other: []
};

export interface MatchedTransaction {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  context?: string;
}

export interface BillWithTransactions extends Bill {
  matchedTransactions: MatchedTransaction[];
  totalPaidAmount: number;
  paymentHistory: MatchedTransaction[];
}

/**
 * Match transactions to a specific bill category
 */
export function matchTransactionsToBillCategory(
  transactions: MatchedTransaction[],
  category: BillCategory
): MatchedTransaction[] {
  const keywords = BILL_TRANSACTION_MATCHERS[category];
  if (!keywords || keywords.length === 0) return [];
  
  return transactions.filter(txn => {
    const vendorLower = txn.vendor.toLowerCase();
    const contextLower = (txn.context || '').toLowerCase();
    
    return keywords.some(keyword => 
      vendorLower.includes(keyword) || contextLower.includes(keyword)
    );
  });
}

/**
 * Match transactions to a specific bill by provider name
 */
export function matchTransactionsToBill(
  transactions: MatchedTransaction[],
  bill: Bill
): MatchedTransaction[] {
  const providerLower = bill.provider.toLowerCase();
  const category = bill.category;
  
  // Get category keywords
  const categoryKeywords = BILL_TRANSACTION_MATCHERS[category] || [];
  
  // Build search terms from provider name
  const providerWords = providerLower.split(/[\s\-\(\)]+/).filter(w => w.length > 2);
  
  return transactions.filter(txn => {
    const vendorLower = txn.vendor.toLowerCase();
    const contextLower = (txn.context || '').toLowerCase();
    const combined = vendorLower + ' ' + contextLower;
    
    // Match by category keywords
    const matchesCategory = categoryKeywords.some(keyword => combined.includes(keyword));
    
    // Match by provider name words
    const matchesProvider = providerWords.some(word => combined.includes(word));
    
    return matchesCategory || matchesProvider;
  });
}

/**
 * Get all bills with their matched transactions
 */
export async function getBillsWithTransactions(
  transactions: MatchedTransaction[]
): Promise<BillWithTransactions[]> {
  const bills = await getAllBills();
  
  return bills.map(bill => {
    const matchedTransactions = matchTransactionsToBill(transactions, bill);
    const totalPaidAmount = matchedTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Sort by date, most recent first
    const sortedTransactions = [...matchedTransactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return {
      ...bill,
      matchedTransactions: sortedTransactions,
      totalPaidAmount,
      paymentHistory: sortedTransactions
    };
  });
}

/**
 * Get payment summary for a bill category from transactions
 */
export function getCategoryPaymentSummary(
  transactions: MatchedTransaction[],
  category: BillCategory
): {
  totalPaid: number;
  transactionCount: number;
  averagePayment: number;
  lastPayment: MatchedTransaction | null;
  payments: MatchedTransaction[];
} {
  const matched = matchTransactionsToBillCategory(transactions, category);
  const totalPaid = matched.reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = matched.length;
  const averagePayment = transactionCount > 0 ? totalPaid / transactionCount : 0;
  
  // Sort by date, most recent first
  const sorted = [...matched].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return {
    totalPaid,
    transactionCount,
    averagePayment,
    lastPayment: sorted[0] || null,
    payments: sorted
  };
}

/**
 * Auto-detect bill category from a transaction
 */
export function detectBillCategory(transaction: MatchedTransaction): BillCategory | null {
  const vendorLower = transaction.vendor.toLowerCase();
  const contextLower = (transaction.context || '').toLowerCase();
  const combined = vendorLower + ' ' + contextLower;
  
  for (const [category, keywords] of Object.entries(BILL_TRANSACTION_MATCHERS)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      return category as BillCategory;
    }
  }
  
  return null;
}

// Export helpers
export const billsHelpers = {
  getCategoryIcon,
  getCategoryColor,
  getNextDueDate,
  getBillStatus,
  generateId,
  matchTransactionsToBill,
  matchTransactionsToBillCategory,
  detectBillCategory
};

export const billsService = {
  getAllBills,
  getBill,
  createBill,
  updateBill,
  deleteBill,
  markBillAsPaid,
  getUpcomingBills,
  getOverdueBills,
  getMonthlyBillSummary,
  getBillPaymentHistory,
  getAllPaymentHistory,
  initializeDefaultBills,
  getBillsWithTransactions,
  getCategoryPaymentSummary,
  setCurrentUserId
};

export default billsService;
