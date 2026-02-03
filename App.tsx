import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ZoomIn,
  Unlink,
  Link2,
  Settings,
  Home,
  Flame,
  Droplets,
  Wifi,
  Building2,
  Clock,
  AlertTriangle,
  LogOut,
  User
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import { Transaction, DashboardStats, ChatMessage, ClientAgreement, Invoice, Attachment, TaxFormSummary, CompanyAsset } from './types';
import { analyzeTransaction, streamStrategyChat, enhanceBusinessContext, generateMonthlySummary, MonthlySummary } from './services/geminiService';
import { db } from './services/supabaseService';
import { mercuryService, hasMercuryEnvKey } from './services/mercuryService';
import { receiptsService, Receipt as ReceiptData } from './services/receiptsService';
import { chatHistoryService, ChatSession, ChatMessage as ChatHistoryMessage } from './services/chatHistoryService';
import { embeddingService } from './services/embeddingService';
import { billsService, Bill, BillCategory, billsHelpers, BillWithTransactions, MatchedTransaction } from './services/billsService';
import { credentialsService, AccountCredential } from './services/credentialsService';
import { plaidService, convertPlaidTransaction } from './services/plaidService';
import { useAuthSafe } from './src/hooks/useAuth';

// Premium Animation Variants
const pageTransition = {
  initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -20, filter: 'blur(10px)' }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const staggerItem = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: 'spring' as const, 
      stiffness: 100, 
      damping: 15,
      mass: 0.8
    }
  }
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { 
      type: 'spring', 
      stiffness: 400, 
      damping: 25 
    }
  },
  tap: { scale: 0.98 }
};

const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(99, 102, 241, 0.1)',
      '0 0 40px rgba(99, 102, 241, 0.2)',
      '0 0 20px rgba(99, 102, 241, 0.1)'
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalContent = {
  initial: { opacity: 0, scale: 0.9, y: 40 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.2 }
  }
};

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  }
};

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

