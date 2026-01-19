
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  FileSignature, 
  CreditCard, 
  RefreshCcw, 
  Search, 
  Download, 
  AlertCircle, 
  TrendingUp, 
  Plus, 
  Scale, 
  Trash2, 
  X, 
  ChevronRight, 
  Edit3, 
  Paperclip, 
  File, 
  UploadCloud, 
  Loader2,
  Bell,
  Check,
  CheckSquare,
  Square,
  ChevronDown,
  Wand2,
  ChevronUp,
  Calendar,
  Calculator,
  Percent,
  DollarSign,
  Printer,
  FileText,
  Zap,
  BookOpen,
  Gavel,
  ArrowUpRight,
  History,
  Target,
  Image as ImageIcon,
  FolderOpen,
  Box,
  HardDrive,
  CheckCircle2,
  ShieldAlert,
  Info,
  Waves,
  Link as LinkIcon,
  Globe,
  Lock,
  Brain,
  Lightbulb,
  Rocket,
  TrendingDown,
  Activity,
  Eye,
  ExternalLink,
  ZoomIn
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import { Transaction, DashboardStats, ChatMessage, ClientAgreement, Invoice, Attachment, TaxFormSummary, CompanyAsset } from './types';
import { analyzeTransaction, streamStrategyChat, enhanceBusinessContext, generateMonthlySummary, MonthlySummary } from './services/geminiService';
import { db } from './services/supabaseService';
import { mercuryService, hasMercuryEnvKey } from './services/mercuryService';

const COMPANY_INFO = {
  name: "Agency Dev Works",
  address: "20830 Stevens Creek Blvd #1103, Cupertino, CA 95014",
  email: "Official@AgencyDevWorks.ai",
  bankName: "Evolve Bank & Trust via Mercury",
  accountName: "Agency DevWorks",
  accountNumber: "202566543260",
  routingNumber: "091311229"
};

// Team members who can make expenses
const TEAM_MEMBERS = ['Ali', 'Mustafa', 'Sajjad', 'Mario'];

const MOCK_DATA = {
  transactions: [
    { id: 'm1', date: '2024-05-15', vendor: 'OpenAI', amount: 2500.00, category: 'Software/SaaS', context: 'API credits for custom LLM integration on Client Project X.', attachments: [], bankVerified: true },
    { id: 'm2', date: '2024-05-12', vendor: 'Apple Inc.', amount: 3499.00, category: 'Hardware', context: 'M3 Max MacBook Pro for lead architect. IRC 179 eligible.', attachments: [], bankVerified: true },
    { id: 'm3', date: '2024-04-20', vendor: 'Vercel', amount: 40.00, category: 'Software/SaaS', context: 'Production hosting for Agency Dev Works portal.', attachments: [], bankVerified: true }
  ],
  agreements: [
    { id: 'a1', clientName: 'Neural Dynamics Corp', effectiveDate: '2024-01-01', status: 'Active', scopeOfWork: 'Ongoing AI Infrastructure Management and LLM fine-tuning.', value: 125000, attachments: [{ id: 'doc1', name: 'Neural_MSA_Final.pdf', type: 'application/pdf', url: '#', dateAdded: '2024-01-01' }] }
  ],
  invoices: [
    { id: 'i1', invoiceNumber: 'INV-2024-001', clientName: 'Neural Dynamics Corp', issueDate: '2024-05-01', dueDate: '2024-05-15', amount: 15000, description: 'Milestone 2: Database Migration', status: 'Paid' },
    { id: 'i2', invoiceNumber: 'INV-2024-002', clientName: 'Astra AI', issueDate: '2024-05-10', dueDate: '2024-06-10', amount: 8500, description: 'R&D Consultation Fees', status: 'Sent' }
  ],
  assets: [
    { id: 'as1', name: 'ADW LOGO.png', type: 'image/png', url: '/assets/branding/ADW%20LOGO.png', category: 'Branding', dateAdded: '2024-01-10', size: '50KB' },
    { id: 'as2', name: 'AgencyDevWorks_BrandGuide.pdf', type: 'application/pdf', url: '#', category: 'Branding', dateAdded: '2024-01-15', size: '4.2MB' }
  ]
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'agreements' | 'invoices' | 'chat' | 'tax' | 'assets'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agreements, setAgreements] = useState<ClientAgreement[]>([]);
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMercurySyncing, setIsMercurySyncing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState<'transaction' | 'invoice' | 'agreement' | 'asset' | 'mercury' | 'receipt' | null>(null);
  const [viewingAsset, setViewingAsset] = useState<CompanyAsset | null>(null); // For image/document lightbox
  const [uploadPreview, setUploadPreview] = useState<string | null>(null); // Preview for asset upload
  const [receiptUploadTransaction, setReceiptUploadTransaction] = useState<Transaction | null>(null); // For receipt upload
  
  // Helper function to check if asset is viewable (image or PDF)
  const isViewableAsset = (asset: CompanyAsset) => {
    return asset.type.includes('image') || asset.type.includes('pdf');
  };
  
  // Helper function to open document in new tab
  const openDocumentInNewTab = (asset: CompanyAsset) => {
    if (asset.url && asset.url.startsWith('data:')) {
      // For base64 data URLs, open in new tab
      const newWindow = window.open();
      if (newWindow) {
        if (asset.type.includes('pdf')) {
          newWindow.document.write(`
            <html>
              <head><title>${asset.name}</title></head>
              <body style="margin:0;padding:0;background:#1a1a1a;">
                <embed src="${asset.url}" type="application/pdf" width="100%" height="100%" style="position:absolute;top:0;left:0;right:0;bottom:0;" />
              </body>
            </html>
          `);
        } else {
          newWindow.document.write(`
            <html>
              <head><title>${asset.name}</title></head>
              <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a;">
                <img src="${asset.url}" style="max-width:100%;max-height:100vh;" />
              </body>
            </html>
          `);
        }
      }
    } else if (asset.url && asset.url !== '#') {
      window.open(asset.url, '_blank');
    } else {
      setNotification({ message: 'Document URL not available', type: 'alert' });
    }
  };
  const [mercuryApiKey, setMercuryApiKey] = useState<string>(localStorage.getItem('mercury_key') || '');
  const [mercuryKeyError, setMercuryKeyError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(localStorage.getItem('mercury_sync') || 'Never');
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAgreement, setEditingAgreement] = useState<ClientAgreement | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [tempAttachments, setTempAttachments] = useState<Attachment[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'alert'} | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState<string>('all'); // Default to showing all transactions
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
  const [modalContext, setModalContext] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: 'Agency Dev Works Strategist online. Knowledge base: Internal Revenue Code 2024. Bank connection: Mercury Protocol established. How shall we optimize your tax posture today?', timestamp: Date.now() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  // AI Monthly Summary State
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(() => {
    const saved = localStorage.getItem('monthly_summary');
    return saved ? JSON.parse(saved) : null;
  });
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const modalFormRef = useRef<HTMLFormElement>(null);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      // Load from localStorage first (most reliable)
      const savedMercuryTransactions = localStorage.getItem('mercury_transactions');
      const savedAgreements = localStorage.getItem('agreements');
      const savedInvoices = localStorage.getItem('invoices');
      const savedAssets = localStorage.getItem('assets');
      
      const mercuryTransactions = savedMercuryTransactions ? JSON.parse(savedMercuryTransactions) : [];
      const localAgreements = savedAgreements ? JSON.parse(savedAgreements) : [];
      const localInvoices = savedInvoices ? JSON.parse(savedInvoices) : [];
      const localAssets = savedAssets ? JSON.parse(savedAssets) : [];
      
      // Try to fetch from Supabase (may fail if tables don't exist)
      const [tData, iData, aData, asData] = await Promise.all([
        db.transactions.fetch().catch(() => []),
        db.invoices.fetch().catch(() => []),
        db.agreements.fetch().catch(() => []),
        db.assets.fetch().catch(() => [])
      ]);
      
      // Combine Supabase data with localStorage data (localStorage takes priority)
      const supabaseTransactions = tData?.length ? tData : MOCK_DATA.transactions as any;
      
      // Merge: localStorage Mercury transactions + Supabase/mock data (avoiding duplicates)
      const existingIds = new Set(mercuryTransactions.map((t: any) => t.id));
      const uniqueSupabase = supabaseTransactions.filter((t: any) => !existingIds.has(t.id));
      const allTransactions = [...mercuryTransactions, ...uniqueSupabase];
      
      setTransactions(allTransactions);
      
      // Use localStorage data if available, otherwise Supabase, otherwise mock
      setAgreements(localAgreements.length ? localAgreements : (aData?.length ? aData : MOCK_DATA.agreements as any));
      setInvoices(localInvoices.length ? localInvoices : (iData?.length ? iData : MOCK_DATA.invoices as any));
      setAssets(localAssets.length ? localAssets : (asData?.length ? asData : MOCK_DATA.assets as any));
    } catch (e) {
      console.error("Load Error:", e);
      // Fallback to localStorage then mock data
      const savedMercuryTransactions = localStorage.getItem('mercury_transactions');
      const savedAgreements = localStorage.getItem('agreements');
      const savedInvoices = localStorage.getItem('invoices');
      const savedAssets = localStorage.getItem('assets');
      
      const mercuryTransactions = savedMercuryTransactions ? JSON.parse(savedMercuryTransactions) : [];
      setTransactions(mercuryTransactions.length ? mercuryTransactions : MOCK_DATA.transactions as any);
      setAgreements(savedAgreements ? JSON.parse(savedAgreements) : MOCK_DATA.agreements as any);
      setInvoices(savedInvoices ? JSON.parse(savedInvoices) : MOCK_DATA.invoices as any);
      setAssets(savedAssets ? JSON.parse(savedAssets) : MOCK_DATA.assets as any);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ESC key handler for closing lightbox
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingAsset(null);
        setShowModal(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const filteredTransactions = useMemo(() => {
    // If currentMonth is empty or 'all', show all transactions
    if (activeTab === 'transactions' && currentMonth && currentMonth !== 'all') {
      return transactions.filter(t => t.date.startsWith(currentMonth));
    }
    return transactions;
  }, [transactions, currentMonth, activeTab]);

  const [bankBalance, setBankBalance] = useState<number>(parseFloat(localStorage.getItem('mercury_balance') || '0'));
  const [accountBalances, setAccountBalances] = useState<{ 
    checking: number; 
    savings: number; 
    credit: number;
    creditLimit: number;
    creditAvailable: number;
    creditPending: number;
  }>(() => {
    const saved = localStorage.getItem('mercury_accounts');
    return saved ? JSON.parse(saved) : { checking: 0, savings: 0, credit: 0, creditLimit: 0, creditAvailable: 0, creditPending: 0 };
  });

  const stats: DashboardStats = useMemo(() => {
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalPotential_deductions = transactions.reduce((sum, t) => sum + (t.analysis?.deductibleAmount || 0), 0);
    return {
      totalSpent,
      totalPotentialDeductions: totalPotential_deductions,
      projectedTaxSavings: totalPotential_deductions * 0.25,
      optimizationScore: transactions.length > 0 ? Math.round((transactions.filter(t => t.analysis).length / transactions.length) * 100) : 0,
      bankBalance: bankBalance,
      lastSync: lastSyncTime
    };
  }, [transactions, lastSyncTime, bankBalance]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => {
      const expenditure = 15000 + (Math.random() * 10000);
      const shield = expenditure * (0.6 + (Math.random() * 0.2));
      return { name: month, expenditure, shield };
    });
  }, [transactions]);

  // Schedule C line item mapping - maps expense categories to IRS Schedule C lines
  const SCHEDULE_C_LINES: Record<string, { line: string; label: string; categories: string[] }> = {
    'line8': { line: '8', label: 'Advertising', categories: ['Advertising', 'Marketing', 'Ads'] },
    'line9': { line: '9', label: 'Car and truck expenses', categories: ['Transportation', 'Vehicle', 'Car', 'Mileage', 'Uber', 'Lyft'] },
    'line10': { line: '10', label: 'Commissions and fees', categories: ['Commissions', 'Fees', 'Platform Fees'] },
    'line11': { line: '11', label: 'Contract labor', categories: ['Contractors', 'Contract Labor', 'Freelancers', 'Subcontractors'] },
    'line13': { line: '13', label: 'Depreciation (Section 179)', categories: ['Depreciation', 'Hardware', 'Equipment'] },
    'line14': { line: '14', label: 'Employee benefit programs', categories: ['Benefits', 'Health Insurance', 'Employee Benefits'] },
    'line15': { line: '15', label: 'Insurance (other than health)', categories: ['Insurance', 'Liability Insurance', 'Business Insurance'] },
    'line17': { line: '17', label: 'Legal and professional services', categories: ['Legal', 'Professional Services', 'Accounting', 'Attorney', 'CPA'] },
    'line18': { line: '18', label: 'Office expense', categories: ['Office', 'Office Supplies', 'Supplies'] },
    'line20b': { line: '20b', label: 'Rent (other business property)', categories: ['Rent', 'Lease', 'Office Rent', 'Coworking'] },
    'line21': { line: '21', label: 'Repairs and maintenance', categories: ['Repairs', 'Maintenance'] },
    'line22': { line: '22', label: 'Supplies', categories: ['Supplies', 'Materials'] },
    'line23': { line: '23', label: 'Taxes and licenses', categories: ['Taxes', 'Licenses', 'Permits', 'Business License'] },
    'line24a': { line: '24a', label: 'Travel', categories: ['Travel', 'Lodging', 'Hotels', 'Flights'] },
    'line24b': { line: '24b', label: 'Deductible meals', categories: ['Meals', 'Business Meals', 'Dining'] },
    'line25': { line: '25', label: 'Utilities', categories: ['Utilities', 'Electric', 'Internet', 'Phone'] },
    'line27a': { line: '27a', label: 'Other expenses', categories: ['Software/SaaS', 'Software', 'SaaS', 'Subscriptions', 'Miscellaneous', 'Other'] }
  };

  const taxSummary: TaxFormSummary = useMemo(() => {
    const grossIncome = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
    const expensesByCategory: Record<string, number> = {};
    const scheduleC: Record<string, number> = {};
    let totalDeductionsValue = 0;

    // Initialize Schedule C lines
    Object.keys(SCHEDULE_C_LINES).forEach(key => {
      scheduleC[key] = 0;
    });

    transactions.forEach(t => {
      const amount = t.analysis?.deductibleAmount || t.amount;
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + amount;
      if (t.analysis) totalDeductionsValue += t.analysis.deductibleAmount;

      // Map to Schedule C lines
      let mapped = false;
      for (const [lineKey, lineInfo] of Object.entries(SCHEDULE_C_LINES)) {
        if (lineInfo.categories.some(cat => 
          t.category.toLowerCase().includes(cat.toLowerCase()) ||
          cat.toLowerCase().includes(t.category.toLowerCase())
        )) {
          scheduleC[lineKey] += amount;
          mapped = true;
          break;
        }
      }
      // Default to "Other expenses" if no match
      if (!mapped) {
        scheduleC['line27a'] += amount;
      }
    });

    const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

    return {
      year: new Date().getFullYear(),
      grossIncome,
      expensesByCategory,
      scheduleC,
      totalExpenses,
      netProfit: grossIncome - totalExpenses,
      potentialCredits: totalDeductionsValue * 0.06,
      estimatedSelfEmploymentTax: Math.max(0, (grossIncome - totalExpenses) * 0.9235 * 0.153),
      estimatedQBI: Math.max(0, (grossIncome - totalExpenses) * 0.20)
    };
  }, [transactions, invoices]);

  const resetMercurySync = (opts?: { clearKey?: boolean; clearTransactions?: boolean }) => {
    try {
      if (opts?.clearKey) {
        localStorage.removeItem('mercury_key');
        setMercuryApiKey('');
      }
      if (opts?.clearTransactions) {
        localStorage.removeItem('mercury_transactions');
        setTransactions(prev => prev.filter(t => !t.bankVerified && !t.bankId));
      }
      localStorage.removeItem('mercury_sync');
      localStorage.removeItem('mercury_balance');
      localStorage.removeItem('mercury_accounts');
      setLastSyncTime('Never');
      setBankBalance(0);
      setAccountBalances({ checking: 0, savings: 0, credit: 0, creditLimit: 0, creditAvailable: 0, creditPending: 0 });
      setMercuryKeyError(null);
    } catch (e) {
      console.warn('Failed to reset Mercury sync state:', e);
    }
  };

  const handleMercurySync = async (overrideKey?: string) => {
    // Check for API key: env variable first, then localStorage
    const hasEnvKey = hasMercuryEnvKey();
    const keyToUse = overrideKey ?? (mercuryApiKey || undefined);
    if (!hasEnvKey && !keyToUse) {
      setShowModal('mercury');
      return;
    }

    setIsMercurySyncing(true);
    setMercuryKeyError(null);
    setNotification({ message: "Connecting to Mercury Protocol...", type: 'success' });

    try {
      // Call real Mercury API (uses env key if available, otherwise localStorage key)
      const mercuryTransactions = await mercuryService.fetchTransactions(keyToUse);
      
      // Process all Mercury transactions
      const processedTransactions = mercuryTransactions.map(t => ({
        ...t,
        bankId: t.id,
        id: t.id.startsWith('merc_') ? t.id : `merc_${t.id}`,
        bankVerified: true
      }));
      
      // Save ALL Mercury transactions to localStorage for persistence
      localStorage.setItem('mercury_transactions', JSON.stringify(processedTransactions));
      
      // Update state with Mercury transactions + existing non-Mercury transactions
      setTransactions(prev => {
        const nonMercuryTransactions = prev.filter(p => !p.bankVerified && !p.bankId);
        return [...processedTransactions, ...nonMercuryTransactions];
      });

      // Also fetch the real bank balance with account breakdown
      try {
        const balanceData = await mercuryService.fetchAccountBalances(keyToUse);
        // Mercury returns balance in dollars (not cents)
        setBankBalance(balanceData.total);
        setAccountBalances({ 
          checking: balanceData.checking, 
          savings: balanceData.savings, 
          credit: balanceData.credit,
          creditLimit: balanceData.creditLimit,
          creditAvailable: balanceData.creditAvailable,
          creditPending: balanceData.creditPending
        });
        localStorage.setItem('mercury_balance', String(balanceData.total));
        localStorage.setItem('mercury_accounts', JSON.stringify({ 
          checking: balanceData.checking, 
          savings: balanceData.savings, 
          credit: balanceData.credit,
          creditLimit: balanceData.creditLimit,
          creditAvailable: balanceData.creditAvailable,
          creditPending: balanceData.creditPending
        }));
        console.log("[Mercury] Account balances saved:", balanceData);
      } catch (balanceError) {
        console.warn("Could not fetch balance:", balanceError);
      }

      const now = new Date().toLocaleString();
      setLastSyncTime(now);
      localStorage.setItem('mercury_sync', now);
      setNotification({ message: `Sync Complete. ${mercuryTransactions.length} records retrieved from Mercury.`, type: 'success' });
    } catch (error: any) {
      console.error("Mercury Sync Error:", error);
      const msg = error?.message || "Mercury Connection Failed. Verify API Credentials.";
      setNotification({ message: msg, type: 'alert' });

      // If this looks like an auth/key issue, immediately re-open the vault so user can try again.
      const looksLikeKeyIssue = /401|unauthorized|forbidden|api key|bearer|token|ipnotwhitelisted/i.test(String(msg));
      if (looksLikeKeyIssue) {
        setMercuryKeyError(String(msg));
        setShowModal('mercury');
      }
    } finally {
      setIsMercurySyncing(false);
    }
  };

  const handleSaveMercuryKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const key = String(fd.get('apiKey') || '').trim();
    setMercuryApiKey(key);
    localStorage.setItem('mercury_key', key);
    // Reset sync timestamp so user isn't stuck with stale "Never/old" state after fixing key
    localStorage.removeItem('mercury_sync');
    setLastSyncTime('Never');
    setMercuryKeyError(null);
    setShowModal(null);
    setNotification({ message: "Mercury API Key Vaulted.", type: 'success' });
    // Immediately retry sync with the newly saved key
    setTimeout(() => handleMercurySync(key), 0);
  };

  const handleEnhanceContext = async (vendor: string, amount: string) => {
    if (!modalContext.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceBusinessContext(modalContext, vendor, parseFloat(amount || "0"));
      setModalContext(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAnalyze = async (transaction: Transaction) => {
    setNotification({ message: `Analyzing ${transaction.vendor}...`, type: 'success' });
    try {
      const analysis = await analyzeTransaction(transaction);
      const updated = { ...transaction, analysis };
      
      // Update state
      setTransactions(prev => {
        const newTransactions = prev.map(t => t.id === transaction.id ? updated : t);
        
        // Save Mercury transactions (those with bankVerified) to localStorage
        const mercuryTransactions = newTransactions.filter(t => t.bankVerified);
        localStorage.setItem('mercury_transactions', JSON.stringify(mercuryTransactions));
        
        return newTransactions;
      });
      
      // Also try to save to Supabase
      db.transactions.upsert(updated).catch(e => console.warn("Supabase save failed:", e));
      
      setNotification({ message: `Analysis complete for ${transaction.vendor}`, type: 'success' });
      return updated;
    } catch (error: any) {
      console.error("Analysis error:", error);
      setNotification({ message: `Analysis failed: ${error.message || 'Unknown error'}`, type: 'alert' });
      throw error;
    }
  };

  const handleBulkAnalyze = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkAnalyzing(true);
    setNotification({ message: `Analyzing ${selectedIds.size} transactions...`, type: 'success' });
    
    try {
      const toAnalyze = transactions.filter(t => selectedIds.has(t.id));
      for (const t of toAnalyze) {
        await handleAnalyze(t);
      }
      setNotification({ message: `Successfully analyzed ${selectedIds.size} records.`, type: 'success' });
      setSelectedIds(new Set());
    } catch (error) {
      setNotification({ message: "Bulk analysis encountered an error.", type: 'alert' });
    } finally {
      setIsBulkAnalyzing(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setNotification({ message: "AI Strategist analyzing your financials...", type: 'success' });
    
    try {
      const summary = await generateMonthlySummary(
        transactions.map(t => ({ vendor: t.vendor, amount: t.amount, category: t.category, date: t.date })),
        invoices.map(i => ({ amount: i.amount, status: i.status, clientName: i.clientName })),
        bankBalance,
        agreements.map(a => ({ clientName: a.clientName, value: a.value, status: a.status }))
      );
      
      setMonthlySummary(summary);
      localStorage.setItem('monthly_summary', JSON.stringify(summary));
      setNotification({ message: "Strategic summary generated successfully!", type: 'success' });
    } catch (error: any) {
      console.error("Summary generation error:", error);
      setNotification({ message: `Summary failed: ${error.message || 'Unknown error'}`, type: 'alert' });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Permanently expunge this record?')) return;
    try {
      // Update state
      setTransactions(prev => {
        const updated = prev.filter(t => t.id !== id);
        
        // Update localStorage - remove from mercury_transactions
        const mercuryTransactions = updated.filter(t => t.bankVerified || t.bankId);
        localStorage.setItem('mercury_transactions', JSON.stringify(mercuryTransactions));
        
        return updated;
      });
      
      // Also try to delete from Supabase (may fail if not connected)
      db.transactions.delete(id).catch(e => console.warn("Supabase delete failed:", e));
      
      setNotification({ message: "Record permanently expunged.", type: 'success' });
    } catch (e) { 
      console.error(e);
      setNotification({ message: "Failed to delete record.", type: 'alert' });
    }
  };

  const handleReceiptUpload = async (transactionId: string, file: File) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newAttachment: Attachment = {
        id: `receipt_${Date.now()}`,
        name: file.name,
        type: file.type,
        url: base64String,
        dateAdded: new Date().toISOString().split('T')[0]
      };
      
      setTransactions(prev => {
        const updated = prev.map(t => {
          if (t.id === transactionId) {
            return {
              ...t,
              attachments: [...(t.attachments || []), newAttachment]
            };
          }
          return t;
        });
        
        // Update localStorage
        const mercuryTransactions = updated.filter(t => t.bankVerified || t.bankId);
        localStorage.setItem('mercury_transactions', JSON.stringify(mercuryTransactions));
        localStorage.setItem('transactions', JSON.stringify(updated));
        
        return updated;
      });
      
      setShowModal(null);
      setReceiptUploadTransaction(null);
      setUploadPreview(null);
      setNotification({ message: `Receipt "${file.name}" attached successfully!`, type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteReceipt = (transactionId: string, attachmentId: string) => {
    setTransactions(prev => {
      const updated = prev.map(t => {
        if (t.id === transactionId) {
          return {
            ...t,
            attachments: (t.attachments || []).filter(a => a.id !== attachmentId)
          };
        }
        return t;
      });
      
      // Update localStorage
      const mercuryTransactions = updated.filter(t => t.bankVerified || t.bankId);
      localStorage.setItem('mercury_transactions', JSON.stringify(mercuryTransactions));
      localStorage.setItem('transactions', JSON.stringify(updated));
      
      return updated;
    });
    setNotification({ message: "Receipt removed.", type: 'success' });
  };

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>, overrideText?: string) => {
    if (e) e.preventDefault();
    
    let message: string = '';
    if (overrideText) {
      message = overrideText;
    } else {
      const form = e?.currentTarget;
      const input = form?.elements.namedItem('chatInput') as HTMLInputElement | null;
      message = input?.value?.trim() || '';
      if (input) input.value = '';
    }

    if (!message || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: message, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const context = `
      LEDGER TOTAL: $${stats.totalSpent.toLocaleString()}
      REVENUE YTD: $${taxSummary.grossIncome.toLocaleString()}
      NET PROFIT: $${taxSummary.netProfit.toLocaleString()}
      PENDING DEDUCTIONS: $${stats.totalPotentialDeductions.toLocaleString()}
      AGREEMENTS: ${agreements.map(a => a.clientName).join(', ')}
      BANK BALANCE: $${stats.bankBalance?.toLocaleString()}
      LAST BANK SYNC: ${stats.lastSync}
    `;

    const assistantMsgId = (Date.now() + 1).toString();
    let assistantMsgContent = '';

    try {
      await streamStrategyChat(message, chatMessages.slice(-5), context, (chunk: string) => {
        setIsTyping(false);
        assistantMsgContent += chunk;
        setChatMessages(prev => {
          const existing = prev.find(m => m.id === assistantMsgId);
          if (existing) return prev.map(m => m.id === assistantMsgId ? { ...m, content: assistantMsgContent } : m);
          return [...prev, { id: assistantMsgId, role: 'assistant', content: assistantMsgContent, timestamp: Date.now() }];
        });
      });
    } catch (error) {
      console.error(error);
      setIsTyping(false);
    }
  };

  const generateTaxPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text('SCHEDULE C (FORM 1040) - PROFIT OR LOSS FROM BUSINESS', 20, 30);
    doc.setFontSize(10);
    doc.text(`Year: ${taxSummary.year} | Business: ${COMPANY_INFO.name}`, 20, 38);
    doc.text('1. Gross receipts:', 25, 60);
    doc.text(`$${taxSummary.grossIncome.toLocaleString()}`, 170, 60, { align: 'right' });
    let y = 83;
    Object.entries(taxSummary.expensesByCategory).forEach(([cat, val]) => {
      doc.text(`${cat}:`, 25, y);
      doc.text(`$${val.toLocaleString()}`, 170, y, { align: 'right' });
      y += 8;
    });
    doc.text('NET PROFIT:', 25, y + 20);
    doc.text(`$${taxSummary.netProfit.toLocaleString()}`, 170, y + 20, { align: 'right' });
    doc.save(`Tax_Synthesis_${taxSummary.year}.pdf`);
  };

  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Agency Dev Works Logo - Place your logo at: public/assets/branding/adw-logo.png */}
        <img 
          src="/assets/branding/ADW%20LOGO.png" 
          alt="Agency Dev Works" 
          className="w-full h-full object-contain drop-shadow-lg"
          onError={(e) => {
            // Fallback if logo not found
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        {/* Fallback placeholder - hidden when logo loads */}
        <div className="hidden absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
          <span className="text-white font-black text-lg">AW</span>
        </div>
      </div>
      {isSidebarOpen && (
        <div className="flex flex-col">
          <span className="font-black text-sm tracking-widest text-white leading-none">AGENCY</span>
          <span className="font-medium text-[10px] tracking-[0.3em] text-indigo-400 leading-tight">DEV WORKS</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#09090A] text-slate-400 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className={`bg-[#0F0F12] border-r border-white/5 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col z-20`}>
        <div className="p-6 border-b border-white/5 bg-[#0F0F12]/50 backdrop-blur-md"><Logo /></div>
        <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Strategist HQ' },
            { id: 'transactions', icon: Receipt, label: 'Expenditures' },
            { id: 'agreements', icon: FileSignature, label: 'Service Agreements' },
            { id: 'invoices', icon: CreditCard, label: 'Revenue Log' },
            { id: 'tax', icon: Calculator, label: 'Tax Center' },
            { id: 'assets', icon: HardDrive, label: 'Asset Vault' },
            { id: 'chat', icon: Sparkles, label: 'AI War Room' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-white transition-colors">
            <ChevronRight size={16} className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
            {isSidebarOpen && <span className="text-xs uppercase font-bold">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#09090A] to-[#09090A] custom-scrollbar">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#09090A]/80 backdrop-blur-xl sticky top-0 z-30">
          <h1 className="text-lg font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <LinkIcon size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Mercury Active</span>
            </div>
            <button onClick={loadData} disabled={isSyncing} className="p-2 text-slate-500 hover:text-indigo-400 transition-colors">
              <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <button className="p-2 text-slate-400 hover:text-white relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-[#09090A]"></span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative overflow-hidden bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles size={120} className="text-indigo-400" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 animate-pulse">
                          <Zap size={16} fill="currentColor" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Immediate Breakthrough Insights</span>
                      </div>
                      <h2 className="text-2xl font-black text-white leading-tight">Optimizing IRC § 41 R&D Pipeline</h2>
                      <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                        Strategist analysis detected 3 high-probability tax deductions waiting for verification. Increase Audit Shield to 98% with one click.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center bg-[#09090A]/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 min-w-[120px]">
                        <span className="text-lg font-black text-emerald-400">$4,250</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Potential Shield</span>
                      </div>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2">
                        Apply Strategies <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mercury Bank Status Card - Checking */}
                <div className="bg-[#121216] border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                   <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20 group-hover:rotate-12 transition-transform">
                          <Globe size={24} />
                        </div>
                        <span className="text-[8px] font-black text-indigo-400 border border-indigo-400/20 px-2 py-1 rounded-full uppercase tracking-widest">Checking</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Operating Account</div>
                        <div className="text-3xl font-black text-white">${accountBalances.checking.toLocaleString()}</div>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                         <div className="text-[9px] font-bold text-slate-500">Synced: {stats.lastSync}</div>
                         <button onClick={() => handleMercurySync()} disabled={isMercurySyncing} className="text-[10px] font-black text-indigo-400 uppercase hover:text-white flex items-center gap-1.5 transition-colors">
                           {isMercurySyncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />} 
                           Sync
                         </button>
                      </div>
                   </div>
                </div>

                {/* Mercury Bank Status Card - Savings */}
                <div className="bg-[#121216] border border-emerald-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                   <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-600/20 group-hover:rotate-12 transition-transform">
                          <ShieldCheck size={24} />
                        </div>
                        <span className="text-[8px] font-black text-emerald-400 border border-emerald-400/20 px-2 py-1 rounded-full uppercase tracking-widest">Savings</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Reserve Account</div>
                        <div className="text-3xl font-black text-emerald-400">${accountBalances.savings.toLocaleString()}</div>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                         <div className="text-[9px] font-bold text-slate-500">
                           Total Liquidity: <span className="text-white">${stats.bankBalance?.toLocaleString()}</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Mercury Credit Card Balance - styled like Mercury */}
                <div className="bg-[#121216] border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
                   <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Credit Card</div>
                        </div>
                        <div className="p-2 bg-indigo-600/20 rounded-xl">
                          <CreditCard size={18} className="text-indigo-400" />
                        </div>
                      </div>
                      
                      {accountBalances.credit > 0 || accountBalances.creditAvailable > 0 ? (
                        <>
                          <div>
                            <div className="text-3xl font-black text-white">
                              ${Math.floor(accountBalances.credit).toLocaleString()}
                              <span className="text-lg text-slate-500">.{((accountBalances.credit % 1) * 100).toFixed(0).padStart(2, '0')}</span>
                            </div>
                          </div>
                          
                          {/* Credit usage bar */}
                          <div className="space-y-2">
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                                style={{ width: `${accountBalances.creditLimit > 0 ? Math.min((accountBalances.credit / accountBalances.creditLimit) * 100, 100) : 0}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[9px]">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                  <span className="text-slate-400">Balance</span>
                                </span>
                                {accountBalances.creditPending > 0 && (
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span className="text-slate-400">Pending</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-emerald-400 font-bold">
                                ${accountBalances.creditAvailable.toLocaleString()} available
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-2xl font-black text-slate-600">$0.00</div>
                          <div className="text-[10px] text-slate-500 mt-2">
                            No credit card balance found.<br/>
                            Sync Mercury to load credit card data.
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[9px] text-slate-500">
                          <CreditCard size={12} />
                          <span>Mercury Credit Card</span>
                        </div>
                        <span className="text-[9px] text-slate-500">
                          {lastSyncTime !== 'Never' ? `Last sync: ${lastSyncTime}` : 'Not synced'}
                        </span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Expenditures', value: `$${stats.totalSpent.toLocaleString()}`, icon: Receipt, trend: '+12%', color: 'text-white' },
                  { label: 'Potential Deductions', value: `$${stats.totalPotentialDeductions.toLocaleString()}`, icon: Scale, trend: '+5.2%', color: 'text-emerald-400' },
                  { label: 'Projected Tax Savings', value: `$${stats.projectedTaxSavings.toLocaleString()}`, icon: TrendingUp, trend: 'Optimal', color: 'text-indigo-400' },
                  { label: 'Strategy Score', value: `${stats.optimizationScore}%`, icon: Sparkles, trend: 'Shield Active', color: 'text-white' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#121216] border border-white/5 p-6 rounded-3xl hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                        <stat.icon size={20} className="text-indigo-500" />
                      </div>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${i === 1 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-500'} uppercase tracking-widest`}>
                        {stat.trend}
                      </span>
                    </div>
                    <div className={`text-2xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#121216] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8 overflow-hidden relative">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                          <Waves size={18} className="text-indigo-500" /> Fiscal Shield Trajectory
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Projecting Expenditure vs Substantiated Tax Breakpoints</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                           <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expenditure</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                           <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tax Shield</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorShield" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `$${value / 1000}k`} />
                          <Tooltip contentStyle={{ backgroundColor: '#121216', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px' }} itemStyle={{ fontWeight: 700 }} />
                          <Area type="monotone" dataKey="expenditure" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                          <Area type="monotone" dataKey="shield" stroke="#34d399" strokeWidth={4} fillOpacity={1} fill="url(#colorShield)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#121216] border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center">
                       <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                         <ShieldAlert size={18} className="text-slate-500" /> Audit Defense Exposure
                       </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Safe', risk: 'Green Zone', count: 14, color: 'bg-emerald-500', icon: CheckCircle2 },
                        { label: 'Moderate', risk: 'Standard Deduction', count: 5, color: 'bg-amber-500', icon: Info },
                        { label: 'Aggressive', risk: 'Manual Substantiation', count: 2, color: 'bg-rose-500', icon: AlertCircle },
                      ].map((item, i) => (
                        <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3 group hover:border-white/10 transition-all">
                          <div className={`p-2 w-fit rounded-lg ${item.color}/10 ${item.color.replace('bg-', 'text-')}`}>
                            <item.icon size={16} />
                          </div>
                          <div>
                            <div className="text-xl font-black text-white">{item.count}</div>
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{item.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#121216] border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl text-center flex flex-col items-center">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IRC Compliance Score</h4>
                    <div className="relative w-40 h-40">
                       <svg className="w-full h-full transform -rotate-90">
                         <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-white/5" />
                         <circle 
                            cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" 
                            strokeDasharray={440}
                            strokeDashoffset={440 - (440 * stats.optimizationScore) / 100}
                            className="text-indigo-500 transition-all duration-1000 stroke-cap-round"
                         />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-white leading-none">{stats.optimizationScore}%</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Strategized</span>
                       </div>
                    </div>
                  </div>

                  <div className="bg-[#121216] border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
                    <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] flex items-center gap-2">
                       <History size={18} className="text-slate-500" /> Strategy Feed
                    </h3>
                    <div className="space-y-4">
                      {transactions.slice(0, 3).map((t, i) => (
                        <div key={i} className="flex items-center gap-4 group cursor-pointer">
                          <div className="h-10 w-1 rounded-full bg-white/5 group-hover:bg-indigo-500 transition-colors"></div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{t.vendor}</div>
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{t.date} • ${t.amount.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Monthly Strategic Summary */}
              <div className="bg-gradient-to-br from-[#121216] via-[#121216] to-indigo-950/20 border border-indigo-500/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-3xl -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-3xl -ml-32 -mb-32"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20">
                        <Brain size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-lg uppercase tracking-wide flex items-center gap-2">
                          AI Strategic Summary
                          <span className="text-[9px] font-black px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 uppercase tracking-widest">
                            {new Date().toLocaleString('default', { month: 'short' })} {new Date().getFullYear()}
                          </span>
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {monthlySummary ? `Generated: ${new Date(monthlySummary.generatedAt).toLocaleDateString()}` : 'Analyze expenses, find savings, discover ventures'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      {isGeneratingSummary ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} /> {monthlySummary ? 'Refresh Analysis' : 'Generate Summary'}
                        </>
                      )}
                    </button>
                  </div>

                  {monthlySummary ? (
                    <div className="space-y-8">
                      {/* Executive Summary */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-emerald-500/10 rounded-xl shrink-0">
                            <Activity size={20} className="text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Executive Overview</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-500">Health Score:</span>
                                <span className={`text-sm font-black ${monthlySummary.overallHealthScore >= 70 ? 'text-emerald-400' : monthlySummary.overallHealthScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                  {monthlySummary.overallHealthScore}/100
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{monthlySummary.executiveSummary}</p>
                          </div>
                        </div>
                      </div>

                      {/* Key Metrics Row */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
                          <div className="text-2xl font-black text-emerald-400">${monthlySummary.totalRevenue.toLocaleString()}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Revenue</div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
                          <div className="text-2xl font-black text-rose-400">${monthlySummary.totalExpenses.toLocaleString()}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Expenses</div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
                          <div className={`text-2xl font-black ${monthlySummary.netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {monthlySummary.netCashflow >= 0 ? '+' : ''}${monthlySummary.netCashflow.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Net Cashflow</div>
                        </div>
                      </div>

                      {/* Savings & Ventures Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Money Saving Opportunities */}
                        <div className="bg-white/[0.02] border border-emerald-500/20 rounded-2xl p-6 space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                              <DollarSign size={16} className="text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Savings Opportunities</span>
                          </div>
                          <div className="space-y-3">
                            {monthlySummary.savingsOpportunities.slice(0, 3).map((opp, idx) => (
                              <div key={idx} className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-emerald-500/20 transition-all">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-bold text-white">{opp.title}</span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${opp.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : opp.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                    {opp.priority}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mb-2">{opp.action}</p>
                                <div className="text-sm font-black text-emerald-400">
                                  Save ${opp.potentialSavings.toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* New Venture Opportunities */}
                        <div className="bg-white/[0.02] border border-purple-500/20 rounded-2xl p-6 space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                              <Rocket size={16} className="text-purple-400" />
                            </div>
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Revenue Ventures</span>
                          </div>
                          <div className="space-y-3">
                            {monthlySummary.ventureOpportunities.slice(0, 3).map((venture, idx) => (
                              <div key={idx} className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-purple-500/20 transition-all">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-bold text-white">{venture.idea}</span>
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                                    {venture.timeToImplement}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mb-2">{venture.reasoning}</p>
                                <div className="text-sm font-black text-purple-400">{venture.potentialRevenue}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Items & Risk Alerts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Action Items */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                              <Lightbulb size={16} className="text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Action Items</span>
                          </div>
                          <div className="space-y-2">
                            {monthlySummary.actionItems.slice(0, 4).map((item, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl">
                                <span className="text-[10px] font-black text-indigo-400 mt-0.5">{idx + 1}.</span>
                                <span className="text-[11px] text-slate-300">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Risk Alerts */}
                        {monthlySummary.riskAlerts && monthlySummary.riskAlerts.length > 0 && (
                          <div className="bg-white/[0.02] border border-rose-500/20 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-rose-500/10 rounded-lg">
                                <AlertCircle size={16} className="text-rose-400" />
                              </div>
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Risk Alerts</span>
                            </div>
                            <div className="space-y-2">
                              {monthlySummary.riskAlerts.slice(0, 3).map((alert, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10">
                                  <AlertCircle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                                  <span className="text-[11px] text-rose-300">{alert}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="p-6 bg-indigo-500/10 rounded-3xl inline-block mb-6">
                        <Brain size={48} className="text-indigo-400 animate-pulse" />
                      </div>
                      <h4 className="text-lg font-black text-white mb-2">AI Strategist Ready</h4>
                      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                        Click "Generate Summary" to receive a comprehensive analysis of your expenses, discover money-saving opportunities, and explore new revenue ventures.
                      </p>
                      <div className="flex justify-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <DollarSign size={14} className="text-emerald-400" /> Cost Reduction
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <Rocket size={14} className="text-purple-400" /> New Ventures
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <TrendingUp size={14} className="text-indigo-400" /> Growth Insights
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Expenditure Ledger</h2>
                  <p className="text-xs text-slate-500">Verifying cash outflows against the Mercury Protocol.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleMercurySync()} 
                    disabled={isMercurySyncing}
                    className="bg-[#121216] border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    {isMercurySyncing ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                    Sync Mercury
                  </button>
                  {selectedIds.size > 0 && (
                    <button 
                      onClick={handleBulkAnalyze}
                      disabled={isBulkAnalyzing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95 animate-in zoom-in-95"
                    >
                      {isBulkAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      Analyze Selected ({selectedIds.size})
                    </button>
                  )}
                  <button onClick={() => setShowModal('transaction')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95"><Plus size={18} /> Add Record</button>
                </div>
              </div>

              {/* Month Filter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter by Month:</span>
                  </div>
                  <select
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(e.target.value)}
                    className="bg-[#121216] border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="all">📊 All Time ({transactions.length} records)</option>
                    <option value={new Date().toISOString().slice(0, 7)}>📅 This Month</option>
                    {/* Generate last 12 months */}
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - i);
                      const value = date.toISOString().slice(0, 7);
                      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return <option key={value} value={value}>{label}</option>;
                    })}
                  </select>
                </div>
                <div className="text-[10px] text-slate-500">
                  Showing <span className="text-indigo-400 font-bold">{filteredTransactions.length}</span> of <span className="font-bold">{transactions.length}</span> transactions
                </div>
              </div>

              <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[9px] uppercase tracking-[0.2em] border-b border-white/5 bg-white/2">
                      <th className="px-6 py-4"><button onClick={toggleSelectAll}><CheckSquare size={16} /></button></th>
                      <th className="px-2 py-4">Date</th>
                      <th className="px-6 py-4">Vendor</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Made By</th>
                      <th className="px-6 py-4 text-center">Verify</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTransactions.map(t => (
                      <React.Fragment key={t.id}>
                        <tr className={`hover:bg-white/[0.02] transition-colors ${selectedIds.has(t.id) ? 'bg-indigo-500/5' : ''} ${expandedAnalysisId === t.id ? 'bg-indigo-500/5' : ''}`}>
                          <td className="px-6 py-5"><button onClick={() => toggleSelect(t.id)}>{selectedIds.has(t.id) ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} />}</button></td>
                          <td className="px-2 py-5 text-[11px] font-mono">{t.date}</td>
                          <td className="px-6 py-5 font-bold text-white">{t.vendor}</td>
                          <td className="px-6 py-5 font-mono">${t.amount.toLocaleString()}</td>
                          <td className="px-6 py-5">
                            {t.madeBy ? (
                              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                                {t.madeBy}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600">--</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                             {t.bankVerified ? (
                               <div className="flex items-center justify-center text-indigo-400 gap-1.5" title="Mercury Bank Verified">
                                 <Globe size={14} />
                                 <span className="text-[9px] font-black uppercase">MERCURY</span>
                               </div>
                             ) : (
                               <span className="text-[9px] font-black text-slate-700 uppercase">MANUAL</span>
                             )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {t.analysis && (
                                <button 
                                  onClick={() => setExpandedAnalysisId(expandedAnalysisId === t.id ? null : t.id)} 
                                  className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                                >
                                  <ShieldCheck size={12} /> IRC VERIFIED
                                  <ChevronDown size={12} className={`transition-transform ${expandedAnalysisId === t.id ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                              <button 
                                onClick={() => handleAnalyze(t)} 
                                className="text-[10px] text-indigo-400 font-bold bg-indigo-400/10 px-2 py-1 rounded hover:bg-indigo-400/20 transition-all flex items-center gap-1"
                              >
                                <Sparkles size={12} /> {t.analysis ? 'RE-ANALYZE' : 'ANALYZE'}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right flex justify-end gap-1">
                            <button 
                              onClick={() => { setReceiptUploadTransaction(t); setShowModal('receipt'); }} 
                              className={`p-2 transition-colors relative ${t.attachments && t.attachments.length > 0 ? 'text-emerald-400 hover:text-emerald-300' : 'hover:text-amber-400'}`}
                              title={t.attachments && t.attachments.length > 0 ? `${t.attachments.length} receipt(s) attached` : 'Upload receipt'}
                            >
                              <Paperclip size={16}/>
                              {t.attachments && t.attachments.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                  {t.attachments.length}
                                </span>
                              )}
                            </button>
                            <button onClick={() => { setEditingTransaction(t); setShowModal('transaction'); }} className="p-2 hover:text-indigo-400 transition-colors"><Edit3 size={16}/></button>
                            <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                        {/* Expandable IRC Compliance Dropdown */}
                        {expandedAnalysisId === t.id && t.analysis && (
                          <tr className="bg-indigo-500/5">
                            <td colSpan={8} className="px-6 py-6">
                              <div className="bg-[#0D0D10] border border-indigo-500/20 rounded-2xl p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                                      <ShieldCheck size={20} className="text-emerald-500" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black text-white uppercase tracking-wide">IRC Compliance Analysis</h4>
                                      <p className="text-[10px] text-slate-500">AI-verified tax deduction assessment for {t.vendor}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-black text-emerald-400">${t.analysis.deductibleAmount.toLocaleString()}</div>
                                    <div className="text-[9px] text-slate-500 uppercase">Deductible Amount</div>
                                  </div>
                                </div>

                                {/* Compliance Steps */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* IRC Section */}
                                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Gavel size={14} className="text-indigo-400" />
                                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">IRC Section</span>
                                    </div>
                                    <div className="text-sm font-bold text-white">{t.analysis.citedSections?.join(', ') || t.analysis.legalBasis}</div>
                                  </div>

                                  {/* Deduction Potential */}
                                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Target size={14} className="text-amber-400" />
                                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Deduction Potential</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${
                                            t.analysis.deductionPotential === 'High' ? 'bg-emerald-500' : 
                                            t.analysis.deductionPotential === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                                          }`}
                                          style={{ width: t.analysis.deductionPotential === 'High' ? '90%' : t.analysis.deductionPotential === 'Medium' ? '70%' : t.analysis.deductionPotential === 'Low' ? '40%' : '20%' }}
                                        />
                                      </div>
                                      <span className={`text-sm font-black ${
                                        t.analysis.deductionPotential === 'High' ? 'text-emerald-400' : 
                                        t.analysis.deductionPotential === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                                      }`}>{t.analysis.deductionPotential}</span>
                                    </div>
                                  </div>

                                  {/* Risk Assessment */}
                                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <ShieldAlert size={14} className="text-rose-400" />
                                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Audit Risk</span>
                                    </div>
                                    <span className={`text-sm font-bold px-3 py-1 rounded-lg inline-block ${
                                      t.analysis.riskLevel === 'Safe' ? 'bg-emerald-500/10 text-emerald-500' :
                                      t.analysis.riskLevel === 'Moderate' ? 'bg-amber-500/10 text-amber-500' :
                                      'bg-rose-500/10 text-rose-500'
                                    }`}>{t.analysis.riskLevel}</span>
                                  </div>

                                  {/* Category */}
                                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <FolderOpen size={14} className="text-cyan-400" />
                                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Category</span>
                                    </div>
                                    <div className="text-sm font-bold text-white">{t.category}</div>
                                  </div>
                                </div>

                                {/* Strategy */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <BookOpen size={14} className="text-purple-400" />
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Tax Strategy</span>
                                  </div>
                                  <p className="text-sm text-slate-300 leading-relaxed">{t.analysis.strategy}</p>
                                </div>

                                {/* Action Steps */}
                                {t.analysis.actionSteps && t.analysis.actionSteps.length > 0 && (
                                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 size={14} className="text-emerald-400" />
                                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Action Steps</span>
                                    </div>
                                    <div className="space-y-2">
                                      {t.analysis.actionSteps.map((step, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                                          <span className="text-[10px] font-black text-indigo-400 mt-0.5">{idx + 1}.</span>
                                          <span className="text-[11px] text-slate-300">{step}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Compliance Checklist */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Compliance Checklist</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      { label: 'Business Purpose Documented', check: !!t.context },
                                      { label: 'Receipt/Invoice Available', check: t.attachments && t.attachments.length > 0 },
                                      { label: 'Bank Verification', check: t.bankVerified },
                                      { label: 'IRC Section Mapped', check: t.analysis.citedSections && t.analysis.citedSections.length > 0 },
                                      { label: 'Deduction Calculated', check: t.analysis.deductibleAmount > 0 },
                                      { label: 'Risk Assessment Complete', check: !!t.analysis.riskLevel },
                                    ].map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                                        {item.check ? (
                                          <CheckCircle2 size={14} className="text-emerald-500" />
                                        ) : (
                                          <AlertCircle size={14} className="text-amber-500" />
                                        )}
                                        <span className={`text-[11px] font-medium ${item.check ? 'text-slate-300' : 'text-amber-400'}`}>
                                          {item.label}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Context Info */}
                                {t.context && (
                                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <FileText size={14} className="text-slate-400" />
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Context</span>
                                    </div>
                                    <p className="text-sm text-slate-400 italic">{t.context}</p>
                                  </div>
                                )}

                                {/* Attached Receipts */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Paperclip size={14} className="text-amber-400" />
                                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Attached Receipts</span>
                                    </div>
                                    <button 
                                      onClick={() => { setReceiptUploadTransaction(t); setShowModal('receipt'); }}
                                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                                    >
                                      <Plus size={12} /> Add Receipt
                                    </button>
                                  </div>
                                  {t.attachments && t.attachments.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {t.attachments.map(att => (
                                        <div key={att.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 group hover:border-indigo-500/30 transition-colors">
                                          <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${att.type.includes('image') ? 'bg-indigo-500/10' : 'bg-rose-500/10'}`}>
                                              {att.type.includes('image') ? (
                                                <ImageIcon size={16} className="text-indigo-400" />
                                              ) : (
                                                <FileText size={16} className="text-rose-400" />
                                              )}
                                            </div>
                                            <div>
                                              <p className="text-xs font-bold text-white truncate max-w-[150px]">{att.name}</p>
                                              <p className="text-[10px] text-slate-500">{att.dateAdded}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                              onClick={() => {
                                                setViewingAsset({
                                                  id: att.id,
                                                  name: att.name,
                                                  type: att.type,
                                                  url: att.url,
                                                  category: 'Receipt',
                                                  dateAdded: att.dateAdded,
                                                  size: ''
                                                });
                                              }}
                                              className="p-1.5 hover:bg-indigo-500/20 rounded-lg transition-colors"
                                              title="View"
                                            >
                                              <Eye size={14} className="text-indigo-400" />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteReceipt(t.id, att.id)}
                                              className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-colors"
                                              title="Delete"
                                            >
                                              <Trash2 size={14} className="text-rose-400" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-slate-500 italic">No receipts attached. Click "Add Receipt" to upload documentation.</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'agreements' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Service Agreements</h2>
                  <p className="text-xs text-slate-500">Active client contracts and retainers.</p>
                </div>
                <button onClick={() => { setEditingAgreement(null); setShowModal('agreement'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95">
                  <Plus size={18} /> New Agreement
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agreements.map(a => (
                  <div key={a.id} className="bg-[#121216] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl">
                        <FileSignature size={20} className="text-indigo-400" />
                      </div>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                        a.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 
                        a.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 
                        'bg-slate-500/10 text-slate-500'
                      }`}>{a.status}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{a.clientName}</h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{a.scopeOfWork}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <div>
                        <div className="text-lg font-black text-emerald-400">${a.value.toLocaleString()}</div>
                        <div className="text-[9px] text-slate-500 uppercase">Contract Value</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingAgreement(a); setShowModal('agreement'); }} className="p-2 hover:text-indigo-400 transition-colors"><Edit3 size={16}/></button>
                        <button onClick={async () => { 
                          if(confirm('Delete this agreement?')) { 
                            setAgreements(prev => {
                              const updated = prev.filter(x => x.id !== a.id);
                              localStorage.setItem('agreements', JSON.stringify(updated));
                              return updated;
                            });
                            db.agreements.delete(a.id).catch(e => console.warn("Supabase delete failed:", e));
                            setNotification({ message: "Agreement deleted.", type: 'success' });
                          }
                        }} className="p-2 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {agreements.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <FileSignature size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No agreements yet. Add your first client contract.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Revenue Log</h2>
                  <p className="text-xs text-slate-500">Track invoices and incoming payments.</p>
                </div>
                <button onClick={() => { setEditingInvoice(null); setShowModal('invoice'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95">
                  <Plus size={18} /> New Invoice
                </button>
              </div>
              <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[9px] uppercase tracking-[0.2em] border-b border-white/5 bg-white/2">
                      <th className="px-6 py-4">Invoice #</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-5 font-mono text-sm text-indigo-400">{inv.invoiceNumber}</td>
                        <td className="px-6 py-5 font-bold text-white">{inv.clientName}</td>
                        <td className="px-6 py-5 font-mono text-emerald-400">${inv.amount.toLocaleString()}</td>
                        <td className="px-6 py-5 text-[11px] font-mono">{inv.dueDate}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-lg ${
                            inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' :
                            inv.status === 'Sent' ? 'bg-indigo-500/10 text-indigo-400' :
                            inv.status === 'Overdue' ? 'bg-rose-500/10 text-rose-500' :
                            'bg-slate-500/10 text-slate-500'
                          }`}>{inv.status}</span>
                        </td>
                        <td className="px-6 py-5 text-right flex justify-end gap-2">
                          <button onClick={() => { setEditingInvoice(inv); setShowModal('invoice'); }} className="p-2 hover:text-indigo-400 transition-colors"><Edit3 size={16}/></button>
                          <button onClick={async () => { 
                              if(confirm('Delete this invoice?')) { 
                                setInvoices(prev => {
                                  const updated = prev.filter(x => x.id !== inv.id);
                                  localStorage.setItem('invoices', JSON.stringify(updated));
                                  return updated;
                                });
                                db.invoices.delete(inv.id).catch(e => console.warn("Supabase delete failed:", e));
                                setNotification({ message: "Invoice deleted.", type: 'success' });
                              }
                            }} className="p-2 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invoices.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No invoices yet. Create your first invoice.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Tax Center</h2>
                  <p className="text-xs text-slate-500">Schedule C (Form 1040) synthesis for {taxSummary.year}</p>
                </div>
                <div className="flex gap-3">
                  <a 
                    href="https://www.irs.gov/pub/irs-pdf/f1040sc.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all"
                  >
                    <FileText size={16} /> View IRS Form
                  </a>
                  <button onClick={generateTaxPDF} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95">
                    <Download size={18} /> Export Report
                  </button>
                </div>
              </div>

              {/* Schedule C Header Card */}
              <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <Calculator size={24} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">SCHEDULE C (Form 1040)</h3>
                    <p className="text-xs text-slate-400">Profit or Loss From Business (Sole Proprietorship)</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Business Name</span>
                    <span className="text-white font-bold">{COMPANY_INFO.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Tax Year</span>
                    <span className="text-white font-bold">{taxSummary.year}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Principal Business</span>
                    <span className="text-white font-bold">Software Development</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Business Code</span>
                    <span className="text-white font-bold">541511</span>
                  </div>
                </div>
              </div>

              {/* Part I: Income */}
              <div className="bg-[#121216] border border-white/5 rounded-3xl overflow-hidden">
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-4">
                  <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider">Part I — Income</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500 w-8">1</span>
                      <span className="text-sm text-slate-300">Gross receipts or sales</span>
                    </div>
                    <span className="font-mono text-lg font-bold text-emerald-400">${taxSummary.grossIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500 w-8">2</span>
                      <span className="text-sm text-slate-300">Returns and allowances</span>
                    </div>
                    <span className="font-mono text-lg font-bold text-slate-500">$0</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-emerald-400 w-8">7</span>
                      <span className="text-sm font-bold text-white">Gross income</span>
                    </div>
                    <span className="font-mono text-xl font-black text-emerald-400">${taxSummary.grossIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Part II: Expenses */}
              <div className="bg-[#121216] border border-white/5 rounded-3xl overflow-hidden">
                <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-4">
                  <h3 className="text-sm font-black text-rose-400 uppercase tracking-wider">Part II — Expenses</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(SCHEDULE_C_LINES).map(([key, info]) => {
                      const amount = taxSummary.scheduleC[key] || 0;
                      if (amount === 0) return null;
                      return (
                        <div key={key} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-slate-500 w-8">{info.line}</span>
                            <span className="text-sm text-slate-300">{info.label}</span>
                          </div>
                          <span className="font-mono text-sm font-bold text-rose-400">${amount.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Totals */}
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-rose-400 w-8">28</span>
                        <span className="text-sm font-bold text-white">Total expenses</span>
                      </div>
                      <span className="font-mono text-xl font-black text-rose-400">${taxSummary.totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Profit/Loss */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <TrendingUp size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 block">Line 31</span>
                      <span className="text-lg font-black text-white">Net Profit (or Loss)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-4xl font-black ${taxSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${Math.abs(taxSummary.netProfit).toLocaleString()}
                    </span>
                    {taxSummary.netProfit < 0 && <span className="text-rose-400 text-xs block mt-1">(Loss)</span>}
                  </div>
                </div>
              </div>

              {/* Tax Estimates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#121216] border border-white/5 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Percent size={16} className="text-amber-400" />
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Self-Employment Tax</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400">${taxSummary.estimatedSelfEmploymentTax.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  <p className="text-[10px] text-slate-500 mt-2">15.3% of 92.35% of net profit</p>
                </div>
                <div className="bg-[#121216] border border-white/5 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={16} className="text-cyan-400" />
                    <span className="text-[10px] text-slate-500 uppercase font-bold">QBI Deduction</span>
                  </div>
                  <div className="text-2xl font-black text-cyan-400">${taxSummary.estimatedQBI.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  <p className="text-[10px] text-slate-500 mt-2">20% of qualified business income</p>
                </div>
                <div className="bg-[#121216] border border-white/5 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} className="text-emerald-400" />
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Potential Credits</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">${taxSummary.potentialCredits.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  <p className="text-[10px] text-slate-500 mt-2">Based on analyzed deductions</p>
                </div>
              </div>

              {/* Schedule C Reference */}
              <div className="bg-[#121216] border border-white/5 rounded-3xl overflow-hidden">
                <div className="bg-indigo-500/10 border-b border-indigo-500/20 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen size={18} className="text-indigo-400" />
                    <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider">Schedule C Reference Guide</h3>
                  </div>
                  <a 
                    href="https://www.irs.gov/forms-pubs/about-schedule-c-form-1040"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    IRS Instructions <ExternalLink size={12} />
                  </a>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <span className="p-1 bg-emerald-500/20 rounded text-emerald-400 text-[10px]">Part I</span>
                      Income
                    </h4>
                    <p className="text-[10px] text-slate-500">Lines 1-7: Report gross receipts, returns, cost of goods sold, and calculate gross income.</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <span className="p-1 bg-rose-500/20 rounded text-rose-400 text-[10px]">Part II</span>
                      Expenses
                    </h4>
                    <p className="text-[10px] text-slate-500">Lines 8-27: Deductible business expenses including advertising, car, supplies, and more.</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <span className="p-1 bg-amber-500/20 rounded text-amber-400 text-[10px]">Part III</span>
                      Cost of Goods Sold
                    </h4>
                    <p className="text-[10px] text-slate-500">Lines 33-42: For businesses with inventory (typically not applicable for services).</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <span className="p-1 bg-cyan-500/20 rounded text-cyan-400 text-[10px]">Part IV</span>
                      Vehicle Info
                    </h4>
                    <p className="text-[10px] text-slate-500">Lines 43-47: Required if claiming car/truck expenses without Form 4562.</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <span className="p-1 bg-purple-500/20 rounded text-purple-400 text-[10px]">Part V</span>
                      Other Expenses
                    </h4>
                    <p className="text-[10px] text-slate-500">Line 48: Additional expenses not covered in Lines 8-27.</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <span className="p-1 bg-indigo-500/20 rounded text-indigo-400 text-[10px]">§179</span>
                      Depreciation
                    </h4>
                    <p className="text-[10px] text-slate-500">Section 179 allows immediate deduction of equipment purchases up to $1,160,000 (2024).</p>
                  </div>
                </div>
              </div>

              {/* Expenses by Category (Original) */}
              <div className="bg-[#121216] border border-white/5 rounded-3xl p-8">
                <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                  <FolderOpen size={20} className="text-indigo-400" />
                  Expenses by Business Category
                </h3>
                <div className="space-y-3">
                  {Object.entries(taxSummary.expensesByCategory).length > 0 ? (
                    Object.entries(taxSummary.expensesByCategory)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([cat, val]) => {
                        const amount = val as number;
                        const percentage = (amount / taxSummary.totalExpenses) * 100;
                        return (
                          <div key={cat} className="group">
                            <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                <span className="text-sm font-bold text-white">{cat}</span>
                                <span className="text-[10px] text-slate-500">({percentage.toFixed(1)}%)</span>
                              </div>
                              <span className="font-mono text-indigo-400 font-bold">${amount.toLocaleString()}</span>
                            </div>
                            <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-8">No expenses recorded yet. Sync with Mercury to import transactions.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Asset Vault</h2>
                  <p className="text-xs text-slate-500">Company documents, branding, and resources.</p>
                </div>
                <button onClick={() => setShowModal('asset')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95">
                  <Plus size={18} /> Upload Asset
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {assets.map(asset => (
                  <div key={asset.id} className="bg-[#121216] border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all group">
                    {/* Clickable Preview Area */}
                    <div 
                      className={`relative ${asset.type.includes('image') ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (asset.type.includes('image') && asset.url) {
                          setViewingAsset(asset);
                        }
                      }}
                    >
                      {asset.type.includes('image') && asset.url ? (
                        // Image thumbnail
                        <div className="h-40 bg-black/50 relative overflow-hidden">
                          <img 
                            src={asset.url} 
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121216] to-transparent opacity-60"></div>
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                            <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-black/50 backdrop-blur text-white uppercase">{asset.category}</span>
                            <div className="p-2 bg-indigo-500/80 rounded-xl backdrop-blur">
                              <Eye size={14} className="text-white" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Non-image file display (PDFs and other documents)
                        <div 
                          className={`h-40 flex items-center justify-center bg-gradient-to-br from-indigo-500/5 to-purple-500/5 ${asset.type.includes('pdf') && asset.url && asset.url !== '#' ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (asset.type.includes('pdf') && asset.url && asset.url !== '#') {
                              setViewingAsset(asset);
                            }
                          }}
                        >
                          <div className="text-center">
                            <div className={`p-4 rounded-2xl inline-block mb-2 transition-all duration-300 ${asset.type.includes('pdf') ? 'bg-rose-500/10 group-hover:bg-rose-500/20 group-hover:scale-110' : 'bg-indigo-500/10'}`}>
                              <FileText size={32} className={asset.type.includes('pdf') ? 'text-rose-400' : 'text-indigo-400'} />
                            </div>
                            <span className="block text-[9px] font-black px-2 py-1 rounded-lg bg-white/5 text-slate-500 uppercase">
                              {asset.type.includes('pdf') ? 'PDF Document' : asset.category}
                            </span>
                            {asset.type.includes('pdf') && asset.url && asset.url !== '#' && (
                              <span className="block text-[8px] text-indigo-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye size={10} className="inline mr-1" />Click to view
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Info section */}
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-white mb-1 truncate group-hover:text-indigo-400 transition-colors">{asset.name}</h3>
                      <p className="text-[10px] text-slate-500">{asset.size || 'Unknown size'}</p>
                      <div className="flex justify-between items-center gap-2 mt-3 pt-3 border-t border-white/5">
                        {(asset.type.includes('image') || asset.type.includes('pdf')) && asset.url && asset.url !== '#' ? (
                          <button 
                            onClick={() => setViewingAsset(asset)}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                          >
                            <Eye size={12} /> {asset.type.includes('pdf') ? 'View PDF' : 'View Full'}
                          </button>
                        ) : asset.url && asset.url !== '#' ? (
                          <a 
                            href={asset.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> Open
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <FileText size={12} /> No file
                          </span>
                        )}
                        <button onClick={async () => { 
                            if(confirm('Delete this asset?')) { 
                              setAssets(prev => {
                                const updated = prev.filter(x => x.id !== asset.id);
                                localStorage.setItem('assets', JSON.stringify(updated));
                                return updated;
                              });
                              db.assets.delete(asset.id).catch(e => console.warn("Supabase delete failed:", e));
                              setNotification({ message: "Asset deleted.", type: 'success' });
                            }
                          }} className="p-2 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {assets.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <HardDrive size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No assets yet. Upload your first file.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-[calc(100vh-12rem)] flex flex-col animate-in fade-in duration-500">
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-6 rounded-3xl ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-[#121216] border border-white/5 text-slate-300'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#121216] border border-white/5 p-6 rounded-3xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-4 pt-4 border-t border-white/5">
                <input 
                  name="chatInput" 
                  type="text" 
                  placeholder="Ask the Tax Strategist..." 
                  className="flex-1 bg-[#121216] border border-white/10 rounded-2xl py-4 px-6 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                />
                <button type="submit" disabled={isTyping} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-4 rounded-2xl transition-all">
                  <Send size={20} />
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Mercury Vault Modal */}
      {showModal === 'mercury' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowModal(null)} />
          <div className="bg-[#121216] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-2xl shadow-indigo-600/30">
                 <Lock size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Mercury Credential Vault</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Establish a read-only secure tunnel to your Mercury account for live expenditure verification.</p>
              </div>
              {mercuryKeyError && (
                <div className="w-full p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-left">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Mercury Auth Error</div>
                      <div className="text-xs text-slate-300 mt-1 break-words">{mercuryKeyError}</div>
                      <div className="text-[10px] text-slate-500 mt-2">Paste the correct key below and we’ll retry immediately.</div>
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleSaveMercuryKey} className="w-full space-y-4">
                 <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-2">API API Bearer Token</label>
                    <input 
                      name="apiKey" 
                      type="password" 
                      defaultValue={mercuryApiKey}
                      placeholder="••••••••••••••••••••••••••••••••" 
                      required 
                      className="w-full bg-[#09090A] border border-white/10 rounded-2xl py-5 px-6 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner" 
                    />
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-[10px] text-slate-400 italic">
                    <ShieldCheck size={16} className="text-indigo-500 shrink-0" />
                    Tokens are vaulted locally and never shared with the AI or external servers.
                 </div>
                 <div className="flex gap-2">
                   <button
                     type="button"
                     onClick={() => resetMercurySync({ clearKey: true })}
                     className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-black uppercase tracking-widest rounded-2xl transition-all text-[10px]"
                   >
                     Clear Key
                   </button>
                   <button
                     type="button"
                     onClick={() => resetMercurySync({ clearKey: false })}
                     className="flex-1 py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-black uppercase tracking-widest rounded-2xl transition-all text-[10px]"
                   >
                     Reset Sync
                   </button>
                 </div>
                 <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95">Establish Connection</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Agreement Modal */}
      {showModal === 'agreement' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowModal(null); setEditingAgreement(null); setTempAttachments([]); }} />
          <div className="bg-[#121216] border border-white/10 w-full max-w-2xl rounded-3xl p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => { setShowModal(null); setEditingAgreement(null); setTempAttachments([]); }} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                <FileSignature size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{editingAgreement ? 'Edit Agreement' : 'New Service Agreement'}</h3>
                <p className="text-xs text-slate-500">Create a new client contract or retainer agreement</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const agreement: ClientAgreement = {
                id: editingAgreement?.id || `agr_${Date.now()}`,
                clientName: fd.get('clientName') as string,
                effectiveDate: fd.get('effectiveDate') as string,
                expirationDate: fd.get('expirationDate') as string || undefined,
                status: fd.get('status') as 'Active' | 'Pending' | 'Expired',
                scopeOfWork: fd.get('scopeOfWork') as string,
                value: parseFloat(fd.get('value') as string) || 0,
                notes: fd.get('notes') as string || undefined,
                attachments: tempAttachments.length > 0 ? tempAttachments : (editingAgreement?.attachments || [])
              };
              
              // Update local state first (always works)
              if (editingAgreement) {
                setAgreements(prev => {
                  const updated = prev.map(a => a.id === agreement.id ? agreement : a);
                  localStorage.setItem('agreements', JSON.stringify(updated));
                  return updated;
                });
              } else {
                setAgreements(prev => {
                  const updated = [...prev, agreement];
                  localStorage.setItem('agreements', JSON.stringify(updated));
                  return updated;
                });
              }
              
              // Try to save to Supabase (optional - may fail if table doesn't exist)
              try {
                await db.agreements.upsert(agreement);
              } catch (error) {
                console.warn('Supabase save failed (table may not exist), saved locally:', error);
              }
              
              setNotification({ message: editingAgreement ? 'Agreement updated!' : 'Agreement created!', type: 'success' });
              setShowModal(null);
              setEditingAgreement(null);
              setTempAttachments([]);
            }} className="space-y-6">
              
              {/* Client/Agreement Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client / Agreement Name *</label>
                <input 
                  name="clientName" 
                  type="text" 
                  defaultValue={editingAgreement?.clientName || ''}
                  placeholder="e.g., Neural Dynamics Corp - Master Services Agreement"
                  required
                  className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              {/* Description / Scope of Work */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description / Scope of Work *</label>
                <textarea 
                  name="scopeOfWork" 
                  defaultValue={editingAgreement?.scopeOfWork || ''}
                  placeholder="Describe the services, deliverables, and scope covered by this agreement..."
                  required
                  rows={4}
                  className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Contract Value & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contract Value ($)</label>
                  <input 
                    name="value" 
                    type="number" 
                    step="0.01"
                    defaultValue={editingAgreement?.value || ''}
                    placeholder="0.00"
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingAgreement?.status || 'Active'}
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Effective Date *</label>
                  <input 
                    name="effectiveDate" 
                    type="date" 
                    defaultValue={editingAgreement?.effectiveDate || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiration Date</label>
                  <input 
                    name="expirationDate" 
                    type="date" 
                    defaultValue={editingAgreement?.expirationDate || ''}
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Additional Notes</label>
                <textarea 
                  name="notes" 
                  defaultValue={editingAgreement?.notes || ''}
                  placeholder="Any additional notes, special terms, or reminders..."
                  rows={2}
                  className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              {/* PDF Upload */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agreement Document (PDF)</label>
                <div 
                  className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-all cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const newAttachment: Attachment = {
                          id: `att_${Date.now()}`,
                          name: file.name,
                          type: file.type,
                          url: URL.createObjectURL(file),
                          dateAdded: new Date().toISOString().split('T')[0]
                        };
                        setTempAttachments(prev => [...prev, newAttachment]);
                        setNotification({ message: `File "${file.name}" attached`, type: 'success' });
                      }
                    }}
                  />
                  <div className="p-4 bg-indigo-500/10 rounded-2xl inline-block mb-4 group-hover:bg-indigo-500/20 transition-all">
                    <UploadCloud size={32} className="text-indigo-400" />
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Click to upload agreement PDF</p>
                  <p className="text-[10px] text-slate-600">Supports PDF, DOC, DOCX files</p>
                </div>

                {/* Attached Files */}
                {(tempAttachments.length > 0 || (editingAgreement?.attachments && editingAgreement.attachments.length > 0)) && (
                  <div className="space-y-2 mt-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attached Documents</span>
                    <div className="space-y-2">
                      {[...tempAttachments, ...(editingAgreement?.attachments || [])].map((att, idx) => (
                        <div key={att.id || idx} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-500/10 rounded-lg">
                              <FileText size={16} className="text-rose-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{att.name}</p>
                              <p className="text-[9px] text-slate-500">Added: {att.dateAdded}</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setTempAttachments(prev => prev.filter(a => a.id !== att.id));
                            }}
                            className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(null); setEditingAgreement(null); setTempAttachments([]); }}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  {editingAgreement ? 'Update Agreement' : 'Create Agreement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showModal === 'transaction' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowModal(null); setEditingTransaction(null); }} />
          <div className="bg-[#121216] border border-white/10 w-full max-w-xl rounded-3xl p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => { setShowModal(null); setEditingTransaction(null); }} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                <Receipt size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h3>
                <p className="text-xs text-slate-500">Add or edit an expenditure record</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const transaction: Transaction = {
                id: editingTransaction?.id || `txn_${Date.now()}`,
                date: fd.get('date') as string,
                vendor: fd.get('vendor') as string,
                amount: parseFloat(fd.get('amount') as string) || 0,
                category: fd.get('category') as string,
                context: fd.get('context') as string || undefined,
                madeBy: fd.get('madeBy') as string || undefined,
                attachments: editingTransaction?.attachments || [],
                bankVerified: false
              };
              
              // Update local state first
              if (editingTransaction) {
                setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
              } else {
                setTransactions(prev => [...prev, transaction]);
              }
              
              // Try Supabase (optional)
              try {
                await db.transactions.upsert(transaction);
              } catch (error) {
                console.warn('Supabase save failed, saved locally:', error);
              }
              
              setNotification({ message: editingTransaction ? 'Transaction updated!' : 'Transaction added!', type: 'success' });
              setShowModal(null);
              setEditingTransaction(null);
            }} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date *</label>
                  <input 
                    name="date" 
                    type="date" 
                    defaultValue={editingTransaction?.date || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount ($) *</label>
                  <input 
                    name="amount" 
                    type="number" 
                    step="0.01"
                    defaultValue={editingTransaction?.amount || ''}
                    placeholder="0.00"
                    required
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendor *</label>
                <input 
                  name="vendor" 
                  type="text" 
                  defaultValue={editingTransaction?.vendor || ''}
                  placeholder="e.g., OpenAI, Apple Inc., AWS"
                  required
                  className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                  <select 
                    name="category" 
                    defaultValue={editingTransaction?.category || 'Software/SaaS'}
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="Software/SaaS">Software/SaaS</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Travel">Travel</option>
                    <option value="Meals & Entertainment">Meals & Entertainment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Made By</label>
                  <select 
                    name="madeBy" 
                    defaultValue={editingTransaction?.madeBy || ''}
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">-- Select Person --</option>
                    {TEAM_MEMBERS.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Business Context</label>
                <textarea 
                  name="context" 
                  defaultValue={editingTransaction?.context || ''}
                  placeholder="Describe the business purpose of this expense..."
                  rows={3}
                  className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(null); setEditingTransaction(null); }}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  {editingTransaction ? 'Update' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showModal === 'invoice' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowModal(null); setEditingInvoice(null); }} />
          <div className="bg-[#121216] border border-white/10 w-full max-w-xl rounded-3xl p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => { setShowModal(null); setEditingInvoice(null); }} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-emerald-600 rounded-2xl text-white">
                <CreditCard size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</h3>
                <p className="text-xs text-slate-500">Create or edit a client invoice</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const invoice: Invoice = {
                id: editingInvoice?.id || `inv_${Date.now()}`,
                invoiceNumber: fd.get('invoiceNumber') as string,
                clientName: fd.get('clientName') as string,
                issueDate: fd.get('issueDate') as string,
                dueDate: fd.get('dueDate') as string,
                amount: parseFloat(fd.get('amount') as string) || 0,
                description: fd.get('description') as string,
                status: fd.get('status') as 'Paid' | 'Sent' | 'Draft' | 'Overdue'
              };
              
              // Update local state first
              if (editingInvoice) {
                setInvoices(prev => {
                  const updated = prev.map(i => i.id === invoice.id ? invoice : i);
                  localStorage.setItem('invoices', JSON.stringify(updated));
                  return updated;
                });
              } else {
                setInvoices(prev => {
                  const updated = [...prev, invoice];
                  localStorage.setItem('invoices', JSON.stringify(updated));
                  return updated;
                });
              }
              
              // Try Supabase (optional)
              try {
                await db.invoices.upsert(invoice);
              } catch (error) {
                console.warn('Supabase save failed, saved locally:', error);
              }
              
              setNotification({ message: editingInvoice ? 'Invoice updated!' : 'Invoice created!', type: 'success' });
              setShowModal(null);
              setEditingInvoice(null);
            }} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice Number *</label>
                  <input 
                    name="invoiceNumber" 
                    type="text" 
                    defaultValue={editingInvoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`}
                    required
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount ($) *</label>
                  <input 
                    name="amount" 
                    type="number" 
                    step="0.01"
                    defaultValue={editingInvoice?.amount || ''}
                    placeholder="0.00"
                    required
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client Name *</label>
                <input 
                  name="clientName" 
                  type="text" 
                  defaultValue={editingInvoice?.clientName || ''}
                  placeholder="e.g., Neural Dynamics Corp"
                  required
                  className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description *</label>
                <textarea 
                  name="description" 
                  defaultValue={editingInvoice?.description || ''}
                  placeholder="Describe the services or deliverables..."
                  required
                  rows={2}
                  className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue Date *</label>
                  <input 
                    name="issueDate" 
                    type="date" 
                    defaultValue={editingInvoice?.issueDate || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Due Date *</label>
                  <input 
                    name="dueDate" 
                    type="date" 
                    defaultValue={editingInvoice?.dueDate || ''}
                    required
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingInvoice?.status || 'Draft'}
                    className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(null); setEditingInvoice(null); }}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Upload Modal */}
      {showModal === 'asset' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowModal(null); setUploadPreview(null); }} />
          <div className="bg-[#121216] border border-white/10 w-full max-w-md rounded-3xl p-8 relative z-10 shadow-2xl">
            <button onClick={() => { setShowModal(null); setUploadPreview(null); }} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-purple-600 rounded-2xl text-white">
                <HardDrive size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Upload Asset</h3>
                <p className="text-xs text-slate-500">Add a new company asset or document</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const fileInput = assetInputRef.current;
              const file = fileInput?.files?.[0];
              
              if (!file) {
                setNotification({ message: 'Please select a file', type: 'alert' });
                return;
              }

              // Convert file to base64 for persistence
              const reader = new FileReader();
              reader.onload = async () => {
                const base64Url = reader.result as string;
                
                const asset: CompanyAsset = {
                  id: `asset_${Date.now()}`,
                  name: file.name,
                  type: file.type,
                  url: base64Url, // Store as base64 data URL
                  category: fd.get('category') as 'Branding' | 'Legal' | 'Marketing' | 'Internal',
                  dateAdded: new Date().toISOString().split('T')[0],
                  size: `${(file.size / 1024).toFixed(1)}KB`
                };
                
                // Update local state first
                setAssets(prev => {
                  const updated = [...prev, asset];
                  localStorage.setItem('assets', JSON.stringify(updated));
                  return updated;
                });
                
                // Try Supabase (optional)
                try {
                  await db.assets.upsert(asset);
                } catch (error) {
                  console.warn('Supabase save failed, saved locally:', error);
                }
                
                setNotification({ message: 'Asset uploaded!', type: 'success' });
                setShowModal(null);
                setUploadPreview(null);
              };
              
              reader.onerror = () => {
                setNotification({ message: 'Failed to read file', type: 'alert' });
              };
              
              reader.readAsDataURL(file);
            }} className="space-y-6">
              
              <div 
                className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => assetInputRef.current?.click()}
              >
                <input 
                  ref={assetInputRef}
                  type="file" 
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = () => setUploadPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    } else {
                      setUploadPreview(null);
                    }
                  }}
                />
                {uploadPreview ? (
                  <div className="relative">
                    <img src={uploadPreview} alt="Preview" className="max-h-32 mx-auto rounded-xl mb-3" />
                    <p className="text-sm text-emerald-400 font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} /> Image ready to upload
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">Click to change file</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-purple-500/10 rounded-2xl inline-block mb-4 group-hover:bg-purple-500/20 transition-all">
                      <UploadCloud size={32} className="text-purple-400" />
                    </div>
                    <p className="text-sm text-slate-400 mb-1">Click to select a file</p>
                    <p className="text-[10px] text-slate-600">Images, PDFs, documents</p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                <select 
                  name="category" 
                  defaultValue="Branding"
                  className="w-full bg-[#09090A] border border-white/10 rounded-xl py-4 px-5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="Branding">Branding</option>
                  <option value="Legal">Legal</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Internal">Internal</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(null); setUploadPreview(null); }}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <UploadCloud size={18} />
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Upload Modal */}
      {showModal === 'receipt' && receiptUploadTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowModal(null); setReceiptUploadTransaction(null); setUploadPreview(null); }} />
          <div className="bg-[#121216] border border-white/10 w-full max-w-md rounded-3xl p-8 relative z-10 shadow-2xl">
            <button onClick={() => { setShowModal(null); setReceiptUploadTransaction(null); setUploadPreview(null); }} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-amber-600 rounded-2xl text-white">
                <Paperclip size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Upload Receipt</h3>
                <p className="text-xs text-slate-500">Attach documentation for {receiptUploadTransaction.vendor}</p>
              </div>
            </div>

            {/* Transaction Info */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-white">{receiptUploadTransaction.vendor}</p>
                  <p className="text-[10px] text-slate-500">{receiptUploadTransaction.date} • {receiptUploadTransaction.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-indigo-400">${receiptUploadTransaction.amount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Existing Receipts */}
            {receiptUploadTransaction.attachments && receiptUploadTransaction.attachments.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Attached Receipts ({receiptUploadTransaction.attachments.length})</p>
                <div className="space-y-2">
                  {receiptUploadTransaction.attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        {att.type.includes('image') ? (
                          <ImageIcon size={14} className="text-indigo-400" />
                        ) : (
                          <FileText size={14} className="text-rose-400" />
                        )}
                        <span className="text-xs text-white truncate max-w-[150px]">{att.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setViewingAsset({
                              id: att.id,
                              name: att.name,
                              type: att.type,
                              url: att.url,
                              category: 'Receipt',
                              dateAdded: att.dateAdded,
                              size: ''
                            });
                          }}
                          className="p-1.5 hover:bg-indigo-500/20 rounded transition-colors"
                        >
                          <Eye size={12} className="text-indigo-400" />
                        </button>
                        <button 
                          onClick={() => handleDeleteReceipt(receiptUploadTransaction.id, att.id)}
                          className="p-1.5 hover:bg-rose-500/20 rounded transition-colors"
                        >
                          <Trash2 size={12} className="text-rose-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div 
              className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-amber-500/50 transition-all cursor-pointer group relative overflow-hidden mb-6"
              onClick={() => document.getElementById('receiptInput')?.click()}
            >
              <input 
                id="receiptInput"
                type="file" 
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = () => setUploadPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    } else {
                      setUploadPreview('pdf');
                    }
                  }
                }}
              />
              {uploadPreview ? (
                <div className="relative">
                  {uploadPreview === 'pdf' ? (
                    <div className="p-4 bg-rose-500/10 rounded-2xl inline-block mb-3">
                      <FileText size={32} className="text-rose-400" />
                    </div>
                  ) : (
                    <img src={uploadPreview} alt="Preview" className="max-h-32 mx-auto rounded-xl mb-3" />
                  )}
                  <p className="text-sm text-emerald-400 font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Ready to upload
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">Click to change file</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-amber-500/10 rounded-2xl inline-block mb-4 group-hover:bg-amber-500/20 transition-all">
                    <UploadCloud size={32} className="text-amber-400" />
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Click to select receipt</p>
                  <p className="text-[10px] text-slate-600">Images or PDF documents</p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => { setShowModal(null); setReceiptUploadTransaction(null); setUploadPreview(null); }}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const input = document.getElementById('receiptInput') as HTMLInputElement;
                  const file = input?.files?.[0];
                  if (file && receiptUploadTransaction) {
                    handleReceiptUpload(receiptUploadTransaction.id, file);
                  } else {
                    setNotification({ message: 'Please select a file', type: 'alert' });
                  }
                }}
                disabled={!uploadPreview}
                className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Paperclip size={18} />
                Attach Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Lightbox */}
      {viewingAsset && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
            onClick={() => setViewingAsset(null)} 
          />
          <div className={`relative z-10 flex flex-col ${viewingAsset.type.includes('pdf') ? 'w-full max-w-5xl h-[90vh]' : 'max-w-6xl max-h-[90vh]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${viewingAsset.type.includes('pdf') ? 'bg-rose-500/20' : 'bg-indigo-500/20'}`}>
                  {viewingAsset.type.includes('pdf') ? (
                    <FileText size={20} className="text-rose-400" />
                  ) : (
                    <ImageIcon size={20} className="text-indigo-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewingAsset.name}</h3>
                  <p className="text-xs text-slate-500">
                    {viewingAsset.size} • {viewingAsset.category} • {viewingAsset.type.includes('pdf') ? 'PDF Document' : 'Image'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => openDocumentInNewTab(viewingAsset)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink size={18} className="text-slate-400" />
                </button>
                <a 
                  href={viewingAsset.url}
                  download={viewingAsset.name}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  title="Download"
                >
                  <Download size={18} className="text-slate-400" />
                </a>
                <button 
                  onClick={() => setViewingAsset(null)}
                  className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-xl transition-colors"
                >
                  <X size={18} className="text-slate-400 hover:text-rose-400" />
                </button>
              </div>
            </div>
            
            {/* Content Container - Image or PDF */}
            <div className={`relative bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl ${viewingAsset.type.includes('pdf') ? 'flex-1' : ''}`}>
              {viewingAsset.type.includes('pdf') ? (
                // PDF Viewer
                <iframe 
                  src={viewingAsset.url}
                  title={viewingAsset.name}
                  className="w-full h-full min-h-[70vh]"
                  style={{ border: 'none' }}
                />
              ) : (
                // Image Viewer
                <img 
                  src={viewingAsset.url} 
                  alt={viewingAsset.name}
                  className="max-w-full max-h-[75vh] object-contain mx-auto"
                />
              )}
            </div>
            
            {/* Footer hint */}
            <p className="text-center text-[10px] text-slate-600 mt-3">
              Click outside or press ESC to close • Click "Open in new tab" for full screen
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 z-[200] ${notification.type === 'success' ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-600/10 border-rose-500/50 text-rose-400'}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-xs font-bold uppercase tracking-wider">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