const COMPANY_INFO = {
  name: "Agency Dev Works",
  address: "20830 Stevens Creek Blvd #1103, Cupertino, CA 95014",
  email: "Official@AgencyDevWorks.ai",
  bankName: "Evolve Bank & Trust via Mercury",
  bankAddress: "695 Minna St, San Francisco, CA 94103",
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
  // Auth context - null when not wrapped in AuthProvider (direct access mode)
  const auth = useAuthSafe();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'receipts' | 'agreements' | 'invoices' | 'chat' | 'tax' | 'assets' | 'bills'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agreements, setAgreements] = useState<ClientAgreement[]>([]);
  const [assets, setAssets] = useState<CompanyAsset[]>([]);
  
  // Bills State
  const [bills, setBills] = useState<Bill[]>([]);
  const [billsWithTransactions, setBillsWithTransactions] = useState<BillWithTransactions[]>([]);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  
  // Credentials State (for utility accounts)
  const [credentials, setCredentials] = useState<AccountCredential[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  
  // Receipts from adw-receipts Supabase project
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [linkingReceiptToTransaction, setLinkingReceiptToTransaction] = useState<ReceiptData | null>(null);
  const [receiptLinks, setReceiptLinks] = useState<Record<string, string>>(receiptsService.getReceiptLinks());
  const [receiptPage, setReceiptPage] = useState(1);
  const RECEIPTS_PER_PAGE = 12; // Show 12 at a time for performance
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMercurySyncing, setIsMercurySyncing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [showModal, setShowModal] = useState<'transaction' | 'invoice' | 'agreement' | 'asset' | 'mercury' | 'receipt' | 'settings' | null>(null);
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
  const [geminiApiKey, setGeminiApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAgreement, setEditingAgreement] = useState<ClientAgreement | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [tempAttachments, setTempAttachments] = useState<Attachment[]>([]);
  const [tempInvoiceAttachments, setTempInvoiceAttachments] = useState<Attachment[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'alert'} | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState<string>('all'); // Default to showing all transactions
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
  const [modalContext, setModalContext] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Initial chat message is set dynamically based on user type
  const getInitialChatMessage = (): ChatMessage => {
    const company = getCompanyName();
    const bankName = getBankDisplayName();
    if (isADWUser()) {
      return { 
        id: '1', 
        role: 'assistant', 
        content: 'Agency Dev Works Strategist online. Knowledge base: Internal Revenue Code 2024. Bank connection: Mercury Protocol established. How shall we optimize your tax posture today?', 
        timestamp: Date.now() 
      };
    }
    return { 
      id: '1', 
      role: 'assistant', 
      content: `${company} Finance Assistant ready. I have access to the Internal Revenue Code 2024 and your connected bank data. How can I help optimize your business finances and tax strategy today?`, 
      timestamp: Date.now() 
    };
  };
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Chat History State (RAG + Persistence)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Load chat sessions on mount or when auth changes
  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const sessions = await chatHistoryService.getAllSessions();
        setChatSessions(sessions);
        
        // Load current session or create new one
        const currentSession = await chatHistoryService.getCurrentSession();
        setCurrentSessionId(currentSession.id);
        
        // If session has messages, load them; otherwise use personalized initial message
        if (currentSession.messages.length > 0) {
          setChatMessages(currentSession.messages);
        } else {
          setChatMessages([getInitialChatMessage()]);
        }
      } catch (e) {
        console.error('[ChatHistory] Failed to load:', e);
        // Fallback to initial message
        setChatMessages([getInitialChatMessage()]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadChatHistory();
  }, [auth?.user?.id]); // Reload when user changes
  
  // Save chat messages when they change
  useEffect(() => {
    if (currentSessionId && chatMessages.length > 1) {
      chatHistoryService.updateSessionMessages(currentSessionId, chatMessages)
        .then(() => {
          // Refresh sessions list
          chatHistoryService.getAllSessions().then(setChatSessions);
        })
        .catch(console.error);
    }
  }, [chatMessages, currentSessionId]);
  
  // Create new chat session
  const handleNewChat = () => {
    const newSession = chatHistoryService.createSession();
    setCurrentSessionId(newSession.id);
    setChatMessages([getInitialChatMessage()]);
    chatHistoryService.getAllSessions().then(setChatSessions);
    setShowChatHistory(false);
  };
  
  // Load a previous chat session
  const handleLoadSession = async (sessionId: string) => {
    const session = await chatHistoryService.getSession(sessionId);
    if (session) {
      setCurrentSessionId(session.id);
      setChatMessages(session.messages.length > 0 ? session.messages : [getInitialChatMessage()]);
      chatHistoryService.setCurrentSession(session.id);
    }
    setShowChatHistory(false);
  };
  
  // Delete a chat session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await chatHistoryService.deleteSession(sessionId);
    const sessions = await chatHistoryService.getAllSessions();
    setChatSessions(sessions);
    
    // If we deleted the current session, create a new one
    if (sessionId === currentSessionId) {
      handleNewChat();
    }
  };
  
  // AI Monthly Summary State
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(() => {
    const saved = localStorage.getItem('monthly_summary');
    return saved ? JSON.parse(saved) : null;
  });
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const creditCardCsvInputRef = useRef<HTMLInputElement>(null);
  
  // Credit card CSV upload handler
  const handleCreditCardCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const cardName = prompt('Enter credit card name (e.g., "Chase Ink", "Amex Gold"):') || 'External Card';
    
    try {
      const content = await file.text();
      const newTransactions = mercuryService.parseCreditCardCSV(content, cardName);
      
      if (newTransactions.length === 0) {
        setNotification({ message: 'No transactions found in CSV. Check format.', type: 'error' });
        return;
      }
      
      // Add to existing transactions (avoiding duplicates by vendor+date+amount)
      setTransactions(prev => {
        const existingKeys = new Set(prev.map(t => `${t.vendor}_${t.date}_${t.amount}`));
        const uniqueNew = newTransactions.filter(t => !existingKeys.has(`${t.vendor}_${t.date}_${t.amount}`));
        const updated = [...prev, ...uniqueNew];
        
        // Save credit card transactions separately
        const ccTransactions = updated.filter(t => t.context?.includes('Credit Card'));
        localStorage.setItem(getUserStorageKey('creditcard_transactions'), JSON.stringify(ccTransactions));
        
        return updated;
      });
      
      setNotification({ message: `Imported ${newTransactions.length} transactions from ${cardName}!`, type: 'success' });
    } catch (error) {
      console.error('CSV parse error:', error);
      setNotification({ message: 'Failed to parse CSV file', type: 'error' });
    }
    
    // Reset input
    e.target.value = '';
  };
  const modalFormRef = useRef<HTMLFormElement>(null);

  // ADW company identifier - all @agencydevworks.ai emails share this account
  const ADW_COMPANY_ID = 'adw-company-shared';
  
  // ADW team members who have access to the shared Mercury account
  const ADW_TEAM_EMAILS = [
    'ali@agencydevworks.ai',
    'mario@agencydevworks.ai',
    'sajjad@agencydevworks.ai',
    'mustafa@agencydevworks.ai',
    'hassanain@agencydevworks.ai',
    'diego@agencydevworks.ai',
  ];
  
  // Check if user is part of ADW (agencydevworks.ai domain or in team list)
  const isADWUser = () => {
    const email = auth?.user?.email?.toLowerCase();
    if (!email) return false;
    
    // Check if email is in the explicit team list
    if (ADW_TEAM_EMAILS.includes(email)) return true;
    
    // Also allow any @agencydevworks.ai email
    return email.endsWith('@agencydevworks.ai');
  };
  
  // Get the effective user ID - ADW users share a company account
  const getEffectiveUserId = () => {
    if (isADWUser()) {
      return ADW_COMPANY_ID; // All ADW team members share this
    }
    return auth?.user?.id;
  };
  
  // ============================================
  // CLIENT PERSONALIZATION HELPERS
  // These ensure non-ADW clients see their own branding
  // ============================================
  
  // Get the company name to display - uses profile data for clients
  const getCompanyName = () => {
    if (isADWUser()) {
      return 'Agency DevWorks';
    }
    // Use company name from profile, or fallback to user's name or email
    return auth?.profile?.company_name || 
           auth?.user?.user_metadata?.full_name || 
           auth?.user?.email?.split('@')[0] || 
           'Your Company';
  };
  
  // Get the display name for the user
  const getUserDisplayName = () => {
    return auth?.user?.user_metadata?.full_name || 
           auth?.profile?.full_name ||
           auth?.user?.email?.split('@')[0] || 
           'User';
  };
  
  // Get personalized section titles based on company name
  const getSectionTitle = (section: string) => {
    const company = getCompanyName();
    const isADW = isADWUser();
    
    switch (section) {
      case 'dashboard':
        return isADW ? 'Agency DevWorks Dashboard' : `${company} Dashboard`;
      case 'strategist':
        return isADW ? 'ADW Strategist HQ' : `${company} Strategy Center`;
      case 'warroom':
        return isADW ? 'ADW AI War Room' : `${company} AI Assistant`;
      case 'bills':
        return isADW ? 'ADW Bills & Utilities' : `${company} Bills & Utilities`;
      case 'revenue':
        return isADW ? 'ADW Revenue Logs' : `${company} Revenue`;
      case 'agreements':
        return isADW ? 'ADW Service Agreements' : `${company} Agreements`;
      case 'receipts':
        return isADW ? 'ADW Receipt Vault' : `${company} Receipt Vault`;
      case 'expenditures':
        return isADW ? 'ADW Expenditure Ledger' : `${company} Expenses`;
      case 'bank':
        return isADW ? 'Mercury Bank' : 'Connected Bank';
      default:
        return section;
    }
  };
  
  // Get the bank/account name to display
  const getBankDisplayName = () => {
    if (isADWUser()) {
      return 'Mercury';
    }
    return 'Bank'; // Generic for Plaid-connected banks
  };
  
  // Helper to get user-specific localStorage key - REQUIRES valid user ID
  const getUserStorageKey = (key: string) => {
    const effectiveId = getEffectiveUserId();
    if (!effectiveId) {
      // Don't fall back to base key - that causes data bleed between users
      console.warn(`[Storage] No user ID available for key: ${key}`);
      return `${key}_anonymous_temp`;
    }
    return `${key}_${effectiveId}`;
  };

  const loadData = async () => {
    const userId = getEffectiveUserId();
    const userEmail = auth?.user?.email?.toLowerCase();
    const isADW = isADWUser();
    
    // DON'T load data if no user is authenticated - prevents loading old/other user data
    if (!userId) {
      console.log('[LoadData] No user ID - skipping data load');
      setTransactions([]);
      setAgreements([]);
      setInvoices([]);
      setAssets([]);
      setBankBalance(0);
      setAccountBalances({ checking: 0, savings: 0, credit: 0, creditLimit: 0, creditAvailable: 0, creditPending: 0 });
      setIsSyncing(false);
      return;
    }
    
    setIsSyncing(true);
    console.log(`[LoadData] Loading data for: ${userEmail} | ID: ${userId} | ADW: ${isADW}`);
    
    // CLEAR legacy localStorage keys (from before multi-tenancy) on first load
    // This ensures non-ADW users don't see old ADW data
    const legacyCleared = localStorage.getItem('legacy_data_cleared_v2');
    if (!legacyCleared) {
      console.log('[LoadData] Clearing legacy localStorage keys...');
      // Remove old keys that don't have user ID suffix
      localStorage.removeItem('mercury_transactions');
      localStorage.removeItem('creditcard_transactions');
      localStorage.removeItem('agreements');
      localStorage.removeItem('invoices');
      localStorage.removeItem('assets');
      localStorage.removeItem('mercury_balance');
      localStorage.removeItem('mercury_accounts');
      localStorage.setItem('legacy_data_cleared_v2', 'true');
    }
    
    try {
      // Load from user-specific localStorage first
      const savedMercuryTransactions = localStorage.getItem(getUserStorageKey('mercury_transactions'));
      const savedPlaidTransactions = localStorage.getItem(getUserStorageKey('plaid_transactions'));
      const savedCreditCardTransactions = localStorage.getItem(getUserStorageKey('creditcard_transactions'));
      const savedAgreements = localStorage.getItem(getUserStorageKey('agreements'));
      const savedInvoices = localStorage.getItem(getUserStorageKey('invoices'));
      const savedAssets = localStorage.getItem(getUserStorageKey('assets'));
      
      console.log(`[LoadData] User: ${userEmail} | ADW: ${isADW}`);
      console.log(`[LoadData] Mercury data: ${!!savedMercuryTransactions} | Plaid data: ${!!savedPlaidTransactions}`);
      
      // ADW users get Mercury transactions, non-ADW users get Plaid transactions
      const bankTransactions = isADW 
        ? (savedMercuryTransactions ? JSON.parse(savedMercuryTransactions) : [])
        : (savedPlaidTransactions ? JSON.parse(savedPlaidTransactions) : []);
      const creditCardTransactions = savedCreditCardTransactions ? JSON.parse(savedCreditCardTransactions) : [];
      const localAgreements = savedAgreements ? JSON.parse(savedAgreements) : [];
      const localInvoices = savedInvoices ? JSON.parse(savedInvoices) : [];
      const localAssets = savedAssets ? JSON.parse(savedAssets) : [];
      
      // Load bank balance based on user type
      if (isADW) {
        const savedBalance = localStorage.getItem(getUserStorageKey('mercury_balance'));
        const savedAccounts = localStorage.getItem(getUserStorageKey('mercury_accounts'));
        if (savedBalance) setBankBalance(parseFloat(savedBalance));
        if (savedAccounts) setAccountBalances(JSON.parse(savedAccounts));
        console.log(`[LoadData] ADW user - Mercury balance: ${savedBalance}`);
      } else {
        // Non-ADW users - load from Plaid balance
        const savedBalance = localStorage.getItem(getUserStorageKey('plaid_balance'));
        if (savedBalance) {
          setBankBalance(parseFloat(savedBalance));
          console.log(`[LoadData] Non-ADW user - Plaid balance: ${savedBalance}`);
        } else {
          setBankBalance(0);
          setAccountBalances({ checking: 0, savings: 0, credit: 0, creditLimit: 0, creditAvailable: 0, creditPending: 0 });
          console.log('[LoadData] Non-ADW user - no Plaid data yet');
        }
      }
      
      // Try to fetch from Supabase with user_id filter (multi-tenant)
      const [tData, iData, aData, asData] = await Promise.all([
        db.transactions.fetch(userId).catch(() => []),
        db.invoices.fetch(userId).catch(() => []),
        db.agreements.fetch(userId).catch(() => []),
        db.assets.fetch(userId).catch(() => [])
      ]);
      
      // For new users (no data), show empty state - no mock data
      // For returning users, show their saved data
      const isNewUser = !userId || (!tData?.length && !bankTransactions.length && !creditCardTransactions.length);
      
      if (isNewUser && userId) {
        // New user - start with empty data
        console.log('[LoadData] New user - starting fresh');
        setTransactions([]);
        setAgreements([]);
        setInvoices([]);
        setAssets([]);
      } else {
        // Combine Supabase data with localStorage data
        const supabaseTransactions = tData?.length ? tData : [];
        
        // Merge: localStorage bank transactions (Mercury or Plaid) + Credit Card + Supabase data
        const existingIds = new Set([
          ...bankTransactions.map((t: any) => t.id),
          ...creditCardTransactions.map((t: any) => t.id)
        ]);
        const uniqueSupabase = supabaseTransactions.filter((t: any) => !existingIds.has(t.id));
        const allTransactions = [...bankTransactions, ...creditCardTransactions, ...uniqueSupabase];
        
        console.log(`[LoadData] Loaded ${bankTransactions.length} bank + ${creditCardTransactions.length} credit card + ${uniqueSupabase.length} supabase transactions`);
        setTransactions(allTransactions);
        
        // Use localStorage data if available, otherwise Supabase data
        setAgreements(localAgreements.length ? localAgreements : (aData || []));
        setInvoices(localInvoices.length ? localInvoices : (iData || []));
        setAssets(localAssets.length ? localAssets : (asData || []));
      }
      
      // Load receipts from adw-receipts Supabase (separate project)
      loadReceipts();
      
      // Load bills
      loadBills();
    } catch (e) {
      console.error("Load Error:", e);
      // Fallback to user-specific localStorage
      const savedMercuryTransactions = localStorage.getItem(getUserStorageKey('mercury_transactions'));
      const savedCreditCardTransactions = localStorage.getItem(getUserStorageKey('creditcard_transactions'));
      const savedAgreements = localStorage.getItem(getUserStorageKey('agreements'));
      const savedInvoices = localStorage.getItem(getUserStorageKey('invoices'));
      const savedAssets = localStorage.getItem(getUserStorageKey('assets'));
      
      const mercuryTransactions = savedMercuryTransactions ? JSON.parse(savedMercuryTransactions) : [];
      const creditCardTransactions = savedCreditCardTransactions ? JSON.parse(savedCreditCardTransactions) : [];
      const allTxns = [...mercuryTransactions, ...creditCardTransactions];
      setTransactions(allTxns);
      setAgreements(savedAgreements ? JSON.parse(savedAgreements) : []);
      setInvoices(savedInvoices ? JSON.parse(savedInvoices) : []);
      setAssets(savedAssets ? JSON.parse(savedAssets) : []);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load receipts from adw-receipts Supabase project
  const loadReceipts = async () => {
    setIsLoadingReceipts(true);
    try {
      const fetchedReceipts = await receiptsService.fetchAllReceipts();
      setReceipts(fetchedReceipts);
      console.log(`[Receipts] Loaded ${fetchedReceipts.length} receipts from adw-receipts`);
    } catch (error) {
      console.error('[Receipts] Failed to load receipts:', error);
      setNotification({ message: 'Failed to load receipts from database', type: 'alert' });
    } finally {
      setIsLoadingReceipts(false);
    }
  };
  
  // Load bills and credentials
  const loadBills = async () => {
    try {
      // Initialize default bills (rent) if first time
      await billsService.initializeDefaultBills();
      const fetchedBills = await billsService.getAllBills();
      setBills(fetchedBills);
      console.log(`[Bills] Loaded ${fetchedBills.length} bills`);
      
      // Initialize and load credentials
      await credentialsService.initializeUtilityCredentials();
      const fetchedCredentials = await credentialsService.getAllCredentials();
      setCredentials(fetchedCredentials);
      console.log(`[Credentials] Loaded ${fetchedCredentials.length} account credentials`);
    } catch (error) {
      console.error('[Bills] Failed to load bills:', error);
    }
  };
  
  // Match transactions to bills when transactions change
  useEffect(() => {
    const matchBillsToTransactions = async () => {
      if (transactions.length === 0) return;
      
      // Convert transactions to MatchedTransaction format
      const matchableTransactions: MatchedTransaction[] = transactions.map(t => ({
        id: t.id,
        date: t.date,
        vendor: t.vendor,
        amount: t.amount,
        category: t.category,
        context: t.context
      }));
      
      const billsWithTxns = await billsService.getBillsWithTransactions(matchableTransactions);
      setBillsWithTransactions(billsWithTxns);
      console.log(`[Bills] Matched transactions to ${billsWithTxns.filter(b => b.matchedTransactions.length > 0).length} bills`);
    };
    
    matchBillsToTransactions();
  }, [transactions, bills]);

  // Link a receipt to a transaction (now saves to database!)
  const handleLinkReceipt = async (receiptId: string, transactionId: string) => {
    await receiptsService.linkReceiptToTransaction(receiptId, transactionId);
    setReceiptLinks(receiptsService.getReceiptLinks());
    setLinkingReceiptToTransaction(null);
    setNotification({ message: 'Receipt linked to transaction! ✓ Saved to database', type: 'success' });
  };

  // Unlink a receipt (now saves to database!)
  const handleUnlinkReceipt = async (receiptId: string) => {
    await receiptsService.unlinkReceipt(receiptId);
    setReceiptLinks(receiptsService.getReceiptLinks());
    setNotification({ message: 'Receipt unlinked', type: 'success' });
  };

  // Get transaction details for a linked receipt
  const getLinkedTransaction = (receiptId: string): Transaction | null => {
    const txnId = receiptLinks[receiptId];
    if (!txnId) return null;
    return transactions.find(t => t.id === txnId) || null;
  };

  // Set user ID in services for multi-tenancy when auth changes
  // ADW users share a company account, others get individual accounts
  useEffect(() => {
    const effectiveId = getEffectiveUserId();
    billsService.setCurrentUserId(effectiveId);
    credentialsService.setCurrentUserId(effectiveId);
    console.log(`[Auth] User ${auth?.user?.email} -> effective ID: ${effectiveId}`);
  }, [auth?.user?.id, auth?.user?.email]);

  // Migrate existing ADW data to shared company account
  useEffect(() => {
    const migrateADWData = () => {
      const userEmail = auth?.user?.email?.toLowerCase();
      
      // Only migrate for agencydevworks.ai accounts
      if (!userEmail?.includes('agencydevworks.ai')) return;
      
      // Check if migration already done for the shared ADW account
      const migrationKey = `data_migrated_${ADW_COMPANY_ID}`;
      if (localStorage.getItem(migrationKey)) {
        console.log('[Migration] ADW data already migrated to shared account');
        return;
      }
      
      console.log('[Migration] Starting ADW data migration to shared company account');
      
      // Keys to migrate from old (non-user-specific) storage to shared ADW account
      const keysToMigrate = [
        'mercury_transactions',
        'creditcard_transactions', 
        'agreements',
        'invoices',
        'assets',
        'adw_bills',
        'adw_bill_payments',
        'adw_credentials_encrypted'
      ];
      
      let migratedCount = 0;
      keysToMigrate.forEach(key => {
        const oldData = localStorage.getItem(key);
        if (oldData) {
          const newKey = `${key}_${ADW_COMPANY_ID}`;
          // Only migrate if new key doesn't exist
          if (!localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, oldData);
            migratedCount++;
            console.log(`[Migration] Migrated ${key} -> ${newKey}`);
          }
        }
      });
      
      // Mark migration as complete for the shared account
      localStorage.setItem(migrationKey, 'true');
      console.log(`[Migration] Complete - migrated ${migratedCount} data sets to shared ADW account`);
    };
    
    migrateADWData();
  }, [auth?.user?.email]);

  // Reload data when user changes (login/logout)
  useEffect(() => { loadData(); }, [auth?.user?.id]);

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

  // Start with 0 - actual values will be loaded by loadData() based on user type
  // (Non-ADW users should never see Mercury data)
  const [bankBalance, setBankBalance] = useState<number>(0);
  const [accountBalances, setAccountBalances] = useState<{ 
    checking: number; 
    savings: number; 
    credit: number;
    creditLimit: number;
    creditAvailable: number;
    creditPending: number;
  }>({ checking: 0, savings: 0, credit: 0, creditLimit: 0, creditAvailable: 0, creditPending: 0 });

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

  // Chart data from REAL transactions - grouped by month
  const chartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Group transactions by month
    const monthlyData: Record<string, { expenditure: number; shield: number }> = {};
    
    // Initialize all months of current year
    monthNames.forEach((month, idx) => {
      monthlyData[month] = { expenditure: 0, shield: 0 };
    });
    
    // Calculate actual expenditure and tax shield per month
    transactions.forEach(t => {
      const txDate = new Date(t.date);
      if (txDate.getFullYear() === currentYear) {
        const monthName = monthNames[txDate.getMonth()];
        monthlyData[monthName].expenditure += t.amount;
        // Tax shield = deductible amount (from AI analysis) or estimate at 60% if not analyzed
        const deductible = t.analysis?.deductibleAmount || (t.amount * 0.6);
        monthlyData[monthName].shield += deductible;
      }
    });
    
    // Return only months with data, or last 6 months if no data
    const monthsWithData = monthNames.filter(m => monthlyData[m].expenditure > 0);
    const displayMonths = monthsWithData.length > 0 
      ? monthNames.slice(0, new Date().getMonth() + 1) // Show Jan to current month
      : monthNames.slice(0, 6); // Default to first 6 months
    
    return displayMonths.map(month => ({
      name: month,
      expenditure: Math.round(monthlyData[month].expenditure),
      shield: Math.round(monthlyData[month].shield)
    }));
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
    // Mercury is ONLY for ADW users - non-ADW users use Plaid
    if (!isADWUser()) {
      console.log('[Mercury] Sync blocked - not an ADW user');
      setNotification({ message: "Mercury is for ADW accounts only. Connect your bank via Plaid.", type: 'error' });
      return;
    }
    
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
      // CLEAR OLD cached Mercury data first for fresh sync
      localStorage.removeItem('mercury_transactions');
      console.log('[Sync] 🗑️ Cleared old cached Mercury transactions');
      
      // Call real Mercury API (uses env key if available, otherwise localStorage key)
      const mercuryTransactions = await mercuryService.fetchTransactions(keyToUse);
      
      // Process all Mercury transactions
      const processedTransactions = mercuryTransactions.map(t => ({
        ...t,
        bankId: t.id,
        id: t.id.startsWith('merc_') ? t.id : `merc_${t.id}`,
        bankVerified: true
      }));
      
      // Find the most recent transaction date
      if (processedTransactions.length > 0) {
        const sortedByDate = [...processedTransactions].sort((a, b) => 
          new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
        );
        console.log('[Sync] 📅 Most recent transaction:', sortedByDate[0].date, '-', sortedByDate[0].vendor);
        console.log('[Sync] 📅 Oldest transaction:', sortedByDate[sortedByDate.length - 1].date);
      }
      
      // Save ALL Mercury transactions to localStorage for persistence
      localStorage.setItem(getUserStorageKey('mercury_transactions'), JSON.stringify(processedTransactions));
      localStorage.setItem('mercury_last_sync', new Date().toISOString());
      console.log(`[Sync] ✅ Saved ${processedTransactions.length} fresh transactions`);
      
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
        localStorage.setItem(getUserStorageKey('mercury_balance'), String(balanceData.total));
        localStorage.setItem(getUserStorageKey('mercury_accounts'), JSON.stringify({ 
          checking: balanceData.checking, 
          savings: balanceData.savings, 
          credit: balanceData.credit,
          creditLimit: balanceData.creditLimit,
          creditAvailable: balanceData.creditAvailable,
          creditPending: balanceData.creditPending
        }));
        console.log("[Mercury] Account balances saved for ADW:", balanceData);
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

  // Plaid Sync for non-ADW users
  const [isPlaidSyncing, setIsPlaidSyncing] = useState(false);
  
  const handlePlaidSync = async () => {
    const userId = getEffectiveUserId();
    if (!userId) {
      setNotification({ message: "Please log in to sync your bank", type: 'error' });
      return;
    }
    
    setIsPlaidSyncing(true);
    setNotification({ message: "Syncing your bank transactions...", type: 'success' });
    
    try {
      // Fetch transactions from Plaid
      const result = await plaidService.getTransactions(userId);
      
      if (result.transactions.length === 0) {
        setNotification({ message: "No new transactions found", type: 'success' });
        setIsPlaidSyncing(false);
        return;
      }
      
      // Convert Plaid transactions to our format
      const processedTransactions = result.transactions.map(t => convertPlaidTransaction(t));
      
      console.log(`[Plaid] Synced ${processedTransactions.length} transactions`);
      
      // Calculate total balance from accounts
      const totalBalance = result.accounts.reduce((sum, acc) => {
        if (acc.type === 'depository') {
          return sum + (acc.balances.available || acc.balances.current || 0);
        }
        return sum;
      }, 0);
      
      const creditBalance = result.accounts.reduce((sum, acc) => {
        if (acc.type === 'credit') {
          return sum + (acc.balances.current || 0);
        }
        return sum;
      }, 0);
      
      // Update state
      setBankBalance(totalBalance);
      setAccountBalances(prev => ({
        ...prev,
        checking: totalBalance,
        credit: creditBalance,
      }));
      
      // Save to localStorage with user-specific key
      localStorage.setItem(getUserStorageKey('plaid_transactions'), JSON.stringify(processedTransactions));
      localStorage.setItem(getUserStorageKey('plaid_balance'), String(totalBalance));
      localStorage.setItem('plaid_last_sync', new Date().toISOString());
      
      // Merge with existing transactions (avoiding duplicates)
      setTransactions(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newTransactions = processedTransactions.filter(t => !existingIds.has(t.id));
        return [...prev, ...newTransactions];
      });
      
      setLastSyncTime(new Date().toLocaleString());
      setNotification({ message: `Synced ${processedTransactions.length} transactions!`, type: 'success' });
    } catch (error: any) {
      console.error('[Plaid] Sync error:', error);
      setNotification({ message: error.message || "Failed to sync bank transactions", type: 'error' });
    } finally {
      setIsPlaidSyncing(false);
    }
  };
  
  // Universal sync function - calls the right sync based on user type
  const handleBankSync = () => {
    if (isADWUser()) {
      handleMercurySync();
    } else {
      handlePlaidSync();
    }
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
        localStorage.setItem(getUserStorageKey('mercury_transactions'), JSON.stringify(mercuryTransactions));
        
        return newTransactions;
      });
      
      // Also try to save to Supabase with user_id (ADW users share company account)
      db.transactions.upsert(updated, getEffectiveUserId()).catch(e => console.warn("Supabase save failed:", e));
      
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
    setNotification({ message: "AI Strategist analyzing your complete financials...", type: 'success' });
    
    try {
      // Log what data we're sending
      console.log("[Summary] Generating with:", {
        transactions: transactions.length,
        invoices: invoices.length,
        agreements: agreements.length,
        bankBalance,
        accountBalances
      });
      
      const summary = await generateMonthlySummary(
        transactions.map(t => ({ vendor: t.vendor, amount: t.amount, category: t.category, date: t.date })),
        invoices.map(i => ({ amount: i.amount, status: i.status, clientName: i.clientName })),
        bankBalance,
        agreements.map(a => ({ clientName: a.clientName, value: a.value, status: a.status })),
        {
          checking: accountBalances.checking,
          savings: accountBalances.savings,
          credit: accountBalances.credit,
          creditAvailable: accountBalances.creditAvailable
        }
      );
      
      setMonthlySummary(summary);
      localStorage.setItem('monthly_summary', JSON.stringify(summary));
      setNotification({ message: "Strategic summary generated!", type: 'success' });
    } catch (error: any) {
      console.error("Summary generation error:", error);
      setNotification({ message: `Summary failed: ${error.message || 'Unknown error'}. Try syncing Mercury first.`, type: 'alert' });
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
        localStorage.setItem(getUserStorageKey('mercury_transactions'), JSON.stringify(mercuryTransactions));
        
        return updated;
      });
      
      // Also try to delete from Supabase with user_id verification
      db.transactions.delete(id, getEffectiveUserId()).catch(e => console.warn("Supabase delete failed:", e));
      
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
        localStorage.setItem(getUserStorageKey('mercury_transactions'), JSON.stringify(mercuryTransactions));
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
      localStorage.setItem(getUserStorageKey('mercury_transactions'), JSON.stringify(mercuryTransactions));
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

    // Build comprehensive RAG context with all app data
    const appData = {
      transactions: transactions.map(t => ({
        vendor: t.vendor,
        amount: t.amount,
        category: t.category,
        date: t.date,
        context: t.context
      })),
      invoices: invoices.map(i => ({
        invoiceNumber: i.invoiceNumber,
        clientName: i.clientName,
        amount: i.amount,
        status: i.status,
        dueDate: i.dueDate
      })),
      agreements: agreements.map(a => ({
        clientName: a.clientName,
        value: a.value,
        status: a.status,
        scopeOfWork: a.scopeOfWork
      })),
      accountBalances: {
        checking: accountBalances.checking,
        savings: accountBalances.savings,
        credit: accountBalances.credit,
        creditAvailable: accountBalances.creditAvailable,
        creditLimit: accountBalances.creditLimit
      },
      receipts: receipts.map(r => ({
        merchant: r.vendor_name || undefined,
        amount: r.amount || undefined,
        date: r.receipt_date || undefined
      })),
      taxSummary: {
        totalIncome: taxSummary.grossIncome,
        totalExpenses: taxSummary.totalExpenses,
        netProfit: taxSummary.netProfit,
        estimatedTax: taxSummary.estimatedSelfEmploymentTax
      }
    };

    // Legacy context for fallback
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
      // Pass full app data for RAG-enhanced responses
      await streamStrategyChat(message, chatMessages.slice(-10), context, (chunk: string) => {
        setIsTyping(false);
        assistantMsgContent += chunk;
        setChatMessages(prev => {
          const existing = prev.find(m => m.id === assistantMsgId);
          if (existing) return prev.map(m => m.id === assistantMsgId ? { ...m, content: assistantMsgContent } : m);
          return [...prev, { id: assistantMsgId, role: 'assistant', content: assistantMsgContent, timestamp: Date.now() }];
        });
      }, appData);
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

  // Generate Professional Invoice PDF - Matching Agency Dev Works format
  const generateInvoicePDF = async (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;
    let y = 15;

    // ==================== LOGO ====================
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '/assets/branding/ADW%20LOGO.png';
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject();
        setTimeout(() => reject(), 3000);
      });
      doc.addImage(logoImg, 'PNG', leftMargin, y, 20, 20);
      y += 25;
    } catch {
      y += 5;
    }

    // ==================== HEADER ====================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', leftMargin, y);
    y += 8;

    // Horizontal line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, y, rightMargin, y);
    y += 10;

    // ==================== COMPANY INFO ====================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text('Agency DevWorks', leftMargin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(COMPANY_INFO.address, leftMargin, y);
    y += 4;
    doc.text(`Email: ${COMPANY_INFO.email}`, leftMargin, y);
    y += 12;

    // ==================== BILL TO SECTION ====================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Bill To:', leftMargin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(invoice.clientName, leftMargin, y);
    
    // Invoice Date and Number - Right aligned
    const invoiceDateFormatted = new Date(invoice.issueDate).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    doc.text(`Invoice Date: ${invoiceDateFormatted}`, rightMargin, y - 5, { align: 'right' });
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, rightMargin, y, { align: 'right' });
    
    y += 12;

    // ==================== DESCRIPTION TABLE ====================
    const tableTop = y;
    const tableWidth = rightMargin - leftMargin;
    const descColWidth = tableWidth * 0.75;
    const amountColWidth = tableWidth * 0.25;
    const rowHeight = 10;

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, tableTop, tableWidth, rowHeight, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Description', leftMargin + 3, tableTop + 7);
    doc.text('Amount', leftMargin + descColWidth + amountColWidth/2, tableTop + 7, { align: 'center' });

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.rect(leftMargin, tableTop, tableWidth, rowHeight);
    doc.line(leftMargin + descColWidth, tableTop, leftMargin + descColWidth, tableTop + rowHeight);

    // Description Row
    const rowTop = tableTop + rowHeight;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    const descLines = doc.splitTextToSize(invoice.description, descColWidth - 6);
    const contentRowHeight = Math.max(rowHeight, descLines.length * 5 + 4);
    
    doc.rect(leftMargin, rowTop, tableWidth, contentRowHeight);
    doc.line(leftMargin + descColWidth, rowTop, leftMargin + descColWidth, rowTop + contentRowHeight);
    doc.text(descLines, leftMargin + 3, rowTop + 6);
    doc.text(`$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, leftMargin + descColWidth + amountColWidth/2, rowTop + 6, { align: 'center' });

    y = rowTop + contentRowHeight;

    // Subtotal Row
    doc.setFillColor(250, 250, 250);
    doc.rect(leftMargin, y, tableWidth, rowHeight, 'F');
    doc.rect(leftMargin, y, tableWidth, rowHeight);
    doc.line(leftMargin + descColWidth, y, leftMargin + descColWidth, y + rowHeight);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text('Subtotal:', leftMargin + descColWidth - 3, y + 7, { align: 'right' });
    doc.text(`$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, leftMargin + descColWidth + amountColWidth/2, y + 7, { align: 'center' });
    y += rowHeight;

    // Total Row
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, y, tableWidth, rowHeight, 'F');
    doc.rect(leftMargin, y, tableWidth, rowHeight);
    doc.line(leftMargin + descColWidth, y, leftMargin + descColWidth, y + rowHeight);
    
    doc.setFont("helvetica", "bold");
    doc.text('Total:', leftMargin + descColWidth - 3, y + 7, { align: 'right' });
    doc.text(`$${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, leftMargin + descColWidth + amountColWidth/2, y + 7, { align: 'center' });
    y += rowHeight + 10;

    // ==================== THANK YOU MESSAGE ====================
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('Thank you for your business!', leftMargin, y);
    y += 12;

    // ==================== PAYMENT INFORMATION ====================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Information', leftMargin, y);
    y += 8;

    // ACH & Wire Information
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text('ACH & Wire Information', leftMargin, y);
    y += 4;
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, y, leftMargin + 45, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('PAYMENT REMITTANCE INSTRUCTIONS', leftMargin, y);
    y += 6;

    // Bank Details - Compact
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    
    const bankDetails = [
      { label: 'Bank Account Name:', value: COMPANY_INFO.accountName },
      { label: 'Bank Account Address:', value: COMPANY_INFO.bankAddress },
      { label: 'Bank Name:', value: COMPANY_INFO.bankName },
      { label: 'Account Number:', value: COMPANY_INFO.accountNumber },
      { label: 'Routing Number:', value: COMPANY_INFO.routingNumber }
    ];

    bankDetails.forEach(detail => {
      doc.setFont("helvetica", "bold");
      doc.text(detail.label, leftMargin, y);
      doc.setFont("helvetica", "normal");
      doc.text(detail.value, leftMargin + 42, y);
      y += 5;
    });

    y += 6;

    // Pay by Card Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text('Pay by Card (3% fee)', leftMargin, y);
    y += 4;
    doc.line(leftMargin, y, leftMargin + 40, y);
    y += 6;

    const cardAmount = invoice.amount * 1.03;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Amount: $${cardAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, leftMargin, y);

    // Save PDF
    doc.save(`Invoice_${invoice.clientName.replace(/\s+/g, '_')}_${invoice.issueDate.replace(/-/g, '_')}.pdf`);
    setNotification({ message: 'Invoice PDF generated!', type: 'success' });
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
        {/* Sidebar Navigation - Updated Jan 21 2026 */}
        <motion.nav 
          className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Strategist HQ' },
            { id: 'transactions', icon: Receipt, label: 'Expenses' },
            { id: 'receipts', icon: Paperclip, label: 'Receipts' },
            { id: 'agreements', icon: FileSignature, label: 'Service Agreements' },
            { id: 'invoices', icon: CreditCard, label: 'Revenue Log' },
            { id: 'bills', icon: Home, label: 'Bills & Utilities' },
            { id: 'tax', icon: Calculator, label: 'Tax Center' },
            { id: 'assets', icon: HardDrive, label: 'Asset Vault' },
            { id: 'chat', icon: Sparkles, label: 'AI War Room' },
          ].map((item, index) => (
            <motion.button
              key={item.id}
              variants={staggerItem}
              whileHover={{ x: 4, transition: { type: 'spring', stiffness: 400 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id as any)}
              className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-200 ${
                activeTab === item.id 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent'
              }`}
            >
              <motion.div
                animate={activeTab === item.id ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <item.icon size={20} />
              </motion.div>
              {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute left-0 w-1 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.nav>
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
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white">{getCompanyName()}</h1>
            <span className="text-slate-500">|</span>
            <span className="text-sm text-slate-400 capitalize">{activeTab.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Mercury Bank indicator */}
            <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <LinkIcon size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Mercury Active</span>
            </div>
            {/* Sync button - syncs from appropriate bank source */}
            <button 
              onClick={handleBankSync} 
              disabled={isSyncing || isMercurySyncing || isPlaidSyncing} 
              className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
              title="Sync from Mercury"
            >
              <RefreshCcw size={18} className={(isSyncing || isMercurySyncing || isPlaidSyncing) ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowModal('settings')} className="p-2 text-slate-400 hover:text-white transition-colors" title="Settings">
              <Settings size={18} />
            </button>
            <button className="p-2 text-slate-400 hover:text-white relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-[#09090A]"></span>
            </button>
            
            {/* User Menu & Logout */}
            {auth?.user && (
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
                <div className="flex items-center gap-2">
                  {auth.user.user_metadata?.avatar_url ? (
                    <img 
                      src={auth.user.user_metadata.avatar_url} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full border border-white/10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <User size={16} className="text-indigo-400" />
                    </div>
                  )}
                  <span className="text-xs text-slate-400 hidden sm:block max-w-[120px] truncate">
                    {auth.user.email}
                  </span>
                </div>
                <button 
                  onClick={() => auth.signOut()} 
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg border border-rose-500/20 transition-all text-xs font-medium" 
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
          <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <motion.div 
                  variants={staggerItem}
                  whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}
                  className="lg:col-span-2 relative overflow-hidden bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl group"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                    <Sparkles size={120} className="text-indigo-400" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <motion.div 
                          className={`p-1.5 bg-indigo-500 shadow-indigo-500/20 text-white rounded-lg shadow-lg`}
                          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <Zap size={16} fill="currentColor" />
                        </motion.div>
                        <span className={`text-[10px] font-black text-indigo-400 uppercase tracking-widest`}>
                          {'Immediate Breakthrough Insights'}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-white leading-tight">
                        Optimizing IRC § 41 R&D Pipeline
                      </h2>
                      <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                        Strategist analysis detected 3 high-probability tax deductions waiting for verification. Increase Audit Shield to 98% with one click.
                      </p>
                    </div>
                    <motion.div 
                      className="flex flex-col items-center bg-[#09090A]/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 min-w-[120px]"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <span className="text-lg font-black text-emerald-400">$4,250</span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Potential Shield</span>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Bank Status Card - Checking */}
                <motion.div 
                  variants={staggerItem}
                  whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
                  className={`bg-[#121216] border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group`}
                >
                   <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className={`p-3 bg-indigo-600 shadow-indigo-600/20 rounded-2xl text-white shadow-xl group-hover:rotate-12 transition-transform`}>
                          <Globe size={24} />
                        </div>
                        <span className={`text-[8px] font-black text-indigo-400 border-indigo-400/20 border px-2 py-1 rounded-full uppercase tracking-widest`}>Checking</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                          {'Operating Account'}
                        </div>
                        <div className="text-3xl font-black text-white">${accountBalances.checking.toLocaleString()}</div>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                         <div className="text-[9px] font-bold text-slate-500">Synced: {stats.lastSync}</div>
                         <motion.button 
                           onClick={handleBankSync} 
                           disabled={isMercurySyncing || isPlaidSyncing} 
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           className={`text-[10px] font-black text-indigo-400 uppercase hover:text-white flex items-center gap-1.5 transition-colors`}
                         >
                           {(isMercurySyncing || isPlaidSyncing) ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />} 
                           Sync
                         </motion.button>
                      </div>
                   </div>
                </motion.div>

                {/* Mercury Bank Status Card - Savings */}
                <motion.div 
                  variants={staggerItem}
                  whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
                  className="bg-[#121216] border border-emerald-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group"
                >
                   <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <motion.div 
                          className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-600/20"
                          whileHover={{ rotate: 12 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <ShieldCheck size={24} />
                        </motion.div>
                        <span className="text-[8px] font-black text-emerald-400 border border-emerald-400/20 px-2 py-1 rounded-full uppercase tracking-widest">Savings</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Reserve Account</div>
                        <motion.div 
                          className="text-3xl font-black text-emerald-400"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, type: 'spring' }}
                        >
                          ${accountBalances.savings.toLocaleString()}
                        </motion.div>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                         <div className="text-[9px] font-bold text-slate-500">
                           Total Liquidity: <span className="text-white">${stats.bankBalance?.toLocaleString()}</span>
                         </div>
                      </div>
                   </div>
                </motion.div>

                {/* True Available - After CC Autopay */}
                <motion.div 
                  variants={staggerItem}
                  whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
                  className="bg-[#121216] border border-amber-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group"
                >
                   <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-amber-600 rounded-2xl text-white shadow-xl shadow-amber-600/20 group-hover:rotate-12 transition-transform">
                          <Calculator size={24} />
                        </div>
                        <span className="text-[8px] font-black text-amber-400 border border-amber-400/20 px-2 py-1 rounded-full uppercase tracking-widest">Net Cash</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">True Available</div>
                        <div className="text-3xl font-black text-amber-400">
                          ${Math.max(0, accountBalances.checking - accountBalances.credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/5 space-y-1">
                         <div className="text-[9px] font-bold text-slate-500 flex justify-between">
                           <span>Operating:</span>
                           <span className="text-white">${accountBalances.checking.toLocaleString()}</span>
                         </div>
                         <div className="text-[9px] font-bold text-slate-500 flex justify-between">
                           <span>CC Autopay (1st):</span>
                           <motion.span 
                             className="text-red-400"
                             animate={{ opacity: [0.7, 1, 0.7] }}
                             transition={{ duration: 2, repeat: Infinity }}
                           >
                             -${accountBalances.credit.toLocaleString()}
                           </motion.span>
                         </div>
                      </div>
                   </div>
                </motion.div>

                {/* Credit Card - Mercury for ADW, Plaid credit for others */}
                <motion.div 
                  variants={staggerItem}
                  whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 300 } }}
                  className={`bg-[#121216] border border-indigo-500/20 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group`}
                >
                   <div className={`absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                   <div className="relative z-10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 bg-indigo-600/20 rounded-xl`}>
                            <CreditCard size={16} className={'text-indigo-400'} />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              {'Mercury Credit'}
                            </div>
                            <div className={`text-[9px] text-indigo-400 font-medium`}>
                              {'IO Mastercard®'}
                            </div>
                          </div>
                        </div>
                        {accountBalances.credit > 0 && (
                          <div className="px-2 py-1 bg-emerald-500/10 rounded-lg">
                            <span className="text-[8px] text-emerald-400 font-bold uppercase">Active</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Current Balance */}
                      {(accountBalances.credit > 0 || accountBalances.creditAvailable > 0) ? (
                        <>
                          <div>
                            <div className="text-[9px] text-slate-500 mb-1">Current Balance</div>
                            <div className="text-3xl font-black text-white">
                              ${Math.floor(accountBalances.credit).toLocaleString()}
                              <span className="text-lg text-slate-500">.{((accountBalances.credit % 1) * 100).toFixed(0).padStart(2, '0')}</span>
                            </div>
                          </div>
                          
                          {/* Credit Limit Bar */}
                          <div className="space-y-2">
                            <div className="h-2.5 bg-slate-800/80 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${'from-indigo-500 via-purple-500 to-indigo-400'} rounded-full transition-all duration-700 ease-out`}
                                style={{ width: `${accountBalances.creditLimit > 0 ? Math.min((accountBalances.credit / accountBalances.creditLimit) * 100, 100) : 0}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="text-slate-500">
                                {accountBalances.creditLimit > 0 
                                  ? `${((accountBalances.credit / accountBalances.creditLimit) * 100).toFixed(0)}% utilized`
                                  : 'Credit utilized'}
                              </span>
                              <span className="text-emerald-400 font-bold">
                                ${accountBalances.creditAvailable.toLocaleString()} available
                              </span>
                            </div>
                          </div>

                          {/* Credit Card Transactions Count */}
                          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                              <Activity size={12} className={'text-indigo-400'} />
                              <span className="text-[9px] text-slate-400">Card Transactions</span>
                            </div>
                            <span className="text-sm font-bold text-white">
                              {transactions.filter(t => t.context?.includes('Credit Card') || (t as any).isCreditCard || (t as any).source === 'mercury_credit').length}
                            </span>
                          </div>

                          {/* Credit Limit Info */}
                          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                            <div className="text-[9px] text-slate-500">
                              <span className="text-slate-600">Limit:</span> ${accountBalances.creditLimit.toLocaleString()}
                            </div>
                            <button 
                              onClick={handleBankSync}
                              className={`text-[9px] ${'text-indigo-400 hover:text-indigo-300'} font-bold flex items-center gap-1`}
                            >
                              <RefreshCcw size={10} />
                              Sync Transactions
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <CreditCard size={32} className="mx-auto mb-3 text-slate-700" />
                          <div className="text-slate-500 text-xs mb-3">
                            No credit card data found
                          </div>
                          <button 
                            onClick={handleBankSync}
                            className={`px-4 py-2 ${'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/30 text-indigo-400'} border rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-all`}
                          >
                            <RefreshCcw size={12} />
                            Sync Bank
                          </button>
                          <div className="text-[9px] text-slate-600 mt-3">
                            'Click sync to load your Mercury credit card'
                          </div>
                        </div>
                      )}
                   </div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {[
                  { label: 'True Available', value: `$${Math.max(0, accountBalances.checking - accountBalances.credit).toLocaleString()}`, icon: Calculator, trend: 'After CC Pay', color: 'text-amber-400', highlight: true },
                  { label: 'Expenditures', value: `$${stats.totalSpent.toLocaleString()}`, icon: Receipt, trend: '+12%', color: 'text-white', highlight: false },
                  { label: 'Mercury CC', value: `$${accountBalances.credit.toLocaleString()}`, icon: CreditCard, trend: `$${accountBalances.creditAvailable.toLocaleString()} avail`, color: 'text-indigo-400', highlight: false },
                  { label: 'Potential Deductions', value: `$${stats.totalPotentialDeductions.toLocaleString()}`, icon: Scale, trend: '+5.2%', color: 'text-emerald-400', highlight: true },
                  { label: 'Projected Tax Savings', value: `$${stats.projectedTaxSavings.toLocaleString()}`, icon: TrendingUp, trend: 'Optimal', color: 'text-purple-400', highlight: false },
                  { label: 'Strategy Score', value: `$${stats.optimizationScore}%`, icon: Sparkles, trend: 'Shield Active', color: 'text-white', highlight: false },
                ].map((stat, i) => (
                  <motion.div 
                    key={i} 
                    variants={staggerItem}
                    whileHover={{ y: -6, scale: 1.03, transition: { type: 'spring', stiffness: 400 } }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#121216] border border-white/5 p-5 rounded-2xl hover:border-indigo-500/30 transition-colors group relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-all duration-500"></div>
                    <div className="flex justify-between items-start mb-4">
                      <motion.div 
                        className="p-2 bg-white/5 rounded-xl"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <stat.icon size={16} className="text-indigo-500" />
                      </motion.div>
                      <span className={`text-[8px] font-black px-2 py-1 rounded-lg ${stat.highlight ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-500'} uppercase tracking-widest`}>
                        {stat.trend}
                      </span>
                    </div>
                    <motion.div 
                      className={`text-xl font-black mb-1 ${stat.color}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#121216] border border-white/5 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-black text-white text-sm flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                            <ShieldCheck size={14} className="text-indigo-400" />
                          </div>
                          Tax Shield Analysis
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1">Monthly spending vs tax-deductible amounts ({taxSummary.year})</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px]">
                          <div className="w-3 h-1 rounded-full bg-indigo-500"></div>
                          <span className="text-slate-400">Total Spent</span>
                          <span className="text-white font-bold">${chartData.reduce((a, b) => a + b.expenditure, 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px]">
                          <div className="w-3 h-1 rounded-full bg-emerald-400"></div>
                          <span className="text-slate-400">Tax Deductible</span>
                          <span className="text-emerald-400 font-bold">${chartData.reduce((a, b) => a + b.shield, 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="h-[220px] w-full">
                      {chartData.some(d => d.expenditure > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                              </linearGradient>
                              <linearGradient id="colorShield" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#34d399" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }} dy={5} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }} tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', padding: '12px' }} 
                              itemStyle={{ fontWeight: 600 }}
                              formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === 'expenditure' ? 'Spent' : 'Deductible']}
                              labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                            />
                            <Area type="monotone" dataKey="expenditure" name="expenditure" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                            <Area type="monotone" dataKey="shield" name="shield" stroke="#34d399" strokeWidth={2.5} fillOpacity={1} fill="url(#colorShield)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <ShieldCheck size={32} className="text-slate-700 mb-3" />
                          <p className="text-xs text-slate-500 mb-2">No transaction data yet</p>
                          <button 
                            onClick={() => mercuryApiKey ? handleMercurySync() : setShowModal('settings')}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                          >
                            {mercuryApiKey ? 'Sync from Mercury' : 'Connect Mercury Bank →'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Explanation Footer */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-3">
                      <Info size={14} className="text-slate-500 mt-0.5 shrink-0" />
                      <p className="text-[9px] text-slate-500 leading-relaxed">
                        <span className="text-slate-400 font-semibold">How it works:</span> The purple line shows your total monthly spending. 
                        The green line shows the portion that's tax-deductible based on AI analysis (or estimated at 60% if not analyzed). 
                        The gap between them represents non-deductible expenses.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#121216] border border-white/5 rounded-2xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-black text-white text-sm flex items-center gap-2">
                         <div className="p-1.5 bg-amber-500/20 rounded-lg">
                           <ShieldAlert size={14} className="text-amber-400" />
                         </div>
                         Audit Risk Analysis
                       </h3>
                       <span className="text-[9px] text-slate-500">{transactions.filter(t => t.analysis).length} analyzed</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(() => {
                        // Calculate REAL audit risk based on analyzed transactions
                        const analyzed = transactions.filter(t => t.analysis);
                        const safe = analyzed.filter(t => t.analysis?.riskLevel === 'Safe' || t.analysis?.riskLevel === 'Low').length;
                        const moderate = analyzed.filter(t => t.analysis?.riskLevel === 'Moderate').length;
                        const aggressive = analyzed.filter(t => t.analysis?.riskLevel === 'Aggressive').length;
                        const unanalyzed = transactions.length - analyzed.length;
                        
                        return [
                          { label: 'Safe', desc: 'Well documented', count: safe, color: 'emerald', icon: CheckCircle2 },
                          { label: 'Review', desc: 'Needs receipts', count: moderate + unanalyzed, color: 'amber', icon: Info },
                          { label: 'High Risk', desc: 'May be flagged', count: aggressive, color: 'rose', icon: AlertCircle },
                        ].map((item, i) => (
                          <div 
                            key={i} 
                            className={`p-4 bg-white/[0.02] border border-${item.color}-500/10 rounded-xl hover:border-${item.color}-500/30 transition-all cursor-pointer`}
                            onClick={() => setActiveTab('transactions')}
                          >
                            <div className={`p-1.5 w-fit rounded-lg bg-${item.color}-500/10 text-${item.color}-400 mb-2`}>
                              <item.icon size={14} />
                            </div>
                            <div className="text-xl font-black text-white">{item.count}</div>
                            <div className="text-[9px] text-slate-500 font-bold">{item.label}</div>
                            <div className="text-[8px] text-slate-600 mt-0.5">{item.desc}</div>
                          </div>
                        ));
                      })()}
                    </div>
                    {transactions.filter(t => !t.analysis).length > 0 && (
                      <button 
                        onClick={async () => {
                          const unanalyzed = transactions.filter(t => !t.analysis);
                          setIsBulkAnalyzing(true);
                          for (const t of unanalyzed.slice(0, 10)) {
                            try {
                              const analysis = await analyzeTransaction(t.vendor, t.amount, t.category, t.context);
                              if (analysis) {
                                setTransactions(prev => {
                                  const updated = prev.map(tx => tx.id === t.id ? { ...tx, analysis } : tx);
                                  localStorage.setItem(getUserStorageKey('mercury_transactions'), JSON.stringify(updated.filter(tx => tx.bankVerified)));
                                  return updated;
                                });
                              }
                            } catch (e) { console.error(e); }
                          }
                          setIsBulkAnalyzing(false);
                          setNotification({ message: 'Analysis complete!', type: 'success' });
                        }}
                        disabled={isBulkAnalyzing}
                        className="w-full mt-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl text-xs font-bold text-indigo-400 flex items-center justify-center gap-2 transition-all"
                      >
                        {isBulkAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                        Analyze {Math.min(transactions.filter(t => !t.analysis).length, 10)} Transactions
                      </button>
                    )}
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
                                <span className={`text-sm font-black ${(monthlySummary.overallHealthScore || 0) >= 70 ? 'text-emerald-400' : (monthlySummary.overallHealthScore || 0) >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                  {monthlySummary.overallHealthScore || 0}/100
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
                          <div className="text-2xl font-black text-emerald-400">${(monthlySummary.totalRevenue || 0).toLocaleString()}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Revenue</div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
                          <div className="text-2xl font-black text-rose-400">${(monthlySummary.totalExpenses || 0).toLocaleString()}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Expenses</div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
                          <div className={`text-2xl font-black ${(monthlySummary.netCashflow || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(monthlySummary.netCashflow || 0) >= 0 ? '+' : ''}${(monthlySummary.netCashflow || 0).toLocaleString()}
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
                            {(monthlySummary.savingsOpportunities || []).slice(0, 3).map((opp, idx) => (
                              <div key={idx} className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-emerald-500/20 transition-all">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-bold text-white">{opp.title}</span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${opp.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : opp.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                    {opp.priority}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mb-2">{opp.action}</p>
                                <div className="text-sm font-black text-emerald-400">
                                  Save ${(opp.potentialSavings || 0).toLocaleString()}
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
                            {(monthlySummary.ventureOpportunities || []).slice(0, 3).map((venture, idx) => (
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
                            {(monthlySummary.actionItems || []).slice(0, 4).map((item, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl">
                                <span className="text-[10px] font-black text-indigo-400 mt-0.5">{idx + 1}.</span>
                                <span className="text-[11px] text-slate-300">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Risk Alerts */}
                        {(monthlySummary.riskAlerts || []).length > 0 && (
                          <div className="bg-white/[0.02] border border-rose-500/20 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-rose-500/10 rounded-lg">
                                <AlertCircle size={16} className="text-rose-400" />
                              </div>
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Risk Alerts</span>
                            </div>
                            <div className="space-y-2">
                              {(monthlySummary.riskAlerts || []).slice(0, 3).map((alert, idx) => (
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
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div 
              key="transactions"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">{'Expenditure Ledger'}</h2>
                  <p className="text-xs text-slate-500">
                    'Verifying cash outflows against the Mercury Protocol.'
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleBankSync} 
                    disabled={isMercurySyncing || isPlaidSyncing}
                    className={`bg-[#121216] border ${'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'} px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95`}
                  >
                    {(isMercurySyncing || isPlaidSyncing) ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                    'Sync Mercury'
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

              {/* Month Filter - Modern Design */}
              <div className="flex items-center justify-between bg-[#0c0c0e] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-xl">
                    <Calendar size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Time Range</span>
                  </div>
                  <div className="relative">
                    <select
                      value={currentMonth}
                      onChange={(e) => setCurrentMonth(e.target.value)}
                      className="appearance-none bg-[#18181c] hover:bg-[#1e1e24] border border-white/10 hover:border-indigo-500/30 rounded-xl py-3 pl-5 pr-12 text-sm font-semibold text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer shadow-lg shadow-black/20"
                    >
                      <option value="all">All Time • {transactions.length} records</option>
                      <option value={new Date().toISOString().slice(0, 7)}>This Month</option>
                      {/* Generate last 12 months */}
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const value = date.toISOString().slice(0, 7);
                        const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        return <option key={value} value={value}>{label}</option>;
                      })}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl">
                  <Activity size={14} className="text-emerald-400" />
                  <span className="text-xs text-slate-400">
                    <span className="text-emerald-400 font-bold">{filteredTransactions.length}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span className="text-white font-medium">{transactions.length}</span>
                    <span className="text-slate-500 ml-1.5">showing</span>
                  </span>
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
                            {(() => {
                              const uploadedCount = t.attachments?.length || 0;
                              const vaultLinked = receiptsService.getReceiptsForTransaction(t.id);
                              const totalReceipts = uploadedCount + vaultLinked.length;
                              const hasReceipts = totalReceipts > 0;
                              return (
                                <button 
                                  onClick={() => { setReceiptUploadTransaction(t); setShowModal('receipt'); }} 
                                  className={`p-2 transition-colors relative ${hasReceipts ? 'text-emerald-400 hover:text-emerald-300' : 'hover:text-amber-400'}`}
                                  title={hasReceipts ? `${totalReceipts} receipt(s) attached` : 'Upload/link receipt'}
                                >
                                  <Paperclip size={16}/>
                                  {hasReceipts && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                      {totalReceipts}
                                    </span>
                                  )}
                                </button>
                              );
                            })()}
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
                                      { label: 'Receipt/Invoice Available', check: (t.attachments && t.attachments.length > 0) || receiptsService.getReceiptsForTransaction(t.id).length > 0 },
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
                                {(() => {
                                  const vaultLinked = receiptsService.getReceiptsForTransaction(t.id);
                                  const linkedVaultReceipts = receipts.filter(r => vaultLinked.includes(r.id));
                                  const hasUploaded = t.attachments && t.attachments.length > 0;
                                  const hasVault = linkedVaultReceipts.length > 0;
                                  const hasAny = hasUploaded || hasVault;
                                  
                                  return (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Paperclip size={14} className="text-amber-400" />
                                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                            Attached Receipts ({(t.attachments?.length || 0) + linkedVaultReceipts.length})
                                          </span>
                                        </div>
                                        <button 
                                          onClick={() => { setReceiptUploadTransaction(t); setShowModal('receipt'); }}
                                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                                        >
                                          <Plus size={12} /> Add Receipt
                                        </button>
                                      </div>
                                      
                                      {hasAny ? (
                                        <div className="space-y-3">
                                          {/* Vault-Linked Receipts */}
                                          {hasVault && (
                                            <div>
                                              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-2">📎 From Receipt Vault</p>
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {linkedVaultReceipts.map(r => (
                                                  <div key={r.id} className="flex items-center justify-between p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20 group hover:border-indigo-400/40 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                      <img src={r.public_url + '?width=40&quality=60'} alt="Receipt" className="w-10 h-10 object-cover rounded-lg" loading="lazy" />
                                                      <div>
                                                        <p className="text-xs font-bold text-white">Vault Receipt</p>
                                                        <p className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</p>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <button 
                                                        onClick={() => setViewingAsset({ id: r.id, name: 'Receipt', type: 'image/jpeg', url: r.public_url, category: 'Receipt', dateAdded: r.created_at, size: '' })}
                                                        className="p-1.5 hover:bg-indigo-500/20 rounded-lg transition-colors"
                                                        title="View"
                                                      >
                                                        <Eye size={14} className="text-indigo-400" />
                                                      </button>
                                                      <button 
                                                        onClick={() => handleUnlinkReceipt(r.id)}
                                                        className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-colors"
                                                        title="Unlink"
                                                      >
                                                        <Unlink size={14} className="text-rose-400" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Uploaded Receipts */}
                                          {hasUploaded && (
                                            <div>
                                              {hasVault && <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-2">📤 Uploaded</p>}
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {t.attachments!.map(att => (
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
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-slate-500 italic">No receipts attached. Click "Add Receipt" to upload or link from vault.</p>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* RECEIPT VAULT - Receipts from adw-receipts app */}
          {activeTab === 'receipts' && (
            <motion.div 
              key="receipts"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">{'Receipt Vault'}</h2>
                  <p className="text-xs text-slate-500">
                    'Uploaded receipts' • {receipts.length} total • Page {receiptPage} of {Math.ceil(receipts.length / RECEIPTS_PER_PAGE)}
                  </p>
                </div>
                <button 
                  onClick={() => { setReceiptPage(1); loadReceipts(); }} 
                  disabled={isLoadingReceipts}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isLoadingReceipts ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
                  Refresh
                </button>
              </div>

              {/* Receipts Grid - PAGINATED for performance */}
              {isLoadingReceipts ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-indigo-400" />
                  <span className="ml-3 text-slate-400">Loading receipts...</span>
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No receipts found. Upload receipts from your receipt app.</p>
                  <p className="text-xs mt-2 text-slate-600">Check console (F12) for connection errors.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {receipts
                      .slice((receiptPage - 1) * RECEIPTS_PER_PAGE, receiptPage * RECEIPTS_PER_PAGE)
                      .map(receipt => {
                      const linkedTxn = getLinkedTransaction(receipt.id);
                      const isImage = receipt.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      // Use thumbnail URL for faster loading (Supabase image transform)
                      const thumbnailUrl = receipt.public_url.includes('supabase.co') 
                        ? `${receipt.public_url}?width=200&quality=60` 
                        : receipt.public_url;
                      
                      return (
                        <div 
                          key={receipt.id} 
                          className={`bg-[#121216] border rounded-xl overflow-hidden transition-all hover:border-indigo-500/50 group ${
                            linkedTxn ? 'border-emerald-500/30' : 'border-white/5'
                          }`}
                        >
                          {/* Receipt Image/Preview - Using thumbnail for speed */}
                          <div 
                            className="aspect-square bg-black/40 relative cursor-pointer overflow-hidden"
                            onClick={() => window.open(receipt.public_url, '_blank')}
                          >
                            {isImage ? (
                              <img 
                                src={thumbnailUrl} 
                                alt="Receipt" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText size={32} className="text-slate-500" />
                              </div>
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn size={20} className="text-white" />
                            </div>
                            
                            {/* Linked Badge */}
                            {linkedTxn && (
                              <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                <LinkIcon size={8} /> Linked
                              </div>
                            )}
                          </div>
                          
                          {/* Receipt Info - Compact */}
                          <div className="p-2 space-y-1">
                            <div className="text-[9px] text-slate-500">
                              {new Date(receipt.created_at).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', year: '2-digit'
                              })}
                            </div>
                            
                            {linkedTxn ? (
                              <div className="text-[10px]">
                                <div className="text-emerald-400 font-bold truncate">{linkedTxn.vendor}</div>
                                <div className="text-slate-400">${linkedTxn.amount.toFixed(2)}</div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleUnlinkReceipt(receipt.id); }}
                                  className="mt-1 text-[9px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
                                >
                                  <X size={10} /> Unlink
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setLinkingReceiptToTransaction(receipt); }}
                                className="w-full text-[9px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-1.5 rounded font-bold transition-colors flex items-center justify-center gap-1"
                              >
                              <LinkIcon size={10} /> Link
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                  
                  {/* Pagination Controls */}
                  {receipts.length > RECEIPTS_PER_PAGE && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button
                        onClick={() => setReceiptPage(p => Math.max(1, p - 1))}
                        disabled={receiptPage === 1}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                      >
                        ← Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.ceil(receipts.length / RECEIPTS_PER_PAGE) }, (_, i) => i + 1)
                          .slice(Math.max(0, receiptPage - 3), receiptPage + 2)
                          .map(page => (
                            <button
                              key={page}
                              onClick={() => setReceiptPage(page)}
                              className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                                page === receiptPage 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-white/5 hover:bg-white/10 text-slate-400'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                      </div>
                      <button
                        onClick={() => setReceiptPage(p => Math.min(Math.ceil(receipts.length / RECEIPTS_PER_PAGE), p + 1))}
                        disabled={receiptPage >= Math.ceil(receipts.length / RECEIPTS_PER_PAGE)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Modal: Link Receipt to Transaction */}
          {linkingReceiptToTransaction && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0d0d10] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Link Receipt to Transaction</h3>
                    <p className="text-xs text-slate-500">Select the expense this receipt belongs to</p>
                  </div>
                  <button onClick={() => setLinkingReceiptToTransaction(null)} className="text-slate-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                
                {/* Receipt Preview */}
                <div className="p-4 bg-black/30 flex items-center gap-4">
                  <img 
                    src={linkingReceiptToTransaction.public_url} 
                    alt="Receipt" 
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                  <div>
                    <div className="text-sm text-white font-bold">Selected Receipt</div>
                    <div className="text-xs text-slate-400">
                      Uploaded {new Date(linkingReceiptToTransaction.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {/* Transactions List */}
                <div className="p-4 overflow-y-auto max-h-[400px] space-y-2">
                  {transactions
                    .filter(t => t.amount > 0) // Only show expenses
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 50) // Limit to recent 50
                    .map(txn => {
                      const alreadyLinked = Object.values(receiptLinks).includes(txn.id);
                      return (
                        <button
                          key={txn.id}
                          onClick={() => handleLinkReceipt(linkingReceiptToTransaction.id, txn.id)}
                          disabled={alreadyLinked}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                            alreadyLinked 
                              ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed' 
                              : 'border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-white">{txn.vendor}</div>
                            <div className="text-xs text-slate-400">{txn.date} • {txn.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-rose-400">${txn.amount.toFixed(2)}</div>
                            {alreadyLinked && <div className="text-[9px] text-slate-500">Already linked</div>}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agreements' && (
            <motion.div 
              key="agreements"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">{'Service Agreements'}</h2>
                  <p className="text-xs text-slate-500">
                    'Active client contracts and retainers.'
                  </p>
                </div>
                <button onClick={() => { setEditingAgreement(null); setShowModal('agreement'); }} className={`bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95`}>
                  <Plus size={18} /> New 'Agreement'
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agreements.map(a => (
                  <div key={a.id} className="bg-[#121216] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl">
                        <FileSignature size={20} className="text-indigo-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        {a.attachments && a.attachments.length > 0 && (
                          <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center gap-1">
                            <Paperclip size={10} /> {a.attachments.length}
                          </span>
                        )}
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                          a.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 
                          a.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-slate-500/10 text-slate-500'
                        }`}>{a.status}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{a.clientName}</h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{a.scopeOfWork}</p>
                    
                    {/* View Attached Documents */}
                    {a.attachments && a.attachments.length > 0 && (
                      <div className="mb-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Attached Documents</span>
                        <div className="flex flex-wrap gap-2">
                          {a.attachments.map((att, idx) => (
                            <button
                              key={att.id || idx}
                              onClick={() => {
                                if (att.url && att.url !== '#') {
                                  window.open(att.url, '_blank');
                                } else {
                                  setNotification({ message: "Document preview not available - no URL attached", type: 'error' });
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg transition-all group/doc"
                            >
                              <FileText size={14} className="text-indigo-400" />
                              <span className="text-[11px] font-semibold text-white truncate max-w-[120px]">{att.name}</span>
                              <ExternalLink size={12} className="text-slate-500 group-hover/doc:text-indigo-400 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

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
                              localStorage.setItem(getUserStorageKey('agreements'), JSON.stringify(updated));
                              return updated;
                            });
                            db.agreements.delete(a.id, getEffectiveUserId()).catch(e => console.warn("Supabase delete failed:", e));
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
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div 
              key="invoices"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">{'Revenue Log'}</h2>
                  <p className="text-xs text-slate-500">
                    'Track invoices and incoming payments.'
                  </p>
                </div>
                <button onClick={() => { setEditingInvoice(null); setShowModal('invoice'); }} className={`bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95`}>
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
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-indigo-400">{inv.invoiceNumber}</span>
                            {inv.attachments && inv.attachments.length > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                                <Paperclip size={9} /> {inv.attachments.length}
                              </span>
                            )}
                          </div>
                        </td>
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
                        <td className="px-6 py-5 text-right flex justify-end gap-1">
                          <button 
                            onClick={() => generateInvoicePDF(inv)} 
                            className="p-2 hover:text-indigo-400 transition-colors" 
                            title="Download Invoice PDF"
                          >
                            <Download size={16}/>
                          </button>
                          {inv.attachments && inv.attachments.length > 0 && (
                            <button 
                              onClick={() => {
                                if (inv.attachments && inv.attachments.length === 1) {
                                  // Single attachment - open directly
                                  const att = inv.attachments[0];
                                  if (att.url && att.url !== '#') {
                                    window.open(att.url, '_blank');
                                  } else {
                                    setNotification({ message: "Document preview not available", type: 'error' });
                                  }
                                } else if (inv.attachments && inv.attachments.length > 1) {
                                  // Multiple attachments - open all
                                  inv.attachments.forEach(att => {
                                    if (att.url && att.url !== '#') {
                                      window.open(att.url, '_blank');
                                    }
                                  });
                                }
                              }} 
                              className="p-2 hover:text-emerald-400 transition-colors" 
                              title="View Attached Files"
                            >
                              <Eye size={16}/>
                            </button>
                          )}
                          <button onClick={() => { setEditingInvoice(inv); setShowModal('invoice'); }} className="p-2 hover:text-indigo-400 transition-colors" title="Edit Invoice"><Edit3 size={16}/></button>
                          <button onClick={async () => { 
                              if(confirm('Delete this invoice?')) { 
                                setInvoices(prev => {
                                  const updated = prev.filter(x => x.id !== inv.id);
                                  localStorage.setItem(getUserStorageKey('invoices'), JSON.stringify(updated));
                                  return updated;
                                });
                                db.invoices.delete(inv.id, getEffectiveUserId()).catch(e => console.warn("Supabase delete failed:", e));
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
            </motion.div>
          )}

          {activeTab === 'tax' && (
            <motion.div 
              key="tax"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">'Tax Center'</h2>
                  <p className="text-xs text-slate-500">
                    {isADWUser() 
                      ? `Schedule C (Form 1040) synthesis for ${taxSummary.year}`
                      : `Tax analysis and deductions for ${taxSummary.year}`
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Receipt size={14} /> View Expenses
                  </button>
                  <a 
                    href="https://www.irs.gov/pub/irs-pdf/f1040sc.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <FileText size={14} /> IRS Form
                  </a>
                  <button onClick={generateTaxPDF} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95">
                    <Download size={14} /> Export PDF
                  </button>
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#121216] border border-emerald-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Gross Revenue</span>
                  </div>
                  <div className="text-xl font-black text-emerald-400">${taxSummary.grossIncome.toLocaleString()}</div>
                  <p className="text-[9px] text-slate-500 mt-1">{invoices.filter(i => i.status === 'Paid').length} paid invoices</p>
                </div>
                <div className="bg-[#121216] border border-rose-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={14} className="text-rose-400" />
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Total Expenses</span>
                  </div>
                  <div className="text-xl font-black text-rose-400">${taxSummary.totalExpenses.toLocaleString()}</div>
                  <p className="text-[9px] text-slate-500 mt-1">{transactions.length} transactions</p>
                </div>
                <div className="bg-[#121216] border border-indigo-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-indigo-400" />
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Net Profit</span>
                  </div>
                  <div className={`text-xl font-black ${taxSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${Math.abs(taxSummary.netProfit).toLocaleString()}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">Line 31 • Schedule C</p>
                </div>
                <div className="bg-[#121216] border border-amber-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator size={14} className="text-amber-400" />
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Est. SE Tax</span>
                  </div>
                  <div className="text-xl font-black text-amber-400">${taxSummary.estimatedSelfEmploymentTax.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  <p className="text-[9px] text-slate-500 mt-1">15.3% of net earnings</p>
                </div>
              </div>

              {/* Analysis Status Bar */}
              <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${transactions.filter(t => t.analysis).length === transactions.length && transactions.length > 0 ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></div>
                    <span className="text-xs text-slate-400">
                      <span className="font-bold text-white">{transactions.filter(t => t.analysis).length}</span> of <span className="font-bold">{transactions.length}</span> transactions analyzed
                    </span>
                  </div>
                  <div className="h-4 w-px bg-white/10"></div>
                  <div className="flex items-center gap-2">
                    <Globe size={12} className={mercuryApiKey ? 'text-emerald-400' : 'text-slate-500'} />
                    <span className="text-xs text-slate-400">Mercury {mercuryApiKey ? 'Connected' : 'Not Connected'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {transactions.filter(t => !t.analysis).length > 0 && (
                    <button 
                      onClick={async () => {
                        const unanalyzed = transactions.filter(t => !t.analysis);
                        if (unanalyzed.length === 0) {
                          setNotification({ message: 'All transactions already analyzed!', type: 'success' });
                          return;
                        }
                        setIsBulkAnalyzing(true);
                        setNotification({ message: `Analyzing ${unanalyzed.length} transactions...`, type: 'alert' });
                        for (const t of unanalyzed) {
                          try {
                            const analysis = await analyzeTransaction(t.vendor, t.amount, t.category, t.context);
                            if (analysis) {
                              setTransactions(prev => {
                                const updated = prev.map(tx => tx.id === t.id ? { ...tx, analysis } : tx);
                                localStorage.setItem(getUserStorageKey('mercury_transactions'), JSON.stringify(updated.filter(tx => tx.bankVerified)));
                                return updated;
                              });
                            }
                          } catch (e) { console.error(e); }
                        }
                        setIsBulkAnalyzing(false);
                        setNotification({ message: 'Tax analysis complete!', type: 'success' });
                      }}
                      disabled={isBulkAnalyzing}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                    >
                      {isBulkAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                      Analyze All
                    </button>
                  )}
                  {!mercuryApiKey && (
                    <button 
                      onClick={() => setShowModal('settings')}
                      className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                    >
                      <Settings size={14} /> Connect Bank
                    </button>
                  )}
                </div>
              </div>

              {/* Schedule C Header Card */}
              <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                      <Scale size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">SCHEDULE C (Form 1040)</h3>
                      <p className="text-[10px] text-slate-500">Profit or Loss From Business • Sole Proprietorship</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-xs">
                    <div className="text-right">
                      <span className="text-slate-500 block">Business</span>
                      <span className="text-white font-bold">{COMPANY_INFO.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block">Tax Year</span>
                      <span className="text-white font-bold">{taxSummary.year}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block">NAICS Code</span>
                      <span className="text-white font-bold">541511</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part I: Income */}
              <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden">
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-3 flex items-center justify-between">
                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Part I — Income</h3>
                  <button 
                    onClick={() => setActiveTab('invoices')}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    View Invoices <ChevronRight size={12} />
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-slate-500 w-6">1</span>
                      <span className="text-xs text-slate-300">Gross receipts or sales</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-emerald-400">${taxSummary.grossIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-slate-500 w-6">2</span>
                      <span className="text-xs text-slate-300">Returns and allowances</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-slate-500">$0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-emerald-400 w-6">7</span>
                      <span className="text-xs font-bold text-white">Gross income</span>
                    </div>
                    <span className="font-mono text-base font-black text-emerald-400">${taxSummary.grossIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Part II: Expenses */}
              <div className="bg-[#121216] border border-white/5 rounded-2xl overflow-hidden">
                <div className="bg-rose-500/10 border-b border-rose-500/20 px-5 py-3 flex items-center justify-between">
                  <h3 className="text-xs font-black text-rose-400 uppercase tracking-wider">Part II — Expenses</h3>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                  >
                    View All Expenses <ChevronRight size={12} />
                  </button>
                </div>
                <div className="p-4">
                  {Object.entries(SCHEDULE_C_LINES).filter(([key]) => (taxSummary.scheduleC[key] || 0) > 0).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(SCHEDULE_C_LINES).map(([key, info]) => {
                        const amount = taxSummary.scheduleC[key] || 0;
                        if (amount === 0) return null;
                        return (
                          <div key={key} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-rose-500/30 transition-colors cursor-pointer"
                            onClick={() => setActiveTab('transactions')}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-slate-500 w-6">{info.line}</span>
                              <span className="text-xs text-slate-300">{info.label}</span>
                            </div>
                            <span className="font-mono text-xs font-bold text-rose-400">${amount.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Receipt size={32} className="mx-auto mb-3 text-slate-600" />
                      <p className="text-xs text-slate-500 mb-3">No expenses recorded yet</p>
                      <button 
                        onClick={() => mercuryApiKey ? handleMercurySync() : setShowModal('settings')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        {mercuryApiKey ? 'Sync from Mercury' : 'Connect Mercury Bank'}
                      </button>
                    </div>
                  )}
                  
                  {/* Totals */}
                  {taxSummary.totalExpenses > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-rose-400 w-6">28</span>
                          <span className="text-xs font-bold text-white">Total expenses</span>
                        </div>
                        <span className="font-mono text-base font-black text-rose-400">${taxSummary.totalExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Net Profit/Loss Card */}
              <div className={`bg-gradient-to-r ${taxSummary.netProfit >= 0 ? 'from-emerald-600/10 to-cyan-600/10 border-emerald-500/20' : 'from-rose-600/10 to-orange-600/10 border-rose-500/20'} border rounded-2xl p-5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 ${taxSummary.netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'} rounded-xl`}>
                      {taxSummary.netProfit >= 0 ? <TrendingUp size={20} className="text-emerald-400" /> : <TrendingDown size={20} className="text-rose-400" />}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 block">Line 31 • Schedule C</span>
                      <span className="text-sm font-black text-white">Net {taxSummary.netProfit >= 0 ? 'Profit' : 'Loss'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-3xl font-black ${taxSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {taxSummary.netProfit < 0 && '('}${Math.abs(taxSummary.netProfit).toLocaleString()}{taxSummary.netProfit < 0 && ')'}
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1">Gross Income − Total Expenses</p>
                  </div>
                </div>
              </div>

              {/* Tax Estimates Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121216] border border-amber-500/20 rounded-2xl p-4 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Percent size={14} className="text-amber-400" />
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Self-Employment Tax</span>
                    </div>
                    <a href="https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes" target="_blank" rel="noopener" className="text-amber-400 hover:text-amber-300">
                      <Info size={12} />
                    </a>
                  </div>
                  <div className="text-xl font-black text-amber-400">${taxSummary.estimatedSelfEmploymentTax.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  <p className="text-[9px] text-slate-500 mt-1">Social Security (12.4%) + Medicare (2.9%)</p>
                </div>
                <div className="bg-[#121216] border border-cyan-500/20 rounded-2xl p-4 hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-cyan-400" />
                      <span className="text-[10px] text-slate-500 uppercase font-bold">QBI Deduction (§199A)</span>
                    </div>
                    <a href="https://www.irs.gov/newsroom/qualified-business-income-deduction" target="_blank" rel="noopener" className="text-cyan-400 hover:text-cyan-300">
                      <Info size={12} />
                    </a>
                  </div>
                  <div className="text-xl font-black text-cyan-400">${taxSummary.estimatedQBI.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  <p className="text-[9px] text-slate-500 mt-1">20% deduction on qualified income</p>
                </div>
                <div className="bg-[#121216] border border-emerald-500/20 rounded-2xl p-4 hover:border-emerald-500/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-emerald-400" />
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Estimated Savings</span>
                    </div>
                    <CheckCircle2 size={12} className="text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-emerald-400">${(taxSummary.estimatedQBI + taxSummary.potentialCredits).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                  <p className="text-[9px] text-slate-500 mt-1">QBI + analyzed deductions benefit</p>
                </div>
              </div>

              {/* Two Column Layout: Categories + Quick Links */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Expenses by Category */}
                <div className="lg:col-span-2 bg-[#121216] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <FolderOpen size={16} className="text-indigo-400" />
                      Expense Breakdown
                    </h3>
                    <span className="text-[10px] text-slate-500">{Object.entries(taxSummary.expensesByCategory).length} categories</span>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {Object.entries(taxSummary.expensesByCategory).length > 0 ? (
                      Object.entries(taxSummary.expensesByCategory)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([cat, val]) => {
                          const amount = val as number;
                          const percentage = taxSummary.totalExpenses > 0 ? (amount / taxSummary.totalExpenses) * 100 : 0;
                          return (
                            <div key={cat} className="group cursor-pointer" onClick={() => setActiveTab('transactions')}>
                              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                  <span className="text-xs font-bold text-white">{cat}</span>
                                  <span className="text-[9px] text-slate-500">({percentage.toFixed(1)}%)</span>
                                </div>
                                <span className="font-mono text-xs text-indigo-400 font-bold">${amount.toLocaleString()}</span>
                              </div>
                              <div className="mt-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-center py-8">
                        <FolderOpen size={28} className="mx-auto mb-2 text-slate-600" />
                        <p className="text-xs text-slate-500">No expenses yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Links & Resources */}
                <div className="bg-[#121216] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-400" />
                    IRS Resources
                  </h3>
                  <div className="space-y-2">
                    <a 
                      href="https://www.irs.gov/pub/irs-pdf/f1040sc.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-rose-400" />
                        <span className="text-xs text-slate-300">Schedule C Form</span>
                      </div>
                      <ExternalLink size={12} className="text-slate-500 group-hover:text-indigo-400" />
                    </a>
                    <a 
                      href="https://www.irs.gov/forms-pubs/about-schedule-c-form-1040"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-amber-400" />
                        <span className="text-xs text-slate-300">Instructions</span>
                      </div>
                      <ExternalLink size={12} className="text-slate-500 group-hover:text-indigo-400" />
                    </a>
                    <a 
                      href="https://www.irs.gov/businesses/small-businesses-self-employed/self-employed-individuals-tax-center"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <Gavel size={14} className="text-cyan-400" />
                        <span className="text-xs text-slate-300">SE Tax Center</span>
                      </div>
                      <ExternalLink size={12} className="text-slate-500 group-hover:text-indigo-400" />
                    </a>
                    <a 
                      href="https://www.irs.gov/newsroom/qualified-business-income-deduction"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span className="text-xs text-slate-300">QBI Deduction (§199A)</span>
                      </div>
                      <ExternalLink size={12} className="text-slate-500 group-hover:text-indigo-400" />
                    </a>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <button 
                      onClick={() => setActiveTab('chat')}
                      className="w-full flex items-center justify-between p-3 bg-indigo-600/10 hover:bg-indigo-600/20 rounded-xl border border-indigo-500/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Brain size={14} className="text-indigo-400" />
                        <span className="text-xs font-bold text-white">Ask AI Strategist</span>
                      </div>
                      <ChevronRight size={14} className="text-indigo-400" />
                    </button>
                    <button 
                      onClick={generateTaxPDF}
                      className="w-full flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Download size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-300">Download Tax Report</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div 
              key="assets"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">{'Asset Vault'}</h2>
                  <p className="text-xs text-slate-500">
                    'Company documents, branding, and resources.'
                  </p>
                </div>
                <button onClick={() => setShowModal('asset')} className={`bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95`}>
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
                                localStorage.setItem(getUserStorageKey('assets'), JSON.stringify(updated));
                                return updated;
                              });
                              db.assets.delete(asset.id, getEffectiveUserId()).catch(e => console.warn("Supabase delete failed:", e));
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
            </motion.div>
          )}

          {activeTab === 'bills' && (
            <motion.div 
              key="bills"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              {/* Bills Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-white">Bills & Utilities</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    'Track household expenses paid with company card'
                  </p>
                </div>
                <button 
                  onClick={() => { setEditingBill(null); setShowAddBillModal(true); }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                >
                  <Plus size={16} /> Add Bill
                </button>
              </div>

              {/* Bills Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Monthly */}
                <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10">
                      <DollarSign size={16} className="text-indigo-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Total Monthly</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    ${bills.filter(b => b.frequency === 'monthly').reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{bills.filter(b => b.frequency === 'monthly').length} recurring bills</p>
                </div>

                {/* Upcoming */}
                <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                      <Clock size={16} className="text-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Due Soon</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {bills.filter(b => !b.isPaid && new Date(b.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Due in next 7 days</p>
                </div>

                {/* Paid This Month */}
                <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Paid</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    ${bills.filter(b => b.isPaid).reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{bills.filter(b => b.isPaid).length} bills paid</p>
                </div>

                {/* Overdue */}
                <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-rose-500/10">
                      <AlertTriangle size={16} className="text-rose-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Overdue</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {bills.filter(b => !b.isPaid && new Date(b.dueDate) < new Date()).length}
                  </div>
                  <p className="text-[10px] text-rose-400 mt-1">
                    ${bills.filter(b => !b.isPaid && new Date(b.dueDate) < new Date()).reduce((sum, b) => sum + b.amount, 0).toLocaleString()} overdue
                  </p>
                </div>
              </div>

              {/* Bills List */}
              <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-bold text-white">All Bills</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {bills.length === 0 ? (
                    <div className="p-12 text-center">
                      <Home size={40} className="mx-auto text-slate-600 mb-4" />
                      <h3 className="text-lg font-bold text-slate-400 mb-2">No Bills Yet</h3>
                      <p className="text-sm text-slate-500 mb-4">Add your rent, utilities, and other recurring bills</p>
                      <button 
                        onClick={() => { setEditingBill(null); setShowAddBillModal(true); }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      >
                        <Plus size={14} className="inline mr-2" /> Add Your First Bill
                      </button>
                    </div>
                  ) : (
                    (billsWithTransactions.length > 0 ? billsWithTransactions : bills.map(b => ({ ...b, matchedTransactions: [], totalPaidAmount: 0, paymentHistory: [] }))).map((bill) => {
                      const isOverdue = !bill.isPaid && new Date(bill.dueDate) < new Date();
                      const isDueSoon = !bill.isPaid && !isOverdue && new Date(bill.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                      const matchedTxns = 'matchedTransactions' in bill ? bill.matchedTransactions : [];
                      const hasMatches = matchedTxns.length > 0;
                      const isExpanded = expandedBillId === bill.id;
                      
                      const categoryIcons: Record<BillCategory, React.ReactNode> = {
                        rent: <Building2 size={18} />,
                        electricity: <Zap size={18} />,
                        gas: <Flame size={18} />,
                        water: <Droplets size={18} />,
                        trash: <Trash2 size={18} />,
                        internet: <Wifi size={18} />,
                        phone: <Activity size={18} />,
                        insurance: <ShieldCheck size={18} />,
                        other: <FileText size={18} />
                      };
                      
                      const categoryColors: Record<BillCategory, string> = {
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
                      
                      const color = categoryColors[bill.category];
                      
                      return (
                        <div 
                          key={bill.id} 
                          className={`transition-colors ${isOverdue ? 'bg-rose-500/5' : ''}`}
                        >
                          <div 
                            className="p-4 hover:bg-white/[0.02] cursor-pointer"
                            onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400`}>
                                  {categoryIcons[bill.category]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">{bill.provider}</span>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                      bill.isPaid ? 'bg-emerald-500/10 text-emerald-400' :
                                      isOverdue ? 'bg-rose-500/10 text-rose-400' :
                                      isDueSoon ? 'bg-amber-500/10 text-amber-400' :
                                      'bg-slate-500/10 text-slate-400'
                                    }`}>
                                      {bill.isPaid ? 'Paid' : isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Upcoming'}
                                    </span>
                                    {hasMatches && (
                                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-indigo-500/10 text-indigo-400 flex items-center gap-1">
                                        <Link2 size={8} /> {matchedTxns.length} Mercury Txns
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-slate-500 capitalize">{bill.category}</span>
                                    <span className="text-xs text-slate-600">•</span>
                                    <span className="text-xs text-slate-500">{bill.frequency}</span>
                                    <span className="text-xs text-slate-600">•</span>
                                    <span className={`text-xs ${isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                                      Due: {new Date(bill.dueDate).toLocaleDateString()}
                                    </span>
                                    {hasMatches && (
                                      <>
                                        <span className="text-xs text-slate-600">•</span>
                                        <span className="text-xs text-emerald-400">
                                          ${('totalPaidAmount' in bill ? bill.totalPaidAmount : 0).toLocaleString()} paid (Mercury)
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-xl font-black text-white">${bill.amount.toLocaleString()}</div>
                                  {bill.isPaid && bill.paidDate && (
                                    <div className="text-[10px] text-emerald-400">
                                      Paid {new Date(bill.paidDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  {!bill.isPaid && (
                                    <button
                                      onClick={async () => {
                                        await billsService.markBillAsPaid(bill.id);
                                        const updatedBills = await billsService.getAllBills();
                                        setBills(updatedBills);
                                        setNotification({ message: `${bill.provider} marked as paid!`, type: 'success' });
                                      }}
                                      className="p-2 hover:bg-emerald-500/10 rounded-lg text-slate-500 hover:text-emerald-400 transition-colors"
                                      title="Mark as Paid"
                                    >
                                      <Check size={16} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { setEditingBill(bill); setShowAddBillModal(true); }}
                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                                    title="Edit"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Delete ${bill.provider} bill?`)) {
                                        await billsService.deleteBill(bill.id);
                                        const updatedBills = await billsService.getAllBills();
                                        setBills(updatedBills);
                                        setNotification({ message: 'Bill deleted', type: 'success' });
                                      }
                                    }}
                                    className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  <ChevronDown 
                                    size={16} 
                                    className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded section with matched transactions */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-0">
                                  <div className="ml-14 space-y-3">
                                    {/* Notes */}
                                    {bill.notes && (
                                      <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                        <Info size={14} className="text-slate-500" />
                                        <span className="text-xs text-slate-400">{bill.notes.split('\n')[0]}</span>
                                        {bill.notes.includes('Account: http') && (
                                          <a 
                                            href={bill.notes.match(/Account: (https?:\/\/[^\s]+)/)?.[1]} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors ml-auto"
                                          >
                                            <ExternalLink size={10} /> Pay Online
                                          </a>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Matched Mercury Transactions */}
                                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <Waves size={14} className="text-indigo-400" />
                                          <span className="text-xs font-bold text-white">Mercury Payments</span>
                                        </div>
                                        {hasMatches && (
                                          <span className="text-[10px] text-emerald-400 font-bold">
                                            ${('totalPaidAmount' in bill ? bill.totalPaidAmount : 0).toLocaleString()} total
                                          </span>
                                        )}
                                      </div>
                                      
                                      {matchedTxns.length === 0 ? (
                                        <div className="text-center py-4">
                                          <p className="text-xs text-slate-500">No matching transactions found in Mercury</p>
                                          <p className="text-[10px] text-slate-600 mt-1">
                                            Transactions with "{bill.provider.split(' ')[0]}" or related keywords will appear here
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                          {matchedTxns.slice(0, 10).map((txn, idx) => (
                                            <div 
                                              key={txn.id || idx}
                                              className="flex items-center justify-between p-2 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors"
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                  <CheckCircle2 size={12} className="text-emerald-400" />
                                                </div>
                                                <div>
                                                  <div className="text-xs font-medium text-white">{txn.vendor}</div>
                                                  <div className="text-[10px] text-slate-500">{txn.date}</div>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-sm font-bold text-white">${txn.amount.toLocaleString()}</div>
                                                <div className="text-[9px] text-slate-500">{txn.category}</div>
                                              </div>
                                            </div>
                                          ))}
                                          {matchedTxns.length > 10 && (
                                            <div className="text-center text-[10px] text-slate-500 pt-2">
                                              + {matchedTxns.length - 10} more transactions
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {/* Notes preview when not expanded */}
                          {!isExpanded && bill.notes && (
                            <div className="mt-2 pl-16 flex items-center gap-3">
                              <span className="text-xs text-slate-500">
                                {bill.notes.split('\n')[0]}
                              </span>
                              {bill.notes.includes('Account: http') && (
                                <a 
                                  href={bill.notes.match(/Account: (https?:\/\/[^\s]+)/)?.[1]} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={10} /> Pay Online
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Add Presets */}
              <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4">Quick Add Common Bills</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { category: 'electricity' as BillCategory, provider: 'Electric Company', icon: <Zap size={14} /> },
                    { category: 'gas' as BillCategory, provider: 'Gas Company', icon: <Flame size={14} /> },
                    { category: 'water' as BillCategory, provider: 'Water Utility', icon: <Droplets size={14} /> },
                    { category: 'trash' as BillCategory, provider: 'Waste Management', icon: <Trash2 size={14} /> },
                    { category: 'internet' as BillCategory, provider: 'Internet Provider', icon: <Wifi size={14} /> },
                  ].map((preset) => (
                    <button
                      key={preset.category}
                      onClick={() => {
                        setEditingBill({
                          id: '',
                          category: preset.category,
                          provider: preset.provider,
                          amount: 0,
                          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          frequency: 'monthly',
                          status: 'pending',
                          isPaid: false,
                          autoPayEnabled: false,
                          reminderDays: 5,
                          createdAt: '',
                          updatedAt: ''
                        });
                        setShowAddBillModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-slate-300 transition-all"
                    >
                      {preset.icon}
                      <span>+ {preset.provider}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Utility Account Credentials */}
              <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                      <Lock size={16} className="text-amber-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-white">Utility Account Logins</h3>
                      <p className="text-xs text-slate-500">{credentials.length} saved accounts • Click to {showCredentials ? 'hide' : 'reveal'}</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className={`text-slate-500 transition-transform ${showCredentials ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showCredentials && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                          <ShieldAlert size={14} className="text-amber-400" />
                          <span className="text-xs text-amber-400">Keep these credentials secure. Don't share your screen while viewing.</span>
                        </div>
                        
                        {credentials.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-sm">
                            No credentials saved yet
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {credentials.map((cred) => (
                              <div key={cred.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-bold text-white">{cred.service_name}</span>
                                      <a 
                                        href={cred.service_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-indigo-400 transition-colors"
                                      >
                                        <ExternalLink size={12} />
                                      </a>
                                    </div>
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 uppercase w-16">Email:</span>
                                        <code className="text-xs text-slate-300 bg-white/5 px-2 py-0.5 rounded">{cred.username}</code>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(cred.username);
                                            setNotification({ message: 'Email copied!', type: 'success' });
                                          }}
                                          className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors"
                                          title="Copy"
                                        >
                                          <FileText size={10} />
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 uppercase w-16">Password:</span>
                                        <code className="text-xs text-slate-300 bg-white/5 px-2 py-0.5 rounded font-mono">
                                          {revealedPasswords.has(cred.id) ? cred.password : '••••••••••••'}
                                        </code>
                                        <button
                                          onClick={() => {
                                            const newRevealed = new Set(revealedPasswords);
                                            if (newRevealed.has(cred.id)) {
                                              newRevealed.delete(cred.id);
                                            } else {
                                              newRevealed.add(cred.id);
                                            }
                                            setRevealedPasswords(newRevealed);
                                          }}
                                          className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors"
                                          title={revealedPasswords.has(cred.id) ? 'Hide' : 'Show'}
                                        >
                                          <Eye size={10} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(cred.password);
                                            setNotification({ message: 'Password copied!', type: 'success' });
                                          }}
                                          className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors"
                                          title="Copy"
                                        >
                                          <FileText size={10} />
                                        </button>
                                      </div>
                                    </div>
                                    {cred.notes && (
                                      <p className="text-[10px] text-slate-500 mt-2">{cred.notes}</p>
                                    )}
                                  </div>
                                  <a
                                    href={cred.service_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                  >
                                    Login <ExternalLink size={10} />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="pt-2 text-[9px] text-slate-600 text-center">
                          Credentials stored in Supabase • Synced across devices
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Add/Edit Bill Modal */}
          <AnimatePresence>
            {showAddBillModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowAddBillModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#0c0c0f] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
                >
                  <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                      {editingBill?.id ? 'Edit Bill' : 'Add New Bill'}
                    </h2>
                    <button 
                      onClick={() => setShowAddBillModal(false)}
                      className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const billData = {
                        category: formData.get('category') as BillCategory,
                        provider: formData.get('provider') as string,
                        amount: parseFloat(formData.get('amount') as string) || 0,
                        dueDate: formData.get('dueDate') as string,
                        frequency: formData.get('frequency') as 'monthly' | 'quarterly' | 'annually' | 'one-time',
                        isPaid: formData.get('isPaid') === 'on',
                        autoPayEnabled: formData.get('autoPayEnabled') === 'on',
                        reminderDays: parseInt(formData.get('reminderDays') as string) || 5,
                        notes: formData.get('notes') as string,
                        accountNumber: formData.get('accountNumber') as string
                      };
                      
                      if (editingBill?.id) {
                        await billsService.updateBill(editingBill.id, billData);
                        setNotification({ message: 'Bill updated!', type: 'success' });
                      } else {
                        await billsService.createBill(billData);
                        setNotification({ message: 'Bill added!', type: 'success' });
                      }
                      
                      const updatedBills = await billsService.getAllBills();
                      setBills(updatedBills);
                      setShowAddBillModal(false);
                      setEditingBill(null);
                    }}
                    className="p-5 space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Category</label>
                        <select 
                          name="category" 
                          defaultValue={editingBill?.category || 'rent'}
                          className="w-full bg-[#121216] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-indigo-500 outline-none"
                        >
                          <option value="rent">🏠 Rent</option>
                          <option value="electricity">⚡ Electricity</option>
                          <option value="gas">🔥 Gas</option>
                          <option value="water">💧 Water</option>
                          <option value="trash">🗑️ Trash</option>
                          <option value="internet">📶 Internet</option>
                          <option value="phone">📱 Phone</option>
                          <option value="insurance">🛡️ Insurance</option>
                          <option value="other">📄 Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Frequency</label>
                        <select 
                          name="frequency" 
                          defaultValue={editingBill?.frequency || 'monthly'}
                          className="w-full bg-[#121216] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-indigo-500 outline-none"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annually">Annually</option>
                          <option value="one-time">One-time</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Provider/Payee</label>
                      <input 
                        name="provider"
                        type="text"
                        defaultValue={editingBill?.provider || ''}
                        placeholder="e.g., PG&E, Landlord, Comcast"
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Amount</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                          <input 
                            name="amount"
                            type="number"
                            step="0.01"
                            defaultValue={editingBill?.amount || ''}
                            placeholder="0.00"
                            className="w-full bg-[#121216] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Due Date</label>
                        <input 
                          name="dueDate"
                          type="date"
                          defaultValue={editingBill?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          className="w-full bg-[#121216] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-indigo-500 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Account Number (Optional)</label>
                      <input 
                        name="accountNumber"
                        type="text"
                        defaultValue={editingBill?.accountNumber || ''}
                        placeholder="For your reference"
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Notes (Optional)</label>
                      <textarea 
                        name="notes"
                        defaultValue={editingBill?.notes || ''}
                        placeholder="Any notes about this bill..."
                        rows={2}
                        className="w-full bg-[#121216] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          name="autoPayEnabled"
                          type="checkbox"
                          defaultChecked={editingBill?.autoPayEnabled || false}
                          className="w-4 h-4 rounded bg-[#121216] border-white/20 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-300">Auto-pay enabled</span>
                      </label>
                      {editingBill?.id && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            name="isPaid"
                            type="checkbox"
                            defaultChecked={editingBill?.isPaid || false}
                            className="w-4 h-4 rounded bg-[#121216] border-white/20 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-300">Mark as paid</span>
                        </label>
                      )}
                    </div>

                    <input type="hidden" name="reminderDays" value="5" />

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowAddBillModal(false); setEditingBill(null); }}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-colors"
                      >
                        {editingBill?.id ? 'Update Bill' : 'Add Bill'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-[calc(100vh-12rem)] flex"
            >
              {/* Chat History Sidebar */}
              <AnimatePresence>
                {showChatHistory && (
                  <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="h-full border-r border-white/5 bg-[#0d0d10] overflow-hidden flex flex-col"
                  >
                    <div className="p-4 border-b border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-white">Chat History</h3>
                        <button 
                          onClick={() => setShowChatHistory(false)}
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <button 
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-xl text-xs font-bold transition-all"
                      >
                        <Plus size={14} />
                        New Conversation
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 size={20} className="animate-spin text-indigo-500" />
                        </div>
                      ) : chatSessions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          No saved conversations yet
                        </div>
                      ) : (
                        chatSessions.map(session => (
                          <button
                            key={session.id}
                            onClick={() => handleLoadSession(session.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all group ${
                              session.id === currentSessionId 
                                ? 'bg-indigo-600/20 border border-indigo-500/30' 
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate">
                                  {session.title}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  {new Date(session.updatedAt).toLocaleDateString()} • {session.messages.length} msgs
                                </div>
                              </div>
                              <button
                                onClick={(e) => handleDeleteSession(session.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-white/5 text-[9px] text-slate-600 text-center">
                      Conversations auto-saved locally & synced to cloud
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowChatHistory(!showChatHistory)}
                      className={`p-2 rounded-xl transition-all ${showChatHistory ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-white/5 text-slate-500'}`}
                      title="Chat History"
                    >
                      <History size={18} />
                    </button>
                    <div>
                      <h2 className="text-sm font-bold text-white">'AI War Room'</h2>
                      <p className="text-[10px] text-slate-500">
                        {isADWUser() 
                          ? 'RAG-powered • IRC Knowledge Base • Mercury Data' 
                          : `Powered by AI • Tax Knowledge • ${getCompanyName()} Data`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[9px] text-emerald-400 font-bold uppercase">Connected</span>
                    </div>
                    <button 
                      onClick={handleNewChat}
                      className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors"
                      title="New Chat"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4">
                  {chatMessages.map((msg, idx) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-5 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-[#121216] border border-white/5 text-slate-300'
                      }`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                            <div className={`p-1 bg-indigo-500/20 rounded-lg`}>
                              <Brain size={12} className={'text-indigo-400'} />
                            </div>
                            <span className={`text-[9px] text-indigo-400 font-bold uppercase`}>
                              {'Tax Strategist'}
                            </span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className="mt-2 text-[9px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-[#121216] border border-white/5 p-5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 bg-indigo-500/20 rounded-lg">
                            <Brain size={12} className="text-indigo-400" />
                          </div>
                          <span className="text-[9px] text-indigo-400 font-bold uppercase">Analyzing...</span>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5">
                  <div className="flex gap-3">
                    <input 
                      name="chatInput" 
                      type="text" 
                      placeholder="Ask about tax strategy, IRC sections, your finances..." 
                      className="flex-1 bg-[#121216] border border-white/10 rounded-2xl py-4 px-6 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all"
                    />
                    <button 
                      type="submit" 
                      disabled={isTyping} 
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 rounded-2xl transition-all flex items-center gap-2 font-medium"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-4 text-[9px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <BookOpen size={10} /> IRC Knowledge Base
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity size={10} /> Live Financial Data
                    </span>
                    <span className="flex items-center gap-1">
                      <History size={10} /> Chat History Saved
                    </span>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
      {showModal === 'settings' && (
        <motion.div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            onClick={() => setShowModal(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div 
            className="bg-[#121216] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <motion.button 
              onClick={() => setShowModal(null)} 
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <X size={20} />
            </motion.button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-indigo-600 rounded-2xl text-white">
                <Settings size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">API Settings</h3>
                <p className="text-xs text-slate-500">Configure your API connections</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Gemini API Key */}
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Brain size={16} className="text-purple-400" />
                  <span className="text-sm font-bold text-white">Gemini AI API Key</span>
                  {localStorage.getItem('gemini_api_key') && <span className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold">CONFIGURED</span>}
                </div>
                <p className="text-[11px] text-slate-500">Powers AI analysis, strategic summaries, and chat. Get a free key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-indigo-400 hover:underline">Google AI Studio</a>.</p>
                <input 
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-[#09090A] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Mercury API Key */}
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-indigo-400" />
                  <span className="text-sm font-bold text-white">Mercury API Key</span>
                  {localStorage.getItem('mercury_key') && <span className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold">CONFIGURED</span>}
                </div>
                <p className="text-[11px] text-slate-500">Syncs your bank transactions from Mercury. Get your API key from Mercury Dashboard → Settings → API.</p>
                <input 
                  type="password"
                  value={mercuryApiKey}
                  onChange={(e) => setMercuryApiKey(e.target.value)}
                  placeholder="secret-token:..."
                  className="w-full bg-[#09090A] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={() => {
                  // Save Gemini key
                  localStorage.setItem('gemini_api_key', geminiApiKey);
                  import('./services/geminiService').then(m => m.resetGeminiClient());
                  // Save Mercury key
                  localStorage.setItem('mercury_key', mercuryApiKey);
                  // Show success feedback
                  setShowModal(null);
                  // Optional: could add a toast notification here
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 px-6 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Save API Keys
              </button>

              {/* Security Note */}
              <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                <p className="text-[10px] text-slate-400">
                  <span className="text-emerald-400 font-bold">Secure:</span> Keys are stored locally in your browser only. They are never sent to our servers.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Mercury Vault Modal */}
      <AnimatePresence>
      {showModal === 'mercury' && (
        <motion.div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            onClick={() => setShowModal(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div 
            className="bg-[#121216] border border-white/10 w-full max-w-md rounded-[2.5rem] p-10 relative z-10 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

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
                  localStorage.setItem(getUserStorageKey('agreements'), JSON.stringify(updated));
                  return updated;
                });
              } else {
                setAgreements(prev => {
                  const updated = [...prev, agreement];
                  localStorage.setItem(getUserStorageKey('agreements'), JSON.stringify(updated));
                  return updated;
                });
              }
              
              // Try to save to Supabase with user_id (optional - may fail if table doesn't exist)
              try {
                await db.agreements.upsert(agreement, getEffectiveUserId());
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
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agreement Documents</label>
                <div 
                  className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-all cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        const newAttachments: Attachment[] = Array.from(files).map((file, idx) => ({
                          id: `att_${Date.now()}_${idx}`,
                          name: file.name,
                          type: file.type,
                          url: URL.createObjectURL(file),
                          dateAdded: new Date().toISOString().split('T')[0]
                        }));
                        setTempAttachments(prev => [...prev, ...newAttachments]);
                        setNotification({ 
                          message: files.length === 1 
                            ? `File "${files[0].name}" attached` 
                            : `${files.length} files attached`, 
                          type: 'success' 
                        });
                      }
                      // Reset input so same file(s) can be selected again
                      e.target.value = '';
                    }}
                  />
                  <div className="p-4 bg-indigo-500/10 rounded-2xl inline-block mb-4 group-hover:bg-indigo-500/20 transition-all">
                    <UploadCloud size={32} className="text-indigo-400" />
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Click to upload documents</p>
                  <p className="text-[10px] text-slate-600">Supports PDF, DOC, DOCX • Select multiple files</p>
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
              
              // Try Supabase with user_id (optional)
              try {
                await db.transactions.upsert(transaction, getEffectiveUserId());
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowModal(null); setEditingInvoice(null); setTempInvoiceAttachments([]); }} />
          <div className="bg-[#121216] border border-white/10 w-full max-w-xl rounded-3xl p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => { setShowModal(null); setEditingInvoice(null); setTempInvoiceAttachments([]); }} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
            
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
                status: fd.get('status') as 'Paid' | 'Sent' | 'Draft' | 'Overdue',
                attachments: tempInvoiceAttachments.length > 0 ? tempInvoiceAttachments : (editingInvoice?.attachments || [])
              };
              
              // Update local state first
              if (editingInvoice) {
                setInvoices(prev => {
                  const updated = prev.map(i => i.id === invoice.id ? invoice : i);
                  localStorage.setItem(getUserStorageKey('invoices'), JSON.stringify(updated));
                  return updated;
                });
              } else {
                setInvoices(prev => {
                  const updated = [...prev, invoice];
                  localStorage.setItem(getUserStorageKey('invoices'), JSON.stringify(updated));
                  return updated;
                });
              }
              
              // Try Supabase with user_id (optional)
              try {
                await db.invoices.upsert(invoice, getEffectiveUserId());
              } catch (error) {
                console.warn('Supabase save failed, saved locally:', error);
              }
              
              setNotification({ message: editingInvoice ? 'Invoice updated!' : 'Invoice created!', type: 'success' });
              setShowModal(null);
              setEditingInvoice(null);
              setTempInvoiceAttachments([]);
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

              {/* Invoice Document Upload */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice Document</label>
                <div 
                  className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-all cursor-pointer group"
                  onClick={() => invoiceFileInputRef.current?.click()}
                >
                  <input 
                    ref={invoiceFileInputRef}
                    type="file" 
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        const newAttachments: Attachment[] = Array.from(files).map((file, idx) => ({
                          id: `inv_att_${Date.now()}_${idx}`,
                          name: file.name,
                          type: file.type,
                          url: URL.createObjectURL(file),
                          dateAdded: new Date().toISOString().split('T')[0]
                        }));
                        setTempInvoiceAttachments(prev => [...prev, ...newAttachments]);
                        setNotification({ 
                          message: files.length === 1 
                            ? `File "${files[0].name}" attached` 
                            : `${files.length} files attached`, 
                          type: 'success' 
                        });
                      }
                      e.target.value = '';
                    }}
                  />
                  <div className="p-3 bg-emerald-500/10 rounded-xl inline-block mb-3 group-hover:bg-emerald-500/20 transition-all">
                    <UploadCloud size={24} className="text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Click to upload invoice PDF</p>
                  <p className="text-[10px] text-slate-600">PDF, DOC, or Image • Select multiple files</p>
                </div>

                {/* Attached Files */}
                {(tempInvoiceAttachments.length > 0 || (editingInvoice?.attachments && editingInvoice.attachments.length > 0)) && (
                  <div className="space-y-2 mt-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attached Documents</span>
                    <div className="space-y-2">
                      {[...tempInvoiceAttachments, ...(editingInvoice?.attachments || [])].map((att, idx) => (
                        <div key={att.id || idx} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                              <FileText size={16} className="text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white truncate max-w-[200px]">{att.name}</p>
                              <p className="text-[9px] text-slate-500">Added: {att.dateAdded}</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setTempInvoiceAttachments(prev => prev.filter(a => a.id !== att.id));
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

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(null); setEditingInvoice(null); setTempInvoiceAttachments([]); }}
                  className="py-4 px-6 bg-white/5 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                {editingInvoice && (
                  <button 
                    type="button"
                    onClick={() => generateInvoicePDF(editingInvoice)}
                    className="py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    PDF
                  </button>
                )}
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
                  localStorage.setItem(getUserStorageKey('assets'), JSON.stringify(updated));
                  return updated;
                });
                
                // Try Supabase with user_id (optional)
                try {
                  await db.assets.upsert(asset, getEffectiveUserId());
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

            {/* Receipts Linked from Vault */}
            {(() => {
              const linkedFromVault = receiptsService.getReceiptsForTransaction(receiptUploadTransaction.id);
              const linkedReceipts = receipts.filter(r => linkedFromVault.includes(r.id));
              if (linkedReceipts.length > 0) {
                return (
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">📎 Linked from Receipt Vault ({linkedReceipts.length})</p>
                    <div className="space-y-2">
                      {linkedReceipts.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
                          <div className="flex items-center gap-3">
                            <img src={r.public_url + '?width=40&quality=60'} alt="Receipt" className="w-10 h-10 object-cover rounded-lg" />
                            <div>
                              <span className="text-xs text-white font-bold">Vault Receipt</span>
                              <div className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setViewingAsset({ id: r.id, name: 'Receipt', type: 'image/jpeg', url: r.public_url, category: 'Receipt', dateAdded: r.created_at, size: '' })}
                              className="p-1.5 hover:bg-indigo-500/20 rounded transition-colors"
                            >
                              <Eye size={12} className="text-indigo-400" />
                            </button>
                            <button 
                              onClick={() => handleUnlinkReceipt(r.id)}
                              className="p-1.5 hover:bg-rose-500/20 rounded transition-colors"
                            >
                              <Unlink size={12} className="text-rose-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Link from Vault Section */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">🗃️ Link from Receipt Vault</p>
              {receipts.length > 0 ? (
                <div>
                  {/* Show receipts from ±7 days of transaction date */}
                  {(() => {
                    const txnDate = new Date(receiptUploadTransaction.date);
                    const alreadyLinked = receiptsService.getReceiptsForTransaction(receiptUploadTransaction.id);
                    const nearbyReceipts = receipts
                      .filter(r => {
                        if (alreadyLinked.includes(r.id)) return false;
                        const receiptDate = new Date(r.created_at);
                        const daysDiff = Math.abs((receiptDate.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24));
                        return daysDiff <= 7;
                      })
                      .slice(0, 6);
                    
                    if (nearbyReceipts.length === 0) {
                      const unlinkedReceipts = receipts.filter(r => !receiptsService.getTransactionForReceipt(r.id)).slice(0, 4);
                      if (unlinkedReceipts.length === 0) {
                        return <p className="text-[11px] text-slate-500 italic">All receipts are already linked.</p>;
                      }
                      return (
                        <>
                          <p className="text-[11px] text-slate-500 mb-3">No receipts found within 7 days. Showing unlinked receipts:</p>
                          <div className="grid grid-cols-4 gap-2">
                            {unlinkedReceipts.map(r => (
                              <button
                                key={r.id}
                                onClick={() => { handleLinkReceipt(r.id, receiptUploadTransaction.id); }}
                                className="group relative aspect-square rounded-xl overflow-hidden border-2 border-white/10 hover:border-indigo-500/50 transition-all"
                              >
                                <img src={r.public_url + '?width=80&quality=60'} alt="Receipt" className="w-full h-full object-cover" loading="lazy" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Link2 size={16} className="text-indigo-400" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                                  <div className="text-[8px] text-white truncate">{new Date(r.created_at).toLocaleDateString()}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      );
                    }
                    
                    return (
                      <>
                        <p className="text-[11px] text-emerald-400 mb-3 flex items-center gap-1.5">
                          <Sparkles size={12} /> {nearbyReceipts.length} receipt(s) found within 7 days of this transaction
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {nearbyReceipts.map(r => (
                            <button
                              key={r.id}
                              onClick={() => { handleLinkReceipt(r.id, receiptUploadTransaction.id); }}
                              className="group relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-500/30 hover:border-emerald-400 transition-all bg-emerald-500/5"
                            >
                              <img src={r.public_url + '?width=100&quality=60'} alt="Receipt" className="w-full h-full object-cover" loading="lazy" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] text-white font-bold flex items-center gap-1"><Link2 size={12} /> Link</span>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                                <div className="text-[8px] text-emerald-400 truncate">{new Date(r.created_at).toLocaleDateString()}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">No receipts in vault. Upload receipts in your receipt app first.</p>
              )}
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center">
                <span className="bg-[#121216] px-4 text-[10px] font-bold text-slate-500 uppercase">Or Upload New</span>
              </div>
            </div>

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
